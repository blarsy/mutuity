-- Allow anonymous role to evaluate RLS predicates used by public read paths.
--
-- Public detail queries (e.g. needById/resourceById) evaluate policies that call
-- app_private.current_account_id() and app_private.is_admin(). Anonymous users
-- should evaluate these as NULL/FALSE, but still need schema/function access to
-- execute the policy expression.

begin;

grant usage on schema app_private to anonymous;

grant execute on function app_private.current_account_id()
  to anonymous;

grant execute on function app_private.is_admin()
  to anonymous;

commit;
