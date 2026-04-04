create or replace function app_public.mark_claim_messages_read(conversation_id uuid)
returns integer
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_conversation app_public.claim_conversation;
  v_count integer := 0;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  select *
  into v_conversation
  from app_public.claim_conversation cc
  where cc.id = mark_claim_messages_read.conversation_id;

  if not found then
    raise exception using message = 'Claim conversation not found';
  end if;

  if v_account_id not in (v_conversation.creator_account_id, v_conversation.claimer_account_id) then
    raise exception using message = 'Only claim participants can read messages';
  end if;

  update app_public.claim_message as cm
  set read_at = coalesce(cm.read_at, now())
  where cm.conversation_id = mark_claim_messages_read.conversation_id
    and cm.sender_account_id <> v_account_id
    and cm.read_at is null;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

comment on function app_public.mark_claim_messages_read(uuid) is '@name markClaimMessagesRead';
