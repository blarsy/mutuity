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