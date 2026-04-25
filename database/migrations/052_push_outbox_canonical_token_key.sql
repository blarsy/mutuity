begin;

create or replace function app_private.queue_push_notification_outbox(
  p_account_id uuid,
  p_event_category text,
  p_title text,
  p_body text,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_notification_id uuid;
  v_metadata jsonb;
  v_push_target text;
begin
  if p_event_category not in (
    'new_resource_added',
    'new_need_added',
    'unread_notifications',
    'new_chat_message_received'
  ) then
    raise exception using message = 'Unsupported event category';
  end if;

  if nullif(btrim(coalesce(p_title, '')), '') is null then
    return null;
  end if;

  if nullif(btrim(coalesce(p_body, '')), '') is null then
    return null;
  end if;

  v_metadata := coalesce(p_metadata, '{}'::jsonb);
  v_push_target := coalesce(
    nullif(btrim(v_metadata ->> 'expoPushToken'), ''),
    nullif(btrim(v_metadata ->> 'pushToken'), ''),
    nullif(btrim(v_metadata ->> 'to'), '')
  );

  if v_push_target is not null then
    v_metadata := jsonb_set(v_metadata, '{expoPushToken}', to_jsonb(v_push_target), true);
    v_metadata := jsonb_set(v_metadata, '{to}', to_jsonb(v_push_target), true);
  end if;

  insert into app_private.push_notification_outbox (
    account_id,
    event_category,
    title,
    body,
    metadata
  )
  values (
    p_account_id,
    p_event_category,
    btrim(p_title),
    btrim(p_body),
    v_metadata
  )
  returning id into v_notification_id;

  return v_notification_id;
end;
$$;

comment on function app_private.queue_push_notification_outbox(uuid, text, text, text, jsonb) is
  'Queues one preference-managed realtime push notification in the push outbox and normalizes token metadata to expoPushToken/to when provided.';

commit;