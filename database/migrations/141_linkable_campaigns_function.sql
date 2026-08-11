begin;

create or replace function app_public.linkable_campaigns()
returns setof app_public.campaign
language sql
stable
security definer
set search_path = app_public, app_private, public
as $$
  select c.*
  from app_public.campaign c
  where c.moderation_status = 'approved'
    and c.start_at <= now()
    and c.end_at >= now()
  order by c.start_at asc, c.title asc
$$;

grant execute on function app_public.linkable_campaigns()
  to anonymous, identified_account, admin;

comment on function app_public.linkable_campaigns() is
  'Approved campaigns that are currently active and therefore linkable from public search flows.';

commit;
