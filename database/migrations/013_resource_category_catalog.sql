begin;

create table if not exists app_public.resource_category (
  code integer primary key,
  slug text not null unique,
  label text not null,
  label_fr text not null,
  sort_order integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists resource_category_active_sort_idx
  on app_public.resource_category (is_active, sort_order, code);

drop trigger if exists trg_resource_category_set_updated_at on app_public.resource_category;
create trigger trg_resource_category_set_updated_at
  before update on app_public.resource_category
  for each row
  execute function app_private.set_updated_at();

alter table app_public.resource_category enable row level security;

drop policy if exists resource_category_select_policy on app_public.resource_category;
create policy resource_category_select_policy on app_public.resource_category
  for select
  using (is_active or app_private.current_role() in ('manager', 'admin'));

drop policy if exists resource_category_insert_policy on app_public.resource_category;
create policy resource_category_insert_policy on app_public.resource_category
  for insert
  with check (app_private.is_manager());

drop policy if exists resource_category_update_policy on app_public.resource_category;
create policy resource_category_update_policy on app_public.resource_category
  for update
  using (app_private.is_manager())
  with check (app_private.is_manager());

grant select on app_public.resource_category to anonymous, identified_account, manager, admin;
grant insert, update on app_public.resource_category to manager, admin;

insert into app_public.resource_category (code, slug, label, label_fr, sort_order)
values
  (1, 'decoration', 'Decoration', 'Déco', 1),
  (2, 'transport', 'Transport', 'Transport', 2),
  (3, 'food_beverage', 'Food & beverage', 'Alimentation', 3),
  (4, 'garden', 'Garden', 'Jardin', 4),
  (5, 'sport_leisure', 'Sport & leisure', 'Sport & loisirs', 5),
  (6, 'health_comfort', 'Health & comfort', 'Santé & confort', 6),
  (7, 'building_material_tools', 'Building material & tools', 'Matériaux construction & outillage', 7),
  (8, 'electronics_technology', 'Electronics & technology', 'Electronique & technologie', 8),
  (9, 'books_education', 'Books & education', 'Livres & éducation', 9),
  (10, 'misc', 'Misc', 'Divers', 10),
  (11, 'clothing', 'Clothing', 'Habillement', 11),
  (12, 'furniture', 'Furniture', 'Meubles', 12)
on conflict (code) do update
set slug = excluded.slug,
    label = excluded.label,
    label_fr = excluded.label_fr,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

create table if not exists app_public.resource_category_assignment (
  resource_id uuid not null references app_public.resource(id) on delete cascade,
  category_code integer not null references app_public.resource_category(code),
  created_at timestamptz not null default now(),
  primary key (resource_id, category_code)
);

create index if not exists resource_category_assignment_category_idx
  on app_public.resource_category_assignment (category_code, resource_id);

create or replace function app_public.resource_category_labels(resource app_public.resource)
returns text[]
language sql
stable
security definer
set search_path = app_public, app_private, public
as $$
  select coalesce(array_agg(rc.label order by rc.sort_order, rc.code), '{}'::text[])
  from app_public.resource_category_assignment rca
  join app_public.resource_category rc
    on rc.code = rca.category_code
   and rc.is_active
  where rca.resource_id = resource.id
$$;

grant execute on function app_public.resource_category_labels(app_public.resource)
  to anonymous, identified_account, manager, admin;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'app_public'
      and table_name = 'resource'
      and column_name = 'category_labels'
  ) then
    insert into app_public.resource_category_assignment (resource_id, category_code)
    select distinct r.id, rc.code
    from app_public.resource r
    cross join lateral unnest(coalesce(r.category_labels, '{}'::text[])) as raw_label(label)
    join app_public.resource_category rc
      on lower(app_private.immutable_unaccent(btrim(raw_label.label))) in (
        lower(app_private.immutable_unaccent(rc.slug)),
        lower(app_private.immutable_unaccent(rc.label)),
        lower(app_private.immutable_unaccent(rc.label_fr))
      )
    on conflict do nothing;

    drop index if exists resource_category_labels_idx;
    alter table app_public.resource drop column if exists category_labels;
  end if;
end;
$$;

drop function if exists app_public.publish_resource(
  text,
  text,
  text,
  numeric,
  numeric,
  app_public.need_intensity,
  integer,
  text[],
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  timestamptz
);

drop function if exists app_public.publish_resource(
  text,
  text,
  text,
  numeric,
  numeric,
  app_public.need_intensity,
  integer,
  integer[],
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  timestamptz
);

