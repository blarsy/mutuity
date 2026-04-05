begin;

create table if not exists app_public.resource (
  id uuid primary key default gen_random_uuid(),
  creator_account_id uuid not null references app_public.account(id) on delete cascade,
  title text not null,
  description text,
  location text not null,
  latitude numeric(9, 6) not null default 50.6072,
  longitude numeric(9, 6) not null default 3.3889,
  intensity app_public.need_intensity not null,
  default_token_amount integer,
  category_labels text[] not null default '{}'::text[],
  is_product boolean not null default false,
  is_service boolean not null default false,
  can_be_given boolean not null default false,
  can_be_exchanged boolean not null default false,
  can_be_taken_away boolean not null default false,
  can_be_delivered boolean not null default false,
  is_active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resource_title_present check (btrim(title) <> ''),
  constraint resource_description_length check (description is null or char_length(description) <= 8000),
  constraint resource_default_token_amount_positive check (
    default_token_amount is null or default_token_amount > 0
  ),
  constraint resource_default_token_amount_matches_intensity check (
    default_token_amount is null
    or (intensity = 'leg_up' and default_token_amount between 10 and 99)
    or (intensity = 'sharing' and default_token_amount between 100 and 999)
    or (intensity = 'commitment' and default_token_amount between 1000 and 4999)
    or (intensity = 'rare_contribution' and default_token_amount >= 5000)
  )
);

create index if not exists resource_active_expiry_created_idx
  on app_public.resource (is_active, expires_at, created_at desc);

create index if not exists resource_creator_idx
  on app_public.resource (creator_account_id, created_at desc);

create index if not exists resource_category_labels_idx
  on app_public.resource using gin (category_labels);

drop trigger if exists trg_resource_set_updated_at on app_public.resource;
create trigger trg_resource_set_updated_at
  before update on app_public.resource
  for each row
  execute function app_private.set_updated_at();

alter table app_public.resource enable row level security;

drop policy if exists resource_select_policy on app_public.resource;
create policy resource_select_policy on app_public.resource
  for select
  using (
    (is_active and coalesce(expires_at > now(), true))
    or creator_account_id = app_private.current_account_id()
    or app_private.is_manager()
  );

drop policy if exists resource_insert_policy on app_public.resource;
create policy resource_insert_policy on app_public.resource
  for insert
  with check (
    creator_account_id = app_private.current_account_id()
    or app_private.is_admin()
  );

drop policy if exists resource_update_policy on app_public.resource;
create policy resource_update_policy on app_public.resource
  for update
  using (
    creator_account_id = app_private.current_account_id()
    or app_private.is_manager()
  )
  with check (
    creator_account_id = app_private.current_account_id()
    or app_private.is_manager()
  );

grant select on app_public.resource to anonymous, identified_account, manager, admin;
grant insert, update on app_public.resource to identified_account, manager, admin;

create or replace function app_private.calculate_geo_distance_km(
  p_item_latitude numeric,
  p_item_longitude numeric,
  p_query_latitude numeric,
  p_query_longitude numeric
)
returns numeric
language sql
immutable
as $$
  select (
    6371::numeric * acos(
      least(
        1::double precision,
        greatest(
          -1::double precision,
          cos(radians(p_query_latitude::double precision))
          * cos(radians(p_item_latitude::double precision))
          * cos(radians((p_item_longitude - p_query_longitude)::double precision))
          + sin(radians(p_query_latitude::double precision))
          * sin(radians(p_item_latitude::double precision))
        )
      )
    )
  )::numeric
$$;

create or replace function app_private.resource_search_document(
  p_title text,
  p_description text,
  p_category_labels text[]
)
returns text
language sql
immutable
parallel safe
as $$
  select lower(
    app_private.immutable_unaccent(
      trim(
        concat_ws(
          ' ',
          coalesce(p_title, ''),
          coalesce(p_description, ''),
          array_to_string(coalesce(p_category_labels, '{}'::text[]), ' ')
        )
      )
    )
  )
$$;

grant execute on function app_private.calculate_geo_distance_km(numeric, numeric, numeric, numeric) to anonymous, identified_account, manager, admin;
grant execute on function app_private.resource_search_document(text, text, text[]) to anonymous, identified_account, manager, admin;

drop function if exists app_public.search_resources(
  numeric,
  numeric,
  numeric,
  numeric,
  text,
  text[],
  app_public.tri_state_filter,
  app_public.tri_state_filter,
  app_public.tri_state_filter,
  app_public.tri_state_filter,
  app_public.tri_state_filter,
  app_public.tri_state_filter,
  integer
);

