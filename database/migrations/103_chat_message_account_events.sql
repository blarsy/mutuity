begin;

-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 103: Chat message account events for real-time UI updates
--
-- When a chat message is sent, emit PostgreSQL NOTIFY events to the sender and
-- recipient accounts so their chat UIs refetch the conversation immediately via
-- the GraphQL subscription account event mechanism.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Update send_resource_message (bid-based) ───────────────────────────────────

create or replace function app_public.send_resource_message(
  resource_bid_id uuid,
  body text,
  image_urls text[] default array[]::text[]
)
returns app_public.resource_message
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_bid record;
  v_conversation app_public.resource_conversation;
  v_message app_public.resource_message;
  v_image_url text;
  v_sort_order integer := 0;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  if nullif(btrim(send_resource_message.body), '') is null then
    raise exception using message = 'Message body is required';
  end if;

  select
    rb.id,
    rb.resource_id,
    rb.bidder_account_id,
    rb.message,
    rb.created_at,
    r.creator_account_id as owner_account_id
  into v_bid
  from app_public.resource_bid rb
  join app_public.resource r on r.id = rb.resource_id
  where rb.id = send_resource_message.resource_bid_id;

  if not found then
    raise exception using message = 'Resource bid not found';
  end if;

  if v_account_id not in (v_bid.owner_account_id, v_bid.bidder_account_id) then
    raise exception using message = 'Only resource conversation participants can send messages';
  end if;

  select *
  into v_conversation
  from app_public.resource_conversation
  where app_public.resource_conversation.resource_bid_id = send_resource_message.resource_bid_id;

  if not found then
    insert into app_public.resource_conversation (
      resource_bid_id,
      resource_id,
      owner_account_id,
      bidder_account_id
    )
    values (
      v_bid.id,
      v_bid.resource_id,
      v_bid.owner_account_id,
      v_bid.bidder_account_id
    )
    returning * into v_conversation;

    if nullif(btrim(coalesce(v_bid.message, '')), '') is not null then
      insert into app_public.resource_message (
        conversation_id,
        sender_account_id,
        body,
        created_at
      )
      values (
        v_conversation.id,
        v_bid.bidder_account_id,
        v_bid.message,
        v_bid.created_at
      );
    end if;
  end if;

  insert into app_public.resource_message (
    conversation_id,
    sender_account_id,
    body
  )
  values (
    v_conversation.id,
    v_account_id,
    btrim(send_resource_message.body)
  )
  returning * into v_message;

  foreach v_image_url in array coalesce(send_resource_message.image_urls, array[]::text[]) loop
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

  -- Emit account events for real-time UI updates
  perform app_private.notify_account_event(v_account_id, v_message.id);
  if v_account_id <> v_bid.owner_account_id then
    perform app_private.notify_account_event(v_bid.owner_account_id, v_message.id);
  end if;
  if v_account_id <> v_bid.bidder_account_id then
    perform app_private.notify_account_event(v_bid.bidder_account_id, v_message.id);
  end if;

  return v_message;
end;
$$;

-- ── Update send_claim_message ──────────────────────────────────────────────────

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
    -- Emit account events for real-time UI updates
    perform app_private.notify_account_event(v_account_id, v_message.id);
    if v_account_id <> v_claim.creator_account_id then
      perform app_private.notify_account_event(v_claim.creator_account_id, v_message.id);
    end if;
    if v_account_id <> v_claim.claimer_account_id then
      perform app_private.notify_account_event(v_claim.claimer_account_id, v_message.id);
    end if;

  return v_message;
end;
$$;

-- ── Update send_need_message (open contact variant) ─────────────────────────────

create or replace function app_public.send_need_message(
  p_need_id uuid,
  p_body text,
  p_image_urls text[] default array[]::text[]
)
returns app_public.claim_message
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id      uuid;
  v_need            app_public.need;
  v_conversation    app_public.claim_conversation;
  v_message         app_public.claim_message;
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

  select * into v_need
  from app_public.need
  where id = p_need_id;

  if not found then
    raise exception using message = 'Need not found';
  end if;

  if v_account_id = v_need.creator_account_id then
    raise exception using message = 'Need creator cannot message themselves';
  end if;

  -- Derive roles: need creator is always creator_account_id; sender is claimer
  select * into v_conversation
  from app_public.claim_conversation
  where need_id            = p_need_id
    and creator_account_id = v_need.creator_account_id
    and claimer_account_id = v_account_id;

  if not found then
    insert into app_public.claim_conversation (
      need_id,
      creator_account_id,
      claimer_account_id
      -- need_claim_id intentionally NULL until a claim is submitted
    )
    values (
      p_need_id,
      v_need.creator_account_id,
      v_account_id
    )
    returning * into v_conversation;
  end if;

  insert into app_public.claim_message (
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
    perform app_private.notify_account_event(v_account_id, v_message.id);
    if v_account_id <> v_need.creator_account_id then
      perform app_private.notify_account_event(v_need.creator_account_id, v_message.id);
    end if;

  return v_message;
end;
$$;

grant execute on function app_public.send_need_message(uuid, text, text[])
  to identified_account, admin;

-- ── Update send_resource_message (direct, open contact variant) ────────────────

create or replace function app_public.send_resource_message(
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

  -- Determine which participant is owner and which is bidder based on who is
  -- calling the function.  The resource creator is always the owner.
  if v_account_id = v_resource.creator_account_id then
    -- Creator is messaging a bidder/contact
    v_owner_id  := v_account_id;
    v_bidder_id := p_other_account_id;
  elsif p_other_account_id = v_resource.creator_account_id then
    -- Non-creator is messaging the owner
    v_owner_id  := p_other_account_id;
    v_bidder_id := v_account_id;
  else
    raise exception using message = 'Only resource conversation participants can send messages';
  end if;

  if v_owner_id = v_bidder_id then
    raise exception using message = 'Resource owner cannot message themselves';
  end if;

  -- Find or create the conversation (no bid required)
  select * into v_conversation
  from app_public.resource_conversation
  where resource_id     = p_resource_id
    and owner_account_id  = v_owner_id
    and bidder_account_id = v_bidder_id;

  if not found then
    insert into app_public.resource_conversation (
      resource_id,
      owner_account_id,
      bidder_account_id
      -- resource_bid_id intentionally NULL until a bid is submitted
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

  -- Emit account events for real-time UI updates
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

grant execute on function app_public.send_resource_message(uuid, uuid, text, text[])
  to identified_account, admin;

commit;
