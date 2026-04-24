create or replace function app_public.set_account_delivery_preference(
  p_event_category text,
  p_delivery_strategy text,
  p_summary_frequency_days integer default null
)
returns app_public.account_delivery_preference
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_frequency integer;
  v_preference app_public.account_delivery_preference;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  if p_event_category not in (
    'new_resource_added',
    'new_need_added',
    'unread_notifications',
    'new_chat_message_received'
  ) then
    raise exception using message = 'Unsupported event category';
  end if;

  if p_delivery_strategy not in ('realtime_push', 'email_summary') then
    raise exception using message = 'Unsupported delivery strategy';
  end if;

  v_frequency := coalesce(p_summary_frequency_days, 1);

  if v_frequency not in (1, 3, 7, 30) then
    raise exception using message = 'Unsupported summary frequency';
  end if;

  insert into app_public.account_delivery_preference (
    account_id,
    event_category,
    delivery_strategy,
    summary_frequency_days,
    updated_at
  )
  values (
    v_account_id,
    p_event_category,
    p_delivery_strategy,
    v_frequency,
    now()
  )
  on conflict (account_id, event_category)
  do update
  set
    delivery_strategy = excluded.delivery_strategy,
    summary_frequency_days = excluded.summary_frequency_days,
    updated_at = now()
  returning * into v_preference;

  return v_preference;
end;
$$;

comment on function app_public.set_account_delivery_preference(text, text, integer) is
  '@name setAccountDeliveryPreference';
