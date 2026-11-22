begin;

-- No historical coordinates are rewritten: existing fallback values cannot be
-- distinguished reliably from coordinates deliberately provided by users.
alter table app_public.need
  alter column location drop not null,
  alter column latitude drop not null,
  alter column longitude drop not null,
  alter column latitude drop default,
  alter column longitude drop default;

-- PostGraphile exposes Need.location, latitude and longitude as nullable after
-- schema refresh. createNeed keeps its existing optional inputs and signature.
create or replace function app_public.create_need(
  title text,
  description text default null,
  location text default null,
  intensity app_public.need_intensity default 'sharing',
  proposed_topes_amount integer default null,
  object_required boolean default false,
  competence_required boolean default false,
  tooling_required boolean default false,
  multiple_people_required boolean default false,
  required_competence_text text default null,
  required_tooling_text text default null,
  required_people_count integer default null,
  campaign_id uuid default null,
  latitude numeric default null,
  longitude numeric default null,
  image_urls text[] default array[]::text[],
  expires_at timestamptz default null
)
returns app_public.need
language plpgsql
as $$
declare
  v_account_id uuid;
  v_account_latitude numeric;
  v_account_longitude numeric;
  v_location text;
  v_image_urls text[];
  v_need app_public.need;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  perform app_private.validate_topes_amount(create_need.intensity::text, create_need.proposed_topes_amount);
  perform app_private.validate_people_count(create_need.multiple_people_required, create_need.required_people_count);
  perform app_private.validate_campaign_linkability(create_need.campaign_id);

  v_location := nullif(btrim(create_need.location), '');

  -- Keep the historical fallback for addressed needs only. An absent address
  -- must not invent coordinates, while explicitly supplied coordinates survive.
  if v_location is not null then
    select a.latitude, a.longitude
    into v_account_latitude, v_account_longitude
    from app_public.account a
    where a.id = v_account_id;
  end if;

  v_image_urls := app_private.normalize_text_array(create_need.image_urls);

  insert into app_public.need (
    creator_account_id,
    title,
    description,
    location,
    latitude,
    longitude,
    intensity,
    proposed_topes_amount,
    object_required,
    competence_required,
    tooling_required,
    multiple_people_required,
    required_competence_text,
    required_tooling_text,
    required_people_count,
    image_urls,
    is_active,
    expires_at
  )
  values (
    v_account_id,
    nullif(btrim(create_need.title), ''),
    nullif(btrim(create_need.description), ''),
    v_location,
    case when v_location is null then create_need.latitude
      else coalesce(create_need.latitude, v_account_latitude, 50.6072) end,
    case when v_location is null then create_need.longitude
      else coalesce(create_need.longitude, v_account_longitude, 3.3889) end,
    create_need.intensity,
    create_need.proposed_topes_amount,
    create_need.object_required,
    create_need.competence_required,
    create_need.tooling_required,
    create_need.multiple_people_required,
    nullif(btrim(create_need.required_competence_text), ''),
    nullif(btrim(create_need.required_tooling_text), ''),
    create_need.required_people_count,
    v_image_urls,
    true,
    create_need.expires_at
  )
  returning * into v_need;

  if create_need.campaign_id is not null then
    perform app_public.link_campaign_need(create_need.campaign_id, v_need.id);
  end if;

  return v_need;
end;
$$;

grant execute on function app_public.create_need(
  text,
  text,
  text,
  app_public.need_intensity,
  integer,
  boolean,
  boolean,
  boolean,
  boolean,
  text,
  text,
  integer,
  uuid,
  numeric,
  numeric,
  text[],
  timestamptz
) to identified_account, admin;

comment on function app_public.create_need(
  text,
  text,
  text,
  app_public.need_intensity,
  integer,
  boolean,
  boolean,
  boolean,
  boolean,
  text,
  text,
  integer,
  uuid,
  numeric,
  numeric,
  text[],
  timestamptz
) is '@name createNeed';

commit;