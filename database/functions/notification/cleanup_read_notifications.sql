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
