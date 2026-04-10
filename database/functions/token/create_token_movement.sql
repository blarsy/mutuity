create or replace function app_private.create_token_movement(
  p_account_id uuid,
  p_amount_delta integer,
  p_event_type text,
  p_reference_type text default null,
  p_reference_id uuid default null,
  p_counterparty_account_id uuid default null,
  p_payload jsonb default '{}'::jsonb,
  p_idempotency_key text default null
)
returns app_public.token_movement
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_movement app_public.token_movement;
begin
  if p_amount_delta is null or p_amount_delta = 0 then
    return null;
  end if;

  if p_idempotency_key is null then
    insert into app_public.token_movement (
      account_id,
      counterparty_account_id,
      event_type,
      amount_delta,
      reference_type,
      reference_id,
      payload,
      idempotency_key
    )
    values (
      p_account_id,
      p_counterparty_account_id,
      p_event_type,
      p_amount_delta,
      nullif(btrim(p_reference_type), ''),
      p_reference_id,
      coalesce(p_payload, '{}'::jsonb),
      null
    )
    returning * into v_movement;
  else
    insert into app_public.token_movement (
      account_id,
      counterparty_account_id,
      event_type,
      amount_delta,
      reference_type,
      reference_id,
      payload,
      idempotency_key
    )
    values (
      p_account_id,
      p_counterparty_account_id,
      p_event_type,
      p_amount_delta,
      nullif(btrim(p_reference_type), ''),
      p_reference_id,
      coalesce(p_payload, '{}'::jsonb),
      p_idempotency_key
    )
    on conflict (idempotency_key) do update
      set idempotency_key = excluded.idempotency_key
    returning * into v_movement;
  end if;

  return v_movement;
end;
$$;
