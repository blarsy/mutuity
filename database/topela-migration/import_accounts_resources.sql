begin;

-- One-shot import from legacy Tope-la schema (sb.*) into Mutuity.
-- Intended for an empty Mutuity database.

select pg_advisory_xact_lock(hashtext('topela_accounts_resources_import_v1'));

create extension if not exists dblink;

-- Safety gates: this importer is only meant for a fresh target database.
do $$
begin
  if exists (select 1 from app_public.account) then
    raise exception 'Target app_public.account is not empty. Aborting migration.';
  end if;

  if exists (select 1 from app_public.resource) then
    raise exception 'Target app_public.resource is not empty. Aborting migration.';
  end if;
end;
$$;

-- Pull legacy tables into temporary staging tables.
create temporary table src_accounts_public_data (
  id uuid,
  name text,
  bio text,
  avatar_image_id uuid,
  location_id uuid
) on commit drop;

insert into src_accounts_public_data
select *
from dblink(
  :'source_db_url',
  $$
    select id, name, bio, avatar_image_id, location_id
    from sb.accounts_public_data
  $$
) as t(id uuid, name text, bio text, avatar_image_id uuid, location_id uuid);

create temporary table src_accounts_private_data (
  account_id uuid,
  email text,
  hash text,
  salt text,
  created timestamptz,
  activated timestamptz,
  amount_of_tokens integer,
  language text
) on commit drop;

insert into src_accounts_private_data
select *
from dblink(
  :'source_db_url',
  $$
    select account_id, email, hash, salt, created, activated, amount_of_tokens, language
    from sb.accounts_private_data
  $$
) as t(
  account_id uuid,
  email text,
  hash text,
  salt text,
  created timestamptz,
  activated timestamptz,
  amount_of_tokens integer,
  language text
);

create temporary table src_accounts_links (
  account_id uuid,
  url text,
  label text,
  link_type_id integer,
  created timestamptz
) on commit drop;

insert into src_accounts_links
select *
from dblink(
  :'source_db_url',
  $$
    select account_id, url, label, link_type_id, created
    from sb.accounts_links
  $$
) as t(account_id uuid, url text, label text, link_type_id integer, created timestamptz);

create temporary table src_link_types (
  id integer,
  name text
) on commit drop;

insert into src_link_types
select *
from dblink(
  :'source_db_url',
  $$
    select id, name
    from sb.link_types
  $$
) as t(id integer, name text);

create temporary table src_locations (
  id uuid,
  address text,
  latitude numeric,
  longitude numeric
) on commit drop;

insert into src_locations
select *
from dblink(
  :'source_db_url',
  $$
    select id, address, latitude, longitude
    from sb.locations
  $$
) as t(id uuid, address text, latitude numeric, longitude numeric);

create temporary table src_images (
  id uuid,
  public_id text
) on commit drop;

insert into src_images
select *
from dblink(
  :'source_db_url',
  $$
    select id, public_id
    from sb.images
  $$
) as t(id uuid, public_id text);

create temporary table src_resources (
  id uuid,
  title text,
  description text,
  expiration timestamptz,
  created timestamptz,
  is_service boolean,
  is_product boolean,
  can_be_delivered boolean,
  can_be_taken_away boolean,
  can_be_exchanged boolean,
  can_be_gifted boolean,
  deleted timestamptz,
  price integer,
  account_id uuid,
  specific_location_id uuid
) on commit drop;

insert into src_resources
select *
from dblink(
  :'source_db_url',
  $$
    select id, title, description, expiration, created, is_service, is_product,
           can_be_delivered, can_be_taken_away, can_be_exchanged, can_be_gifted,
           deleted, price, account_id, specific_location_id
    from sb.resources
  $$
) as t(
  id uuid,
  title text,
  description text,
  expiration timestamptz,
  created timestamptz,
  is_service boolean,
  is_product boolean,
  can_be_delivered boolean,
  can_be_taken_away boolean,
  can_be_exchanged boolean,
  can_be_gifted boolean,
  deleted timestamptz,
  price integer,
  account_id uuid,
  specific_location_id uuid
);

