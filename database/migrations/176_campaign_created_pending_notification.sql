begin;

-- Snapshot of functions/campaign/notify_campaign_created.sql.
-- A trigger keeps create_campaign SECURITY INVOKER and its RLS semantics intact.
-- It also covers other initial pending inserts, but never edits or status changes.
create or replace function app_private.notify_campaign_created_pending()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, app_public, app_private
as $$
declare
  v_admin record;
begin
  for v_admin in
    select a.id
    from app_public.account a
    where a.role_name = 'admin'
      and a.id <> new.creator_account_id
  loop
    perform app_private.create_account_notification(
      v_admin.id,
      'campaign_created_pending',
      jsonb_build_object('campaignId', new.id, 'campaignName', new.title)
    );
  end loop;
  return new;
end;
$$;

revoke all on function app_private.notify_campaign_created_pending() from public, anonymous, identified_account, admin;

drop trigger if exists trg_campaign_created_pending_notification on app_public.campaign;
create trigger trg_campaign_created_pending_notification
  after insert on app_public.campaign
  for each row
  when (new.moderation_status = 'pending')
  execute function app_private.notify_campaign_created_pending();

commit;