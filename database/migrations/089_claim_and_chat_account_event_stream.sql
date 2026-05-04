-- Migration 089: extend the shared account event stream to claims and chat
-- row changes so claim/chat surfaces can refetch selectively without polling.

create or replace function app_private.notify_need_claim_changed()
returns trigger
language plpgsql
security definer
set search_path = app_private, app_public, public
as $$
declare
  v_claim_id uuid;
  v_need_id uuid;
  v_claimer_account_id uuid;
  v_creator_account_id uuid;
begin
  v_claim_id := coalesce(new.id, old.id);
  v_need_id := coalesce(new.need_id, old.need_id);
  v_claimer_account_id := coalesce(new.claimer_account_id, old.claimer_account_id);

  select n.creator_account_id
  into v_creator_account_id
  from app_public.need n
  where n.id = v_need_id;

  perform app_private.notify_account_event(v_claimer_account_id, v_claim_id);

  if v_creator_account_id is distinct from v_claimer_account_id then
    perform app_private.notify_account_event(v_creator_account_id, v_claim_id);
  end if;

  return coalesce(new, old);
end;
$$;

comment on function app_private.notify_need_claim_changed() is
  'Fires pg_notify on account_events_<account_id> whenever a need_claim row changes.';

create or replace function app_private.notify_need_claim_notification_changed()
returns trigger
language plpgsql
security definer
set search_path = app_private, app_public, public
as $$
begin
  perform app_private.notify_account_event(
    coalesce(new.recipient_account_id, old.recipient_account_id),
    coalesce(new.id, old.id)
  );

  return coalesce(new, old);
end;
$$;

comment on function app_private.notify_need_claim_notification_changed() is
  'Fires pg_notify on account_events_<account_id> whenever a need_claim_notification row changes.';

create or replace function app_private.notify_claim_message_changed()
returns trigger
language plpgsql
security definer
set search_path = app_private, app_public, public
as $$
declare
  v_message_id uuid;
  v_conversation_id uuid;
  v_creator_account_id uuid;
  v_claimer_account_id uuid;
begin
  v_message_id := coalesce(new.id, old.id);
  v_conversation_id := coalesce(new.conversation_id, old.conversation_id);

  select cc.creator_account_id, cc.claimer_account_id
  into v_creator_account_id, v_claimer_account_id
  from app_public.claim_conversation cc
  where cc.id = v_conversation_id;

  perform app_private.notify_account_event(v_creator_account_id, v_message_id);

  if v_claimer_account_id is distinct from v_creator_account_id then
    perform app_private.notify_account_event(v_claimer_account_id, v_message_id);
  end if;

  return coalesce(new, old);
end;
$$;

comment on function app_private.notify_claim_message_changed() is
  'Fires pg_notify on account_events_<account_id> whenever a claim_message row changes.';

create or replace function app_private.notify_resource_message_changed()
returns trigger
language plpgsql
security definer
set search_path = app_private, app_public, public
as $$
declare
  v_message_id uuid;
  v_conversation_id uuid;
  v_owner_account_id uuid;
  v_bidder_account_id uuid;
begin
  v_message_id := coalesce(new.id, old.id);
  v_conversation_id := coalesce(new.conversation_id, old.conversation_id);

  select rc.owner_account_id, rc.bidder_account_id
  into v_owner_account_id, v_bidder_account_id
  from app_public.resource_conversation rc
  where rc.id = v_conversation_id;

  perform app_private.notify_account_event(v_owner_account_id, v_message_id);

  if v_bidder_account_id is distinct from v_owner_account_id then
    perform app_private.notify_account_event(v_bidder_account_id, v_message_id);
  end if;

  return coalesce(new, old);
end;
$$;

comment on function app_private.notify_resource_message_changed() is
  'Fires pg_notify on account_events_<account_id> whenever a resource_message row changes.';

drop trigger if exists trg_need_claim_account_events on app_public.need_claim;
create trigger trg_need_claim_account_events
  after insert or update on app_public.need_claim
  for each row
  execute function app_private.notify_need_claim_changed();

drop trigger if exists trg_need_claim_notification_account_events on app_public.need_claim_notification;
create trigger trg_need_claim_notification_account_events
  after insert or update on app_public.need_claim_notification
  for each row
  execute function app_private.notify_need_claim_notification_changed();

drop trigger if exists trg_claim_message_account_events on app_public.claim_message;
create trigger trg_claim_message_account_events
  after insert or update of read_at on app_public.claim_message
  for each row
  execute function app_private.notify_claim_message_changed();

drop trigger if exists trg_resource_message_account_events on app_public.resource_message;
create trigger trg_resource_message_account_events
  after insert or update of read_at on app_public.resource_message
  for each row
  execute function app_private.notify_resource_message_changed();