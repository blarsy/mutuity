begin;

create or replace function app_private.get_accounts_to_notify_of_new_resource(
  p_resource_id uuid,
  p_min_score numeric default 35,
  p_limit_count integer default 100
)
returns table (
  account_id uuid,
  weighted_score numeric,
  proximity_score numeric,
  campaign_score numeric,
  search_intent_score numeric
)
language sql
stable
set search_path = app_public, app_private, public
as $$
  with resource_context as (
    select
      r.id,
      r.creator_account_id,
      r.latitude,
      r.longitude,
      r.intensity,
      r.default_token_amount,
      r.is_product,
      r.is_service
    from app_public.resource r
    where r.id = p_resource_id
      and r.is_active
      and coalesce(r.expires_at > now(), true)
  ),
  resource_campaigns as (
    select cr.campaign_id
    from app_public.campaign_resource cr
    join app_public.campaign c on c.id = cr.campaign_id
    join resource_context rc on rc.id = cr.resource_id
    where cr.status = 'accepted'
      and c.moderation_status = 'approved'
  ),
  campaign_participation as (
    select
      cp.account_id,
      count(distinct cp.campaign_id)::integer as overlap_count
    from (
      select n.creator_account_id as account_id, cn.campaign_id
      from app_public.campaign_need cn
      join app_public.need n on n.id = cn.need_id
      where cn.status = 'accepted'
      union
      select r.creator_account_id as account_id, cr.campaign_id
      from app_public.campaign_resource cr
      join app_public.resource r on r.id = cr.resource_id
      where cr.status = 'accepted'
    ) cp
    where cp.campaign_id in (select campaign_id from resource_campaigns)
    group by cp.account_id
  ),
  search_intent as (
    select
      n.creator_account_id as account_id,
      count(*)::integer as match_count
    from resource_context rc
    join app_public.need n on true
    where n.is_active
      and coalesce(n.expires_at > now(), true)
      and n.creator_account_id <> rc.creator_account_id
      and (
        n.intensity = rc.intensity
        or (rc.is_product and n.object_required)
        or (rc.is_service and (n.competence_required or n.tooling_required))
        or (
          rc.default_token_amount is not null
          and n.proposed_topes_amount is not null
          and abs(rc.default_token_amount - n.proposed_topes_amount)
            <= greatest(50, (rc.default_token_amount * 0.5)::integer)
        )
      )
    group by n.creator_account_id
  ),
  scored_accounts as (
    select
      a.id as account_id,
      case
        when a.latitude is null or a.longitude is null then 40::numeric
        else greatest(
          0::numeric,
          100::numeric - least(
            100::numeric,
            app_private.calculate_geo_distance_km(
              rc.latitude,
              rc.longitude,
              a.latitude,
              a.longitude
            )
          )
        )
      end as proximity_score,
      least(100::numeric, coalesce(cp.overlap_count, 0)::numeric * 50::numeric) as campaign_score,
      least(100::numeric, coalesce(si.match_count, 0)::numeric * 30::numeric) as search_intent_score
    from resource_context rc
    join app_public.account a on a.id <> rc.creator_account_id
    left join campaign_participation cp on cp.account_id = a.id
    left join search_intent si on si.account_id = a.id
  )
  select
    sa.account_id,
    round((sa.proximity_score * 0.5) + (sa.campaign_score * 0.3) + (sa.search_intent_score * 0.2), 2) as weighted_score,
    round(sa.proximity_score, 2) as proximity_score,
    round(sa.campaign_score, 2) as campaign_score,
    round(sa.search_intent_score, 2) as search_intent_score
  from scored_accounts sa
  where round((sa.proximity_score * 0.5) + (sa.campaign_score * 0.3) + (sa.search_intent_score * 0.2), 2)
    >= greatest(coalesce(p_min_score, 35), 0)
  order by weighted_score desc, sa.account_id asc
  limit least(greatest(coalesce(p_limit_count, 100), 1), 500);
$$;

comment on function app_private.get_accounts_to_notify_of_new_resource(uuid, numeric, integer) is
  'Ranked targeting helper for new resource notifications using proximity, campaign overlap, and inferred intent signals.';

