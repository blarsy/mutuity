begin;

-- Canonical notification/realtime.sql. No permission revocations or data rewrites.
-- Account-scoped invalidation only: never include inbox contents in NOTIFY.
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

create or replace function app_private.notify_notification_changed()
returns trigger
language plpgsql
security definer
set search_path = app_private, app_public, public
as $$
begin
  if tg_op = 'DELETE' then
    perform app_private.notify_account_event(old.recipient_account_id, old.id);
    return old;
  end if;

  if tg_op = 'UPDATE' then
    -- Repeated mark-read calls must not cause another refresh. Payload edits
    -- still invalidate the feed, as do read/unread transitions.
    if new is not distinct from old then
      return new;
    end if;

    -- Internal recipient reassignment invalidates both inboxes, not participants.
    if old.recipient_account_id is distinct from new.recipient_account_id then
      perform app_private.notify_account_event(old.recipient_account_id, old.id);
    end if;
  end if;

  perform app_private.notify_account_event(new.recipient_account_id, new.id);
  return new;
end;
$$;

comment on function app_private.notify_notification_changed() is
  'Recipient-only account events for notification inserts, meaningful updates and deletes; transactionally delivered on commit.';

-- Replace the legacy claim-only trigger instead of stacking two signals.
drop trigger if exists trg_need_claim_notification_account_events on app_public.need_claim_notification;
drop trigger if exists trg_account_notification_account_events on app_public.account_notification;
drop trigger if exists trg_resource_bid_notification_account_events on app_public.resource_bid_notification;

create trigger trg_account_notification_account_events
  after insert or update or delete on app_public.account_notification
  for each row execute function app_private.notify_notification_changed();

create trigger trg_need_claim_notification_account_events
  after insert or update or delete on app_public.need_claim_notification
  for each row execute function app_private.notify_notification_changed();

create trigger trg_resource_bid_notification_account_events
  after insert or update or delete on app_public.resource_bid_notification
  for each row execute function app_private.notify_notification_changed();

-- Keep the existing token insertion contract canonical as well.
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

drop trigger if exists trigger_notify_token_balance_changed on app_public.token_movement;
create trigger trigger_notify_token_balance_changed
  after insert on app_public.token_movement
  for each row execute function app_private.notify_token_balance_changed();

-- Single-column indexes expose CREATED_AT_ASC/DESC to PostGraphile. Clients
-- should add ID_DESC as a deterministic tie-breaker and page all three sources.
create index if not exists account_notification_created_at_idx
  on app_public.account_notification (created_at);
create index if not exists need_claim_notification_created_at_idx
  on app_public.need_claim_notification (created_at);
create index if not exists resource_bid_notification_created_at_idx
  on app_public.resource_bid_notification (created_at);

create or replace function app_public.count_unread_notifications()
returns integer
language plpgsql
stable
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_count integer;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  select coalesce(sum(unread_count), 0)::integer
  into v_count
  from (
    select count(*)::integer as unread_count
    from app_public.need_claim_notification
    where recipient_account_id = v_account_id and read_at is null
    union all
    select count(*)::integer as unread_count
    from app_public.resource_bid_notification
    where recipient_account_id = v_account_id and read_at is null
    union all
    select count(*)::integer as unread_count
    from app_public.account_notification
    where recipient_account_id = v_account_id and read_at is null
  ) unread_notifications;

  return coalesce(v_count, 0);
end;
$$;

comment on function app_public.count_unread_notifications() is '@name countUnreadNotifications';
-- Explicit role grants, without changing existing PUBLIC privileges or RLS.
grant execute on function app_public.count_unread_notifications() to identified_account, admin;

-- Refresh migration104 helper bodies: table triggers now own signalling.
-- Realtime is emitted by the table trigger in notification/realtime.sql,
-- including raw/internal inserts; do not emit a duplicate signal here.
create or replace function app_private.create_account_notification(
  p_recipient_account_id uuid,
  p_event_type text,
  p_payload jsonb default '{}'::jsonb
)
returns app_public.account_notification
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_notification app_public.account_notification;
begin
  insert into app_public.account_notification (
    recipient_account_id,
    event_type,
    payload
  )
  values (
    p_recipient_account_id,
    p_event_type,
    coalesce(p_payload, '{}'::jsonb)
  )
  returning * into v_notification;

  return v_notification;
