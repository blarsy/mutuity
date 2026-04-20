begin;

create or replace function app_private.is_account_email_verified(p_account_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from app_private.account_credential c
    where c.account_id = p_account_id
      and c.is_active = true
      and c.email_verified_at is not null
  );
$$;

drop function if exists app_private.find_account_session(text);

create or replace function app_private.find_account_session(p_session_token_hash text)
returns table (
  session_id uuid,
  account_id uuid,
  role_name text,
  expires_at timestamptz,
  display_name text,
  external_subject text,
  avatar_url text,
  email_verified_at timestamptz
)
language sql
stable
as $$
  select
    s.id,
    s.account_id,
    s.role_name,
    s.expires_at,
    a.display_name,
    a.external_subject,
    a.avatar_url,
    c.email_verified_at
  from app_private.account_session s
  join app_public.account a on a.id = s.account_id
  left join lateral (
    select ac.email_verified_at
    from app_private.account_credential ac
    where ac.account_id = s.account_id
      and ac.is_active = true
    order by ac.created_at asc
    limit 1
  ) c on true
  where s.session_token_hash = p_session_token_hash
    and s.revoked_at is null
    and s.expires_at > now()
  limit 1;
$$;

drop policy if exists need_select_policy on app_public.need;
create policy need_select_policy on app_public.need
  for select
  using (
    (
      is_active
      and app_private.is_account_email_verified(creator_account_id)
    )
    or creator_account_id = app_private.current_account_id()
    or app_private.is_manager()
  );

drop policy if exists resource_select_policy on app_public.resource;
create policy resource_select_policy on app_public.resource
  for select
  using (
    (
      is_active
      and coalesce(expires_at > now(), true)
      and app_private.is_account_email_verified(creator_account_id)
    )
    or creator_account_id = app_private.current_account_id()
    or app_private.is_manager()
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
      and (
        app_private.is_account_email_verified(n.creator_account_id)
        or n.creator_account_id = app_private.current_account_id()
        or app_private.is_manager()
      )
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
      and (
        app_private.is_account_email_verified(r.creator_account_id)
        or r.creator_account_id = app_private.current_account_id()
        or app_private.is_manager()
      )
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

grant execute on function app_private.is_account_email_verified(uuid)
  to anonymous, identified_account, manager, admin;

revoke all on function app_private.is_account_email_verified(uuid) from public;

commit;
