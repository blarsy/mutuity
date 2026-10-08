begin;

-- Full canonical definitions: keep this migration self-contained for path-based runners.
-- Only notification title snapshots change; lifecycle, recipients and permissions stay intact.

create or replace function app_public.cancel_need_claim(need_claim_id uuid)
returns app_public.need_claim
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_claim      app_public.need_claim;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  select * into v_claim
  from app_public.need_claim
  where id = cancel_need_claim.need_claim_id
  for update;

  if not found then
    raise exception using message = 'Need claim not found';
  end if;

  if v_claim.claimer_account_id <> v_account_id then
    raise exception using message = 'Only the claimer can cancel this claim';
  end if;

  -- Idempotent: already withdrawn, just return
  if v_claim.status = 'withdrawn' then
    return v_claim;
  end if;

  if v_claim.status <> 'open' then
    raise exception using message = 'Need claim is no longer open';
  end if;

  update app_public.need_claim
  set status     = 'withdrawn',
      updated_at = now()
  where id = cancel_need_claim.need_claim_id
  returning * into v_claim;

  -- Notify the need creator (do not notify the claimer who triggered this)
  insert into app_public.need_claim_notification (
    recipient_account_id,
    need_claim_id,
    event_type,
    payload
  )
  select
    n.creator_account_id,
    v_claim.id,
    'claim_withdrawn',
    jsonb_build_object('needId', v_claim.need_id, 'needName', n.title, 'claimerAccountId', v_claim.claimer_account_id)
  from app_public.need n
  where n.id = v_claim.need_id;

  return v_claim;
end;
$$;

comment on function app_public.cancel_need_claim(uuid) is '@name cancelNeedClaim';

grant execute on function app_public.cancel_need_claim(uuid) to identified_account, admin;

create or replace function app_public.decline_need_claim(need_claim_id uuid)
returns app_public.need_claim
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_claim      app_public.need_claim;
  v_creator_id uuid;
  v_need_title text;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  select n.creator_account_id, n.title into v_creator_id, v_need_title
  from app_public.need n
  join app_public.need_claim nc on nc.need_id = n.id
  where nc.id = decline_need_claim.need_claim_id;

  select * into v_claim
  from app_public.need_claim
  where id = decline_need_claim.need_claim_id
  for update;

  if not found then
    raise exception using message = 'Need claim not found';
  end if;

  if v_creator_id <> v_account_id then
    raise exception using message = 'Only the need creator can decline this claim';
  end if;

  -- Idempotent: already declined, just return
  if v_claim.status = 'declined' then
    return v_claim;
  end if;

  if v_claim.status <> 'open' then
    raise exception using message = 'Need claim is no longer open';
  end if;

  update app_public.need_claim
  set status     = 'declined',
      updated_at = now()
  where id = decline_need_claim.need_claim_id
  returning * into v_claim;

  -- Notify the claimer
  insert into app_public.need_claim_notification (
    recipient_account_id,
    need_claim_id,
    event_type,
    payload
  )
  values (
    v_claim.claimer_account_id,
    v_claim.id,
    'claim_declined',
    jsonb_build_object('needId', v_claim.need_id, 'needName', v_need_title)
  );

  return v_claim;
end;
$$;

comment on function app_public.decline_need_claim(uuid) is '@name declineNeedClaim';

grant execute on function app_public.decline_need_claim(uuid) to identified_account, admin;

create or replace function app_private.decline_open_claims_on_need(
  p_need_id        uuid,
  p_reason         text  -- 'need_deactivated' | 'need_expired'
)
returns integer    -- number of claims declined
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_declined_count integer;
  v_need_title text;
begin
  select n.title into v_need_title
  from app_public.need n
  where n.id = p_need_id;

  -- Decline all currently open claims on this need.
  -- Cast the target status explicitly to the enum type to avoid
  -- "column status is of type need_claim_status but expression is of type text".
  with declined as (
    update app_public.need_claim
    set status     = case p_reason
                       when 'need_expired' then 'expired'::app_public.need_claim_status
                       else                     'declined'::app_public.need_claim_status
                     end,
        updated_at = now()
    where need_id  = p_need_id
      and status   = 'open'::app_public.need_claim_status
    returning id, claimer_account_id
  ),
  notifications as (
    insert into app_public.need_claim_notification (
      recipient_account_id,
      need_claim_id,
      event_type,
      payload
    )
    select
      d.claimer_account_id,
      d.id,
      case p_reason
        when 'need_expired'     then 'claim_expired'
        else                         'claim_need_deactivated'
      end,
      jsonb_build_object('needId', p_need_id, 'needName', v_need_title, 'reason', p_reason)
    from declined d
    returning id
  )
  select count(*)::integer into v_declined_count from declined;

  -- For need_expired: also notify the need creator once with a summary
  if p_reason = 'need_expired' and v_declined_count > 0 then
    insert into app_public.need_claim_notification (
      recipient_account_id,
      need_claim_id,
      event_type,
      payload
    )
    select
      n.creator_account_id,
      nc.id,       -- use first claim id as representative
      'need_expired_claims_declined',
      jsonb_build_object('needId', p_need_id, 'needName', n.title, 'declinedCount', v_declined_count)
    from app_public.need n
    join app_public.need_claim nc on nc.need_id = n.id
    where n.id = p_need_id
    limit 1;
  end if;

  return v_declined_count;
end;
$$;

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
    jsonb_build_object('needId', nc.need_id, 'needName', v_need_context.need_title, 'settledClaimId', v_current_claim.id)
  from app_public.need_claim nc
  where nc.need_id = v_current_claim.need_id
    and nc.id <> v_current_claim.id
    and nc.status = 'declined';

  return v_current_claim;
end;
$$;

comment on function app_public.settle_need_claim(uuid) is '@name settleNeedClaim';

-- Repair existing inbox rows through their typed foreign keys, never payload IDs.
-- Historical nonblank titles are snapshots and must not be replaced by current titles.
-- Preserve all other payload fields, recipients, read state and notification identity.
update app_public.need_claim_notification as notification
set payload = notification.payload || jsonb_build_object('needName', n.title)
from app_public.need_claim nc
join app_public.need n on n.id = nc.need_id
where notification.need_claim_id = nc.id
  and notification.event_type in (
    'claim_created',
    'claim_settled',
    'claim_declined',
    'claim_withdrawn',
    'claim_expired',
    'claim_need_deactivated',
    'need_expired_claims_declined'
  )
  and jsonb_typeof(notification.payload) = 'object'
  and (
    notification.payload ->> 'needName' is null
    or notification.payload ->> 'needName' ~ '^[[:space:]]*$'
  );

commit;