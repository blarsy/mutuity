create or replace function app_public.mark_resource_bid_notification_read(
  notification_id uuid
)
returns app_public.resource_bid_notification
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_notification app_public.resource_bid_notification;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  update app_public.resource_bid_notification
  set read_at = coalesce(read_at, now())
  where id = mark_resource_bid_notification_read.notification_id
    and recipient_account_id = v_account_id
  returning * into v_notification;

  if not found then
    raise exception using message = 'Resource bid notification not found';
  end if;

  return v_notification;
end;
$$;

comment on function app_public.mark_resource_bid_notification_read(uuid) is '@name markResourceBidNotificationRead';