create or replace function app_public.search_resources(
  latitude numeric default null,
  longitude numeric default null,
  browser_latitude numeric default null,
  browser_longitude numeric default null,
  search_text text default null,
  category_labels text[] default null,
  is_product app_public.tri_state_filter default 'neutral',
  is_service app_public.tri_state_filter default 'neutral',
  can_be_given app_public.tri_state_filter default 'neutral',
  can_be_exchanged app_public.tri_state_filter default 'neutral',
  can_be_taken_away app_public.tri_state_filter default 'neutral',
  can_be_delivered app_public.tri_state_filter default 'neutral',
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
  default_token_amount integer,
  category_labels text[],
  is_product boolean,
  is_service boolean,
  can_be_given boolean,
  can_be_exchanged boolean,
  can_be_taken_away boolean,
  can_be_delivered boolean,
  is_active boolean,
  expires_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  distance_km numeric,
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
      search_resources.latitude,
      search_resources.longitude,
      search_resources.browser_latitude,
      search_resources.browser_longitude
    )
  ),
  normalized_input as (
    select
      nullif(lower(app_private.immutable_unaccent(btrim(coalesce(search_resources.search_text, '')))), '')
        as normalized_search_text,
      array(
        select lower(app_private.immutable_unaccent(btrim(label)))
        from unnest(coalesce(search_resources.category_labels, '{}'::text[])) as label
        where btrim(label) <> ''
      ) as normalized_category_labels
  ),
  filtered_resources as (
    select
      r.*,
      coalesce(a.display_name, a.external_subject, 'Unknown account') as creator_display_name,
      rl.query_latitude,
      rl.query_longitude,
      app_private.calculate_geo_distance_km(
        coalesce(r.latitude, rl.query_latitude),
        coalesce(r.longitude, rl.query_longitude),
        rl.query_latitude,
        rl.query_longitude
      ) as distance_km
    from app_public.resource r
    join app_public.account a on a.id = r.creator_account_id
    cross join resolved_location rl
    cross join normalized_input ni
    where r.is_active
      and coalesce(r.expires_at > now(), true)
      and app_private.matches_tri_state_filter(search_resources.is_product, r.is_product)
      and app_private.matches_tri_state_filter(search_resources.is_service, r.is_service)
      and app_private.matches_tri_state_filter(search_resources.can_be_given, r.can_be_given)
      and app_private.matches_tri_state_filter(search_resources.can_be_exchanged, r.can_be_exchanged)
      and app_private.matches_tri_state_filter(search_resources.can_be_taken_away, r.can_be_taken_away)
      and app_private.matches_tri_state_filter(search_resources.can_be_delivered, r.can_be_delivered)
      and (
        ni.normalized_search_text is null
        or app_private.account_search_document(a.display_name, a.external_subject)
          like '%' || ni.normalized_search_text || '%'
        or app_private.resource_search_document(
          r.title,
          r.description,
          r.category_labels
        ) like '%' || ni.normalized_search_text || '%'
      )
      and (
        coalesce(array_length(ni.normalized_category_labels, 1), 0) = 0
        or exists (
          select 1
          from unnest(coalesce(r.category_labels, '{}'::text[])) as resource_label
          where lower(app_private.immutable_unaccent(btrim(resource_label))) = any (ni.normalized_category_labels)
        )
      )
  )
  select
    fr.id,
    fr.creator_account_id,
    fr.creator_display_name,
    fr.title,
    fr.description,
    fr.location,
    fr.latitude,
    fr.longitude,
    fr.intensity,
    fr.default_token_amount,
    fr.category_labels,
    fr.is_product,
    fr.is_service,
    fr.can_be_given,
    fr.can_be_exchanged,
    fr.can_be_taken_away,
    fr.can_be_delivered,
    fr.is_active,
    fr.expires_at,
    fr.created_at,
    fr.updated_at,
    round(fr.distance_km, 3) as distance_km,
    fr.query_latitude,
    fr.query_longitude
  from filtered_resources fr
  order by fr.distance_km asc, fr.created_at desc, fr.id asc
  limit least(greatest(coalesce(search_resources.limit_count, 50), 1), 50)
$$;

comment on function app_public.search_resources(
  numeric,
  numeric,
  numeric,
  numeric,
  text,
  text[],
  app_public.tri_state_filter,
  app_public.tri_state_filter,
  app_public.tri_state_filter,
  app_public.tri_state_filter,
  app_public.tri_state_filter,
  app_public.tri_state_filter,
  integer
) is '@name searchResources';

grant execute on function app_public.search_resources(
  numeric,
  numeric,
  numeric,
  numeric,
  text,
  text[],
  app_public.tri_state_filter,
  app_public.tri_state_filter,
  app_public.tri_state_filter,
  app_public.tri_state_filter,
  app_public.tri_state_filter,
  app_public.tri_state_filter,
  integer
) to anonymous, identified_account, manager, admin;

commit;
