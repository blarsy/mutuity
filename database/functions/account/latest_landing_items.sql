drop function if exists app_public.latest_landing_items(integer);

create or replace function app_public.latest_landing_items(limit_count integer default 10)
returns table (
  id uuid,
  kind text,
  title text,
  image_url text,
  creator_display_name text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = app_public, app_private, public
as $$
  with recent_resources as (
    select
      r.id,
      'resource'::text as kind,
      r.title,
      (select u from unnest(r.image_urls) as u where u is not null and u <> '' limit 1) as image_url,
      coalesce(a.display_name, a.external_subject) as creator_display_name,
      r.created_at
    from app_public.resource r
    join app_public.account a on a.id = r.creator_account_id
    where r.is_active
      and exists (select 1 from unnest(r.image_urls) as u where u is not null and u <> '')
    order by r.created_at desc
    limit least(greatest(coalesce(limit_count, 10), 1), 50)
  ),
  recent_needs as (
    select
      n.id,
      'need'::text as kind,
      n.title,
      (select u from unnest(n.image_urls) as u where u is not null and u <> '' limit 1) as image_url,
      coalesce(a.display_name, a.external_subject) as creator_display_name,
      n.created_at
    from app_public.need n
    join app_public.account a on a.id = n.creator_account_id
    where n.is_active
      and n.image_urls is not null
      and exists (select 1 from unnest(n.image_urls) as u where u is not null and u <> '')
    order by n.created_at desc
    limit least(greatest(coalesce(limit_count, 10), 1), 50)
  )
  select * from recent_resources
  union all
  select * from recent_needs
  order by created_at desc
  limit least(greatest(coalesce(limit_count, 10), 1), 50)
$$;

comment on function app_public.latest_landing_items(integer) is '@name latestLandingItems';
