-- Migration 087: emit account-scoped NOTIFY signals for bid workspace refreshes.
--
-- Superseded by migration 088, which routes these signals through the shared
-- account_events_<account_id> channel.

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

  if v_bidder_account_id is not null then
    perform pg_notify(
      'bid_workspace_' || v_bidder_account_id,
      json_build_object(
        'resourceBidId', v_bid_id,
        'resourceId', v_resource_id,
        'event', lower(tg_op)
      )::text
    );
  end if;

  if v_creator_account_id is not null and v_creator_account_id is distinct from v_bidder_account_id then
    perform pg_notify(
      'bid_workspace_' || v_creator_account_id,
      json_build_object(
        'resourceBidId', v_bid_id,
        'resourceId', v_resource_id,
        'event', lower(tg_op)
      )::text
    );
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trigger_notify_bid_workspace_changed on app_public.resource_bid;

create trigger trigger_notify_bid_workspace_changed
  after insert or update or delete
  on app_public.resource_bid
  for each row
  execute function app_private.notify_bid_workspace_changed();

comment on function app_private.notify_bid_workspace_changed() is
  'Fires pg_notify on bid_workspace_<account_id> whenever a resource_bid row changes.';