create or replace function app_private.get_accounts_to_notify_of_new_need(
  p_need_id uuid,
  p_min_score numeric default 35,
  p_limit_count integer default 100
)
returns table (
  account_id uuid,
  weighted_score numeric,
  proximity_score numeric,
  campaign_score numeric,
  search_intent_score numeric
)
language sql
stable
set search_path = app_public, app_private, public
as $$
  with need_context as (
    select
      n.id,
      n.creator_account_id,
      n.latitude,
      n.longitude,
      n.intensity,
      n.proposed_topes_amount,
      n.object_required,
      n.competence_required,
      n.tooling_required
    from app_public.need n
    where n.id = p_need_id
      and n.is_active
      and coalesce(n.expires_at > now(), true)
  ),
  need_campaigns as (
    select cn.campaign_id
    from app_public.campaign_need cn
    join app_public.campaign c on c.id = cn.campaign_id
    join need_context nc on nc.id = cn.need_id
    where cn.status = 'accepted'
      and c.moderation_status = 'approved'
  ),
  campaign_participation as (
    select
      cp.account_id,
      count(distinct cp.campaign_id)::integer as overlap_count
    from (
      select n.creator_account_id as account_id, cn.campaign_id
      from app_public.campaign_need cn
      join app_public.need n on n.id = cn.need_id
      where cn.status = 'accepted'
      union
      select r.creator_account_id as account_id, cr.campaign_id
      from app_public.campaign_resource cr
      join app_public.resource r on r.id = cr.resource_id
      where cr.status = 'accepted'
    ) cp
    where cp.campaign_id in (select campaign_id from need_campaigns)
    group by cp.account_id
  ),
  search_intent as (
    select
      r.creator_account_id as account_id,
      count(*)::integer as match_count
    from need_context nc
    join app_public.resource r on true
    where r.is_active
      and coalesce(r.expires_at > now(), true)
      and r.creator_account_id <> nc.creator_account_id
      and (
        r.intensity = nc.intensity
        or (nc.object_required and r.is_product)
        or ((nc.competence_required or nc.tooling_required) and r.is_service)
        or (
          nc.proposed_topes_amount is not null
          and r.default_token_amount is not null
          and abs(nc.proposed_topes_amount - r.default_token_amount)
            <= greatest(50, (nc.proposed_topes_amount * 0.5)::integer)
        )
      )
    group by r.creator_account_id
  ),
  scored_accounts as (
    select
      a.id as account_id,
      case
        when a.latitude is null or a.longitude is null then 40::numeric
        else greatest(
          0::numeric,
          100::numeric - least(
            100::numeric,
            app_private.calculate_geo_distance_km(
              nc.latitude,
              nc.longitude,
              a.latitude,
              a.longitude
            )
          )
        )
      end as proximity_score,
      least(100::numeric, coalesce(cp.overlap_count, 0)::numeric * 50::numeric) as campaign_score,
      least(100::numeric, coalesce(si.match_count, 0)::numeric * 30::numeric) as search_intent_score
    from need_context nc
    join app_public.account a on a.id <> nc.creator_account_id
    left join campaign_participation cp on cp.account_id = a.id
    left join search_intent si on si.account_id = a.id
  )
  select
    sa.account_id,
    round((sa.proximity_score * 0.5) + (sa.campaign_score * 0.3) + (sa.search_intent_score * 0.2), 2) as weighted_score,
    round(sa.proximity_score, 2) as proximity_score,
    round(sa.campaign_score, 2) as campaign_score,
    round(sa.search_intent_score, 2) as search_intent_score
  from scored_accounts sa
  where round((sa.proximity_score * 0.5) + (sa.campaign_score * 0.3) + (sa.search_intent_score * 0.2), 2)
    >= greatest(coalesce(p_min_score, 35), 0)
  order by weighted_score desc, sa.account_id asc
  limit least(greatest(coalesce(p_limit_count, 100), 1), 500);
$$;

comment on function app_private.get_accounts_to_notify_of_new_need(uuid, numeric, integer) is
  'Ranked targeting helper for new need notifications using proximity, campaign overlap, and inferred intent signals.';

grant execute on function app_private.get_accounts_to_notify_of_new_resource(uuid, numeric, integer)
  to identified_account, manager, admin;

grant execute on function app_private.get_accounts_to_notify_of_new_need(uuid, numeric, integer)
  to identified_account, manager, admin;

revoke all on function app_private.get_accounts_to_notify_of_new_resource(uuid, numeric, integer) from public;
revoke all on function app_private.get_accounts_to_notify_of_new_need(uuid, numeric, integer) from public;

commit;
