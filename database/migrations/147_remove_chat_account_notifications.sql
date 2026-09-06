begin;

-- Chat messages never create an in-app notification (account_notification); delivery is handled
-- entirely by app_private.dispatch_preference_managed_event via realtime push or periodic mail
-- summary, per the recipient's delivery preference. Claim/bid creation already notifies the
-- recipient independently (see create_resource_bid_notification / create_need_claim_notification
-- calls in create_resource_bid.sql / claim_need.sql), regardless of whether an opening chat
-- message accompanies it, so the "announcement" detection and its account_notification are removed.

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
  v_preview text;
begin
  select
    case
      when new.sender_account_id = cc.creator_account_id then cc.claimer_account_id
      else cc.creator_account_id
    end,
    cc.need_id
  into v_recipient_account_id, v_context_id
  from app_public.claim_conversation cc
  where cc.id = new.conversation_id;

  if v_recipient_account_id is null or v_recipient_account_id = new.sender_account_id then
    return new;
  end if;

  select coalesce(a.display_name, a.external_subject)
  into v_sender_display_name
  from app_public.account a
  where a.id = new.sender_account_id;

  v_preview := app_private.chat_message_preview(new.body);

  perform app_private.dispatch_preference_managed_event(
    v_recipient_account_id,
    'new_chat_message_received',
    coalesce(v_sender_display_name, 'New message'),
    v_preview,
    jsonb_build_object(
      'conversationKind', 'need',
      'conversationId', new.conversation_id,
      'contextId', v_context_id,
      'senderAccountId', new.sender_account_id,
      'senderDisplayName', coalesce(v_sender_display_name, new.sender_account_id::text),
      'messagePreview', v_preview,
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
  v_preview text;
begin
  select
    case
      when new.sender_account_id = rc.owner_account_id then rc.bidder_account_id
      else rc.owner_account_id
    end,
    rc.resource_id
  into v_recipient_account_id, v_context_id
  from app_public.resource_conversation rc
  where rc.id = new.conversation_id;

  if v_recipient_account_id is null or v_recipient_account_id = new.sender_account_id then
    return new;
  end if;

  select coalesce(a.display_name, a.external_subject)
  into v_sender_display_name
  from app_public.account a
  where a.id = new.sender_account_id;

  v_preview := app_private.chat_message_preview(new.body);

  perform app_private.dispatch_preference_managed_event(
    v_recipient_account_id,
    'new_chat_message_received',
    coalesce(v_sender_display_name, 'New message'),
    v_preview,
    jsonb_build_object(
      'conversationKind', 'resource',
      'conversationId', new.conversation_id,
      'contextId', v_context_id,
      'senderAccountId', new.sender_account_id,
      'senderDisplayName', coalesce(v_sender_display_name, new.sender_account_id::text),
      'messagePreview', v_preview,
      'messageId', new.id,
      'url', format('/chat?kind=resource&id=%s', new.conversation_id)
    )
  );

  return new;
end;
$$;

commit;
