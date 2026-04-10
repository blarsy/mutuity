begin;

create table if not exists app_public.token_movement (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references app_public.account(id) on delete cascade,
  counterparty_account_id uuid references app_public.account(id) on delete set null,
  event_type text not null,
  amount_delta integer not null,
  reference_type text,
  reference_id uuid,
  payload jsonb not null default '{}'::jsonb,
  idempotency_key text unique,
  created_at timestamptz not null default now(),
  constraint token_movement_amount_nonzero check (amount_delta <> 0),
  constraint token_movement_event_type_present check (btrim(event_type) <> ''),
  constraint token_movement_reference_type_present check (
    reference_type is null or btrim(reference_type) <> ''
  )
);

create index if not exists token_movement_account_created_idx
  on app_public.token_movement (account_id, created_at desc);

create index if not exists token_movement_reference_idx
  on app_public.token_movement (reference_type, reference_id, created_at desc);

alter table app_public.token_movement enable row level security;

drop policy if exists token_movement_select_policy on app_public.token_movement;
create policy token_movement_select_policy on app_public.token_movement
  for select
  using (
    app_private.is_manager()
    or account_id = app_private.current_account_id()
  );

grant select on app_public.token_movement to identified_account, manager, admin;

create or replace function app_private.create_token_movement(
  p_account_id uuid,
  p_amount_delta integer,
  p_event_type text,
  p_reference_type text default null,
  p_reference_id uuid default null,
  p_counterparty_account_id uuid default null,
  p_payload jsonb default '{}'::jsonb,
  p_idempotency_key text default null
)
returns app_public.token_movement
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_movement app_public.token_movement;
begin
  if p_amount_delta is null or p_amount_delta = 0 then
    return null;
  end if;

  if p_idempotency_key is null then
    insert into app_public.token_movement (
      account_id,
      counterparty_account_id,
      event_type,
      amount_delta,
      reference_type,
      reference_id,
      payload,
      idempotency_key
    )
    values (
      p_account_id,
      p_counterparty_account_id,
      p_event_type,
      p_amount_delta,
      nullif(btrim(p_reference_type), ''),
      p_reference_id,
      coalesce(p_payload, '{}'::jsonb),
      null
    )
    returning * into v_movement;
  else
    insert into app_public.token_movement (
      account_id,
      counterparty_account_id,
      event_type,
      amount_delta,
      reference_type,
      reference_id,
      payload,
      idempotency_key
    )
    values (
      p_account_id,
      p_counterparty_account_id,
      p_event_type,
      p_amount_delta,
      nullif(btrim(p_reference_type), ''),
      p_reference_id,
      coalesce(p_payload, '{}'::jsonb),
      p_idempotency_key
    )
    on conflict (idempotency_key) do update
      set idempotency_key = excluded.idempotency_key
    returning * into v_movement;
  end if;

  return v_movement;
end;
$$;

create or replace function app_public.current_token_balance()
returns integer
language sql
stable
security definer
set search_path = app_public, app_private, public
as $$
  select coalesce(sum(tm.amount_delta), 0)::integer
  from app_public.token_movement tm
  where tm.account_id = app_private.current_account_id()
$$;

comment on function app_public.current_token_balance() is '@name currentTokenBalance';

grant execute on function app_private.create_token_movement(uuid, integer, text, text, uuid, uuid, jsonb, text)
  to identified_account, manager, admin;

grant execute on function app_public.current_token_balance()
  to identified_account, manager, admin;

comment on table app_public.token_movement is 'Auditable Topes ledger entries for all positive and negative account movements.';

create or replace function app_public.create_resource_bid(
  resource_id uuid,
  message text default null,
  proposed_token_amount integer default null
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
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

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
    status
  )
  values (
    create_resource_bid.resource_id,
    v_account_id,
    nullif(btrim(create_resource_bid.message), ''),
    v_effective_token_amount,
    'open'
  )
  on conflict on constraint resource_bid_unique_per_account do update
  set message = excluded.message,
      proposed_token_amount = excluded.proposed_token_amount,
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

