drop function if exists app_public.publish_resource(
  text,
  text,
  text,
  numeric,
  numeric,
  app_public.need_intensity,
  integer,
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
