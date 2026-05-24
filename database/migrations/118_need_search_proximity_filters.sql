-- Add proximity filtering controls to need discovery.
--
-- This keeps the Contribute page in sync with backend filtering by accepting
-- favor_local_resources and max_distance_km on search_needs.

set search_path = app_public, app_private, public;

drop function if exists app_public.search_needs(
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
);

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
  limit_count integer default 50,
  favor_local_resources boolean default true,
  max_distance_km numeric default null
)
returns setof app_public.search_need_result
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
  configured_distance as (
    select app_private.get_local_exchange_max_distance_km() as configured_max_distance_km
  ),
  settings as (
    select
      cd.configured_max_distance_km,
      least(
        cd.configured_max_distance_km,
        greatest(coalesce(search_needs.max_distance_km, cd.configured_max_distance_km), 0::numeric)
      ) as effective_max_distance_km
    from configured_distance cd
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
      st.effective_max_distance_km,
      case
        when n.latitude is null or n.longitude is null then
          case
            when coalesce(search_needs.favor_local_resources, true) then st.configured_max_distance_km
            else st.effective_max_distance_km + 1::numeric
          end
        else app_private.calculate_geo_distance_km(
          n.latitude,
          n.longitude,
          r.query_latitude,
          r.query_longitude
        )
      end as distance_km,
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
    cross join settings st
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
    fn.image_urls,
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
  where fn.distance_km <= fn.effective_max_distance_km
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
  integer,
  boolean,
  numeric
) is '@name searchNeeds';
