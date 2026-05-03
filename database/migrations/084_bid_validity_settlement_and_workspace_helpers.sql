begin;

-- T004: Add valid_until column enforcing 12-48 hour bid-validity window
alter table app_public.resource_bid
  add column if not exists valid_until timestamptz;

-- Backfill existing rows with 24h from creation
update app_public.resource_bid
set valid_until = created_at + interval '24 hours'
where valid_until is null;

alter table app_public.resource_bid
  alter column valid_until set not null,
  alter column valid_until set default (now() + interval '24 hours');

-- T004: Update create_resource_bid to honour valid_until (24h default, 12-48h range)
create or replace function app_public.create_resource_bid(
  resource_id uuid,
  message text default null,
  proposed_token_amount integer default null,
  valid_hours integer default 24
)
returns app_public.resource_bid
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_resource app_public.resource;
  v_existing_bid app_public.resource_bid;
  v_bid app_public.resource_bid;
  v_effective_token_amount integer;
  v_has_existing_bid boolean := false;
  v_existing_reserved_amount integer := 0;
  v_new_reserved_amount integer := 0;
  v_reserve_delta integer := 0;
  v_valid_hours integer;
  v_valid_until timestamptz;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  v_valid_hours := coalesce(create_resource_bid.valid_hours, 24);
  if v_valid_hours < 12 or v_valid_hours > 48 then
    raise exception using message = 'Bid validity must be between 12 and 48 hours';
  end if;
  v_valid_until := now() + (v_valid_hours || ' hours')::interval;

  select *
  into v_resource
  from app_public.resource r
  where r.id = create_resource_bid.resource_id
  for update;

  if not found then
    raise exception using message = 'Resource not found';
  end if;

  if v_resource.creator_account_id = v_account_id then
    raise exception using message = 'Resource creators cannot bid on their own resources';
  end if;

  if not v_resource.is_active then
    raise exception using message = 'Resource is no longer active';
  end if;

  if v_resource.expires_at is not null and v_resource.expires_at <= now() then
    raise exception using message = 'Resource has expired';
  end if;

  select *
  into v_existing_bid
  from app_public.resource_bid rb
  where rb.resource_id = create_resource_bid.resource_id
    and rb.bidder_account_id = v_account_id
  for update;

  v_has_existing_bid := found;

  if v_has_existing_bid and v_existing_bid.status = 'accepted' then
    return v_existing_bid;
  end if;

  v_effective_token_amount := coalesce(
    create_resource_bid.proposed_token_amount,
    v_resource.default_token_amount
  );

  if v_effective_token_amount is not null then
    perform app_private.validate_topes_amount(v_resource.intensity::text, v_effective_token_amount);
  end if;

  if v_has_existing_bid and v_existing_bid.status = 'open' then
    v_existing_reserved_amount := coalesce(v_existing_bid.proposed_token_amount, 0);
  end if;

  insert into app_public.resource_bid (
    resource_id,
    bidder_account_id,
    message,
    proposed_token_amount,
    status,
    valid_until
  )
  values (
    create_resource_bid.resource_id,
    v_account_id,
    nullif(btrim(create_resource_bid.message), ''),
    v_effective_token_amount,
    'open',
    v_valid_until
  )
  on conflict on constraint resource_bid_unique_per_account do update
  set message = excluded.message,
      proposed_token_amount = excluded.proposed_token_amount,
      valid_until = excluded.valid_until,
      status = case
        when app_public.resource_bid.status in ('declined', 'withdrawn', 'expired')
          then 'open'::app_public.resource_bid_status
        else app_public.resource_bid.status
      end,
      responded_at = case
        when app_public.resource_bid.status in ('declined', 'withdrawn', 'expired') then null
        else app_public.resource_bid.responded_at
      end,
      responded_by_account_id = case
        when app_public.resource_bid.status in ('declined', 'withdrawn', 'expired') then null
        else app_public.resource_bid.responded_by_account_id
      end,
      updated_at = now()
  returning * into v_bid;

  perform app_private.create_resource_bid_notification(
    v_resource.creator_account_id,
    v_bid.id,
    'resource_bid_created',
    jsonb_build_object(
      'resourceId', v_resource.id,
      'bidderAccountId', v_account_id,
      'status', v_bid.status,
      'proposedTokenAmount', v_bid.proposed_token_amount
    )
  );

  v_new_reserved_amount := coalesce(v_bid.proposed_token_amount, 0);
  v_reserve_delta := v_new_reserved_amount - v_existing_reserved_amount;

  if v_reserve_delta > 0 then
    perform app_private.create_token_movement(
      v_account_id,
      -v_reserve_delta,
      'resource_bid_reserved',
      'resource_bid',
      v_bid.id,
      v_resource.creator_account_id,
      jsonb_build_object(
        'resourceId', v_resource.id,
        'resourceBidId', v_bid.id,
        'reservedAmount', v_reserve_delta,
        'proposedTokenAmount', v_bid.proposed_token_amount,
        'status', v_bid.status
      ),
      null
    );
  elsif v_reserve_delta < 0 then
    perform app_private.create_token_movement(
      v_account_id,
      abs(v_reserve_delta),
      'resource_bid_refunded',
      'resource_bid',
      v_bid.id,
      v_resource.creator_account_id,
      jsonb_build_object(
        'resourceId', v_resource.id,
        'resourceBidId', v_bid.id,
        'refundAmount', abs(v_reserve_delta),
        'reason', 'bid_amount_reduced',
        'status', v_bid.status
      ),
      null
    );
  end if;

  return v_bid;
