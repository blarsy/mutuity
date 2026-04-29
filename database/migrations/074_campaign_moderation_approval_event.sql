-- Persist campaign approval as a moderation timeline event so creators can see
-- the terminal moderation outcome in the same history feed.

alter table app_public.campaign_moderation_event
  drop constraint if exists campaign_moderation_event_event_type_check;

alter table app_public.campaign_moderation_event
  add constraint campaign_moderation_event_event_type_check
  check (event_type in ('campaign_modified_by_creator', 'campaign_approved'));

create or replace function app_public.approve_campaign(campaign_id uuid)
returns app_public.campaign
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_campaign app_public.campaign;
  v_admin_account_id uuid;
begin
  if not app_private.is_admin() then
    raise exception using message = 'Only administrators can approve campaigns';
  end if;

  v_admin_account_id := app_private.current_account_id();

  if v_admin_account_id is null then
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

  if v_campaign.moderation_status not in ('pending', 'awaiting_adaptation') then
    raise exception using message = 'Campaign can only be approved from pending or awaiting adaptation status';
  end if;

  update app_public.campaign
  set moderation_status = 'approved'
  where id = v_campaign.id
  returning * into v_campaign;

  insert into app_public.campaign_moderation_event (
    campaign_id,
    actor_account_id,
    event_type,
    body
  )
  values (
    v_campaign.id,
    v_admin_account_id,
    'campaign_approved',
    null
  );

  perform app_private.create_account_notification(
    v_campaign.creator_account_id,
    'campaign_approved',
    jsonb_build_object(
      'campaignId', v_campaign.id,
      'campaignName', v_campaign.title
    )
  );

  return v_campaign;
end;
$$;

grant execute on function app_public.approve_campaign(uuid)
  to admin;

revoke all on function app_public.approve_campaign(uuid)
  from public;

comment on function app_public.approve_campaign(uuid)
  is '@name approveCampaign';
