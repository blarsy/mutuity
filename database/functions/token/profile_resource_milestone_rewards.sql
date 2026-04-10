create or replace function app_private.normalize_text_array(p_values text[])
returns text[]
language sql
immutable
as $$
  select coalesce(array_agg(value order by ordinality), array[]::text[])
  from (
    select nullif(btrim(item), '') as value, ordinality
    from unnest(coalesce(p_values, array[]::text[])) with ordinality as t(item, ordinality)
  ) normalized
  where value is not null
$$;

create or replace function app_private.normalize_profile_links(p_links jsonb)
returns jsonb
language plpgsql
immutable
as $$
declare
  v_link jsonb;
  v_url text;
  v_label text;
  v_type text;
  v_result jsonb := '[]'::jsonb;
begin
  if p_links is null or p_links = 'null'::jsonb then
    return '[]'::jsonb;
  end if;

  if jsonb_typeof(p_links) <> 'array' then
    raise exception using message = 'Profile links must be an array';
  end if;

  for v_link in
    select value
    from jsonb_array_elements(p_links)
  loop
    if jsonb_typeof(v_link) <> 'object' then
      raise exception using message = 'Each profile link must be an object';
    end if;

    v_url := nullif(btrim(coalesce(v_link ->> 'url', '')), '');
    v_label := nullif(btrim(coalesce(v_link ->> 'label', '')), '');
    v_type := lower(nullif(btrim(coalesce(v_link ->> 'type', '')), ''));

    if v_url is null then
      continue;
    end if;

    if v_type is null then
      v_type := 'website';
    end if;

    if v_type not in ('facebook', 'instagram', 'x', 'website') then
      raise exception using message = 'Profile link type must be one of facebook, instagram, x, or website';
    end if;

    v_result := v_result || jsonb_build_array(
      jsonb_build_object(
        'url', v_url,
        'label', coalesce(v_label, initcap(v_type)),
        'type', v_type
      )
    );
  end loop;

  return v_result;
end;
$$;

create or replace function app_private.normalize_account_profile_fields()
returns trigger
language plpgsql
as $$
begin
  new.display_name := nullif(btrim(coalesce(new.display_name, '')), '');
  new.bio := nullif(btrim(coalesce(new.bio, '')), '');
  new.location := nullif(btrim(coalesce(new.location, '')), '');
  new.avatar_url := nullif(btrim(coalesce(new.avatar_url, '')), '');
  new.profile_links := app_private.normalize_profile_links(coalesce(new.profile_links, '[]'::jsonb));
  return new;
end;
$$;

create or replace function app_private.normalize_resource_media_fields()
returns trigger
language plpgsql
as $$
begin
  new.image_urls := app_private.normalize_text_array(new.image_urls);
  return new;
end;
$$;

create or replace function app_private.issue_account_profile_milestone_rewards()
returns trigger
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_previous_avatar_url text;
  v_current_avatar_url text := nullif(btrim(coalesce(new.avatar_url, '')), '');
  v_previous_bio text;
  v_current_bio text := nullif(btrim(coalesce(new.bio, '')), '');
  v_previous_location text;
  v_current_location text := nullif(btrim(coalesce(new.location, '')), '');
  v_previous_link_count integer := 0;
  v_current_link_count integer := coalesce(jsonb_array_length(coalesce(new.profile_links, '[]'::jsonb)), 0);
  v_awarded_any boolean := false;
