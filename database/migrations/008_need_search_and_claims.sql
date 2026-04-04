begin;

create extension if not exists unaccent;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'tri_state_filter'
      AND n.nspname = 'app_public'
  ) THEN
    CREATE TYPE app_public.tri_state_filter AS ENUM ('neutral', 'set', 'unset');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'need_claim_status'
      AND n.nspname = 'app_public'
  ) THEN
    CREATE TYPE app_public.need_claim_status AS ENUM ('open', 'settled', 'declined', 'withdrawn', 'expired');
  END IF;
END $$;

alter table app_public.account
  add column if not exists latitude numeric(9, 6),
  add column if not exists longitude numeric(9, 6);

alter table app_public.need
  add column if not exists latitude numeric(9, 6),
  add column if not exists longitude numeric(9, 6);

update app_public.need
set latitude = coalesce(latitude, 50.6072),
    longitude = coalesce(longitude, 3.3889)
where latitude is null
   or longitude is null;

alter table app_public.need
  alter column latitude set default 50.6072,
  alter column longitude set default 3.3889,
  alter column latitude set not null,
  alter column longitude set not null;

create table if not exists app_public.need_claim (
  id uuid primary key default gen_random_uuid(),
  need_id uuid not null references app_public.need(id) on delete cascade,
  claimer_account_id uuid not null references app_public.account(id) on delete cascade,
  message text,
  status app_public.need_claim_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  settled_at timestamptz,
  settled_by_account_id uuid references app_public.account(id),
  constraint need_claim_unique_per_account unique (need_id, claimer_account_id)
);

