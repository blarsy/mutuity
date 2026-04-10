create or replace function app_public.current_token_balance()
returns integer
language sql
stable
security definer
set search_path = app_public, app_private, public
as $$
  select coalesce(sum(tm.amount_delta), 0)::integer
  from app_public.token_movement tm
  where tm.account_id = app_private.current_account_id()
$$;

comment on function app_public.current_token_balance() is '@name currentTokenBalance';
