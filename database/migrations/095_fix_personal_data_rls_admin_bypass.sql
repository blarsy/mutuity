-- Remove admin bypass from personal-data RLS policies.
--
-- Principle: per-user personal data must only be accessible by the owning account
-- through base table RLS. Admin use-cases should go through dedicated admin-only
-- functions that enforce role checks internally.

-- token_movement (personal financial ledger)
drop policy if exists token_movement_select_policy on app_public.token_movement;
create policy token_movement_select_policy on app_public.token_movement
  for select
  using (
    account_id = app_private.current_account_id()
  );

-- account_delivery_preference (personal notification preferences)
drop policy if exists account_delivery_preference_select_policy on app_public.account_delivery_preference;
create policy account_delivery_preference_select_policy on app_public.account_delivery_preference
  for select
  using (
    account_id = app_private.current_account_id()
  );

drop policy if exists account_delivery_preference_insert_policy on app_public.account_delivery_preference;
create policy account_delivery_preference_insert_policy on app_public.account_delivery_preference
  for insert
  with check (
    account_id = app_private.current_account_id()
  );

drop policy if exists account_delivery_preference_update_policy on app_public.account_delivery_preference;
create policy account_delivery_preference_update_policy on app_public.account_delivery_preference
  for update
  using (
    account_id = app_private.current_account_id()
  )
  with check (
    account_id = app_private.current_account_id()
  );
