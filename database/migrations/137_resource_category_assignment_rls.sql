begin;

-- Enable RLS on resource_category_assignment (was missing since creation in 013)
alter table app_public.resource_category_assignment enable row level security;

-- SELECT: allow reading category assignments for resources the current role can see
drop policy if exists resource_category_assignment_select_policy on app_public.resource_category_assignment;
create policy resource_category_assignment_select_policy on app_public.resource_category_assignment
  for select
  using (
    app_private.is_admin()
    or exists (
      select 1
      from app_public.resource r
      where r.id = resource_id
        and (
          (r.is_active and coalesce(r.expires_at > now(), true))
          or r.creator_account_id = app_private.current_account_id()
        )
    )
  );

-- INSERT: only resource creator or admin can assign categories
drop policy if exists resource_category_assignment_insert_policy on app_public.resource_category_assignment;
create policy resource_category_assignment_insert_policy on app_public.resource_category_assignment
  for insert
  with check (
    app_private.is_admin()
    or exists (
      select 1
      from app_public.resource r
      where r.id = resource_id
        and r.creator_account_id = app_private.current_account_id()
    )
  );

-- DELETE: only resource creator or admin can remove category assignments
drop policy if exists resource_category_assignment_delete_policy on app_public.resource_category_assignment;
create policy resource_category_assignment_delete_policy on app_public.resource_category_assignment
  for delete
  using (
    app_private.is_admin()
    or exists (
      select 1
      from app_public.resource r
      where r.id = resource_id
        and r.creator_account_id = app_private.current_account_id()
    )
  );

-- Grant SELECT to all roles (RLS policies will filter)
grant select on app_public.resource_category_assignment to anonymous, identified_account, admin;

-- Grant INSERT/DELETE to identified_account+ (RLS policies will filter)
grant insert, delete on app_public.resource_category_assignment to identified_account, admin;

commit;