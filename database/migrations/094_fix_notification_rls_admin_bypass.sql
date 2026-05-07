-- Fix notification RLS policies: remove is_manager() bypass from SELECT/UPDATE.
-- Notifications are personal — even admins should only see and update their own.
-- The previous policies allowed admin accounts to see ALL users' notifications,
-- causing data leakage when an admin account queries allNeedClaimNotifications,
-- allResourceBidNotifications, or allAccountNotifications.

-- need_claim_notification
drop policy if exists need_claim_notification_select_policy on app_public.need_claim_notification;
create policy need_claim_notification_select_policy on app_public.need_claim_notification
  for select
  using (
    recipient_account_id = app_private.current_account_id()
  );

drop policy if exists need_claim_notification_update_policy on app_public.need_claim_notification;
create policy need_claim_notification_update_policy on app_public.need_claim_notification
  for update
  using (
    recipient_account_id = app_private.current_account_id()
  )
  with check (
    recipient_account_id = app_private.current_account_id()
  );

-- resource_bid_notification
drop policy if exists resource_bid_notification_select_policy on app_public.resource_bid_notification;
create policy resource_bid_notification_select_policy on app_public.resource_bid_notification
  for select
  using (
    recipient_account_id = app_private.current_account_id()
  );

drop policy if exists resource_bid_notification_update_policy on app_public.resource_bid_notification;
create policy resource_bid_notification_update_policy on app_public.resource_bid_notification
  for update
  using (
    recipient_account_id = app_private.current_account_id()
  )
  with check (
    recipient_account_id = app_private.current_account_id()
  );

-- account_notification
drop policy if exists account_notification_select_policy on app_public.account_notification;
create policy account_notification_select_policy on app_public.account_notification
  for select
  using (
    recipient_account_id = app_private.current_account_id()
  );

drop policy if exists account_notification_update_policy on app_public.account_notification;
create policy account_notification_update_policy on app_public.account_notification
  for update
  using (
    recipient_account_id = app_private.current_account_id()
  )
  with check (
    recipient_account_id = app_private.current_account_id()
  );
