create or replace function app_public.add_campaign_moderation_note(
  campaign_id uuid,
  body text
)
returns app_public.campaign_moderation_note
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_note app_public.campaign_moderation_note;
  v_admin_account_id uuid;
  v_campaign app_public.campaign;
begin
  if not app_private.is_admin() then
    raise exception using message = 'Only administrators can add moderation notes';
  end if;

  v_admin_account_id := app_private.current_account_id();

  if v_admin_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  select *
  into v_campaign
  from app_public.campaign
  where id = add_campaign_moderation_note.campaign_id
  for update;

  if v_campaign.id is null then
    raise exception using message = 'Campaign not found';
  end if;

  if v_campaign.moderation_status = 'approved' then
    raise exception using message = 'Moderation notes are not allowed for approved campaigns';
  end if;

  if length(trim(body)) = 0 then
    raise exception using message = 'Moderation note body is required';
  end if;

  insert into app_public.campaign_moderation_note (
    campaign_id,
    manager_account_id,
    body
  )
  values (
    add_campaign_moderation_note.campaign_id,
    v_admin_account_id,
    trim(add_campaign_moderation_note.body)
  )
  returning * into v_note;

  update app_public.campaign
  set moderation_status = 'awaiting_adaptation'
  where id = v_campaign.id;

  perform app_private.create_account_notification(
    v_campaign.creator_account_id,
    'campaign_moderation_note_received',
    jsonb_build_object(
      'campaignId', v_campaign.id,
      'campaignName', v_campaign.title,
      'noteBody', v_note.body
    )
  );

  return v_note;
end;
$$;

comment on function app_public.add_campaign_moderation_note(uuid, text)
  is '@name addCampaignModerationNote';
