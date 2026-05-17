-- Allow anonymous reads of public account rows used by public detail pages.
--
-- Public need/resource pages join creator account via accountByCreatorAccountId.
-- Anonymous needs table-level SELECT on app_public.account, then RLS narrows
-- visibility to verified accounts only.

begin;

grant select on app_public.account to anonymous;

drop policy if exists account_public_verified_select_policy on app_public.account;
create policy account_public_verified_select_policy on app_public.account
  for select
  to anonymous
  using (app_private.is_account_email_verified(id));

commit;
