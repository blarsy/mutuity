begin;

create or replace function app_private.validate_campaign_linkability(p_campaign_id uuid)
returns void
language plpgsql
as $$
declare
  v_is_linkable boolean;
begin
  if p_campaign_id is null then
    return;
  end if;

  select exists (
    select 1
    from app_public.campaign c
    where c.id = p_campaign_id
      and c.moderation_status = 'approved'
      and c.start_at <= now()
      and c.end_at >= now()
  )
  into v_is_linkable;

  if not v_is_linkable then
    raise exception using message = 'Campaign is not eligible for need linking';
  end if;
end;
$$;

grant execute on function app_private.validate_campaign_linkability(uuid)
  to identified_account, manager, admin;

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
  expires_at timestamptz default null
)
returns app_public.need
language plpgsql
as $$
declare
  v_account_id uuid;
  v_account_latitude numeric;
  v_account_longitude numeric;
  v_need app_public.need;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  perform app_private.validate_topes_amount(create_need.intensity::text, create_need.proposed_topes_amount);
  perform app_private.validate_people_count(create_need.multiple_people_required, create_need.required_people_count);
  perform app_private.validate_campaign_linkability(create_need.campaign_id);

  select a.latitude, a.longitude
  into v_account_latitude, v_account_longitude
  from app_public.account a
  where a.id = v_account_id;

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
    is_active,
    expires_at
  )
  values (
    v_account_id,
    nullif(btrim(create_need.title), ''),
    nullif(btrim(create_need.description), ''),
    nullif(btrim(create_need.location), ''),
    coalesce(create_need.latitude, v_account_latitude, 50.6072),
    coalesce(create_need.longitude, v_account_longitude, 3.3889),
    create_need.intensity,
    create_need.proposed_topes_amount,
    create_need.object_required,
    create_need.competence_required,
    create_need.tooling_required,
    create_need.multiple_people_required,
    nullif(btrim(create_need.required_competence_text), ''),
    nullif(btrim(create_need.required_tooling_text), ''),
    create_need.required_people_count,
    true,
    create_need.expires_at
  )
  returning * into v_need;

  if create_need.campaign_id is not null then
    insert into app_public.campaign_need (
      campaign_id,
      need_id,
      status,
      acted_by_account_id,
      acted_at
    )
    values (
      create_need.campaign_id,
      v_need.id,
      'pending',
      null,
      null
    );
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
  timestamptz
) to identified_account, manager, admin;

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
  timestamptz
) is '@name createNeed';

commit;