end;
$$;

comment on function app_public.create_resource_bid(uuid, text, integer, integer) is '@name submitResourceBid';

-- T007: Update respond_to_resource_bid to check valid_until expiry and add accepted-bid settlement
drop function if exists app_public.respond_to_resource_bid(uuid, app_public.resource_bid_status);

create or replace function app_public.respond_to_resource_bid(
  resource_bid_id uuid,
  status app_public.resource_bid_status
)
returns app_public.resource_bid
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_context record;
  v_bid app_public.resource_bid;
  v_event_type text;
  v_reserved_amount integer := 0;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  if respond_to_resource_bid.status not in ('accepted', 'declined') then
    raise exception using message = 'Resource bid response must be accepted or declined';
  end if;

  select
    rb.*,
    r.title as resource_title,
    r.creator_account_id as resource_creator_account_id,
    r.is_active as resource_is_active,
    r.expires_at as resource_expires_at
  into v_context
  from app_public.resource_bid rb
  join app_public.resource r on r.id = rb.resource_id
  where rb.id = respond_to_resource_bid.resource_bid_id
  for update of rb, r;

  if not found then
    raise exception using message = 'Resource bid not found';
  end if;

  if not app_private.is_administrator() and v_context.resource_creator_account_id <> v_account_id then
    raise exception using message = 'Only the resource creator can respond to bids';
  end if;

  if not v_context.resource_is_active then
    raise exception using message = 'Resource is no longer active';
  end if;

  -- Auto-expire bid if its own validity window has passed
  if v_context.valid_until <= now() then
    if v_context.status = 'open' then
      update app_public.resource_bid
      set status = 'expired'::app_public.resource_bid_status,
          updated_at = now()
      where id = v_context.id;

      v_reserved_amount := coalesce(v_context.proposed_token_amount, 0);
      if v_reserved_amount > 0 then
        perform app_private.create_token_movement(
          v_context.bidder_account_id,
          v_reserved_amount,
          'resource_bid_refunded',
          'resource_bid',
          v_context.id,
          v_context.resource_creator_account_id,
          jsonb_build_object(
            'resourceId', v_context.resource_id,
            'resourceBidId', v_context.id,
            'refundAmount', v_reserved_amount,
            'reason', 'bid_validity_expired'
          ),
          format('resource_bid:%s:validity_expired_refund', v_context.id)
        );
      end if;

      perform app_private.create_resource_bid_notification(
        v_context.bidder_account_id,
        v_context.id,
        'resource_bid_expired',
        jsonb_build_object(
          'resourceId', v_context.resource_id,
          'resourceBidId', v_context.id,
          'resourceName', v_context.resource_title,
          'status', 'expired',
          'url', '/bids'
        )
      );
    end if;

    raise exception using message = 'Bid validity period has expired';
  end if;

  if v_context.resource_expires_at is not null and v_context.resource_expires_at <= now() then
    update app_public.resource_bid
    set status = case
      when v_context.status = 'open' then 'expired'::app_public.resource_bid_status
      else v_context.status
    end,
        updated_at = now()
    where id = v_context.id;

    v_reserved_amount := coalesce(v_context.proposed_token_amount, 0);
    if v_context.status = 'open' and v_reserved_amount > 0 then
      perform app_private.create_token_movement(
        v_context.bidder_account_id,
        v_reserved_amount,
        'resource_bid_refunded',
        'resource_bid',
        v_context.id,
        v_context.resource_creator_account_id,
        jsonb_build_object(
          'resourceId', v_context.resource_id,
          'resourceBidId', v_context.id,
          'refundAmount', v_reserved_amount,
          'reason', 'resource_expired'
        ),
        format('resource_bid:%s:expired_refund', v_context.id)
      );
    end if;

    if v_context.status = 'open' then
      perform app_private.create_resource_bid_notification(
        v_context.bidder_account_id,
        v_context.id,
        'resource_bid_expired',
        jsonb_build_object(
          'resourceId', v_context.resource_id,
          'resourceBidId', v_context.id,
          'resourceName', v_context.resource_title,
          'status', 'expired',
          'expiresAt', v_context.resource_expires_at,
          'url', '/bids'
        )
      );
    end if;

    raise exception using message = 'Resource has expired';
  end if;

  if v_context.status <> 'open' then
    if v_context.status = respond_to_resource_bid.status then
      select rb.*
      into v_bid
      from app_public.resource_bid rb
      where rb.id = v_context.id;

      return v_bid;
    end if;

    raise exception using message = 'Resource bid is no longer open';
  end if;

  update app_public.resource_bid
  set status = respond_to_resource_bid.status,
      responded_at = now(),
      responded_by_account_id = v_account_id,
      updated_at = now()
  where id = respond_to_resource_bid.resource_bid_id
  returning * into v_bid;

  v_event_type := case
    when v_bid.status = 'accepted' then 'resource_bid_accepted'
    else 'resource_bid_declined'
  end;

  perform app_private.create_resource_bid_notification(
    v_bid.bidder_account_id,
    v_bid.id,
    v_event_type,
    jsonb_build_object(
      'resourceId', v_bid.resource_id,
      'status', v_bid.status,
      'respondedByAccountId', v_account_id
    )
  );

  v_reserved_amount := coalesce(v_bid.proposed_token_amount, 0);

  if v_bid.status = 'accepted' then
    -- Transfer reserved Topes to resource creator exactly once
    if v_reserved_amount > 0 then
      perform app_private.create_token_movement(
        v_context.resource_creator_account_id,
        v_reserved_amount,
        'resource_bid_settled',
        'resource_bid',
        v_bid.id,
        v_bid.bidder_account_id,
        jsonb_build_object(
          'resourceId', v_bid.resource_id,
          'resourceBidId', v_bid.id,
          'settledAmount', v_reserved_amount
        ),
        format('resource_bid:%s:settlement', v_bid.id)
      );
    end if;
  elsif v_bid.status = 'declined' then
    -- Refund reserved Topes to bidder
    if v_reserved_amount > 0 then
      perform app_private.create_token_movement(
        v_bid.bidder_account_id,
        v_reserved_amount,
        'resource_bid_refunded',
        'resource_bid',
        v_bid.id,
        v_account_id,
        jsonb_build_object(
          'resourceId', v_bid.resource_id,
          'resourceBidId', v_bid.id,
          'refundAmount', v_reserved_amount,
          'reason', 'bid_declined'
        ),
        format('resource_bid:%s:declined_refund', v_bid.id)
      );
    end if;
  end if;

  return v_bid;
