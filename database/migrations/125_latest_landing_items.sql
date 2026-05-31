begin;

\ir ../functions/account/latest_landing_items.sql

grant execute on function app_public.latest_landing_items(integer)
  to anonymous, identified_account, admin;

commit;
