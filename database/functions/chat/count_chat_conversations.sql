create or replace function app_public.count_chat_conversations(
  p_search text default null
)
returns integer
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_search text;
  v_pattern text;
  v_count integer;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  v_search := nullif(btrim(coalesce(p_search, '')), '');
  v_pattern := case when v_search is null then null else '%' || lower(v_search) || '%' end;

  with base as (
    select s.*
    from app_public.chat_conversation_summary s
    where s.participant_account_id = v_account_id
  )
  select count(*)::integer
  into v_count
  from base b
  join app_public.account a on a.id = b.other_account_id
  where (
    v_pattern is null
    or lower(coalesce(b.context_title, '')) like v_pattern
    or lower(coalesce(a.display_name, '')) like v_pattern
    or lower(coalesce(a.external_subject, '')) like v_pattern
    or (
      b.conversation_kind = 'need'
      and exists (
        select 1
        from app_public.claim_message cm
        where cm.conversation_id = b.conversation_id
          and lower(cm.body) like v_pattern
      )
    )
    or (
      b.conversation_kind = 'resource'
      and exists (
        select 1
        from app_public.resource_message rm
        where rm.conversation_id = b.conversation_id
          and lower(rm.body) like v_pattern
      )
    )
  );

  return coalesce(v_count, 0);
end;
$$;

comment on function app_public.count_chat_conversations(text) is
  '@name countChatConversations';
