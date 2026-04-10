create or replace function app_private.create_account_notification(
  p_recipient_account_id uuid,
  p_event_type text,
  p_payload jsonb default '{}'::jsonb
)
returns app_public.account_notification
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_notification app_public.account_notification;
begin
  insert into app_public.account_notification (
    recipient_account_id,
    event_type,
    payload
  )
  values (
    p_recipient_account_id,
    p_event_type,
    coalesce(p_payload, '{}'::jsonb)
  )
  returning * into v_notification;

  return v_notification;
end;
$$;
