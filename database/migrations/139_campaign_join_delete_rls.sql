begin;

drop policy if exists campaign_need_delete_policy on app_public.campaign_need;
create policy campaign_need_delete_policy on app_public.campaign_need
  for delete
  using (
    app_private.is_admin()
    or exists (
      select 1
      from app_public.campaign c
      where c.id = campaign_id
        and c.creator_account_id = app_private.current_account_id()
    )
    or exists (
      select 1
      from app_public.need n
      where n.id = need_id
        and n.creator_account_id = app_private.current_account_id()
    )
  );

drop policy if exists campaign_resource_delete_policy on app_public.campaign_resource;
create policy campaign_resource_delete_policy on app_public.campaign_resource
  for delete
  using (
    app_private.is_admin()
    or exists (
      select 1
      from app_public.campaign c
      where c.id = campaign_id
        and c.creator_account_id = app_private.current_account_id()
    )
    or exists (
      select 1
      from app_public.resource r
      where r.id = resource_id
        and r.creator_account_id = app_private.current_account_id()
    )
  );

grant delete on app_public.campaign_need to identified_account, admin;
grant delete on app_public.campaign_resource to identified_account, admin;

commit;