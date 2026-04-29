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