end;
$$;

comment on function app_public.respond_to_resource_bid(uuid, app_public.resource_bid_status) is '@name respondToResourceBid';

-- T006: Add cancel_resource_bid for bidder-side cancellation
create or replace function app_public.cancel_resource_bid(
  resource_bid_id uuid
)
returns app_public.resource_bid
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_context record;
  v_bid app_public.resource_bid;
  v_reserved_amount integer := 0;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  select
    rb.*,
    r.title as resource_title,
    r.creator_account_id as resource_creator_account_id
  into v_context
  from app_public.resource_bid rb
  join app_public.resource r on r.id = rb.resource_id
  where rb.id = cancel_resource_bid.resource_bid_id
  for update of rb;

  if not found then
    raise exception using message = 'Resource bid not found';
  end if;

  if v_context.bidder_account_id <> v_account_id then
    raise exception using message = 'Only the bidder can cancel their own bid';
  end if;

  if v_context.status <> 'open' then
    if v_context.status = 'withdrawn' then
      select rb.* into v_bid from app_public.resource_bid rb where rb.id = v_context.id;
      return v_bid;
    end if;
    raise exception using message = 'Resource bid is no longer open';
  end if;

  update app_public.resource_bid
  set status = 'withdrawn'::app_public.resource_bid_status,
      updated_at = now()
  where id = cancel_resource_bid.resource_bid_id
  returning * into v_bid;

  v_reserved_amount := coalesce(v_bid.proposed_token_amount, 0);
  if v_reserved_amount > 0 then
    perform app_private.create_token_movement(
      v_bid.bidder_account_id,
      v_reserved_amount,
      'resource_bid_refunded',
      'resource_bid',
      v_bid.id,
      v_context.resource_creator_account_id,
      jsonb_build_object(
        'resourceId', v_bid.resource_id,
        'resourceBidId', v_bid.id,
        'refundAmount', v_reserved_amount,
        'reason', 'bid_cancelled_by_bidder'
      ),
      format('resource_bid:%s:bidder_cancel_refund', v_bid.id)
    );
  end if;

  -- Notify resource creator that bidder cancelled (per FR-021 only non-actor is notified)
  perform app_private.create_resource_bid_notification(
    v_context.resource_creator_account_id,
    v_bid.id,
    'resource_bid_cancelled',
    jsonb_build_object(
      'resourceId', v_bid.resource_id,
      'resourceBidId', v_bid.id,
      'resourceName', v_context.resource_title,
      'bidderAccountId', v_bid.bidder_account_id,
      'status', 'withdrawn',
      'url', '/bids'
    )
  );

  return v_bid;
