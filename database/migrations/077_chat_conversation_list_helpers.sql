begin;

create or replace function app_public.list_chat_conversations(
  p_search text default null,
  p_limit integer default 25,
  p_offset integer default 0
)
returns table (
  conversation_kind app_public.chat_context_kind,
  conversation_id uuid,
  context_id uuid,
  context_title text,
  other_account_id uuid,
  other_account_display_name text,
  last_message_preview text,
  unread_count integer,
  last_activity_at timestamptz
)
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_search text;
  v_pattern text;
  v_limit integer;
  v_offset integer;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  v_search := nullif(btrim(coalesce(p_search, '')), '');
  v_pattern := case when v_search is null then null else '%' || lower(v_search) || '%' end;
  v_limit := greatest(1, least(coalesce(p_limit, 25), 100));
  v_offset := greatest(coalesce(p_offset, 0), 0);

  return query
  with base as (
    select s.*
    from app_public.chat_conversation_summary s
    where s.participant_account_id = v_account_id
  )
  select
    b.conversation_kind,
    b.conversation_id,
    b.context_id,
    b.context_title,
    b.other_account_id,
    coalesce(nullif(a.display_name, ''), a.external_subject) as other_account_display_name,
    b.last_message_preview,
    b.unread_count,
    b.last_activity_at
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
  )
  order by b.last_activity_at desc, b.conversation_id
  limit v_limit
  offset v_offset;
end;
$$;

comment on function app_public.list_chat_conversations(text, integer, integer) is
  '@name listChatConversations';

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

grant execute on function app_public.list_chat_conversations(text, integer, integer)
  to identified_account, admin;
grant execute on function app_public.count_chat_conversations(text)
  to identified_account, admin;

commit;