create or replace function app_public.publish_resource(
  title text,
  description text default null,
  location text default null,
  latitude numeric default 50.6072,
  longitude numeric default 3.3889,
  intensity app_public.need_intensity default 'sharing',
  default_token_amount integer default null,
  category_codes integer[] default array[]::integer[],
  is_product boolean default false,
  is_service boolean default false,
  can_be_given boolean default false,
  can_be_exchanged boolean default false,
  can_be_taken_away boolean default false,
  can_be_delivered boolean default false,
  expires_at timestamptz default null
)
returns app_public.resource
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_title text;
  v_description text;
  v_location text;
  v_category_codes integer[];
  v_resource app_public.resource;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  v_title := nullif(btrim(coalesce(publish_resource.title, '')), '');
  v_description := nullif(btrim(coalesce(publish_resource.description, '')), '');
  v_location := nullif(btrim(coalesce(publish_resource.location, '')), '');

  if v_title is null then
    raise exception using message = 'Resource title is required';
  end if;

  if v_location is null then
    raise exception using message = 'Resource location is required';
  end if;

  if v_description is not null and char_length(v_description) > 8000 then
    raise exception using message = 'Resource description must be 8000 characters or fewer';
  end if;

  if publish_resource.expires_at is not null and publish_resource.expires_at <= now() then
    raise exception using message = 'Resource expiration must be in the future';
  end if;

  if not coalesce(publish_resource.is_product, false) and not coalesce(publish_resource.is_service, false) then
    raise exception using message = 'Resource must be marked as a product, a service, or both';
  end if;

  perform app_private.validate_topes_amount(
    publish_resource.intensity::text,
    publish_resource.default_token_amount
  );

  select coalesce(array_agg(distinct requested_code order by requested_code), '{}'::integer[])
  into v_category_codes
  from unnest(coalesce(publish_resource.category_codes, array[]::integer[])) as requested_code
  where requested_code is not null;

  if exists (
    select 1
    from unnest(v_category_codes) as requested_code
    left join app_public.resource_category rc
      on rc.code = requested_code
     and rc.is_active
    where rc.code is null
  ) then
    raise exception using message = 'One or more resource categories are invalid';
  end if;

  insert into app_public.resource (
    creator_account_id,
    title,
    description,
    location,
    latitude,
    longitude,
    intensity,
    default_token_amount,
    is_product,
    is_service,
    can_be_given,
    can_be_exchanged,
    can_be_taken_away,
    can_be_delivered,
    expires_at
  )
  values (
    v_account_id,
    v_title,
    v_description,
    v_location,
    coalesce(publish_resource.latitude, 50.6072),
    coalesce(publish_resource.longitude, 3.3889),
    publish_resource.intensity,
    publish_resource.default_token_amount,
    coalesce(publish_resource.is_product, false),
    coalesce(publish_resource.is_service, false),
    coalesce(publish_resource.can_be_given, false),
    coalesce(publish_resource.can_be_exchanged, false),
    coalesce(publish_resource.can_be_taken_away, false),
    coalesce(publish_resource.can_be_delivered, false),
    publish_resource.expires_at
  )
  returning * into v_resource;

  insert into app_public.resource_category_assignment (resource_id, category_code)
  select v_resource.id, requested_code
  from unnest(v_category_codes) as requested_code
  on conflict do nothing;

  return v_resource;
end;
$$;

comment on function app_public.publish_resource(
  text,
  text,
  text,
  numeric,
  numeric,
  app_public.need_intensity,
  integer,
  integer[],
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  timestamptz
) is '@name publishResource';

grant execute on function app_public.publish_resource(
  text,
  text,
  text,
  numeric,
  numeric,
  app_public.need_intensity,
  integer,
  integer[],
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  timestamptz
) to anonymous, identified_account, manager, admin;

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

drop function if exists app_public.search_resources(
  numeric,
  numeric,
  numeric,
  numeric,
  text,
  integer[],
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
  category_codes integer[] default null,
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
        select distinct requested_code
        from unnest(coalesce(search_resources.category_codes, array[]::integer[])) as requested_code
        where requested_code is not null
        order by requested_code
      ) as requested_category_codes
  ),
  filtered_resources as (
    select
      r.*,
      coalesce(a.display_name, a.external_subject, 'Unknown account') as creator_display_name,
      rl.query_latitude,
      rl.query_longitude,
      coalesce(category_lookup.category_labels, '{}'::text[]) as category_labels,
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
    left join lateral (
      select coalesce(array_agg(rc.label order by rc.sort_order, rc.code), '{}'::text[]) as category_labels
      from app_public.resource_category_assignment rca
      join app_public.resource_category rc
        on rc.code = rca.category_code
       and rc.is_active
      where rca.resource_id = r.id
    ) category_lookup on true
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
          coalesce(category_lookup.category_labels, '{}'::text[])
        ) like '%' || ni.normalized_search_text || '%'
      )
      and (
        coalesce(array_length(ni.requested_category_codes, 1), 0) = 0
        or exists (
          select 1
          from app_public.resource_category_assignment rca
          where rca.resource_id = r.id
            and rca.category_code = any (ni.requested_category_codes)
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
  integer[],
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
  integer[],
  app_public.tri_state_filter,
  app_public.tri_state_filter,
  app_public.tri_state_filter,
  app_public.tri_state_filter,
  app_public.tri_state_filter,
  app_public.tri_state_filter,
  integer
) to anonymous, identified_account, manager, admin;

commit;
