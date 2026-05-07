create or replace function app_public.add_campaign_moderation_note(
  campaign_id uuid,
  body text
)
returns app_public.campaign_moderation_note
language plpgsql
as $$
declare
  v_note app_public.campaign_moderation_note;
  v_manager_account_id uuid;
  v_campaign_status app_public.campaign_moderation_status;
begin
  if not app_private.is_admin() then
    raise exception using message = 'Only admins can add moderation notes';
  end if;

  v_manager_account_id := app_private.current_account_id();

  if v_manager_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  select moderation_status
  into v_campaign_status
  from app_public.campaign
  where id = add_campaign_moderation_note.campaign_id;

  if v_campaign_status is null then
    raise exception using message = 'Campaign not found';
  end if;

  if v_campaign_status <> 'pending' then
    raise exception using message = 'Moderation notes are allowed only for pending campaigns';
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
    v_manager_account_id,
    trim(add_campaign_moderation_note.body)
  )
  returning * into v_note;

  return v_note;
end;
$$;

comment on function app_public.add_campaign_moderation_note(uuid, text)
  is '@name addCampaignModerationNote';
