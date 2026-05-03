-- Migration 083: add a NOTIFY trigger on token_movement so PostGraphile
-- subscriptions can push balance changes to connected clients.
--
-- The notification channel name is: token_balance_<account_id>
-- The payload is the account_id as JSON text so listeners can verify.

create or replace function app_private.notify_token_balance_changed()
returns trigger
language plpgsql
security definer
set search_path = app_private, app_public, public
as $$
begin
  perform pg_notify(
    'token_balance_' || new.account_id,
    json_build_object('accountId', new.account_id)::text
  );
  return new;
end;
$$;

-- Drop and recreate to make this idempotent.
drop trigger if exists trigger_notify_token_balance_changed on app_public.token_movement;

create trigger trigger_notify_token_balance_changed
  after insert
  on app_public.token_movement
  for each row
  execute function app_private.notify_token_balance_changed();

comment on function app_private.notify_token_balance_changed() is
  'Fires pg_notify on the token_balance_<account_id> channel after every token movement insert.';
