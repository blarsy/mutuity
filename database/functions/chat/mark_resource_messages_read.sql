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
