begin;

-- Canonical source: database/functions/chat/participant_privacy.sql.
-- Claim/chat writes are function-only (migration 156). Removing obsolete write
-- policies makes accidental future DML grants fail closed under RLS, including
-- the old need_claim INSERT admin bypass and sender-only message checks.
drop policy if exists need_claim_insert_policy on app_public.need_claim;
drop policy if exists need_claim_update_policy on app_public.need_claim;
drop policy if exists claim_conversation_insert_policy on app_public.claim_conversation;
drop policy if exists claim_message_insert_policy on app_public.claim_message;
drop policy if exists claim_message_update_policy on app_public.claim_message;
drop policy if exists claim_message_image_insert_policy on app_public.claim_message_image;
drop policy if exists resource_conversation_insert_policy on app_public.resource_conversation;
drop policy if exists resource_message_insert_policy on app_public.resource_message;
drop policy if exists resource_message_update_policy on app_public.resource_message;
drop policy if exists resource_message_image_insert_policy on app_public.resource_message_image;
drop policy if exists chat_typing_presence_insert_policy on app_public.chat_typing_presence;
drop policy if exists chat_typing_presence_update_policy on app_public.chat_typing_presence;

drop policy if exists resource_conversation_select_policy on app_public.resource_conversation;
create policy resource_conversation_select_policy on app_public.resource_conversation
  for select to identified_account, admin
  using (app_private.current_account_id() in (owner_account_id, bidder_account_id));

drop policy if exists resource_message_select_policy on app_public.resource_message;
create policy resource_message_select_policy on app_public.resource_message
  for select to identified_account, admin
  using (app_private.is_chat_participant('resource', conversation_id, app_private.current_account_id()));

drop policy if exists resource_message_image_select_policy on app_public.resource_message_image;
create policy resource_message_image_select_policy on app_public.resource_message_image
  for select to identified_account, admin
  using (exists (
    select 1 from app_public.resource_message rm
    where rm.id = message_id
      and app_private.is_chat_participant('resource', rm.conversation_id, app_private.current_account_id())
  ));

drop policy if exists chat_typing_presence_select_policy on app_public.chat_typing_presence;
create policy chat_typing_presence_select_policy on app_public.chat_typing_presence
  for select to identified_account, admin
  using (app_private.is_chat_participant(conversation_kind, conversation_id, app_private.current_account_id()));

-- This owner-executed view is an internal read model, not a public query path.
-- SECURITY DEFINER listing/count functions retain access and filter by account.
revoke all on app_public.chat_conversation_summary from public, anonymous, identified_account, admin;

commit;