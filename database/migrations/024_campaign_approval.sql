begin;

create or replace function app_public.approve_campaign(campaign_id uuid)
returns app_public.campaign
language plpgsql
as $$
declare
  v_campaign app_public.campaign;
  v_manager_account_id uuid;
begin
  if not app_private.is_manager() then
    raise exception using message = 'Only managers can approve campaigns';
  end if;

  v_manager_account_id := app_private.current_account_id();

  if v_manager_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  select *
  into v_campaign
  from app_public.campaign
  where id = approve_campaign.campaign_id
  for update;

  if v_campaign.id is null then
    raise exception using message = 'Campaign not found';
  end if;

  if v_campaign.moderation_status <> 'pending' then
    raise exception using message = 'Campaign can only be approved from pending status';
  end if;

  update app_public.campaign
  set moderation_status = 'approved'
  where id = v_campaign.id
  returning * into v_campaign;

  return v_campaign;
end;
$$;

grant execute on function app_public.approve_campaign(uuid) to manager, admin;

comment on function app_public.approve_campaign(uuid)
  is '@name approveCampaign';

commit;
