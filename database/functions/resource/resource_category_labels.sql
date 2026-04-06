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