create temporary table src_resources_images (
  resource_id uuid,
  image_id uuid,
  created timestamptz
) on commit drop;

insert into src_resources_images
select *
from dblink(
  :'source_db_url',
  $$
    select resource_id, image_id, created
    from sb.resources_images
  $$
) as t(resource_id uuid, image_id uuid, created timestamptz);

create temporary table src_resources_resource_categories (
  resource_id uuid,
  resource_category_code integer,
  created timestamptz
) on commit drop;

insert into src_resources_resource_categories
select *
from dblink(
  :'source_db_url',
  $$
    select resource_id, resource_category_code, created
    from sb.resources_resource_categories
  $$
) as t(resource_id uuid, resource_category_code integer, created timestamptz);

create temporary table src_broadcast_prefs (
  account_id uuid,
  event_type integer,
  days_between_summaries integer
) on commit drop;

insert into src_broadcast_prefs
select *
from dblink(
  :'source_db_url',
  $$
    select account_id, event_type, days_between_summaries
    from sb.broadcast_prefs
  $$
) as t(account_id uuid, event_type integer, days_between_summaries integer);

-- Build reusable account staging with normalized profile links.
create temporary table stg_accounts on commit drop as
select
  apr.account_id,
  lower(btrim(apr.email)) as email,
  nullif(btrim(apu.name), '') as display_name,
  nullif(btrim(apu.bio), '') as bio,
  nullif(btrim(loc.address), '') as location,
  loc.latitude,
  loc.longitude,
  case
    when img.public_id is null or btrim(img.public_id) = '' then null
    else :'cloudinary_base_url' || btrim(img.public_id)
  end as avatar_url,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'url', btrim(al.url),
          'label', coalesce(nullif(btrim(al.label), ''), initcap(mapped.link_type)),
          'type', mapped.link_type
        )
        order by al.created, al.url
      )
      from src_accounts_links al
      left join src_link_types lt
        on lt.id = al.link_type_id
      cross join lateral (
        select case
          when lower(coalesce(lt.name, '')) in ('facebook', 'instagram', 'x', 'website') then lower(lt.name)
          when lower(coalesce(lt.name, '')) in ('twitter', 'twitter/x') then 'x'
          else 'website'
        end as link_type
      ) mapped
      where al.account_id = apr.account_id
        and nullif(btrim(al.url), '') is not null
    ),
    '[]'::jsonb
  ) as profile_links,
  case
    when lower(coalesce(apr.language, '')) in ('en', 'fr') then lower(apr.language)
    else 'en'
  end as preferred_language,
  apr.hash as legacy_hash,
  apr.salt as legacy_salt,
  apr.activated,
  coalesce(apr.amount_of_tokens, 0) as amount_of_tokens,
  coalesce(apr.created, now()) as created_at
from src_accounts_private_data apr
join src_accounts_public_data apu
  on apu.id = apr.account_id
left join src_locations loc
  on loc.id = apu.location_id
left join src_images img
  on img.id = apu.avatar_image_id
where nullif(lower(btrim(apr.email)), '') is not null
  and nullif(btrim(apu.name), '') is not null;

-- Import accounts.
insert into app_public.account (
  id,
  external_subject,
  display_name,
  bio,
  location,
  latitude,
  longitude,
  avatar_url,
  profile_links,
  preferred_language,
  created_at,
  updated_at
)
select
  s.account_id,
  s.email,
  s.display_name,
  s.bio,
  s.location,
  s.latitude,
  s.longitude,
  s.avatar_url,
  s.profile_links,
  s.preferred_language,
  s.created_at,
  s.created_at
from stg_accounts s;

