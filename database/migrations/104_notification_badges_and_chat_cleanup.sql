begin;

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

  perform app_private.notify_account_event(p_recipient_account_id, v_notification.id);

  return v_notification;
end;
$$;

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

  perform app_private.notify_account_event(p_recipient_account_id, v_notification.id);

  return v_notification;
end;
$$;

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

  perform app_private.notify_account_event(p_recipient_account_id, v_notification.id);

  return v_notification;
end;
$$;

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
    where recipient_account_id = v_account_id
      and read_at is null
    union all
    select count(*)::integer as unread_count
    from app_public.resource_bid_notification
    where recipient_account_id = v_account_id
      and read_at is null
    union all
    select count(*)::integer as unread_count
    from app_public.account_notification
    where recipient_account_id = v_account_id
      and read_at is null
  ) unread_notifications;

  return coalesce(v_count, 0);
end;
$$;

comment on function app_public.count_unread_notifications() is '@name countUnreadNotifications';

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

  perform app_private.notify_account_event(v_account_id, v_notification.id);

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

  perform app_private.notify_account_event(v_account_id, v_notification.id);

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

  perform app_private.notify_account_event(v_account_id, v_notification.id);

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

  perform app_private.notify_account_event(v_account_id);

  return v_need_count + v_resource_count + v_account_count;
end;
$$;

comment on function app_public.mark_all_notifications_read() is '@name markAllNotificationsRead';

create or replace function app_public.count_unread_chat_conversations()
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

  select count(*)::integer
  into v_count
  from app_public.chat_conversation_summary s
  where s.participant_account_id = v_account_id
    and s.unread_count > 0;

  return coalesce(v_count, 0);
end;
$$;

comment on function app_public.count_unread_chat_conversations() is '@name countUnreadChatConversations';

create or replace function app_private.notify_claim_message_inbox_notification()
returns trigger
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
begin
  return new;
end;
$$;

create or replace function app_private.notify_resource_message_inbox_notification()
returns trigger
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
begin
  return new;
end;
$$;

commit;