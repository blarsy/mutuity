begin;

-- Enriches moderation-note, resource-bid, and need-claim notification payloads with the
-- actor display name / resource / need title fields required for the 3-line
-- headline1/headline2/description notification layout on mobile and web.

create or replace function app_public.add_campaign_moderation_note(
  campaign_id uuid,
  body text
)
returns app_public.campaign_moderation_note
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_note app_public.campaign_moderation_note;
  v_admin_account_id uuid;
  v_campaign app_public.campaign;
begin
  if not app_private.is_admin() then
    raise exception using message = 'Only administrators can add moderation notes';
  end if;

  v_admin_account_id := app_private.current_account_id();

  if v_admin_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  select *
  into v_campaign
  from app_public.campaign
  where id = add_campaign_moderation_note.campaign_id
  for update;

  if v_campaign.id is null then
    raise exception using message = 'Campaign not found';
  end if;

  if v_campaign.moderation_status = 'approved' then
    raise exception using message = 'Moderation notes are not allowed for approved campaigns';
  end if;

  if length(trim(body)) = 0 then
    raise exception using message = 'Moderation note body is required';
  end if;

  insert into app_public.campaign_moderation_note (
    campaign_id,
    manager_account_id,
    body
  )
  values (
    add_campaign_moderation_note.campaign_id,
    v_admin_account_id,
    trim(add_campaign_moderation_note.body)
  )
  returning * into v_note;

  update app_public.campaign
  set moderation_status = 'awaiting_adaptation'
  where id = v_campaign.id;

  perform app_private.create_account_notification(
    v_campaign.creator_account_id,
    'campaign_moderation_note_received',
    jsonb_build_object(
      'campaignId', v_campaign.id,
      'campaignName', v_campaign.title,
      'noteBody', v_note.body
    )
  );

  return v_note;
end;
$$;

comment on function app_public.add_campaign_moderation_note(uuid, text)
  is '@name addCampaignModerationNote';

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
  v_has_existing_bid boolean := false;
  v_existing_reserved_amount integer := 0;
  v_new_reserved_amount integer := 0;
  v_reserve_delta integer := 0;
  v_bidder_display_name text;
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

  select coalesce(display_name, external_subject)
  into v_bidder_display_name
  from app_public.account
  where id = v_account_id;

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
      'resourceName', v_resource.title,
      'bidderAccountId', v_account_id,
      'bidderDisplayName', coalesce(v_bidder_display_name, v_account_id::text),
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
  v_responder_display_name text;
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

  select coalesce(display_name, external_subject)
  into v_responder_display_name
  from app_public.account
  where id = v_account_id;

  perform app_private.create_resource_bid_notification(
    v_bid.bidder_account_id,
    v_bid.id,
    v_event_type,
    jsonb_build_object(
      'resourceId', v_bid.resource_id,
      'resourceName', v_context.resource_title,
      'status', v_bid.status,
      'respondedByAccountId', v_account_id,
      'responderDisplayName', coalesce(v_responder_display_name, v_account_id::text)
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

create or replace function app_public.claim_need(
  need_id uuid,
  message text default null
)
returns app_public.need_claim
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_need app_public.need;
  v_claim app_public.need_claim;
  v_claimer_display_name text;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  select *
  into v_need
  from app_public.need
  where id = claim_need.need_id;

  if not found then
    raise exception using message = 'Need not found';
  end if;

  if not v_need.is_active or (v_need.expires_at is not null and v_need.expires_at <= now()) then
    raise exception using message = 'Need is no longer active';
  end if;

  insert into app_public.need_claim (
    need_id,
    claimer_account_id,
    message,
    status
  )
  values (
    claim_need.need_id,
    v_account_id,
    nullif(btrim(claim_need.message), ''),
    'open'
  )
  on conflict on constraint need_claim_unique_per_account do update
  set message = excluded.message,
      status = case
        when app_public.need_claim.status in ('declined', 'withdrawn', 'expired') then 'open'::app_public.need_claim_status
        else app_public.need_claim.status
      end,
      updated_at = now()
  returning * into v_claim;

  select coalesce(display_name, external_subject)
  into v_claimer_display_name
  from app_public.account
  where id = v_account_id;

  perform app_private.create_need_claim_notification(
    v_need.creator_account_id,
    v_claim.id,
    'claim_created',
    jsonb_build_object(
      'needId', v_need.id,
      'needName', v_need.title,
      'claimerAccountId', v_account_id,
      'claimerDisplayName', coalesce(v_claimer_display_name, v_account_id::text),
      'status', v_claim.status
    )
  );

  return v_claim;
end;
$$;

comment on function app_public.claim_need(uuid, text) is '@name claimNeed';

create or replace function app_public.settle_need_claim(need_claim_id uuid)
returns app_public.need_claim
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_need_id uuid;
  v_need_context record;
  v_claim_context record;
  v_current_claim app_public.need_claim;
  v_topes_amount integer := 0;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  select nc.need_id
  into v_need_id
  from app_public.need_claim nc
  where nc.id = settle_need_claim.need_claim_id;

  if v_need_id is null then
    raise exception using message = 'Need claim not found';
  end if;

  select
    n.creator_account_id as need_creator_account_id,
    n.is_active as need_is_active,
    n.expires_at as need_expires_at,
    n.title as need_title,
    coalesce(n.proposed_topes_amount, 0) as topes_amount
  into v_need_context
  from app_public.need n
  where n.id = v_need_id
  for update;

  select nc.*
  into v_claim_context
  from app_public.need_claim nc
  where nc.id = settle_need_claim.need_claim_id
  for update;

  if not found then
    raise exception using message = 'Need claim not found';
  end if;

  if v_account_id <> v_need_context.need_creator_account_id then
    raise exception using message = 'Only need creator can settle claims';
  end if;

  if not v_need_context.need_is_active or (v_need_context.need_expires_at is not null and v_need_context.need_expires_at <= now()) then
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

  v_topes_amount := v_need_context.topes_amount;

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
      'needName', v_need_context.need_title,
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
