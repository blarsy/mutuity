create or replace function app_public.public_campaign_resource_links()
returns table (
  campaign_id uuid,
  resource_id uuid
)
language sql
stable
security definer
set search_path = app_public, app_private, public
as $$
  select cr.campaign_id, cr.resource_id
  from app_public.campaign_resource cr
  join app_public.campaign c on c.id = cr.campaign_id
  join app_public.resource r on r.id = cr.resource_id
  where cr.status = 'accepted'
    and c.moderation_status = 'approved'
    and c.start_at <= now()
    and c.end_at >= now()
    and r.is_active
    and coalesce(r.expires_at > now(), true)
$$;

create or replace function app_public.public_campaign_need_links()
returns table (
  campaign_id uuid,
  need_id uuid
)
language sql
stable
security definer
set search_path = app_public, app_private, public
as $$
  select cn.campaign_id, cn.need_id
  from app_public.campaign_need cn
  join app_public.campaign c on c.id = cn.campaign_id
  join app_public.need n on n.id = cn.need_id
  where cn.status = 'accepted'
    and c.moderation_status = 'approved'
    and c.start_at <= now()
    and c.end_at >= now()
    and n.is_active
    and coalesce(n.expires_at > now(), true)
$$;

grant execute on function app_public.public_campaign_resource_links()
  to anonymous, identified_account, admin;

grant execute on function app_public.public_campaign_need_links()
  to anonymous, identified_account, admin;

comment on function app_public.public_campaign_resource_links() is
  'Accepted resource links for approved campaigns active at the current time.';

comment on function app_public.public_campaign_need_links() is
  'Accepted need links for approved campaigns active at the current time.';
