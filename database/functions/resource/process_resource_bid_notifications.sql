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

  return next;
end;
$$;

comment on function app_private.process_resource_bid_notifications(timestamptz)
  is 'Scheduled background processor for resource-bid expiry warnings, automatic expiry, and bidder notifications.';
