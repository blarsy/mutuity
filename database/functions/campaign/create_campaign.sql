create or replace function app_public.create_campaign(
  title text,
  theme text,
  description text,
  manager_note_from_creator text,
  rewards_multiplier integer,
  airdrop_amount integer,
  start_at timestamptz,
  airdrop_at timestamptz,
  end_at timestamptz,
  image_url text
)
returns app_public.campaign
language plpgsql
as $$
declare
  v_account_id uuid;
  v_campaign app_public.campaign;
  v_image_url text;
begin
  v_account_id := app_private.current_account_id();
  v_image_url := nullif(btrim(create_campaign.image_url), '');

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  perform app_private.validate_campaign_dates(start_at, airdrop_at, end_at);

  insert into app_public.campaign (
    creator_account_id,
    title,
    theme,
    description,
    manager_note_from_creator,
    rewards_multiplier,
    airdrop_amount,
    start_at,
    airdrop_at,
    end_at,
    image_url,
    moderation_status
  )
  values (
    v_account_id,
    create_campaign.title,
    create_campaign.theme,
    nullif(btrim(create_campaign.description), ''),
    create_campaign.manager_note_from_creator,
    create_campaign.rewards_multiplier,
    create_campaign.airdrop_amount,
    create_campaign.start_at,
    create_campaign.airdrop_at,
    create_campaign.end_at,
    v_image_url,
    'pending'
  )
  returning * into v_campaign;

  return v_campaign;
end;
$$;

comment on function app_public.create_campaign(
  text,
  text,
  text,
  text,
  integer,
  integer,
  timestamptz,
  timestamptz,
  timestamptz,
  text
) is '@name createCampaign';
