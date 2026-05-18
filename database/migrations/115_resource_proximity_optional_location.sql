begin;

alter table app_public.resource
  alter column location drop not null,
  alter column latitude drop not null,
  alter column longitude drop not null,
  alter column latitude drop default,
  alter column longitude drop default;

insert into app_public.system_setting (key, value_text)
values ('local_exchange_max_distance_km', '50')
on conflict (key) do nothing;

create or replace function app_private.get_local_exchange_max_distance_km()
returns numeric
language plpgsql
stable
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_value text;
  v_distance numeric := 50;
begin
  select s.value_text
  into v_value
  from app_public.system_setting s
  where s.key = 'local_exchange_max_distance_km';

  begin
    if v_value is not null then
      v_distance := greatest(0::numeric, least(v_value::numeric, 500::numeric));
    end if;
  exception
    when invalid_text_representation then
      v_distance := 50;
  end;

  return v_distance;
end;
$$;

grant execute on function app_private.get_local_exchange_max_distance_km() to anonymous, identified_account, admin;

create or replace function app_public.publish_resource(
  title text,
  description text default null,
  location text default null,
  latitude numeric default null,
  longitude numeric default null,
  intensity app_public.need_intensity default 'sharing',
  default_token_amount integer default null,
  category_codes integer[] default array[]::integer[],
  image_urls text[] default array[]::text[],
  is_product boolean default false,
  is_service boolean default false,
  can_be_given boolean default false,
  can_be_exchanged boolean default false,
  can_be_taken_away boolean default false,
  can_be_delivered boolean default false,
  expires_at timestamptz default null,
  resource_id uuid default null
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
  v_image_urls text[];
  v_resource app_public.resource;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  v_title := nullif(btrim(coalesce(publish_resource.title, '')), '');
  v_description := nullif(btrim(coalesce(publish_resource.description, '')), '');
  v_location := nullif(btrim(coalesce(publish_resource.location, '')), '');
  v_image_urls := app_private.normalize_text_array(publish_resource.image_urls);

  if v_title is null then
    raise exception using message = 'Resource title is required';
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

  if publish_resource.resource_id is null then
    insert into app_public.resource (
      creator_account_id,
      title,
      description,
      location,
      latitude,
      longitude,
      intensity,
      default_token_amount,
      image_urls,
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
      publish_resource.latitude,
      publish_resource.longitude,
      publish_resource.intensity,
      publish_resource.default_token_amount,
      v_image_urls,
      coalesce(publish_resource.is_product, false),
      coalesce(publish_resource.is_service, false),
      coalesce(publish_resource.can_be_given, false),
      coalesce(publish_resource.can_be_exchanged, false),
      coalesce(publish_resource.can_be_taken_away, false),
      coalesce(publish_resource.can_be_delivered, false),
      publish_resource.expires_at
    )
    returning * into v_resource;
  else
    update app_public.resource r
    set title = v_title,
        description = v_description,
        location = v_location,
        latitude = publish_resource.latitude,
        longitude = publish_resource.longitude,
        intensity = publish_resource.intensity,
        default_token_amount = publish_resource.default_token_amount,
        image_urls = v_image_urls,
        is_product = coalesce(publish_resource.is_product, false),
        is_service = coalesce(publish_resource.is_service, false),
        can_be_given = coalesce(publish_resource.can_be_given, false),
        can_be_exchanged = coalesce(publish_resource.can_be_exchanged, false),
        can_be_taken_away = coalesce(publish_resource.can_be_taken_away, false),
        can_be_delivered = coalesce(publish_resource.can_be_delivered, false),
        expires_at = publish_resource.expires_at
    where r.id = publish_resource.resource_id
      and (
        r.creator_account_id = v_account_id
        or app_private.is_admin()
      )
    returning * into v_resource;

    if v_resource.id is null then
      raise exception using message = 'Resource not found or not editable by current account';
    end if;

    delete from app_public.resource_category_assignment rca
    where rca.resource_id = v_resource.id
      and not (rca.category_code = any (v_category_codes));
  end if;

  insert into app_public.resource_category_assignment (resource_id, category_code)
  select v_resource.id, requested_code
  from unnest(v_category_codes) as requested_code
  on conflict do nothing;

  select r.*
  into v_resource
  from app_public.resource r
  where r.id = v_resource.id;

  return v_resource;
end;
$$;

grant execute on function app_public.publish_resource(
  text,
  text,
  text,
  numeric,
  numeric,
  app_public.need_intensity,
  integer,
  integer[],
  text[],
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  timestamptz,
  uuid
) to anonymous, identified_account, admin;

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
  limit_count integer default 50,
  favor_local_resources boolean default true,
  max_distance_km numeric default null
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
  image_urls text[],
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
  configured_distance as (
    select app_private.get_local_exchange_max_distance_km() as configured_max_distance_km
  ),
  settings as (
    select
      cd.configured_max_distance_km,
      least(
        cd.configured_max_distance_km,
        greatest(coalesce(search_resources.max_distance_km, cd.configured_max_distance_km), 0::numeric)
      ) as effective_max_distance_km
    from configured_distance cd
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
      st.effective_max_distance_km,
      coalesce(category_lookup.category_labels, '{}'::text[]) as category_labels,
      case
        when r.latitude is null or r.longitude is null then
          case
            when coalesce(search_resources.favor_local_resources, true) then st.effective_max_distance_km
            else 0::numeric
          end
        else app_private.calculate_geo_distance_km(
          r.latitude,
          r.longitude,
          rl.query_latitude,
          rl.query_longitude
        )
      end as distance_km
    from app_public.resource r
    join app_public.account a on a.id = r.creator_account_id
    cross join resolved_location rl
    cross join settings st
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
    fr.image_urls,
    round(fr.distance_km, 3) as distance_km,
    fr.query_latitude,
    fr.query_longitude
  from filtered_resources fr
  where fr.distance_km <= fr.effective_max_distance_km
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
  integer,
  boolean,
  numeric
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
  integer,
  boolean,
  numeric
) to anonymous, identified_account, admin;

commit;
