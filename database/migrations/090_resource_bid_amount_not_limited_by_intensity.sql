-- Migration 090: resource intensity is advisory for bids; do not reject
-- proposed token amounts outside the resource intensity range.

drop function if exists app_public.create_resource_bid(uuid, text, integer);

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
