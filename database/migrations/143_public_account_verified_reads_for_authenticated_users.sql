begin;

-- Public creator account rows are readable for authenticated users when the
-- account is verified. This preserves the private-account restrictions while
-- allowing public detail pages to resolve creator profiles for logged-in users.

drop policy if exists account_public_verified_select_policy on app_public.account;
create policy account_public_verified_select_policy on app_public.account
  for select
  to anonymous, identified_account, admin
  using (
    app_private.is_account_email_verified(id)
  );

commit;
