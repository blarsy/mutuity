begin;

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