comment on function app_public.create_resource_bid(uuid, text, integer) is '@name submitResourceBid';

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

  if not app_private.is_manager() and v_context.resource_creator_account_id <> v_account_id then
    raise exception using message = 'Only the resource creator can respond to bids';
  end if;

  if not v_context.resource_is_active then
    raise exception using message = 'Resource is no longer active';
  end if;

  if v_context.resource_expires_at is not null and v_context.resource_expires_at <= now() then
    update app_public.resource_bid
    set status = case when status = 'open' then 'expired'::app_public.resource_bid_status else status end,
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

    raise exception using message = 'Resource has expired';
  end if;

  if v_context.status <> 'open' then
    if v_context.status = respond_to_resource_bid.status then
      return v_context;
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

  if v_bid.status = 'declined' then
    v_reserved_amount := coalesce(v_bid.proposed_token_amount, 0);

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

create or replace function app_public.settle_need_claim(need_claim_id uuid)
returns app_public.need_claim
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_claim_context record;
  v_current_claim app_public.need_claim;
  v_topes_amount integer := 0;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  select
    nc.*,
    n.creator_account_id as need_creator_account_id,
    n.is_active as need_is_active,
    n.expires_at as need_expires_at,
    coalesce(n.proposed_topes_amount, 0) as topes_amount
  into v_claim_context
  from app_public.need_claim nc
  join app_public.need n on n.id = nc.need_id
  where nc.id = settle_need_claim.need_claim_id
  for update of nc, n;

  if not found then
    raise exception using message = 'Need claim not found';
  end if;

  if v_account_id <> v_claim_context.need_creator_account_id then
    raise exception using message = 'Only need creator can settle claims';
  end if;

  if not v_claim_context.need_is_active or (v_claim_context.need_expires_at is not null and v_claim_context.need_expires_at <= now()) then
    raise exception using message = 'Need is no longer active';
  end if;

  if v_claim_context.status = 'settled' then
    select *
    into v_current_claim
    from app_public.need_claim
    where id = settle_need_claim.need_claim_id;

    return v_current_claim;
  end if;

  if v_claim_context.status <> 'open' then
    raise exception using message = 'Need claim is no longer open';
  end if;

  v_topes_amount := v_claim_context.topes_amount;

  update app_public.need_claim
  set status = 'settled',
      settled_at = now(),
      settled_by_account_id = v_account_id,
      updated_at = now()
  where id = settle_need_claim.need_claim_id
  returning * into v_current_claim;

  update app_public.need_claim
  set status = 'declined',
      updated_at = now()
  where need_id = v_current_claim.need_id
    and id <> v_current_claim.id
    and status = 'open';

  insert into app_public.need_claim_settlement_event (
    need_claim_id,
    need_id,
    settled_by_account_id,
    claimer_account_id,
    topes_amount
  )
  values (
    v_current_claim.id,
    v_current_claim.need_id,
    v_account_id,
    v_current_claim.claimer_account_id,
    v_topes_amount
  )
  on conflict on constraint need_claim_settlement_event_need_claim_id_key do nothing;

  if v_topes_amount > 0 then
    perform app_private.create_token_movement(
      v_current_claim.claimer_account_id,
      v_topes_amount,
      'claim_settlement_credit',
      'need_claim',
      v_current_claim.id,
      v_account_id,
      jsonb_build_object(
        'needId', v_current_claim.need_id,
        'needClaimId', v_current_claim.id,
        'topesAmount', v_topes_amount
      ),
      format('need_claim:%s:settlement_credit', v_current_claim.id)
    );

    perform app_private.create_token_movement(
      v_account_id,
      -v_topes_amount,
      'claim_settlement_debit',
      'need_claim',
      v_current_claim.id,
      v_current_claim.claimer_account_id,
      jsonb_build_object(
        'needId', v_current_claim.need_id,
        'needClaimId', v_current_claim.id,
        'topesAmount', v_topes_amount
      ),
      format('need_claim:%s:settlement_debit', v_current_claim.id)
    );
  end if;

  perform app_private.create_need_claim_notification(
    v_current_claim.claimer_account_id,
    v_current_claim.id,
    'claim_settled',
    jsonb_build_object(
      'needId', v_current_claim.need_id,
      'topesAmount', v_topes_amount
    )
  );

  insert into app_public.need_claim_notification (
    recipient_account_id,
    need_claim_id,
    event_type,
    payload
  )
  select
    nc.claimer_account_id,
    nc.id,
    'claim_declined',
    jsonb_build_object('needId', nc.need_id, 'settledClaimId', v_current_claim.id)
  from app_public.need_claim nc
  where nc.need_id = v_current_claim.need_id
    and nc.id <> v_current_claim.id
    and nc.status = 'declined';

  return v_current_claim;
end;
$$;

comment on function app_public.settle_need_claim(uuid) is '@name settleNeedClaim';

commit;