end;
$$;

comment on function app_public.cancel_resource_bid(uuid) is '@name cancelResourceBid';

-- T004/T005: Update process_resource_bid_notifications to also expire bids based on valid_until
create or replace function app_private.process_resource_bid_notifications(
  p_now timestamptz default now()
)
returns table (
  expiring_soon_count integer,
  expired_bid_count integer,
  cancelled_bid_count integer,
  refund_count integer,
  notification_count integer
)
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_now timestamptz := coalesce(p_now, now());
  v_bid record;
  v_reserved_amount integer;
begin
  expiring_soon_count := 0;
  expired_bid_count := 0;
  cancelled_bid_count := 0;
  refund_count := 0;
  notification_count := 0;

  -- Expiring-soon warning: resource expires within 2 hours
  for v_bid in
    select
      rb.id as resource_bid_id,
      rb.resource_id,
      rb.bidder_account_id,
      rb.proposed_token_amount,
      r.title as resource_title,
      r.creator_account_id as recipient_account_id,
      r.expires_at
    from app_public.resource_bid rb
    join app_public.resource r on r.id = rb.resource_id
    where rb.status = 'open'
      and r.is_active = true
      and r.expires_at is not null
      and r.expires_at > v_now
      and r.expires_at <= v_now + interval '2 hours'
      and not exists (
        select 1
        from app_public.resource_bid_notification n
        where n.recipient_account_id = r.creator_account_id
          and n.resource_bid_id = rb.id
          and n.event_type = 'resource_bid_expiring_soon'
      )
  loop
    perform app_private.create_resource_bid_notification(
      v_bid.recipient_account_id,
      v_bid.resource_bid_id,
      'resource_bid_expiring_soon',
      jsonb_build_object(
        'resourceId', v_bid.resource_id,
        'resourceBidId', v_bid.resource_bid_id,
        'resourceName', v_bid.resource_title,
        'bidderAccountId', v_bid.bidder_account_id,
        'expiresAt', v_bid.expires_at,
        'url', '/bids'
      )
    );

    expiring_soon_count := expiring_soon_count + 1;
    notification_count := notification_count + 1;
  end loop;

  -- Bidder-initiated cancel cleanup: resource became inactive (withdrawn)
  for v_bid in
    update app_public.resource_bid rb
    set status = 'withdrawn'::app_public.resource_bid_status,
        updated_at = v_now
    from app_public.resource r
    where r.id = rb.resource_id
      and rb.status = 'open'
      and r.is_active = false
    returning
      rb.id as resource_bid_id,
      rb.resource_id,
      rb.bidder_account_id,
      rb.proposed_token_amount,
      r.title as resource_title,
      r.creator_account_id as resource_creator_account_id
  loop
    v_reserved_amount := coalesce(v_bid.proposed_token_amount, 0);

    if v_reserved_amount > 0 then
      perform app_private.create_token_movement(
        v_bid.bidder_account_id,
        v_reserved_amount,
        'resource_bid_refunded',
        'resource_bid',
        v_bid.resource_bid_id,
        v_bid.resource_creator_account_id,
        jsonb_build_object(
          'resourceId', v_bid.resource_id,
          'resourceBidId', v_bid.resource_bid_id,
          'refundAmount', v_reserved_amount,
          'reason', 'resource_cancelled'
        ),
        format('resource_bid:%s:cancelled_refund', v_bid.resource_bid_id)
      );
      refund_count := refund_count + 1;
    end if;

    perform app_private.create_resource_bid_notification(
      v_bid.bidder_account_id,
      v_bid.resource_bid_id,
      'resource_bid_cancelled',
      jsonb_build_object(
        'resourceId', v_bid.resource_id,
        'resourceBidId', v_bid.resource_bid_id,
        'resourceName', v_bid.resource_title,
        'status', 'withdrawn',
        'url', '/bids'
      )
    );

    cancelled_bid_count := cancelled_bid_count + 1;
    notification_count := notification_count + 1;
  end loop;

  -- Auto-expire: resource has expired
  for v_bid in
    update app_public.resource_bid rb
    set status = 'expired'::app_public.resource_bid_status,
        updated_at = v_now
    from app_public.resource r
    where r.id = rb.resource_id
      and rb.status = 'open'
      and r.is_active = true
      and r.expires_at is not null
      and r.expires_at <= v_now
    returning
      rb.id as resource_bid_id,
      rb.resource_id,
      rb.bidder_account_id,
      rb.proposed_token_amount,
      r.title as resource_title,
      r.creator_account_id as resource_creator_account_id,
      r.expires_at
  loop
    v_reserved_amount := coalesce(v_bid.proposed_token_amount, 0);

    if v_reserved_amount > 0 then
      perform app_private.create_token_movement(
        v_bid.bidder_account_id,
        v_reserved_amount,
        'resource_bid_refunded',
        'resource_bid',
        v_bid.resource_bid_id,
        v_bid.resource_creator_account_id,
        jsonb_build_object(
          'resourceId', v_bid.resource_id,
          'resourceBidId', v_bid.resource_bid_id,
          'refundAmount', v_reserved_amount,
          'reason', 'resource_expired'
        ),
        format('resource_bid:%s:auto_expired_refund', v_bid.resource_bid_id)
      );
      refund_count := refund_count + 1;
    end if;

    perform app_private.create_resource_bid_notification(
      v_bid.bidder_account_id,
      v_bid.resource_bid_id,
      'resource_bid_expired',
      jsonb_build_object(
        'resourceId', v_bid.resource_id,
        'resourceBidId', v_bid.resource_bid_id,
        'resourceName', v_bid.resource_title,
        'status', 'expired',
        'expiresAt', v_bid.expires_at,
        'url', '/bids'
      )
    );

    expired_bid_count := expired_bid_count + 1;
    notification_count := notification_count + 1;
  end loop;

  -- Auto-expire: bid's own valid_until has passed (bid validity expired independently of resource)
  for v_bid in
    update app_public.resource_bid rb
    set status = 'expired'::app_public.resource_bid_status,
        updated_at = v_now
    from app_public.resource r
    where r.id = rb.resource_id
      and rb.status = 'open'
      and rb.valid_until <= v_now
      and r.is_active = true
      and (r.expires_at is null or r.expires_at > v_now)
    returning
      rb.id as resource_bid_id,
      rb.resource_id,
      rb.bidder_account_id,
      rb.proposed_token_amount,
      rb.valid_until,
      r.title as resource_title,
      r.creator_account_id as resource_creator_account_id
  loop
    v_reserved_amount := coalesce(v_bid.proposed_token_amount, 0);

    if v_reserved_amount > 0 then
      perform app_private.create_token_movement(
        v_bid.bidder_account_id,
        v_reserved_amount,
        'resource_bid_refunded',
        'resource_bid',
        v_bid.resource_bid_id,
        v_bid.resource_creator_account_id,
        jsonb_build_object(
          'resourceId', v_bid.resource_id,
          'resourceBidId', v_bid.resource_bid_id,
          'refundAmount', v_reserved_amount,
          'reason', 'bid_validity_expired'
        ),
        format('resource_bid:%s:validity_expired_refund', v_bid.resource_bid_id)
      );
      refund_count := refund_count + 1;
    end if;

    -- Notify both parties when bid validity expires (system event per FR-021)
    perform app_private.create_resource_bid_notification(
      v_bid.bidder_account_id,
      v_bid.resource_bid_id,
      'resource_bid_expired',
      jsonb_build_object(
        'resourceId', v_bid.resource_id,
        'resourceBidId', v_bid.resource_bid_id,
        'resourceName', v_bid.resource_title,
        'status', 'expired',
        'validUntil', v_bid.valid_until,
        'url', '/bids'
      )
    );

    perform app_private.create_resource_bid_notification(
      v_bid.resource_creator_account_id,
      v_bid.resource_bid_id,
      'resource_bid_expired',
      jsonb_build_object(
        'resourceId', v_bid.resource_id,
        'resourceBidId', v_bid.resource_bid_id,
        'resourceName', v_bid.resource_title,
        'bidderAccountId', v_bid.bidder_account_id,
        'status', 'expired',
        'validUntil', v_bid.valid_until,
        'url', '/bids'
      )
    );

    expired_bid_count := expired_bid_count + 1;
    notification_count := notification_count + 2;
  end loop;

  return next;