end;
$$;

-- Realtime is emitted by the table trigger in notification/realtime.sql,
-- including raw/internal inserts; do not emit a duplicate signal here.
create or replace function app_private.create_need_claim_notification(
  p_recipient_account_id uuid,
  p_need_claim_id uuid,
  p_event_type text,
  p_payload jsonb default '{}'::jsonb
)
returns app_public.need_claim_notification
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_notification app_public.need_claim_notification;
begin
  insert into app_public.need_claim_notification (
    recipient_account_id,
    need_claim_id,
    event_type,
    payload
  )
  values (
    p_recipient_account_id,
    p_need_claim_id,
    p_event_type,
    coalesce(p_payload, '{}'::jsonb)
  )
  returning * into v_notification;

  return v_notification;
end;
$$;

-- Realtime is emitted by the table trigger in notification/realtime.sql,
-- including raw/internal inserts; do not emit a duplicate signal here.
create or replace function app_private.create_resource_bid_notification(
  p_recipient_account_id uuid,
  p_resource_bid_id uuid,
  p_event_type text,
  p_payload jsonb default '{}'::jsonb
)
returns app_public.resource_bid_notification
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_notification app_public.resource_bid_notification;
begin
  insert into app_public.resource_bid_notification (
    recipient_account_id,
    resource_bid_id,
    event_type,
    payload
  )
  values (
    p_recipient_account_id,
    p_resource_bid_id,
    p_event_type,
    coalesce(p_payload, '{}'::jsonb)
  )
  returning * into v_notification;

  return v_notification;
end;
$$;

create or replace function app_public.mark_account_notification_read(
  notification_id uuid
)
returns app_public.account_notification
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_notification app_public.account_notification;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  update app_public.account_notification
  set read_at = coalesce(read_at, now())
  where id = mark_account_notification_read.notification_id
    and recipient_account_id = v_account_id
  returning * into v_notification;

  if not found then
    raise exception using message = 'Account notification not found';
  end if;

  return v_notification;
end;
$$;

comment on function app_public.mark_account_notification_read(uuid) is '@name markAccountNotificationRead';

create or replace function app_public.mark_need_claim_notification_read(
  notification_id uuid
)
returns app_public.need_claim_notification
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_notification app_public.need_claim_notification;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  update app_public.need_claim_notification
  set read_at = coalesce(read_at, now())
  where id = mark_need_claim_notification_read.notification_id
    and recipient_account_id = v_account_id
  returning * into v_notification;

  if not found then
    raise exception using message = 'Need claim notification not found';
  end if;

  return v_notification;
end;
$$;

comment on function app_public.mark_need_claim_notification_read(uuid) is '@name markNeedClaimNotificationRead';

create or replace function app_public.mark_resource_bid_notification_read(
  notification_id uuid
)
returns app_public.resource_bid_notification
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_notification app_public.resource_bid_notification;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  update app_public.resource_bid_notification
  set read_at = coalesce(read_at, now())
  where id = mark_resource_bid_notification_read.notification_id
    and recipient_account_id = v_account_id
  returning * into v_notification;

  if not found then
    raise exception using message = 'Resource bid notification not found';
  end if;

  return v_notification;
end;
$$;

comment on function app_public.mark_resource_bid_notification_read(uuid) is '@name markResourceBidNotificationRead';

create or replace function app_public.mark_all_notifications_read()
returns integer
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_need_count integer := 0;
  v_resource_count integer := 0;
  v_account_count integer := 0;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  update app_public.need_claim_notification
  set read_at = now()
  where recipient_account_id = v_account_id
    and read_at is null;
  get diagnostics v_need_count = row_count;

  update app_public.resource_bid_notification
  set read_at = now()
  where recipient_account_id = v_account_id
    and read_at is null;
  get diagnostics v_resource_count = row_count;

  update app_public.account_notification
  set read_at = now()
  where recipient_account_id = v_account_id
    and read_at is null;
  get diagnostics v_account_count = row_count;

  return v_need_count + v_resource_count + v_account_count;
end;
$$;

comment on function app_public.mark_all_notifications_read() is '@name markAllNotificationsRead';

commit;