create table if not exists app_public.need_claim_notification (
  id uuid primary key default gen_random_uuid(),
  recipient_account_id uuid not null references app_public.account(id) on delete cascade,
  need_claim_id uuid not null references app_public.need_claim(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table if not exists app_public.claim_conversation (
  id uuid primary key default gen_random_uuid(),
  need_claim_id uuid not null unique references app_public.need_claim(id) on delete cascade,
  need_id uuid not null references app_public.need(id) on delete cascade,
  creator_account_id uuid not null references app_public.account(id) on delete cascade,
  claimer_account_id uuid not null references app_public.account(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists app_public.claim_message (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references app_public.claim_conversation(id) on delete cascade,
  sender_account_id uuid not null references app_public.account(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint claim_message_body_present check (btrim(body) <> '')
);

create table if not exists app_public.claim_message_image (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references app_public.claim_message(id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint claim_message_image_url_present check (btrim(image_url) <> '')
);

create table if not exists app_public.need_claim_settlement_event (
  id uuid primary key default gen_random_uuid(),
  need_claim_id uuid not null unique references app_public.need_claim(id) on delete cascade,
  need_id uuid not null references app_public.need(id) on delete cascade,
  settled_by_account_id uuid not null references app_public.account(id) on delete cascade,
  claimer_account_id uuid not null references app_public.account(id) on delete cascade,
  topes_amount integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists need_claim_need_id_status_idx
  on app_public.need_claim (need_id, status, created_at desc);

create index if not exists need_claim_claimer_account_id_idx
  on app_public.need_claim (claimer_account_id, created_at desc);

create index if not exists need_claim_notification_recipient_idx
  on app_public.need_claim_notification (recipient_account_id, created_at desc);

create index if not exists claim_message_conversation_created_idx
  on app_public.claim_message (conversation_id, created_at asc);

create index if not exists claim_message_image_message_id_idx
  on app_public.claim_message_image (message_id, sort_order);

create index if not exists need_claim_settlement_need_id_idx
  on app_public.need_claim_settlement_event (need_id, created_at desc);

drop trigger if exists trg_need_claim_set_updated_at on app_public.need_claim;
create trigger trg_need_claim_set_updated_at
  before update on app_public.need_claim
  for each row
  execute function app_private.set_updated_at();

alter table app_public.need_claim enable row level security;
alter table app_public.need_claim_notification enable row level security;
alter table app_public.claim_conversation enable row level security;
alter table app_public.claim_message enable row level security;
alter table app_public.claim_message_image enable row level security;
alter table app_public.need_claim_settlement_event enable row level security;

create policy need_claim_select_policy on app_public.need_claim
  for select
  using (
    app_private.is_manager()
    or claimer_account_id = app_private.current_account_id()
    or exists (
      select 1
      from app_public.need n
      where n.id = need_id
        and n.creator_account_id = app_private.current_account_id()
    )
  );

create policy need_claim_insert_policy on app_public.need_claim
  for insert
  with check (
    claimer_account_id = app_private.current_account_id()
    or app_private.is_admin()
  );

create policy need_claim_update_policy on app_public.need_claim
  for update
  using (
    app_private.is_manager()
    or claimer_account_id = app_private.current_account_id()
    or exists (
      select 1
      from app_public.need n
      where n.id = need_id
        and n.creator_account_id = app_private.current_account_id()
    )
  )
  with check (
    app_private.is_manager()
    or claimer_account_id = app_private.current_account_id()
    or exists (
      select 1
      from app_public.need n
      where n.id = need_id
        and n.creator_account_id = app_private.current_account_id()
    )
  );

create policy need_claim_notification_select_policy on app_public.need_claim_notification
  for select
  using (
    app_private.is_manager()
    or recipient_account_id = app_private.current_account_id()
  );

create policy need_claim_notification_update_policy on app_public.need_claim_notification
  for update
  using (
    app_private.is_manager()
    or recipient_account_id = app_private.current_account_id()
  )
  with check (
    app_private.is_manager()
    or recipient_account_id = app_private.current_account_id()
  );

create policy claim_conversation_select_policy on app_public.claim_conversation
  for select
  using (
    app_private.is_manager()
    or creator_account_id = app_private.current_account_id()
    or claimer_account_id = app_private.current_account_id()
  );

create policy claim_conversation_insert_policy on app_public.claim_conversation
  for insert
  with check (
    app_private.is_manager()
    or creator_account_id = app_private.current_account_id()
    or claimer_account_id = app_private.current_account_id()
  );

create policy claim_message_select_policy on app_public.claim_message
  for select
  using (
    app_private.is_manager()
    or exists (
      select 1
      from app_public.claim_conversation cc
      where cc.id = conversation_id
        and app_private.current_account_id() in (cc.creator_account_id, cc.claimer_account_id)
    )
  );

create policy claim_message_insert_policy on app_public.claim_message
  for insert
  with check (
    app_private.is_manager()
    or sender_account_id = app_private.current_account_id()
  );

create policy claim_message_update_policy on app_public.claim_message
  for update
  using (
    app_private.is_manager()
    or exists (
      select 1
      from app_public.claim_conversation cc
      where cc.id = conversation_id
        and app_private.current_account_id() in (cc.creator_account_id, cc.claimer_account_id)
    )
  )
  with check (
    app_private.is_manager()
    or exists (
      select 1
      from app_public.claim_conversation cc
      where cc.id = conversation_id
        and app_private.current_account_id() in (cc.creator_account_id, cc.claimer_account_id)
    )
  );

create policy claim_message_image_select_policy on app_public.claim_message_image
  for select
  using (
    app_private.is_manager()
    or exists (
      select 1
      from app_public.claim_message cm
      join app_public.claim_conversation cc on cc.id = cm.conversation_id
      where cm.id = message_id
        and app_private.current_account_id() in (cc.creator_account_id, cc.claimer_account_id)
    )
  );

create policy claim_message_image_insert_policy on app_public.claim_message_image
  for insert
  with check (
    app_private.is_manager()
    or exists (
      select 1
      from app_public.claim_message cm
      join app_public.claim_conversation cc on cc.id = cm.conversation_id
      where cm.id = message_id
        and app_private.current_account_id() in (cc.creator_account_id, cc.claimer_account_id)
    )
  );

create policy need_claim_settlement_event_select_policy on app_public.need_claim_settlement_event
  for select
  using (
    app_private.is_manager()
    or claimer_account_id = app_private.current_account_id()
    or settled_by_account_id = app_private.current_account_id()
    or exists (
      select 1
      from app_public.need n
      where n.id = need_id
        and n.creator_account_id = app_private.current_account_id()
    )
  );

grant select, insert, update on app_public.need_claim to identified_account, manager, admin;
grant select, update on app_public.need_claim_notification to identified_account, manager, admin;
grant select, insert on app_public.claim_conversation to identified_account, manager, admin;
grant select, insert, update on app_public.claim_message to identified_account, manager, admin;
grant select, insert on app_public.claim_message_image to identified_account, manager, admin;
grant select on app_public.need_claim_settlement_event to identified_account, manager, admin;

drop function if exists app_public.search_needs(
  numeric,
  numeric,
  text,
  app_public.tri_state_filter,
  app_public.tri_state_filter,
  app_public.tri_state_filter,
  app_public.tri_state_filter,
  integer
);

drop function if exists app_private.resolve_need_search_coordinates(
  numeric,
  numeric
);

create or replace function app_private.resolve_need_search_coordinates(
  p_latitude numeric,
  p_longitude numeric,
  p_browser_latitude numeric default null,
  p_browser_longitude numeric default null
)
returns table (
  latitude numeric,
  longitude numeric,
  source text
)
language plpgsql
stable
as $$
declare
  v_account_id uuid;
begin
  if p_latitude is not null and p_longitude is not null then
    return query select p_latitude, p_longitude, 'explicit'::text;
    return;
  end if;

  v_account_id := app_private.current_account_id();

  if v_account_id is not null then
    return query
    select a.latitude, a.longitude, 'account'::text
    from app_public.account a
    where a.id = v_account_id
      and a.latitude is not null
      and a.longitude is not null
    limit 1;

    if found then
      return;
    end if;
  end if;

  if p_browser_latitude is not null and p_browser_longitude is not null then
    return query select p_browser_latitude, p_browser_longitude, 'browser'::text;
    return;
  end if;

  return query select 50.6072::numeric, 3.3889::numeric, 'fallback'::text;
end;
$$;

create or replace function app_private.matches_tri_state_filter(
  p_state app_public.tri_state_filter,
  p_value boolean
)
returns boolean
language sql
stable
as $$
  select case
    when p_state = 'set' then p_value is true
    when p_state = 'unset' then p_value is false
    else true
  end
$$;

create or replace function app_private.calculate_need_closeness_score(
  p_need_latitude numeric,
  p_need_longitude numeric,
  p_query_latitude numeric,
  p_query_longitude numeric
)
returns numeric
language sql
immutable
as $$
  select greatest(
    0::numeric,
    100::numeric - least(
      100::numeric,
      (
        6371::numeric * acos(
          least(
            1::double precision,
            greatest(
              -1::double precision,
              cos(radians(p_query_latitude::double precision))
              * cos(radians(p_need_latitude::double precision))
              * cos(radians((p_need_longitude - p_query_longitude)::double precision))
              + sin(radians(p_query_latitude::double precision))
              * sin(radians(p_need_latitude::double precision))
            )
          )
        )
      )::numeric
    )
  )
$$;

create or replace function app_private.calculate_need_ease_of_setup_score(
  p_tooling_required boolean,
  p_competence_required boolean,
  p_multiple_people_required boolean
)
returns numeric
language sql
immutable
as $$
  select greatest(
    0::numeric,
    100::numeric
      - case when p_tooling_required then 25 else 0 end
      - case when p_competence_required then 25 else 0 end
      - case when p_multiple_people_required then 25 else 0 end
  )
$$;

create or replace function app_private.calculate_need_expiration_score(p_expires_at timestamptz)
returns numeric
language sql
stable
as $$
  select case
    when p_expires_at is null then 50::numeric
    when p_expires_at <= now() then 0::numeric
    else greatest(
      0::numeric,
      100::numeric - least(
        100::numeric,
        ((extract(epoch from (p_expires_at - now())) / 3600.0) / 168.0 * 100.0)::numeric
      )
    )
  end
$$;

create or replace function app_private.create_need_claim_notification(
  p_recipient_account_id uuid,
  p_need_claim_id uuid,
  p_event_type text,
  p_payload jsonb default '{}'::jsonb
)
returns app_public.need_claim_notification
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_notification app_public.need_claim_notification;
begin
  insert into app_public.need_claim_notification (
    recipient_account_id,
    need_claim_id,
    event_type,
    payload
  )
  values (
    p_recipient_account_id,
    p_need_claim_id,
    p_event_type,
    coalesce(p_payload, '{}'::jsonb)
  )
  returning * into v_notification;

  return v_notification;
end;
$$;

create or replace function app_public.search_needs(
  latitude numeric default null,
  longitude numeric default null,
  browser_latitude numeric default null,
  browser_longitude numeric default null,
  search_text text default null,
  multiple_people_required app_public.tri_state_filter default 'neutral',
  tooling_required app_public.tri_state_filter default 'neutral',
  competence_required app_public.tri_state_filter default 'neutral',
  object_required app_public.tri_state_filter default 'neutral',
  limit_count integer default 50
)
returns table (
  id uuid,
  creator_account_id uuid,
  creator_display_name text,
  title text,
  description text,
  location text,
  latitude numeric,
  longitude numeric,
  intensity app_public.need_intensity,
  proposed_topes_amount integer,
  object_required boolean,
  competence_required boolean,
  tooling_required boolean,
  multiple_people_required boolean,
  required_competence_text text,
  required_tooling_text text,
  required_people_count integer,
  is_active boolean,
  expires_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  closeness_score numeric,
  ease_of_setup_score numeric,
  expiration_score numeric,
  weighted_score numeric,
  query_latitude numeric,
  query_longitude numeric
)
language sql
stable
security definer
set search_path = app_public, app_private, public
as $$
  with resolved_location as (
    select latitude as query_latitude, longitude as query_longitude
    from app_private.resolve_need_search_coordinates(
      search_needs.latitude,
      search_needs.longitude,
      search_needs.browser_latitude,
      search_needs.browser_longitude
    )
  ),
  filtered_needs as (
    select
      n.*,
      coalesce(a.display_name, a.external_subject, 'Unknown account') as creator_display_name,
      r.query_latitude,
      r.query_longitude,
      app_private.calculate_need_closeness_score(
        coalesce(n.latitude, r.query_latitude),
        coalesce(n.longitude, r.query_longitude),
        r.query_latitude,
        r.query_longitude
      ) as closeness_score,
      app_private.calculate_need_ease_of_setup_score(
        n.tooling_required,
        n.competence_required,
        n.multiple_people_required
      ) as ease_of_setup_score,
      app_private.calculate_need_expiration_score(n.expires_at) as expiration_score
    from app_public.need n
    join app_public.account a on a.id = n.creator_account_id
    cross join resolved_location r
    where n.is_active
      and coalesce(n.expires_at > now(), true)
      and app_private.matches_tri_state_filter(search_needs.multiple_people_required, n.multiple_people_required)
      and app_private.matches_tri_state_filter(search_needs.tooling_required, n.tooling_required)
      and app_private.matches_tri_state_filter(search_needs.competence_required, n.competence_required)
      and app_private.matches_tri_state_filter(search_needs.object_required, n.object_required)
      and (
        nullif(btrim(search_needs.search_text), '') is null
        or unaccent(
          coalesce(a.display_name, '') || ' ' ||
          coalesce(a.external_subject, '') || ' ' ||
          coalesce(n.title, '') || ' ' ||
          coalesce(n.description, '') || ' ' ||
          coalesce(n.required_tooling_text, '') || ' ' ||
          coalesce(n.required_competence_text, '')
        ) ilike '%' || unaccent(btrim(search_needs.search_text)) || '%'
      )
  )
  select
    fn.id,
    fn.creator_account_id,
    fn.creator_display_name,
    fn.title,
    fn.description,
    fn.location,
    fn.latitude,
    fn.longitude,
    fn.intensity,
    fn.proposed_topes_amount,
    fn.object_required,
    fn.competence_required,
    fn.tooling_required,
    fn.multiple_people_required,
    fn.required_competence_text,
    fn.required_tooling_text,
    fn.required_people_count,
    fn.is_active,
    fn.expires_at,
    fn.created_at,
    fn.updated_at,
    round(fn.closeness_score, 2) as closeness_score,
    round(fn.ease_of_setup_score, 2) as ease_of_setup_score,
    round(fn.expiration_score, 2) as expiration_score,
    round((fn.closeness_score * 0.5) + (fn.ease_of_setup_score * 0.3) + (fn.expiration_score * 0.2), 2) as weighted_score,
    fn.query_latitude,
    fn.query_longitude
  from filtered_needs fn
  order by weighted_score desc, fn.created_at desc, fn.id asc
  limit least(greatest(coalesce(search_needs.limit_count, 50), 1), 50)
$$;

create or replace function app_public.claim_need(
  need_id uuid,
  message text default null
)
returns app_public.need_claim
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_need app_public.need;
  v_claim app_public.need_claim;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  select *
  into v_need
  from app_public.need
  where id = claim_need.need_id;

  if not found then
    raise exception using message = 'Need not found';
  end if;

  if not v_need.is_active or (v_need.expires_at is not null and v_need.expires_at <= now()) then
    raise exception using message = 'Need is no longer active';
  end if;

  insert into app_public.need_claim (
    need_id,
    claimer_account_id,
    message,
    status
  )
  values (
    claim_need.need_id,
    v_account_id,
    nullif(btrim(claim_need.message), ''),
    'open'
  )
  on conflict (need_id, claimer_account_id) do update
  set message = excluded.message,
      status = case
        when app_public.need_claim.status in ('declined', 'withdrawn', 'expired') then 'open'::app_public.need_claim_status
        else app_public.need_claim.status
      end,
      updated_at = now()
  returning * into v_claim;

  perform app_private.create_need_claim_notification(
    v_need.creator_account_id,
    v_claim.id,
    'claim_created',
    jsonb_build_object(
      'needId', v_need.id,
      'claimerAccountId', v_account_id,
      'status', v_claim.status
    )
  );

  return v_claim;
end;
$$;

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
  from app_public.claim_conversation cc
  where cc.need_claim_id = send_claim_message.need_claim_id;

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

  return v_message;
end;
$$;

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

  update app_public.claim_message
  set read_at = coalesce(read_at, now())
  where conversation_id = mark_claim_messages_read.conversation_id
    and sender_account_id <> v_account_id
    and read_at is null;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function app_public.settle_need_claim(need_claim_id uuid)
returns app_public.need_claim
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_claim_context record;
  v_current_claim app_public.need_claim;
  v_topes_amount integer := 0;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  select
    nc.*,
    n.creator_account_id as need_creator_account_id,
    n.is_active as need_is_active,
    n.expires_at as need_expires_at,
    coalesce(n.proposed_topes_amount, 0) as topes_amount
  into v_claim_context
  from app_public.need_claim nc
  join app_public.need n on n.id = nc.need_id
  where nc.id = settle_need_claim.need_claim_id
  for update of nc, n;

  if not found then
    raise exception using message = 'Need claim not found';
  end if;

  if v_account_id <> v_claim_context.need_creator_account_id then
    raise exception using message = 'Only need creator can settle claims';
  end if;

  if not v_claim_context.need_is_active or (v_claim_context.need_expires_at is not null and v_claim_context.need_expires_at <= now()) then
    raise exception using message = 'Need is no longer active';
  end if;

  if v_claim_context.status = 'settled' then
    select *
    into v_current_claim
    from app_public.need_claim
    where id = settle_need_claim.need_claim_id;

    return v_current_claim;
  end if;

  if v_claim_context.status <> 'open' then
    raise exception using message = 'Need claim is no longer open';
  end if;

  v_topes_amount := v_claim_context.topes_amount;

  update app_public.need_claim
  set status = 'settled',
      settled_at = now(),
      settled_by_account_id = v_account_id,
      updated_at = now()
  where id = settle_need_claim.need_claim_id
  returning * into v_current_claim;

  update app_public.need_claim
  set status = 'declined',
      updated_at = now()
  where need_id = v_current_claim.need_id
    and id <> v_current_claim.id
    and status = 'open';

  insert into app_public.need_claim_settlement_event (
    need_claim_id,
    need_id,
    settled_by_account_id,
    claimer_account_id,
    topes_amount
  )
  values (
    v_current_claim.id,
    v_current_claim.need_id,
    v_account_id,
    v_current_claim.claimer_account_id,
    v_topes_amount
  )
  on conflict (need_claim_id) do nothing;

  perform app_private.create_need_claim_notification(
    v_current_claim.claimer_account_id,
    v_current_claim.id,
    'claim_settled',
    jsonb_build_object(
      'needId', v_current_claim.need_id,
      'topesAmount', v_topes_amount
    )
  );

  insert into app_public.need_claim_notification (
    recipient_account_id,
    need_claim_id,
    event_type,
    payload
  )
  select
    nc.claimer_account_id,
    nc.id,
    'claim_declined',
    jsonb_build_object('needId', nc.need_id, 'settledClaimId', v_current_claim.id)
  from app_public.need_claim nc
  where nc.need_id = v_current_claim.need_id
    and nc.id <> v_current_claim.id
    and nc.status = 'declined';

  return v_current_claim;
end;
$$;

create or replace function app_private.expire_overdue_needs_and_claims()
returns table (
  expired_need_count integer,
  expired_claim_count integer
)
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
begin
  return query
  with expired_needs as (
    update app_public.need
    set is_active = false,
        updated_at = now()
    where is_active
      and expires_at is not null
      and expires_at <= now()
    returning id, creator_account_id
  ),
  expired_claims as (
    update app_public.need_claim nc
    set status = 'expired',
        updated_at = now()
    where nc.status = 'open'
      and nc.need_id in (select id from expired_needs)
    returning nc.id, nc.need_id, nc.claimer_account_id
  ),
  inserted_notifications as (
    insert into app_public.need_claim_notification (
      recipient_account_id,
      need_claim_id,
      event_type,
      payload
    )
    select
      ec.claimer_account_id,
      ec.id,
      'claim_expired',
      jsonb_build_object('needId', ec.need_id)
    from expired_claims ec
    returning id
  )
  select
    coalesce((select count(*)::integer from expired_needs), 0) as expired_need_count,
    coalesce((select count(*)::integer from expired_claims), 0) as expired_claim_count;
end;
$$;

grant execute on function app_public.search_needs(
  numeric,
  numeric,
  numeric,
  numeric,
  text,
  app_public.tri_state_filter,
  app_public.tri_state_filter,
  app_public.tri_state_filter,
  app_public.tri_state_filter,
  integer
) to anonymous, identified_account, manager, admin;

grant execute on function app_public.claim_need(uuid, text) to identified_account, manager, admin;
grant execute on function app_public.send_claim_message(uuid, text, text[]) to identified_account, manager, admin;
grant execute on function app_public.mark_claim_messages_read(uuid) to identified_account, manager, admin;
grant execute on function app_public.settle_need_claim(uuid) to identified_account, manager, admin;

grant execute on function app_private.expire_overdue_needs_and_claims() to identified_account, manager, admin;

grant execute on function app_private.resolve_need_search_coordinates(numeric, numeric, numeric, numeric) to anonymous, identified_account, manager, admin;
grant execute on function app_private.matches_tri_state_filter(app_public.tri_state_filter, boolean) to anonymous, identified_account, manager, admin;
grant execute on function app_private.calculate_need_closeness_score(numeric, numeric, numeric, numeric) to anonymous, identified_account, manager, admin;
grant execute on function app_private.calculate_need_ease_of_setup_score(boolean, boolean, boolean) to anonymous, identified_account, manager, admin;
grant execute on function app_private.calculate_need_expiration_score(timestamptz) to anonymous, identified_account, manager, admin;

grant execute on function app_private.create_need_claim_notification(uuid, uuid, text, jsonb) to identified_account, manager, admin;

comment on table app_public.need_claim is 'Claims made by authenticated accounts on active needs.';
comment on table app_public.need_claim_notification is 'Notification events emitted when claim lifecycle changes occur.';
comment on table app_public.claim_conversation is 'One private conversation channel per need claim.';
comment on table app_public.claim_message is 'Participant messages inside a claim conversation.';
comment on table app_public.need_claim_settlement_event is 'Recorded settlement and Topes transfer summary for a settled claim.';

comment on function app_public.search_needs(
  numeric,
  numeric,
  numeric,
  numeric,
  text,
  app_public.tri_state_filter,
  app_public.tri_state_filter,
  app_public.tri_state_filter,
  app_public.tri_state_filter,
  integer
) is '@name searchNeeds';

comment on function app_public.claim_need(uuid, text) is '@name claimNeed';
comment on function app_public.send_claim_message(uuid, text, text[]) is '@name sendClaimMessage';
comment on function app_public.mark_claim_messages_read(uuid) is '@name markClaimMessagesRead';
comment on function app_public.settle_need_claim(uuid) is '@name settleNeedClaim';

commit;
