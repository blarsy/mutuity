begin;

create or replace function app_public.send_resource_message(
  resource_bid_id uuid,
  body text,
  image_urls text[] default array[]::text[]
)
returns app_public.resource_message
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_bid record;
  v_conversation app_public.resource_conversation;
  v_message app_public.resource_message;
  v_image_url text;
  v_sort_order integer := 0;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  if nullif(btrim(send_resource_message.body), '') is null then
    raise exception using message = 'Message body is required';
  end if;

  select
    rb.id,
    rb.resource_id,
    rb.bidder_account_id,
    rb.message,
    rb.created_at,
    r.creator_account_id as owner_account_id
  into v_bid
  from app_public.resource_bid rb
  join app_public.resource r on r.id = rb.resource_id
  where rb.id = send_resource_message.resource_bid_id;

  if not found then
    raise exception using message = 'Resource bid not found';
  end if;

  if v_account_id not in (v_bid.owner_account_id, v_bid.bidder_account_id) then
    raise exception using message = 'Only resource conversation participants can send messages';
  end if;

  select *
  into v_conversation
  from app_public.resource_conversation
  where app_public.resource_conversation.resource_bid_id = send_resource_message.resource_bid_id;

  if not found then
    insert into app_public.resource_conversation (
      resource_bid_id,
      resource_id,
      owner_account_id,
      bidder_account_id
    )
    values (
      v_bid.id,
      v_bid.resource_id,
      v_bid.owner_account_id,
      v_bid.bidder_account_id
    )
    returning * into v_conversation;

    if nullif(btrim(coalesce(v_bid.message, '')), '') is not null then
      insert into app_public.resource_message (
        conversation_id,
        sender_account_id,
        body,
        created_at
      )
      values (
        v_conversation.id,
        v_bid.bidder_account_id,
        v_bid.message,
        v_bid.created_at
      );
    end if;
  end if;

  insert into app_public.resource_message (
    conversation_id,
    sender_account_id,
    body
  )
  values (
    v_conversation.id,
    v_account_id,
    btrim(send_resource_message.body)
  )
  returning * into v_message;

  foreach v_image_url in array coalesce(send_resource_message.image_urls, array[]::text[]) loop
    if nullif(btrim(coalesce(v_image_url, '')), '') is not null then
      insert into app_public.resource_message_image (
        message_id,
        image_url,
        sort_order
      )
      values (
        v_message.id,
        btrim(v_image_url),
        v_sort_order
      );

      v_sort_order := v_sort_order + 1;
    end if;
  end loop;

  return v_message;
end;
$$;

comment on function app_public.send_resource_message(uuid, text, text[]) is
  '@name sendResourceMessage';

create or replace function app_public.mark_resource_messages_read(
  p_conversation_id uuid
)
returns integer
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_updated_count integer;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  if not exists (
    select 1
    from app_public.resource_conversation rc
    where rc.id = p_conversation_id
      and v_account_id in (rc.owner_account_id, rc.bidder_account_id)
  ) then
    raise exception using message = 'Only resource conversation participants can read messages';
  end if;

  update app_public.resource_message rm
  set read_at = now()
  where rm.conversation_id = p_conversation_id
    and rm.sender_account_id <> v_account_id
    and rm.read_at is null;

  get diagnostics v_updated_count = row_count;
  return coalesce(v_updated_count, 0);
end;
$$;

comment on function app_public.mark_resource_messages_read(uuid) is
  '@name markResourceMessagesRead';

create or replace function app_public.upsert_chat_typing_presence(
  p_conversation_kind app_public.chat_context_kind,
  p_conversation_id uuid
)
returns app_public.chat_typing_presence
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_row app_public.chat_typing_presence;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  if not app_private.is_chat_participant(p_conversation_kind, p_conversation_id, v_account_id) then
    raise exception using message = 'Only conversation participants can update typing state';
  end if;

  insert into app_public.chat_typing_presence (
    conversation_kind,
    conversation_id,
    account_id,
    last_typed_at
  )
  values (
    p_conversation_kind,
    p_conversation_id,
    v_account_id,
    now()
  )
  on conflict (conversation_kind, conversation_id, account_id)
  do update set
    last_typed_at = excluded.last_typed_at
  returning * into v_row;

  return v_row;
end;
$$;

comment on function app_public.upsert_chat_typing_presence(app_public.chat_context_kind, uuid) is
  '@name upsertChatTypingPresence';

grant execute on function app_public.send_resource_message(uuid, text, text[])
  to identified_account, admin;
grant execute on function app_public.mark_resource_messages_read(uuid)
  to identified_account, admin;
grant execute on function app_public.upsert_chat_typing_presence(app_public.chat_context_kind, uuid)
  to identified_account, admin;

commit;
