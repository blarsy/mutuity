-- Restore legacy helper name referenced by recent SQL functions.
-- Some newer functions call app_private.is_administrator(), while the canonical helper is app_private.is_admin().
create or replace function app_private.is_administrator()
returns boolean
language sql
stable
as $$
  select app_private.is_admin();
$$;

grant execute on function app_private.is_administrator() to identified_account, admin;