-- Import credentials.
-- Legacy Tope-la hashes were generated with pgcrypto crypt(..., gen_salt('md5')).
-- Mutuity verifies passwords with bcryptjs, so non-bcrypt hashes are replaced with
-- random bcrypt hashes and users reset password using email recovery.
insert into app_private.account_credential (
  account_id,
  login_identifier,
  password_hash,
  role_name,
  is_active,
  created_at,
  updated_at,
  email_verified_at
)
select
  s.account_id,
  s.email,
  case
    when coalesce(s.legacy_hash, '') like '$2%' then s.legacy_hash
    else app_private.hash_local_password(gen_random_uuid()::text)
  end as password_hash,
  'identified_account',
  true,
  s.created_at,
  s.created_at,
  now()
from stg_accounts s;

-- Import local identity links.
insert into app_private.account_identity (
  account_id,
  provider,
  provider_subject,
  provider_email,
  provider_email_normalized,
  provider_email_verified,
  metadata,
  linked_at,
  created_at,
  updated_at
)
select
  s.account_id,
  'local',
  s.email,
  s.email,
  s.email,
  true,
  jsonb_build_object(
    'legacyMigration', true,
    'legacyHashKind', 'pgcrypto_crypt_md5',
    'legacySaltPresent', s.legacy_salt is not null,
    'bcryptCompatibleHashCopied', coalesce(s.legacy_hash, '') like '$2%'
  ),
  s.created_at,
  s.created_at,
  s.created_at
from stg_accounts s
on conflict (provider, provider_subject) do nothing;

-- Import opening token balance.
select app_private.create_token_movement(
  s.account_id,
  s.amount_of_tokens,
  'legacy_opening_balance',
  'account',
  s.account_id,
  null,
  jsonb_build_object(
    'source', 'topela',
    'kind', 'one_time_migration'
  ),
  'legacy-opening-balance:' || s.account_id::text
)
from stg_accounts s
where s.amount_of_tokens <> 0;

-- Build resource staging with image URL arrays and category arrays.
create temporary table stg_resource_image_urls on commit drop as
select
  ri.resource_id,
  coalesce(
    array_agg(
      :'cloudinary_base_url' || btrim(i.public_id)
      order by ri.created, i.public_id
    ) filter (where nullif(btrim(i.public_id), '') is not null),
    array[]::text[]
  ) as image_urls
from src_resources_images ri
join src_images i
  on i.id = ri.image_id
group by ri.resource_id;

create temporary table stg_resource_category_codes on commit drop as
select
  rrc.resource_id,
  array_agg(distinct rrc.resource_category_code order by rrc.resource_category_code) as category_codes
from src_resources_resource_categories rrc
group by rrc.resource_id;

create temporary table stg_resources on commit drop as
select
  r.id,
  r.account_id,
  nullif(btrim(r.title), '') as title,
  nullif(btrim(r.description), '') as description,
  nullif(btrim(loc.address), '') as location,
  loc.latitude,
  loc.longitude,
  r.created,
  r.expiration,
  r.deleted,
  r.is_service,
  r.is_product,
  r.can_be_delivered,
  r.can_be_taken_away,
  r.can_be_exchanged,
  r.can_be_gifted,
  -- Set default_token_amount and intensity to match the constraint exactly
  case
    when r.price is null or r.price <= 0 then null
    else r.price
  end as default_token_amount,
  case
    when r.price is null or r.price <= 0 then 'sharing'::app_public.need_intensity
    when r.price between 1 and 99 then 'leg_up'::app_public.need_intensity
    when r.price between 100 and 999 then 'sharing'::app_public.need_intensity
    when r.price between 1000 and 4999 then 'commitment'::app_public.need_intensity
    else 'rare_contribution'::app_public.need_intensity
  end as intensity,
  coalesce(imgs.image_urls, array[]::text[]) as image_urls,
  coalesce(cats.category_codes, array[]::integer[]) as category_codes
from src_resources r
left join src_locations loc
  on loc.id = r.specific_location_id
left join stg_resource_image_urls imgs
  on imgs.resource_id = r.id
left join stg_resource_category_codes cats
  on cats.resource_id = r.id
where r.account_id in (select account_id from stg_accounts);


-- Hard fail on orphaned resources, but print their IDs first.
do $$
declare
  v_orphan_count integer;
  orphan_rec record;