end;
$$;

comment on function app_private.process_resource_bid_notifications(timestamptz)
  is 'Scheduled background processor for resource-bid expiry warnings, automatic expiry (resource and bid validity), resource-cancellation refunds, and notifications.';

-- T005: Workspace helpers returning resource_bid sets for sent/received views
-- Ordered by updated_at desc (latest status change first), with optional active-only filter.
-- PostGraphile exposes these as connections with automatic cursor pagination.

create or replace function app_public.sent_resource_bids(
  active_only boolean default false
)
returns setof app_public.resource_bid
language sql
stable
security definer
set search_path = app_public, app_private, public
as $$
  select rb.*
  from app_public.resource_bid rb
  join app_public.resource r on r.id = rb.resource_id
  where rb.bidder_account_id = app_private.current_account_id()
    and (
      not active_only
      or (
        rb.status = 'open'
        and rb.valid_until > now()
        and r.is_active = true
        and (r.expires_at is null or r.expires_at > now())
      )
    )
  order by rb.updated_at desc;
$$;

comment on function app_public.sent_resource_bids(boolean) is '@name sentResourceBids';

create or replace function app_public.received_resource_bids(
  active_only boolean default false
)
returns setof app_public.resource_bid
language sql
stable
security definer
set search_path = app_public, app_private, public
as $$
  select rb.*
  from app_public.resource_bid rb
  join app_public.resource r on r.id = rb.resource_id
  where r.creator_account_id = app_private.current_account_id()
    and (
      not active_only
      or (
        rb.status = 'open'
        and rb.valid_until > now()
        and r.is_active = true
        and (r.expires_at is null or r.expires_at > now())
      )
    )
  order by rb.updated_at desc;
$$;

comment on function app_public.received_resource_bids(boolean) is '@name receivedResourceBids';

-- Computed field: is a bid currently active (open, valid, resource active)
create or replace function app_public.resource_bid_is_active(
  bid app_public.resource_bid
)
returns boolean
language sql
stable
security definer
set search_path = app_public, app_private, public
as $$
  select
    bid.status = 'open'
    and bid.valid_until > now()
    and exists (
      select 1
      from app_public.resource r
      where r.id = bid.resource_id
        and r.is_active = true
        and (r.expires_at is null or r.expires_at > now())
    );
$$;

comment on function app_public.resource_bid_is_active(app_public.resource_bid) is '@name isActive';

-- Index to support workspace ordering by updated_at desc
create index if not exists resource_bid_bidder_updated_at_idx
  on app_public.resource_bid (bidder_account_id, updated_at desc);

create index if not exists resource_bid_valid_until_idx
  on app_public.resource_bid (valid_until)
  where status = 'open';

commit;
