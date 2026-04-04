create or replace function app_private.create_need_claim_notification(
  p_recipient_account_id uuid,
  p_need_claim_id uuid,
  p_event_type text,
  p_payload jsonb default '{}'::jsonb
)
returns app_public.need_claim_notification
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_notification app_public.need_claim_notification;
begin
  insert into app_public.need_claim_notification (
    recipient_account_id,
    need_claim_id,
    event_type,
    payload
  )
  values (
    p_recipient_account_id,
    p_need_claim_id,
    p_event_type,
    coalesce(p_payload, '{}'::jsonb)
  )
  returning * into v_notification;

  return v_notification;
end;
$$;

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

  perform app_private.create_need_claim_notification(
    v_need.creator_account_id,
    v_claim.id,
    'claim_created',
    jsonb_build_object(
      'needId', v_need.id,
      'claimerAccountId', v_account_id,
      'status', v_claim.status
    )
  );

  return v_claim;
end;
$$;

comment on function app_public.claim_need(uuid, text) is '@name claimNeed';