begin
  select count(*)
  into v_orphan_count
  from stg_resources r
  left join stg_accounts a
    on a.account_id = r.account_id
  where a.account_id is null;

  if v_orphan_count > 0 then
    raise notice 'Orphaned resource IDs:';
    for orphan_rec in
      select r.id, r.title, r.account_id
      from stg_resources r
      left join stg_accounts a on a.account_id = r.account_id
      where a.account_id is null
    loop
      raise notice '  id: %, title: %, owner_account_id: %', orphan_rec.id, orphan_rec.title, orphan_rec.account_id;
    end loop;
    raise exception 'Found % orphaned resources (owner account missing). Aborting migration.', v_orphan_count;
  end if;
end;
$$;

-- Hard fail if any resource category code is unknown/inactive in target.
do $$
declare
  v_missing_category_count integer;
begin
  select count(*)
  into v_missing_category_count
  from src_resources_resource_categories src
  left join app_public.resource_category dst
    on dst.code = src.resource_category_code
   and dst.is_active = true
  where dst.code is null;

  if v_missing_category_count > 0 then
    raise exception 'Found % resource-category mappings without active target category. Aborting migration.', v_missing_category_count;
  end if;
end;
$$;

-- Import resources.
insert into app_public.resource (
  id,
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
  is_active,
  expires_at,
  created_at,
  updated_at
)
select
  r.id,
  r.account_id,
  r.title,
  r.description,
  r.location,
  r.latitude,
  r.longitude,
  r.intensity,
  r.default_token_amount,
  r.image_urls,
  coalesce(r.is_product, false),
  coalesce(r.is_service, false),
  coalesce(r.can_be_gifted, false),
  coalesce(r.can_be_exchanged, false),
  coalesce(r.can_be_taken_away, false),
  coalesce(r.can_be_delivered, false),
  r.deleted is null,
  r.expiration,
  coalesce(r.created, now()),
  coalesce(r.deleted, r.created, now())
from stg_resources r;

-- Import resource-category assignments.
insert into app_public.resource_category_assignment (
  resource_id,
  category_code,
  created_at
)
select
  src.resource_id,
  src.resource_category_code,
  coalesce(src.created, now())
from src_resources_resource_categories src
join app_public.resource r
  on r.id = src.resource_id
join app_public.resource_category c
  on c.code = src.resource_category_code
 and c.is_active = true
on conflict do nothing;

-- Import broadcast preferences where a direct mapping exists.
-- Legacy mapping used in Tope-la internals:
-- 1 => message push
-- 2 => new resource summaries
-- 3 => general notification summaries
insert into app_public.account_delivery_preference (
  account_id,
  event_category,
  delivery_strategy,
  summary_frequency_days,
  created_at,
  updated_at
)
select
  bp.account_id,
  case bp.event_type
    when 1 then 'new_chat_message_received'
    when 2 then 'new_resource_added'
    when 3 then 'unread_notifications'
  end as event_category,
  case
    when bp.days_between_summaries is null then 'realtime_push'
    else 'email_summary'
  end as delivery_strategy,
  case
    when bp.days_between_summaries is null then 1
    when bp.days_between_summaries <= 1 then 1
    when bp.days_between_summaries <= 3 then 3
    when bp.days_between_summaries <= 7 then 7
    else 30
  end as summary_frequency_days,
  now(),
  now()
from src_broadcast_prefs bp
where bp.event_type in (1, 2, 3)
  and bp.account_id in (select account_id from stg_accounts)
on conflict (account_id, event_category)
do update
set delivery_strategy = excluded.delivery_strategy,
    summary_frequency_days = excluded.summary_frequency_days,
    updated_at = now();

-- Summary output for manual verification.
do $$
declare
  v_accounts integer;
  v_resources integer;
  v_categories integer;
begin
  select count(*) into v_accounts from app_public.account;
  select count(*) into v_resources from app_public.resource;
  select count(*) into v_categories from app_public.resource_category_assignment;

  raise notice 'Topela migration summary: % accounts, % resources, % category links', v_accounts, v_resources, v_categories;
end;
$$;

commit;
