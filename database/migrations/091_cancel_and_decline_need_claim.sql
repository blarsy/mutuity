-- Migration 091: claimer-side cancel and creator-side decline for need claims

-- ─── cancel_need_claim (claimer withdraws their own open claim) ────────────────

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
    jsonb_build_object('needId', v_claim.need_id, 'claimerAccountId', v_claim.claimer_account_id)
  from app_public.need n
  where n.id = v_claim.need_id;

  return v_claim;
end;
$$;

comment on function app_public.cancel_need_claim(uuid) is '@name cancelNeedClaim';

grant execute on function app_public.cancel_need_claim(uuid) to identified_account, admin;

-- ─── decline_need_claim (need creator declines an open claim) ─────────────────

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
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  select n.creator_account_id into v_creator_id
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
    jsonb_build_object('needId', v_claim.need_id)
  );

  return v_claim;
end;
$$;

comment on function app_public.decline_need_claim(uuid) is '@name declineNeedClaim';

grant execute on function app_public.decline_need_claim(uuid) to identified_account, admin;
