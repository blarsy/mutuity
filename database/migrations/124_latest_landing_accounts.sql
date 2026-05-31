begin;

\ir ../functions/account/latest_landing_accounts.sql

grant execute on function app_public.latest_landing_accounts(integer)
  to anonymous, identified_account, admin;

commit;