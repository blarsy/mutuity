begin;

create table if not exists app_public.account_notification (
  id uuid primary key default gen_random_uuid(),
  recipient_account_id uuid not null references app_public.account(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint account_notification_event_type_present check (btrim(event_type) <> '')
);

create index if not exists account_notification_recipient_idx
  on app_public.account_notification (recipient_account_id, created_at desc);

alter table app_public.account_notification enable row level security;

drop policy if exists account_notification_select_policy on app_public.account_notification;
create policy account_notification_select_policy on app_public.account_notification
  for select
  using (
    app_private.is_manager()
    or recipient_account_id = app_private.current_account_id()
  );

drop policy if exists account_notification_update_policy on app_public.account_notification;
create policy account_notification_update_policy on app_public.account_notification
  for update
  using (
    app_private.is_manager()
    or recipient_account_id = app_private.current_account_id()
  )
  with check (
    app_private.is_manager()
    or recipient_account_id = app_private.current_account_id()
  );

grant select, update on app_public.account_notification to identified_account, manager, admin;

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

create or replace function app_public.cleanup_read_notifications()
returns integer
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_deleted_need integer := 0;
  v_deleted_resource integer := 0;
  v_deleted_account integer := 0;
begin
  if not app_private.is_manager() then
    raise exception using message = 'Only managers can trigger notification cleanup';
  end if;

  delete from app_public.need_claim_notification
  where created_at <= now() - interval '7 days'
    and read_at is not null
    and read_at <= now() - interval '24 hours';
  get diagnostics v_deleted_need = row_count;

  delete from app_public.resource_bid_notification
  where created_at <= now() - interval '7 days'
    and read_at is not null
    and read_at <= now() - interval '24 hours';
  get diagnostics v_deleted_resource = row_count;

  delete from app_public.account_notification
  where created_at <= now() - interval '7 days'
    and read_at is not null
    and read_at <= now() - interval '24 hours';
  get diagnostics v_deleted_account = row_count;

  return v_deleted_need + v_deleted_resource + v_deleted_account;
end;
$$;

comment on function app_public.cleanup_read_notifications() is '@name cleanupReadNotifications';

create or replace function app_public.gift_tokens(
  recipient_account_id uuid,
  amount integer,
  message text default null
)
returns app_public.token_movement
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_sender_account_id uuid;
  v_sender app_public.account;
  v_recipient app_public.account;
  v_transfer_id uuid := gen_random_uuid();
  v_sender_movement app_public.token_movement;
  v_sender_name text;
begin
  v_sender_account_id := app_private.current_account_id();

  if v_sender_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  if gift_tokens.recipient_account_id is null then
    raise exception using message = 'Recipient account not found';
  end if;

  if gift_tokens.amount is null or gift_tokens.amount <= 0 then
    raise exception using message = 'Gift amount must be greater than zero';
  end if;

  if gift_tokens.recipient_account_id = v_sender_account_id then
    raise exception using message = 'You cannot gift tokens to your own account';
  end if;

  select * into v_sender
  from app_public.account
  where id = v_sender_account_id;

  select * into v_recipient
  from app_public.account
  where id = gift_tokens.recipient_account_id;

  if not found then
    raise exception using message = 'Recipient account not found';
  end if;

  v_sender_name := coalesce(v_sender.display_name, v_sender.external_subject, v_sender.id::text);

  select * into v_sender_movement
  from app_private.create_token_movement(
    v_sender_account_id,
    -gift_tokens.amount,
    'gift_tokens_sent',
    'gift_transfer',
    v_transfer_id,
    v_recipient.id,
    jsonb_build_object(
      'recipientAccountId', v_recipient.id,
      'recipientName', coalesce(v_recipient.display_name, v_recipient.external_subject, v_recipient.id::text),
      'amountSent', gift_tokens.amount,
      'message', nullif(btrim(gift_tokens.message), '')
    ),
    null
  );

  perform app_private.create_token_movement(
    v_recipient.id,
    gift_tokens.amount,
    'gift_tokens_received',
    'gift_transfer',
    v_transfer_id,
    v_sender_account_id,
    jsonb_build_object(
      'senderAccountId', v_sender_account_id,
      'senderName', v_sender_name,
      'amountReceived', gift_tokens.amount,
      'message', nullif(btrim(gift_tokens.message), '')
    ),
    null
  );

  perform app_private.create_account_notification(
    v_recipient.id,
    'gift_tokens_received',
    jsonb_build_object(
      'senderAccountId', v_sender_account_id,
      'senderName', v_sender_name,
      'amountReceived', gift_tokens.amount,
      'message', nullif(btrim(gift_tokens.message), ''),
      'url', '/contribution'
    )
  );

  return v_sender_movement;
end;
$$;

comment on function app_public.gift_tokens(uuid, integer, text) is '@name giftTokens';

grant execute on function app_private.create_account_notification(uuid, text, jsonb)
  to identified_account, manager, admin;

grant execute on function app_public.mark_account_notification_read(uuid)
  to identified_account, manager, admin;

grant execute on function app_public.gift_tokens(uuid, integer, text)
  to identified_account, manager, admin;

comment on table app_public.account_notification is 'Generic account-scoped notifications for gifts, profile rewards, campaigns, and other non-claim/bid events.';

commit;
