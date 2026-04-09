begin;

create or replace function app_public.mark_need_claim_notification_read(
  notification_id uuid
)
returns app_public.need_claim_notification
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_notification app_public.need_claim_notification;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  update app_public.need_claim_notification
  set read_at = coalesce(read_at, now())
  where id = mark_need_claim_notification_read.notification_id
    and recipient_account_id = v_account_id
  returning * into v_notification;

  if not found then
    raise exception using message = 'Need claim notification not found';
  end if;

  return v_notification;
end;
$$;

comment on function app_public.mark_need_claim_notification_read(uuid) is '@name markNeedClaimNotificationRead';

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

create or replace function app_public.mark_all_notifications_read()
returns integer
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_need_count integer := 0;
  v_resource_count integer := 0;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  update app_public.need_claim_notification
  set read_at = now()
  where recipient_account_id = v_account_id
    and read_at is null;
  get diagnostics v_need_count = row_count;

  update app_public.resource_bid_notification
  set read_at = now()
  where recipient_account_id = v_account_id
    and read_at is null;
  get diagnostics v_resource_count = row_count;

  return v_need_count + v_resource_count;
end;
$$;

comment on function app_public.mark_all_notifications_read() is '@name markAllNotificationsRead';

create or replace function app_public.cleanup_read_notifications()
returns integer
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_deleted_need integer := 0;
  v_deleted_resource integer := 0;
begin
  if not app_private.is_manager() then
    raise exception using message = 'Only managers can trigger notification cleanup';
  end if;

  delete from app_public.need_claim_notification
  where created_at <= now() - interval '7 days'
    and read_at is not null
    and read_at <= now() - interval '24 hours';
  get diagnostics v_deleted_need = row_count;

  delete from app_public.resource_bid_notification
  where created_at <= now() - interval '7 days'
    and read_at is not null
    and read_at <= now() - interval '24 hours';
  get diagnostics v_deleted_resource = row_count;

  return v_deleted_need + v_deleted_resource;
end;
$$;

comment on function app_public.cleanup_read_notifications() is '@name cleanupReadNotifications';

grant execute on function app_public.mark_need_claim_notification_read(uuid)
  to identified_account, manager, admin;

grant execute on function app_public.mark_resource_bid_notification_read(uuid)
  to identified_account, manager, admin;

grant execute on function app_public.mark_all_notifications_read()
  to identified_account, manager, admin;

grant execute on function app_public.cleanup_read_notifications()
  to manager, admin;

commit;