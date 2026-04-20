begin;

drop function if exists app_private.touch_resource_updated_at_from_category_assignment();
create or replace function app_private.touch_resource_updated_at_from_category_assignment()
returns trigger
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_resource_id uuid := coalesce(new.resource_id, old.resource_id);
begin
  if v_resource_id is null then
    return coalesce(new, old);
  end if;

  update app_public.resource
  set updated_at = now()
  where id = v_resource_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_resource_category_assignment_touch_resource_updated_at
  on app_public.resource_category_assignment;
create trigger trg_resource_category_assignment_touch_resource_updated_at
  after insert or update or delete on app_public.resource_category_assignment
  for each row
  execute function app_private.touch_resource_updated_at_from_category_assignment();

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
  timestamptz,
  uuid
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
  expires_at timestamptz default null,
  resource_id uuid default null
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

  if publish_resource.resource_id is null then
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
  else
    update app_public.resource r
    set title = v_title,
        description = v_description,
        location = v_location,
        latitude = coalesce(publish_resource.latitude, 50.6072),
        longitude = coalesce(publish_resource.longitude, 3.3889),
        intensity = publish_resource.intensity,
        default_token_amount = publish_resource.default_token_amount,
        image_urls = v_image_urls,
        is_product = coalesce(publish_resource.is_product, false),
        is_service = coalesce(publish_resource.is_service, false),
        can_be_given = coalesce(publish_resource.can_be_given, false),
        can_be_exchanged = coalesce(publish_resource.can_be_exchanged, false),
        can_be_taken_away = coalesce(publish_resource.can_be_taken_away, false),
        can_be_delivered = coalesce(publish_resource.can_be_delivered, false),
        expires_at = publish_resource.expires_at
    where r.id = publish_resource.resource_id
      and (
        r.creator_account_id = v_account_id
        or app_private.is_manager()
      )
    returning * into v_resource;

    if v_resource.id is null then
      raise exception using message = 'Resource not found or not editable by current account';
    end if;

    delete from app_public.resource_category_assignment rca
    where rca.resource_id = v_resource.id
      and not (rca.category_code = any (v_category_codes));
  end if;

  insert into app_public.resource_category_assignment (resource_id, category_code)
  select v_resource.id, requested_code
  from unnest(v_category_codes) as requested_code
  on conflict do nothing;

  select r.*
  into v_resource
  from app_public.resource r
  where r.id = v_resource.id;

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
  timestamptz,
  uuid
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
  timestamptz,
  uuid
) to anonymous, identified_account, manager, admin;

commit;
