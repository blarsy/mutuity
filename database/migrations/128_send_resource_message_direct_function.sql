begin;

-- PostGraphile skips overloaded SQL functions for mutation exposure.
-- Keep the bid-based mutation as send_resource_message(...)
-- and move the direct/open-contact variant to a distinct SQL name.

drop function if exists app_public.send_resource_message(
  uuid,
  uuid,
  text,
  text[]
);

create or replace function app_public.send_resource_message_direct(
  p_resource_id uuid,
  p_other_account_id uuid,
  p_body text,
  p_image_urls text[] default array[]::text[]
)
returns app_public.resource_message
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id      uuid;
  v_resource        app_public.resource;
  v_owner_id        uuid;
  v_bidder_id       uuid;
  v_conversation    app_public.resource_conversation;
  v_message         app_public.resource_message;
  v_image_url       text;
  v_sort_order      integer := 0;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  if nullif(btrim(p_body), '') is null then
    raise exception using message = 'Message body is required';
  end if;

  select * into v_resource
  from app_public.resource
  where id = p_resource_id;

  if not found then
    raise exception using message = 'Resource not found';
  end if;

  if v_account_id = v_resource.creator_account_id then
    v_owner_id := v_account_id;
    v_bidder_id := p_other_account_id;
  elsif p_other_account_id = v_resource.creator_account_id then
    v_owner_id := p_other_account_id;
    v_bidder_id := v_account_id;
  else
    raise exception using message = 'Only resource conversation participants can send messages';
  end if;

  if v_owner_id = v_bidder_id then
    raise exception using message = 'Resource owner cannot message themselves';
  end if;

  select * into v_conversation
  from app_public.resource_conversation
  where resource_id = p_resource_id
    and owner_account_id = v_owner_id
    and bidder_account_id = v_bidder_id;

  if not found then
    insert into app_public.resource_conversation (
      resource_id,
      owner_account_id,
      bidder_account_id
    )
    values (p_resource_id, v_owner_id, v_bidder_id)
    returning * into v_conversation;
  end if;

  insert into app_public.resource_message (
    conversation_id,
    sender_account_id,
    body
  )
  values (
    v_conversation.id,
    v_account_id,
    btrim(p_body)
  )
  returning * into v_message;

  foreach v_image_url in array coalesce(p_image_urls, array[]::text[]) loop
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

  perform app_private.notify_account_event(v_account_id, v_message.id);
  if v_account_id <> v_owner_id then
    perform app_private.notify_account_event(v_owner_id, v_message.id);
  end if;
  if v_account_id <> v_bidder_id then
    perform app_private.notify_account_event(v_bidder_id, v_message.id);
  end if;

  return v_message;
end;
$$;

grant execute on function app_public.send_resource_message_direct(uuid, uuid, text, text[])
  to identified_account, admin;

comment on function app_public.send_resource_message_direct(uuid, uuid, text, text[]) is
  '@name sendResourceMessageDirect';

commit;