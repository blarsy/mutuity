-- Migration 088: collapse account-scoped realtime signals onto a single
-- account_events_<account_id> channel so the browser only needs one
-- websocket subscription per authenticated session.

create or replace function app_private.notify_account_event(
  account_id uuid,
  related_node_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = app_private, app_public, public
as $$
begin
  if account_id is null then
    return;
  end if;

  perform pg_notify(
    'account_events_' || account_id,
    json_build_object('relatedNodeId', related_node_id)::text
  );
end;
$$;

comment on function app_private.notify_account_event(uuid, uuid) is
  'Fires pg_notify on account_events_<account_id> for UI refresh signals scoped to one account.';

create or replace function app_private.notify_token_balance_changed()
returns trigger
language plpgsql
security definer
set search_path = app_private, app_public, public
as $$
begin
  perform app_private.notify_account_event(new.account_id, new.id);
  return new;
end;
$$;

comment on function app_private.notify_token_balance_changed() is
  'Fires pg_notify on account_events_<account_id> after every token movement insert.';

create or replace function app_private.notify_bid_workspace_changed()
returns trigger
language plpgsql
security definer
set search_path = app_private, app_public, public
as $$
declare
  v_bid_id uuid;
  v_resource_id uuid;
  v_bidder_account_id uuid;
  v_creator_account_id uuid;
begin
  v_bid_id := coalesce(new.id, old.id);
  v_resource_id := coalesce(new.resource_id, old.resource_id);
  v_bidder_account_id := coalesce(new.bidder_account_id, old.bidder_account_id);

  select r.creator_account_id
  into v_creator_account_id
  from app_public.resource r
  where r.id = v_resource_id;

  perform app_private.notify_account_event(v_bidder_account_id, v_bid_id);

  if v_creator_account_id is distinct from v_bidder_account_id then
    perform app_private.notify_account_event(v_creator_account_id, v_bid_id);
  end if;

  return coalesce(new, old);
end;
$$;

comment on function app_private.notify_bid_workspace_changed() is
  'Fires pg_notify on account_events_<account_id> whenever a resource_bid row changes.';