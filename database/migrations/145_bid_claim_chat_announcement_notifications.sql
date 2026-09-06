begin;

-- The opening chat message that is back-seeded when a claim/bid conversation
-- is first used (see send_claim_message / send_resource_message) always
-- carries the claimer/bidder's original message at the claim/bid's own
-- created_at timestamp. Detecting that exact match lets us tell this
-- "announcement" message apart from ordinary chat replies, so recipients get
-- a dedicated "you received a claim/bid" notification instead of a generic
-- chat one.

create or replace function app_private.notify_claim_message_inbox_notification()
returns trigger
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_recipient_account_id uuid;
  v_sender_display_name text;
  v_context_id uuid;
  v_need_claim_id uuid;
  v_need_title text;
  v_preview text;
  v_payload jsonb;
  v_is_claim_announcement boolean := false;
begin
  select
    case
      when new.sender_account_id = cc.creator_account_id then cc.claimer_account_id
      else cc.creator_account_id
    end,
    cc.need_id,
    cc.need_claim_id
  into v_recipient_account_id, v_context_id, v_need_claim_id
  from app_public.claim_conversation cc
  where cc.id = new.conversation_id;

  if v_recipient_account_id is null or v_recipient_account_id = new.sender_account_id then
    return new;
  end if;

  select coalesce(a.display_name, a.external_subject)
  into v_sender_display_name
  from app_public.account a
  where a.id = new.sender_account_id;

  select n.title
  into v_need_title
  from app_public.need n
  where n.id = v_context_id;

  if v_need_claim_id is not null then
    select true
    into v_is_claim_announcement
    from app_public.need_claim nc
    where nc.id = v_need_claim_id
      and nc.claimer_account_id = new.sender_account_id
      and nc.created_at = new.created_at;
  end if;

  if coalesce(v_is_claim_announcement, false) then
    v_payload := jsonb_build_object(
      'needId', v_context_id,
      'needName', v_need_title,
      'claimerAccountId', new.sender_account_id,
      'claimerDisplayName', coalesce(v_sender_display_name, new.sender_account_id::text),
      'url', '/claims'
    );

    perform app_private.create_account_notification(
      v_recipient_account_id,
      'need_claim_received',
      v_payload
    );
  else
    v_preview := app_private.chat_message_preview(new.body);

    v_payload := jsonb_build_object(
      'conversationKind', 'need',
      'conversationId', new.conversation_id,
      'contextId', v_context_id,
      'senderAccountId', new.sender_account_id,
      'senderDisplayName', coalesce(v_sender_display_name, new.sender_account_id::text),
      'messagePreview', v_preview,
      'messageId', new.id,
      'url', format('/chat?kind=need&id=%s', new.conversation_id)
    );

    perform app_private.create_account_notification(
      v_recipient_account_id,
      'chat_message_received',
      v_payload
    );
  end if;

  perform app_private.dispatch_preference_managed_event(
    v_recipient_account_id,
    'new_chat_message_received',
    coalesce(v_sender_display_name, 'New message'),
    app_private.chat_message_preview(new.body),
    jsonb_build_object(
      'conversationKind', 'need',
      'conversationId', new.conversation_id,
      'contextId', v_context_id,
      'senderAccountId', new.sender_account_id,
      'senderDisplayName', coalesce(v_sender_display_name, new.sender_account_id::text),
      'messagePreview', app_private.chat_message_preview(new.body),
      'messageId', new.id,
      'url', format('/chat?kind=need&id=%s', new.conversation_id)
    )
  );

  return new;
end;
$$;

create or replace function app_private.notify_resource_message_inbox_notification()
returns trigger
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_recipient_account_id uuid;
  v_sender_display_name text;
  v_context_id uuid;
  v_resource_bid_id uuid;
  v_resource_title text;
  v_preview text;
  v_payload jsonb;
  v_is_bid_announcement boolean := false;
begin
  select
    case
      when new.sender_account_id = rc.owner_account_id then rc.bidder_account_id
      else rc.owner_account_id
    end,
    rc.resource_id,
    rc.resource_bid_id
  into v_recipient_account_id, v_context_id, v_resource_bid_id
  from app_public.resource_conversation rc
  where rc.id = new.conversation_id;

  if v_recipient_account_id is null or v_recipient_account_id = new.sender_account_id then
    return new;
  end if;

  select coalesce(a.display_name, a.external_subject)
  into v_sender_display_name
  from app_public.account a
  where a.id = new.sender_account_id;

  select r.title
  into v_resource_title
  from app_public.resource r
  where r.id = v_context_id;

  if v_resource_bid_id is not null then
    select true
    into v_is_bid_announcement
    from app_public.resource_bid rb
    where rb.id = v_resource_bid_id
      and rb.bidder_account_id = new.sender_account_id
      and rb.created_at = new.created_at;
  end if;

  if coalesce(v_is_bid_announcement, false) then
    v_payload := jsonb_build_object(
      'resourceId', v_context_id,
      'resourceName', v_resource_title,
      'bidderAccountId', new.sender_account_id,
      'bidderDisplayName', coalesce(v_sender_display_name, new.sender_account_id::text),
      'url', '/bids'
    );

    perform app_private.create_account_notification(
      v_recipient_account_id,
      'resource_bid_received',
      v_payload
    );
  else
    v_preview := app_private.chat_message_preview(new.body);

    v_payload := jsonb_build_object(
      'conversationKind', 'resource',
      'conversationId', new.conversation_id,
      'contextId', v_context_id,
      'senderAccountId', new.sender_account_id,
      'senderDisplayName', coalesce(v_sender_display_name, new.sender_account_id::text),
      'messagePreview', v_preview,
      'messageId', new.id,
      'url', format('/chat?kind=resource&id=%s', new.conversation_id)
    );

    perform app_private.create_account_notification(
      v_recipient_account_id,
      'chat_message_received',
      v_payload
    );
  end if;

  perform app_private.dispatch_preference_managed_event(
    v_recipient_account_id,
    'new_chat_message_received',
    coalesce(v_sender_display_name, 'New message'),
    app_private.chat_message_preview(new.body),
    jsonb_build_object(
      'conversationKind', 'resource',
      'conversationId', new.conversation_id,
      'contextId', v_context_id,
      'senderAccountId', new.sender_account_id,
      'senderDisplayName', coalesce(v_sender_display_name, new.sender_account_id::text),
      'messagePreview', app_private.chat_message_preview(new.body),
      'messageId', new.id,
      'url', format('/chat?kind=resource&id=%s', new.conversation_id)
    )
  );

  return new;
end;
$$;

commit;
