begin;

alter table app_public.account
  add column if not exists bio text,
  add column if not exists location text,
  add column if not exists avatar_url text,
  add column if not exists profile_links jsonb not null default '[]'::jsonb;

alter table app_public.resource
  add column if not exists image_urls text[] not null default array[]::text[];

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

update app_public.account
set profile_links = app_private.normalize_profile_links(coalesce(profile_links, '[]'::jsonb));

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

drop trigger if exists trg_account_set_updated_at on app_public.account;
create trigger trg_account_set_updated_at
  before update on app_public.account
  for each row
  execute function app_private.set_updated_at();

drop trigger if exists trg_account_normalize_profile_fields on app_public.account;
create trigger trg_account_normalize_profile_fields
  before insert or update on app_public.account
  for each row
  execute function app_private.normalize_account_profile_fields();

drop trigger if exists trg_account_profile_milestone_rewards on app_public.account;
create trigger trg_account_profile_milestone_rewards
  after insert or update on app_public.account
  for each row
  execute function app_private.issue_account_profile_milestone_rewards();

drop trigger if exists trg_resource_normalize_media_fields on app_public.resource;
create trigger trg_resource_normalize_media_fields
  before insert or update on app_public.resource
  for each row
  execute function app_private.normalize_resource_media_fields();

drop trigger if exists trg_resource_milestone_rewards on app_public.resource;
create trigger trg_resource_milestone_rewards
  after insert or update on app_public.resource
  for each row
  execute function app_private.issue_resource_milestone_rewards();

drop function if exists app_private.find_login_candidate(text);
drop function if exists app_private.find_account_session(text);

create or replace function app_private.find_login_candidate(p_identifier text)
returns table (
  account_id uuid,
  display_name text,
  external_subject text,
  avatar_url text,
  password_hash text,
  role_name text
)
language sql
stable
as $$
  select
    a.id,
    a.display_name,
    a.external_subject,
    a.avatar_url,
    c.password_hash,
    c.role_name
  from app_private.account_credential c
  join app_public.account a on a.id = c.account_id
  where lower(c.login_identifier) = lower(p_identifier)
    and c.is_active = true
  limit 1
$$;

create or replace function app_private.find_account_session(p_session_token_hash text)
returns table (
  session_id uuid,
  account_id uuid,
  role_name text,
  expires_at timestamptz,
  display_name text,
  external_subject text,
  avatar_url text
)
language sql
stable
as $$
  select
    s.id,
    s.account_id,
    s.role_name,
    s.expires_at,
    a.display_name,
    a.external_subject,
    a.avatar_url
  from app_private.account_session s
  join app_public.account a on a.id = s.account_id
  where s.session_token_hash = p_session_token_hash
    and s.revoked_at is null
    and s.expires_at > now()
  limit 1
$$;

drop function if exists app_public.publish_resource(
  text,
  text,
  text,
  numeric,
  numeric,
  app_public.need_intensity,
  integer,
  integer[],
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  timestamptz
);

drop function if exists app_public.publish_resource(
  text,
  text,
  text,
  numeric,
  numeric,
  app_public.need_intensity,
  integer,
  integer[],
  text[],
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  timestamptz
);

create or replace function app_public.publish_resource(
  title text,
  description text default null,
  location text default null,
  latitude numeric default 50.6072,
  longitude numeric default 3.3889,
  intensity app_public.need_intensity default 'sharing',
  default_token_amount integer default null,
  category_codes integer[] default array[]::integer[],
  image_urls text[] default array[]::text[],
  is_product boolean default false,
  is_service boolean default false,
  can_be_given boolean default false,
  can_be_exchanged boolean default false,
  can_be_taken_away boolean default false,
  can_be_delivered boolean default false,
  expires_at timestamptz default null
)
returns app_public.resource
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_title text;
  v_description text;
  v_location text;
  v_category_codes integer[];
  v_image_urls text[];
  v_resource app_public.resource;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  v_title := nullif(btrim(coalesce(publish_resource.title, '')), '');
  v_description := nullif(btrim(coalesce(publish_resource.description, '')), '');
  v_location := nullif(btrim(coalesce(publish_resource.location, '')), '');
  v_image_urls := app_private.normalize_text_array(publish_resource.image_urls);

  if v_title is null then
    raise exception using message = 'Resource title is required';
  end if;

  if v_location is null then
    raise exception using message = 'Resource location is required';
  end if;

  if v_description is not null and char_length(v_description) > 8000 then
    raise exception using message = 'Resource description must be 8000 characters or fewer';
  end if;

  if publish_resource.expires_at is not null and publish_resource.expires_at <= now() then
    raise exception using message = 'Resource expiration must be in the future';
  end if;

  if not coalesce(publish_resource.is_product, false) and not coalesce(publish_resource.is_service, false) then
    raise exception using message = 'Resource must be marked as a product, a service, or both';
  end if;

  perform app_private.validate_topes_amount(
    publish_resource.intensity::text,
    publish_resource.default_token_amount
  );

  select coalesce(array_agg(distinct requested_code order by requested_code), '{}'::integer[])
  into v_category_codes
  from unnest(coalesce(publish_resource.category_codes, array[]::integer[])) as requested_code
  where requested_code is not null;

  if exists (
    select 1
    from unnest(v_category_codes) as requested_code
    left join app_public.resource_category rc
      on rc.code = requested_code
     and rc.is_active
    where rc.code is null
  ) then
    raise exception using message = 'One or more resource categories are invalid';
  end if;

  insert into app_public.resource (
    creator_account_id,
    title,
    description,
    location,
    latitude,
    longitude,
    intensity,
    default_token_amount,
    image_urls,
    is_product,
    is_service,
    can_be_given,
    can_be_exchanged,
    can_be_taken_away,
    can_be_delivered,
    expires_at
  )
  values (
    v_account_id,
    v_title,
    v_description,
    v_location,
    coalesce(publish_resource.latitude, 50.6072),
    coalesce(publish_resource.longitude, 3.3889),
    publish_resource.intensity,
    publish_resource.default_token_amount,
    v_image_urls,
    coalesce(publish_resource.is_product, false),
    coalesce(publish_resource.is_service, false),
    coalesce(publish_resource.can_be_given, false),
    coalesce(publish_resource.can_be_exchanged, false),
    coalesce(publish_resource.can_be_taken_away, false),
    coalesce(publish_resource.can_be_delivered, false),
    publish_resource.expires_at
  )
  returning * into v_resource;

  insert into app_public.resource_category_assignment (resource_id, category_code)
  select v_resource.id, requested_code
  from unnest(v_category_codes) as requested_code
  on conflict do nothing;

  return v_resource;
end;
$$;

comment on function app_public.publish_resource(
  text,
  text,
  text,
  numeric,
  numeric,
  app_public.need_intensity,
  integer,
  integer[],
  text[],
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  timestamptz
) is '@name publishResource';

grant execute on function app_public.publish_resource(
  text,
  text,
  text,
  numeric,
  numeric,
  app_public.need_intensity,
  integer,
  integer[],
  text[],
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  boolean,
  timestamptz
) to anonymous, identified_account, manager, admin;

commit;
