create or replace function app_public.mark_account_notification_read(
  notification_id uuid
)
returns app_public.account_notification
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_notification app_public.account_notification;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  update app_public.account_notification
  set read_at = coalesce(read_at, now())
  where id = mark_account_notification_read.notification_id
    and recipient_account_id = v_account_id
  returning * into v_notification;

  if not found then
    raise exception using message = 'Account notification not found';
  end if;

  return v_notification;
end;
$$;

comment on function app_public.mark_account_notification_read(uuid) is '@name markAccountNotificationRead';
