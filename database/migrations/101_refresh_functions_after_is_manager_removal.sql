-- Refresh live function definitions after removing the is_manager() compatibility shim.
--
-- Some SQL functions are maintained under database/functions/ and were newer than
-- the historical migration-owned definitions present in the database. After
-- dropping app_private.is_manager(), those older installed definitions still
-- referenced the removed shim. This migration reapplies the current definitions
-- for the affected functions.

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

create or replace function app_private.immutable_unaccent(p_text text)
returns text
language sql
immutable
parallel safe
as $$
  select public.unaccent('public.unaccent', coalesce(p_text, ''))
$$;

create or replace function app_private.account_search_document(
  p_display_name text,
  p_external_subject text
)
returns text
language sql
immutable
parallel safe
as $$
  select lower(
    app_private.immutable_unaccent(
      trim(concat_ws(' ', coalesce(p_display_name, ''), coalesce(p_external_subject, '')))
    )
  )
$$;

create or replace function app_private.need_search_document(
  p_title text,
  p_description text,
  p_required_tooling_text text,
  p_required_competence_text text
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
          coalesce(p_required_tooling_text, ''),
          coalesce(p_required_competence_text, '')
        )
      )
    )
  )
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
  normalized_input as (
    select nullif(lower(app_private.immutable_unaccent(btrim(coalesce(search_needs.search_text, '')))), '')
      as normalized_search_text
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
    cross join normalized_input i
    where n.is_active
      and coalesce(n.expires_at > now(), true)
      and app_private.matches_tri_state_filter(search_needs.multiple_people_required, n.multiple_people_required)
      and app_private.matches_tri_state_filter(search_needs.tooling_required, n.tooling_required)
      and app_private.matches_tri_state_filter(search_needs.competence_required, n.competence_required)
      and app_private.matches_tri_state_filter(search_needs.object_required, n.object_required)
      and (
        i.normalized_search_text is null
        or app_private.account_search_document(a.display_name, a.external_subject)
          like '%' || i.normalized_search_text || '%'
        or app_private.need_search_document(
          n.title,
          n.description,
          n.required_tooling_text,
          n.required_competence_text
        ) like '%' || i.normalized_search_text || '%'
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

create or replace function app_public.publish_resource(
  title text,
  description text default null,
  location text default null,
  latitude numeric default 50.6072,
  longitude numeric default 3.3889,
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
      coalesce(publish_resource.latitude, 50.6072),
      coalesce(publish_resource.longitude, 3.3889),
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
        latitude = coalesce(publish_resource.latitude, 50.6072),
        longitude = coalesce(publish_resource.longitude, 3.3889),
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

create or replace function app_public.cleanup_read_notifications()
returns integer
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_deleted_need integer := 0;
  v_deleted_resource integer := 0;
  v_deleted_account integer := 0;
begin
  if not app_private.is_admin() then
    raise exception using message = 'Only admins can trigger notification cleanup';
  end if;

  delete from app_public.need_claim_notification
  where created_at <= now() - interval '7 days'
    and read_at is not null
    and read_at <= now() - interval '24 hours';
  get diagnostics v_deleted_need = row_count;

  delete from app_public.resource_bid_notification
  where created_at <= now() - interval '7 days'
    and read_at is not null
    and read_at <= now() - interval '24 hours';
  get diagnostics v_deleted_resource = row_count;

  delete from app_public.account_notification
  where created_at <= now() - interval '7 days'
    and read_at is not null
    and read_at <= now() - interval '24 hours';
  get diagnostics v_deleted_account = row_count;

  return v_deleted_need + v_deleted_resource + v_deleted_account;
end;
$$;
