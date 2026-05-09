create or replace function app_public.send_claim_message(
  need_claim_id uuid,
  body text,
  image_urls text[] default array[]::text[]
)
returns app_public.claim_message
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_claim record;
  v_conversation app_public.claim_conversation;
  v_message app_public.claim_message;
  v_image_url text;
  v_sort_order integer := 0;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  if nullif(btrim(send_claim_message.body), '') is null then
    raise exception using message = 'Message body is required';
  end if;

  select
    nc.id,
    nc.need_id,
    nc.claimer_account_id,
    nc.message,
    nc.created_at,
    nc.status,
    n.creator_account_id
  into v_claim
  from app_public.need_claim nc
  join app_public.need n on n.id = nc.need_id
  where nc.id = send_claim_message.need_claim_id;

  if not found then
    raise exception using message = 'Need claim not found';
  end if;

  if v_claim.status in ('declined', 'withdrawn', 'expired') then
    raise exception using message = 'Need claim is closed';
  end if;

  if v_account_id not in (v_claim.claimer_account_id, v_claim.creator_account_id) then
    raise exception using message = 'Only claim participants can send messages';
  end if;

  select *
  into v_conversation
  from app_public.claim_conversation
  where claim_conversation.need_claim_id = send_claim_message.need_claim_id;

  if not found then
    if v_account_id <> v_claim.creator_account_id then
      raise exception using message = 'Conversation can only be started by the need creator';
    end if;

    insert into app_public.claim_conversation (
      need_claim_id,
      need_id,
      creator_account_id,
      claimer_account_id
    )
    values (
      v_claim.id,
      v_claim.need_id,
      v_claim.creator_account_id,
      v_claim.claimer_account_id
    )
    returning * into v_conversation;

    if nullif(btrim(coalesce(v_claim.message, '')), '') is not null then
      insert into app_public.claim_message (
        conversation_id,
        sender_account_id,
        body,
        created_at
      )
      values (
        v_conversation.id,
        v_claim.claimer_account_id,
        v_claim.message,
        v_claim.created_at
      );
    end if;
  end if;

  insert into app_public.claim_message (
    conversation_id,
    sender_account_id,
    body
  )
  values (
    v_conversation.id,
    v_account_id,
    btrim(send_claim_message.body)
  )
  returning * into v_message;

  foreach v_image_url in array coalesce(send_claim_message.image_urls, array[]::text[]) loop
    if nullif(btrim(coalesce(v_image_url, '')), '') is not null then
      insert into app_public.claim_message_image (
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

  -- Emit account events for real-time UI updates
  perform pg_notify('account_events_' || v_account_id::text, '');
  if v_account_id <> v_claim.creator_account_id then
    perform pg_notify('account_events_' || v_claim.creator_account_id::text, '');
  end if;
  if v_account_id <> v_claim.claimer_account_id then
    perform pg_notify('account_events_' || v_claim.claimer_account_id::text, '');
  end if;

  return v_message;
end;
$$;

comment on function app_public.send_claim_message(uuid, text, text[]) is '@name sendClaimMessage';
