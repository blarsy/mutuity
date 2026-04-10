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
  v_account_count integer := 0;
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

  update app_public.account_notification
  set read_at = now()
  where recipient_account_id = v_account_id
    and read_at is null;
  get diagnostics v_account_count = row_count;

  return v_need_count + v_resource_count + v_account_count;
end;
$$;

comment on function app_public.mark_all_notifications_read() is '@name markAllNotificationsRead';