begin
  if tg_op = 'INSERT' then
    v_previous_avatar_url := null;
    v_previous_bio := null;
    v_previous_location := null;
    v_previous_link_count := 0;
  else
    v_previous_avatar_url := nullif(btrim(coalesce(old.avatar_url, '')), '');
    v_previous_bio := nullif(btrim(coalesce(old.bio, '')), '');
    v_previous_location := nullif(btrim(coalesce(old.location, '')), '');
    v_previous_link_count := coalesce(jsonb_array_length(coalesce(old.profile_links, '[]'::jsonb)), 0);
  end if;

  if v_previous_avatar_url is null and v_current_avatar_url is not null then
    perform app_private.create_token_movement(
      new.id,
      20,
      'profile_first_avatar_reward',
      'account',
      new.id,
      null,
      jsonb_build_object(
        'accountId', new.id,
        'fieldName', 'avatarUrl',
        'rewardType', 'profile_completion'
      ),
      format('account:%s:profile:first-avatar', new.id)
    );
    v_awarded_any := true;
  end if;

  if v_previous_bio is null and v_current_bio is not null then
    perform app_private.create_token_movement(
      new.id,
      20,
      'profile_first_bio_reward',
      'account',
      new.id,
      null,
      jsonb_build_object(
        'accountId', new.id,
        'fieldName', 'bio',
        'rewardType', 'profile_completion'
      ),
      format('account:%s:profile:first-bio', new.id)
    );
    v_awarded_any := true;
  end if;

  if v_previous_location is null and v_current_location is not null then
    perform app_private.create_token_movement(
      new.id,
      20,
      'profile_first_location_reward',
      'account',
      new.id,
      null,
      jsonb_build_object(
        'accountId', new.id,
        'fieldName', 'location',
        'rewardType', 'profile_completion'
      ),
      format('account:%s:profile:first-location', new.id)
    );
    v_awarded_any := true;
  end if;

  if v_previous_link_count = 0 and v_current_link_count > 0 then
    perform app_private.create_token_movement(
      new.id,
      20,
      'profile_first_link_reward',
      'account',
      new.id,
      null,
      jsonb_build_object(
        'accountId', new.id,
        'fieldName', 'profileLinks',
        'rewardType', 'profile_completion',
        'linkCount', v_current_link_count
      ),
      format('account:%s:profile:first-link', new.id)
    );
    v_awarded_any := true;
  end if;

  if v_awarded_any and not exists (
    select 1
    from app_public.account_notification an
    where an.recipient_account_id = new.id
      and an.event_type = 'welcome_profile_reward'
  ) then
    perform app_private.create_account_notification(
      new.id,
      'welcome_profile_reward',
      jsonb_build_object(
        'accountId', new.id,
        'url', '/profile'
      )
    );
  end if;

  return new;
end;
$$;

create or replace function app_private.issue_resource_milestone_rewards()
returns trigger
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_previous_image_count integer;
  v_current_image_count integer := coalesce(array_length(coalesce(new.image_urls, array[]::text[]), 1), 0);
  v_previous_default_token_amount integer;
  v_current_default_token_amount integer := new.default_token_amount;
begin
  if tg_op = 'INSERT' then
    v_previous_image_count := 0;
    v_previous_default_token_amount := null;
  else
    v_previous_image_count := coalesce(array_length(coalesce(old.image_urls, array[]::text[]), 1), 0);
    v_previous_default_token_amount := old.default_token_amount;
  end if;

  if v_previous_image_count = 0 and v_current_image_count > 0 then
    perform app_private.create_token_movement(
      new.creator_account_id,
      20,
      'resource_first_image_reward',
      'resource',
      new.id,
      null,
      jsonb_build_object(
        'resourceId', new.id,
        'resourceName', new.title,
        'rewardType', 'resource_image_milestone'
      ),
      format('resource:%s:first-image', new.id)
    );
  end if;

  if v_previous_default_token_amount is null and v_current_default_token_amount is not null then
    perform app_private.create_token_movement(
      new.creator_account_id,
      20,
      'resource_first_default_token_amount_reward',
      'resource',
      new.id,
      null,
      jsonb_build_object(
        'resourceId', new.id,
        'resourceName', new.title,
        'defaultTokenAmount', new.default_token_amount,
        'rewardType', 'resource_default_token_amount_milestone'
      ),
      format('resource:%s:first-default-token-amount', new.id)
    );
  end if;

  return new;
end;
$$;
