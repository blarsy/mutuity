begin;

-- Deploy canonical database/functions/chat/send_conversation_messages.sql.
create or replace function app_public.send_claim_conversation_message(
  p_conversation_id uuid,
  p_body text,
  p_image_urls text[] default array[]::text[]
)
returns app_public.claim_message
language plpgsql
security definer
set search_path = pg_catalog, app_public, app_private
as $$
declare
  v_account_id uuid := app_private.current_account_id();
  v_conversation app_public.claim_conversation;
  v_message app_public.claim_message;
  v_image_url text;
  v_sort_order integer := 0;
begin
  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;
  select * into v_conversation from app_public.claim_conversation
  where id = p_conversation_id;
  if not found or v_account_id not in (v_conversation.creator_account_id, v_conversation.claimer_account_id) then
    raise exception using message = 'Only claim participants can send messages';
  end if;
  if nullif(btrim(p_body), '') is null then
    raise exception using message = 'Message body is required';
  end if;
  if exists (select 1 from app_public.need_claim where id = v_conversation.need_claim_id
             and status in ('declined', 'withdrawn', 'expired')) then
    raise exception using message = 'Need claim is closed';
  end if;

  insert into app_public.claim_message (conversation_id, sender_account_id, body)
  values (p_conversation_id, v_account_id, btrim(p_body)) returning * into v_message;
  foreach v_image_url in array coalesce(p_image_urls, array[]::text[]) loop
    if nullif(btrim(v_image_url), '') is not null then
      insert into app_public.claim_message_image (message_id, image_url, sort_order)
      values (v_message.id, btrim(v_image_url), v_sort_order);
      v_sort_order := v_sort_order + 1;
    end if;
  end loop;
  -- Existing message triggers deliver account events and notification dispatch.
  return v_message;
end;
$$;

create or replace function app_public.send_resource_conversation_message(
  p_conversation_id uuid,
  p_body text,
  p_image_urls text[] default array[]::text[]
)
returns app_public.resource_message
language plpgsql
security definer
set search_path = pg_catalog, app_public, app_private
as $$
declare
  v_account_id uuid := app_private.current_account_id();
  v_conversation app_public.resource_conversation;
  v_message app_public.resource_message;
  v_image_url text;
  v_sort_order integer := 0;
begin
  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;
  select * into v_conversation from app_public.resource_conversation
  where id = p_conversation_id;
  if not found or v_account_id not in (v_conversation.owner_account_id, v_conversation.bidder_account_id) then
    raise exception using message = 'Only resource conversation participants can send messages';
  end if;
  if nullif(btrim(p_body), '') is null then
    raise exception using message = 'Message body is required';
  end if;

  insert into app_public.resource_message (conversation_id, sender_account_id, body)
  values (p_conversation_id, v_account_id, btrim(p_body)) returning * into v_message;
  foreach v_image_url in array coalesce(p_image_urls, array[]::text[]) loop
    if nullif(btrim(v_image_url), '') is not null then
      insert into app_public.resource_message_image (message_id, image_url, sort_order)
      values (v_message.id, btrim(v_image_url), v_sort_order);
      v_sort_order := v_sort_order + 1;
    end if;
  end loop;
  return v_message;
end;
$$;

revoke all on function app_public.send_claim_conversation_message(uuid, text, text[]) from public;
revoke all on function app_public.send_resource_conversation_message(uuid, text, text[]) from public;
grant execute on function app_public.send_claim_conversation_message(uuid, text, text[]) to identified_account, admin;
grant execute on function app_public.send_resource_conversation_message(uuid, text, text[]) to identified_account, admin;
comment on function app_public.send_claim_conversation_message(uuid, text, text[]) is '@name sendClaimConversationMessage';
comment on function app_public.send_resource_conversation_message(uuid, text, text[]) is '@name sendResourceConversationMessage';

-- Prevent generated CRUD from bypassing business validation, identity checks,
-- settlement accounting or atomic message/image creation. SELECT is unchanged.
revoke insert, update, delete, truncate, references, trigger on
  app_public.need_claim,
  app_public.claim_conversation,
  app_public.claim_message,
  app_public.claim_message_image,
  app_public.resource_conversation,
  app_public.resource_message,
  app_public.resource_message_image,
  app_public.chat_typing_presence
from public, anonymous, identified_account, admin;

commit;