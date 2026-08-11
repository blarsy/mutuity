begin;

drop policy if exists resource_delete_policy on app_public.resource;
create policy resource_delete_policy on app_public.resource
  for delete
  using (
    creator_account_id = app_private.current_account_id()
    or app_private.is_admin()
  );

grant delete on app_public.resource to identified_account, admin;

commit;