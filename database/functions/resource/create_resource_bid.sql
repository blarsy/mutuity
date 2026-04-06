create or replace function app_private.create_resource_bid_notification(
  p_recipient_account_id uuid,
  p_resource_bid_id uuid,
  p_event_type text,
  p_payload jsonb default '{}'::jsonb
)
returns app_public.resource_bid_notification
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_notification app_public.resource_bid_notification;
begin
  insert into app_public.resource_bid_notification (
    recipient_account_id,
    resource_bid_id,
    event_type,
    payload
  )
  values (
    p_recipient_account_id,
    p_resource_bid_id,
    p_event_type,
    coalesce(p_payload, '{}'::jsonb)
  )
  returning * into v_notification;

  return v_notification;
end;
$$;

drop function if exists app_public.create_resource_bid(uuid, text, integer);

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

  if found and v_existing_bid.status = 'accepted' then
    return v_existing_bid;
  end if;

  v_effective_token_amount := coalesce(
    create_resource_bid.proposed_token_amount,
    v_resource.default_token_amount
  );

  if v_effective_token_amount is not null then
    perform app_private.validate_topes_amount(v_resource.intensity::text, v_effective_token_amount);
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

  return v_bid;
end;
$$;

comment on function app_public.create_resource_bid(uuid, text, integer) is '@name submitResourceBid';
