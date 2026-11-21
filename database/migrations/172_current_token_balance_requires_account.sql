-- A missing session is not an account with an empty ledger. Keep the nullable
-- GraphQL field available, but let clients surface an unavailable balance.
create or replace function app_public.current_token_balance()
returns integer
language sql
stable
security definer
set search_path = app_public, app_private, public
as $$
  select case when app_private.current_account_id() is null then null
    else coalesce(sum(tm.amount_delta), 0)::integer end
  from app_public.token_movement tm
  where tm.account_id = app_private.current_account_id()
$$;

comment on function app_public.current_token_balance() is '@name currentTokenBalance';