-- Ensure unknown-location resources do not always match the user-selected distance.
--
-- Previously, when favor_local_resources=true and a resource had no coordinates,
-- distance_km was set to effective_max_distance_km (the selected slider value).
-- This made those rows always satisfy the distance filter regardless of slider changes.

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
            when coalesce(search_resources.favor_local_resources, true) then st.configured_max_distance_km
            else st.effective_max_distance_km + 1::numeric
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
