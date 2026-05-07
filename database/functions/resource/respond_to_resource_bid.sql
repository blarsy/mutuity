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

  if not app_private.is_admin() and v_context.resource_creator_account_id <> v_account_id then
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
