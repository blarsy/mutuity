begin;

-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 080: Open-contact conversations
--
-- Allow any authenticated account to start a conversation with a need or
-- resource creator directly from the detail page, without first creating a
-- claim or bid.  The bid/claim FK is made nullable so conversations can exist
-- before a formal transaction.  When a bid/claim is later created between the
-- same two accounts for the same context, it is attached to the existing
-- conversation automatically via a trigger.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── claim_conversation ────────────────────────────────────────────────────────

-- 1. Drop the NOT NULL + UNIQUE constraint that forces a claim to exist.
alter table app_public.claim_conversation
  drop constraint claim_conversation_need_claim_id_key;

alter table app_public.claim_conversation
  alter column need_claim_id drop not null;

-- 2. Add a unique pair constraint so there is at most one thread per
--    (need, participant-pair) regardless of whether a claim exists.
alter table app_public.claim_conversation
  add constraint claim_conversation_unique_pair
    unique (need_id, creator_account_id, claimer_account_id);

-- 3. Restore a unique index on need_claim_id for the non-null case so the
--    existing FK lookup is still fast and the one-conversation-per-claim
--    invariant is upheld when a claim IS attached.
create unique index claim_conversation_need_claim_id_idx
  on app_public.claim_conversation (need_claim_id)
  where need_claim_id is not null;


-- ── resource_conversation ─────────────────────────────────────────────────────

-- 1. Drop the NOT NULL + UNIQUE constraint that forces a bid to exist.
alter table app_public.resource_conversation
  drop constraint resource_conversation_resource_bid_id_key;

alter table app_public.resource_conversation
  alter column resource_bid_id drop not null;

-- 2. Add a unique pair constraint so there is at most one thread per
--    (resource, participant-pair).
alter table app_public.resource_conversation
  add constraint resource_conversation_unique_pair
    unique (resource_id, owner_account_id, bidder_account_id);

-- 3. Restore a unique index on resource_bid_id for the non-null case.
create unique index resource_conversation_resource_bid_id_idx
  on app_public.resource_conversation (resource_bid_id)
  where resource_bid_id is not null;


-- ── Trigger: attach bid to existing conversation ──────────────────────────────
-- When a resource_bid is created for a pair that already has a conversation,
-- link the conversation to the new bid (and back-seed the opening message).

create or replace function app_private.attach_resource_bid_to_conversation()
returns trigger
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_owner_account_id uuid;
  v_conv_id uuid;
begin
  select r.creator_account_id
  into v_owner_account_id
  from app_public.resource r
  where r.id = new.resource_id;

  -- Find an existing pre-bid conversation for this exact pair
  select id
  into v_conv_id
  from app_public.resource_conversation
  where resource_id     = new.resource_id
    and owner_account_id  = v_owner_account_id
    and bidder_account_id = new.bidder_account_id
    and resource_bid_id is null;

  if found then
    -- Attach the new bid
    update app_public.resource_conversation
    set resource_bid_id = new.id,
        updated_at      = now()
    where id = v_conv_id;

    -- Back-seed the bid's opening message at its original timestamp
    if nullif(btrim(coalesce(new.message, '')), '') is not null then
      insert into app_public.resource_message (
        conversation_id,
        sender_account_id,
        body,
        created_at
      )
      values (
        v_conv_id,
        new.bidder_account_id,
        new.message,
        new.created_at
      )
      on conflict do nothing;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_attach_resource_bid_to_conversation on app_public.resource_bid;
create trigger trg_attach_resource_bid_to_conversation
  after insert on app_public.resource_bid
  for each row execute function app_private.attach_resource_bid_to_conversation();


-- ── Trigger: attach claim to existing conversation ────────────────────────────
-- When a need_claim is created for a pair that already has a conversation,
-- link the conversation to the new claim (and back-seed the claim message).

create or replace function app_private.attach_claim_to_conversation()
returns trigger
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_creator_account_id uuid;
  v_conv_id uuid;
begin
  select n.creator_account_id
  into v_creator_account_id
  from app_public.need n
  where n.id = new.need_id;

  -- Find an existing pre-claim conversation for this exact pair
  select id
  into v_conv_id
  from app_public.claim_conversation
  where need_id              = new.need_id
    and creator_account_id   = v_creator_account_id
    and claimer_account_id   = new.claimer_account_id
    and need_claim_id is null;

  if found then
    -- Attach the new claim
    update app_public.claim_conversation
    set need_claim_id = new.id
    where id = v_conv_id;

    -- Back-seed the claim's opening message at its original timestamp
    if nullif(btrim(coalesce(new.message, '')), '') is not null then
      insert into app_public.claim_message (
        conversation_id,
        sender_account_id,
        body,
        created_at
      )
      values (
        v_conv_id,
        new.claimer_account_id,
        new.message,
        new.created_at
      )
      on conflict do nothing;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_attach_claim_to_conversation on app_public.need_claim;
create trigger trg_attach_claim_to_conversation
  after insert on app_public.need_claim
  for each row execute function app_private.attach_claim_to_conversation();


-- ── send_need_message ─────────────────────────────────────────────────────────
-- New mutation: any authenticated account can message a need creator directly.
-- The conversation is keyed on (need_id, creator_account_id, claimer_account_id)
-- and is created lazily on the first message.

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
  perform pg_notify('account_events_' || v_account_id::text, '');
  if v_account_id <> v_need.creator_account_id then
    perform pg_notify('account_events_' || v_need.creator_account_id::text, '');
  end if;

  return v_message;
end;
$$;

grant execute on function app_public.send_need_message(uuid, text, text[])
  to identified_account, admin;

comment on function app_public.send_need_message(uuid, text, text[]) is
  '@name sendNeedMessage';


-- ── send_resource_message: accept resource_id when no bid exists yet ──────────
-- The existing function takes resource_bid_id.  We add a parallel overload
-- that takes resource_id + other_account_id so the resource detail page can
-- open a conversation without a prior bid.

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
  perform pg_notify('account_events_' || v_account_id::text, '');
  if v_account_id <> v_owner_id then
    perform pg_notify('account_events_' || v_owner_id::text, '');
  end if;
  if v_account_id <> v_bidder_id then
    perform pg_notify('account_events_' || v_bidder_id::text, '');
  end if;

  return v_message;
end;
$$;

grant execute on function app_public.send_resource_message(uuid, uuid, text, text[])
  to identified_account, admin;

comment on function app_public.send_resource_message(uuid, uuid, text, text[]) is
  '@name sendResourceMessageDirect';


-- Update table-level comments to reflect nullable FK
comment on table app_public.claim_conversation is
  'One private conversation channel per (need, participant-pair). Attached to a need_claim once one is submitted.';

comment on table app_public.resource_conversation is
  'One private conversation channel per (resource, participant-pair). Attached to a resource_bid once one is submitted.';

commit;
