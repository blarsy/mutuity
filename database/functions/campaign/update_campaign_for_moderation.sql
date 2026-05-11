create or replace function app_public.update_campaign_for_moderation(
  p_campaign_id uuid,
  p_title text,
  p_theme text,
  p_manager_note_from_creator text,
  p_rewards_multiplier integer,
  p_airdrop_amount integer,
  p_start_at timestamptz,
  p_airdrop_at timestamptz,
  p_end_at timestamptz,
  p_image_url text
)
returns app_public.campaign
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_campaign app_public.campaign;
  v_previous_status app_public.campaign_moderation_status;
  v_creator_name text;
  v_admin record;
  v_image_url text;
begin
  v_account_id := app_private.current_account_id();
  v_image_url := nullif(btrim(p_image_url), '');

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  select *
  into v_campaign
  from app_public.campaign c
  where c.id = p_campaign_id
  for update;

  if v_campaign.id is null then
    raise exception using message = 'Campaign not found';
  end if;

  select a.display_name
  into v_creator_name
  from app_public.account a
  where a.id = v_campaign.creator_account_id;

  if v_campaign.creator_account_id <> v_account_id then
    raise exception using message = 'Only the campaign creator can edit this campaign';
  end if;

  if v_campaign.moderation_status not in ('pending', 'awaiting_adaptation') then
    raise exception using message = 'Campaign can only be edited while pending or awaiting adaptation';
  end if;

  perform app_private.validate_campaign_dates(p_start_at, p_airdrop_at, p_end_at);

  v_previous_status := v_campaign.moderation_status;

  update app_public.campaign
  set
    title = p_title,
    theme = p_theme,
    manager_note_from_creator = p_manager_note_from_creator,
    rewards_multiplier = p_rewards_multiplier,
    airdrop_amount = p_airdrop_amount,
    start_at = p_start_at,
    airdrop_at = p_airdrop_at,
    end_at = p_end_at,
    image_url = v_image_url
  where id = p_campaign_id
  returning * into v_campaign;

  insert into app_public.campaign_moderation_event (
    campaign_id,
    actor_account_id,
    event_type,
    body
  )
  values (
    v_campaign.id,
    v_account_id,
    'campaign_modified_by_creator',
    coalesce(nullif(trim(p_manager_note_from_creator), ''), 'Campaign updated by creator')
  );

  if v_previous_status = 'awaiting_adaptation' then
    for v_admin in
      select ac.account_id
      from app_private.account_credential ac
      where ac.role_name = 'admin'
        and ac.account_id <> v_account_id
    loop
      perform app_private.create_account_notification(
        v_admin.account_id,
        'campaign_creator_adaptation_submitted',
        jsonb_build_object(
          'campaignId', v_campaign.id,
          'campaignName', v_campaign.title,
          'creatorName', coalesce(v_creator_name, '')
        )
      );
    end loop;
  end if;

  return v_campaign;
end;
$$;

grant execute on function app_public.update_campaign_for_moderation(
  uuid,
  text,
  text,
  text,
  integer,
  integer,
  timestamptz,
  timestamptz,
  timestamptz,
  text
) to identified_account, admin;

revoke all on function app_public.update_campaign_for_moderation(
  uuid,
  text,
  text,
  text,
  integer,
  integer,
  timestamptz,
  timestamptz,
  timestamptz,
  text
) from public;

comment on function app_public.update_campaign_for_moderation(
  uuid,
  text,
  text,
  text,
  integer,
  integer,
  timestamptz,
  timestamptz,
  timestamptz,
  text
) is '@name updateCampaignForModeration';
