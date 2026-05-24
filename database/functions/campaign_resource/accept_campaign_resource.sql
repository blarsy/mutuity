create or replace function app_public.accept_campaign_resource(campaign_id uuid, resource_id uuid)
returns app_public.campaign_resource
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_campaign_creator_account_id uuid;
  v_campaign_resource_status app_public.campaign_need_status;
  v_campaign_resource app_public.campaign_resource;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  select
    cr.status,
    c.creator_account_id
  into
    v_campaign_resource_status,
    v_campaign_creator_account_id
  from app_public.campaign_resource cr
  join app_public.campaign c on c.id = cr.campaign_id
  where cr.campaign_id = accept_campaign_resource.campaign_id
    and cr.resource_id = accept_campaign_resource.resource_id
  for update of cr;

  if not found then
    raise exception using message = 'Campaign resource relation not found';
  end if;

  if v_campaign_creator_account_id <> v_account_id then
    raise exception using message = 'Only the campaign creator can triage joined resources';
  end if;

  if v_campaign_resource_status <> 'pending' then
    raise exception using message = 'Campaign resource can only be triaged from pending status';
  end if;

  update app_public.campaign_resource
  set status = 'accepted',
      acted_by_account_id = v_account_id,
      acted_at = now()
  where app_public.campaign_resource.campaign_id = accept_campaign_resource.campaign_id
    and app_public.campaign_resource.resource_id = accept_campaign_resource.resource_id
  returning * into v_campaign_resource;

  return v_campaign_resource;
end;
$$;

grant execute on function app_public.accept_campaign_resource(uuid, uuid) to identified_account, admin;

comment on function app_public.accept_campaign_resource(uuid, uuid)
  is '@name acceptCampaignResource';
