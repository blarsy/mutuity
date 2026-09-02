begin;

-- One-shot import from legacy Tope-la schema (sb.*) into Mutuity.
-- Intended for an empty Mutuity database.

select pg_advisory_xact_lock(hashtext('topela_accounts_resources_import_v2'));

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

create temporary table src_conversations (
  id uuid,
  resource_id uuid,
  last_message_id uuid,
  created timestamptz
) on commit drop;

insert into src_conversations
select *
from dblink(
  :'source_db_url',
  $$
    select id, resource_id, last_message_id, created
    from sb.conversations
  $$
) as t(id uuid, resource_id uuid, last_message_id uuid, created timestamptz);

create temporary table src_participants (
  id uuid,
  account_id uuid,
  conversation_id uuid,
  created timestamptz
) on commit drop;

insert into src_participants
select *
from dblink(
  :'source_db_url',
  $$
    select id, account_id, conversation_id, created
    from sb.participants
  $$
) as t(id uuid, account_id uuid, conversation_id uuid, created timestamptz);

create temporary table src_messages (
  id uuid,
  participant_id uuid,
  text text,
  received timestamptz,
  created timestamptz,
  image_id uuid
) on commit drop;

insert into src_messages
select *
from dblink(
  :'source_db_url',
  $$
    select id, participant_id, text, received, created, image_id
    from sb.messages
  $$
) as t(id uuid, participant_id uuid, text text, received timestamptz, created timestamptz, image_id uuid);

create temporary table src_unread_messages (
  participant_id uuid,
  message_id uuid,
  created timestamptz
) on commit drop;

insert into src_unread_messages
select *
from dblink(
  :'source_db_url',
  $$
    select participant_id, message_id, created
    from sb.unread_messages
  $$
) as t(participant_id uuid, message_id uuid, created timestamptz);

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
  require_password_reset_on_next_login,
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
  true,
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

-- Build resource-conversation staging. Legacy Tope-la conversations are resource-scoped;
-- Mutuity models them as resource owner plus one bidder/contact account.
create temporary table stg_legacy_conversation_shape on commit drop as
select
  c.id as conversation_id,
  c.resource_id,
  r.creator_account_id as owner_account_id,
  count(distinct p.account_id) as participant_account_count,
  count(distinct p.account_id) filter (where s.account_id is not null) as importable_participant_account_count,
  bool_or(p.account_id = r.creator_account_id) as includes_resource_owner,
  count(distinct p.account_id) filter (where p.account_id <> r.creator_account_id and s.account_id is not null) as importable_non_owner_count
from src_conversations c
join app_public.resource r
  on r.id = c.resource_id
left join src_participants p
  on p.conversation_id = c.id
left join stg_accounts s
  on s.account_id = p.account_id
group by c.id, c.resource_id, r.creator_account_id;

-- Warn on conversations that reference resources not imported into Mutuity.
-- Later staging joins app_public.resource, so these conversations are ignored.
do $$
declare
  v_missing_resource_count integer;
  missing_rec record;
begin
  select count(*)
  into v_missing_resource_count
  from src_conversations c
  left join app_public.resource r
    on r.id = c.resource_id
  where r.id is null;

  if v_missing_resource_count > 0 then
    raise notice 'Conversation IDs with missing target resource:';
    for missing_rec in
      select c.id, c.resource_id
      from src_conversations c
      left join app_public.resource r
        on r.id = c.resource_id
      where r.id is null
    loop
      raise notice '  conversation_id: %, resource_id: %', missing_rec.id, missing_rec.resource_id;
    end loop;
    raise notice 'Found % conversations whose resource was not imported. Ignoring those conversations.', v_missing_resource_count;
  end if;
end;
$$;

-- Warn on legacy conversation shapes Mutuity cannot represent safely.
-- Later staging filters to only import supported two-person resource conversations.
do $$
declare
  v_invalid_shape_count integer;
  invalid_rec record;
begin
  select count(*)
  into v_invalid_shape_count
  from stg_legacy_conversation_shape s
  where s.participant_account_count <> 2
     or s.importable_participant_account_count <> 2
     or s.includes_resource_owner is not true
     or s.importable_non_owner_count <> 1;

  if v_invalid_shape_count > 0 then
    raise notice 'Unsupported legacy conversation shapes:';
    for invalid_rec in
      select *
      from stg_legacy_conversation_shape s
      where s.participant_account_count <> 2
         or s.importable_participant_account_count <> 2
         or s.includes_resource_owner is not true
         or s.importable_non_owner_count <> 1
    loop
      raise notice '  conversation_id: %, resource_id: %, participants: %, importable_participants: %, includes_owner: %, non_owner_count: %',
        invalid_rec.conversation_id,
        invalid_rec.resource_id,
        invalid_rec.participant_account_count,
        invalid_rec.importable_participant_account_count,
        invalid_rec.includes_resource_owner,
        invalid_rec.importable_non_owner_count;
    end loop;
    raise notice 'Found % legacy conversations that cannot map to Mutuity resource conversations. Ignoring those conversations.', v_invalid_shape_count;
  end if;
end;
$$;

create temporary table stg_resource_conversation_pairs on commit drop as
select
  c.id as legacy_conversation_id,
  c.resource_id,
  r.creator_account_id as owner_account_id,
  other_p.account_id as bidder_account_id,
  coalesce(c.created, now()) as created_at
from src_conversations c
join app_public.resource r
  on r.id = c.resource_id
join stg_legacy_conversation_shape shape
  on shape.conversation_id = c.id
 and shape.participant_account_count = 2
 and shape.importable_participant_account_count = 2
 and shape.includes_resource_owner is true
 and shape.importable_non_owner_count = 1
join src_participants other_p
  on other_p.conversation_id = c.id
 and other_p.account_id <> r.creator_account_id
join stg_accounts other_account
  on other_account.account_id = other_p.account_id;

create temporary table stg_resource_conversation_targets on commit drop as
with canonical as (
  select distinct on (p.resource_id, p.owner_account_id, p.bidder_account_id)
    p.resource_id,
    p.owner_account_id,
    p.bidder_account_id,
    p.legacy_conversation_id as target_conversation_id
  from stg_resource_conversation_pairs p
  order by p.resource_id, p.owner_account_id, p.bidder_account_id, p.created_at, p.legacy_conversation_id
), activity as (
  select
    p.resource_id,
    p.owner_account_id,
    p.bidder_account_id,
    min(p.created_at) as created_at,
    max(coalesce(m.created, p.created_at)) as updated_at
  from stg_resource_conversation_pairs p
  left join src_participants participant
    on participant.conversation_id = p.legacy_conversation_id
  left join src_messages m
    on m.participant_id = participant.id
  group by p.resource_id, p.owner_account_id, p.bidder_account_id
)
select
  p.legacy_conversation_id,
  c.target_conversation_id,
  p.resource_id,
  p.owner_account_id,
  p.bidder_account_id,
  a.created_at,
  a.updated_at
from stg_resource_conversation_pairs p
join canonical c
  on c.resource_id = p.resource_id
 and c.owner_account_id = p.owner_account_id
 and c.bidder_account_id = p.bidder_account_id
join activity a
  on a.resource_id = p.resource_id
 and a.owner_account_id = p.owner_account_id
 and a.bidder_account_id = p.bidder_account_id;

-- Remove pre-existing Mutuity resource conversations for the same resource/account pair.
-- This keeps the legacy import authoritative in non-live/test target databases.
delete from app_public.resource_conversation existing
using (
  select distinct target_conversation_id, resource_id, owner_account_id, bidder_account_id
  from stg_resource_conversation_targets
) incoming
where existing.id = incoming.target_conversation_id
   or (
     existing.resource_id = incoming.resource_id
     and existing.owner_account_id = incoming.owner_account_id
     and existing.bidder_account_id = incoming.bidder_account_id
   );

-- Also clear any same-ID test messages/images left outside those conversations.
delete from app_public.resource_message_image existing
using src_messages m
where existing.message_id = m.id;

delete from app_public.resource_message existing
using src_messages m
where existing.id = m.id;

-- Import resource conversations.
insert into app_public.resource_conversation (
  id,
  resource_bid_id,
  resource_id,
  owner_account_id,
  bidder_account_id,
  created_at,
  updated_at
)
select distinct on (target_conversation_id)
  target_conversation_id,
  null,
  resource_id,
  owner_account_id,
  bidder_account_id,
  created_at,
  coalesce(updated_at, created_at)
from stg_resource_conversation_targets
order by target_conversation_id;

do $$
begin
  if exists (
    select 1
    from pg_trigger
    where tgrelid = 'app_public.resource_message'::regclass
      and tgname = 'trg_resource_message_account_events'
      and not tgisinternal
  ) then
    alter table app_public.resource_message disable trigger trg_resource_message_account_events;
  end if;

  if exists (
    select 1
    from pg_trigger
    where tgrelid = 'app_public.resource_message'::regclass
      and tgname = 'trg_resource_message_inbox_notifications'
      and not tgisinternal
  ) then
    alter table app_public.resource_message disable trigger trg_resource_message_inbox_notifications;
  end if;
end;
$$;

-- Import resource messages. Tope-la stores unread state separately; Mutuity stores
-- a nullable read_at timestamp on the message, which maps cleanly for two-person threads.
insert into app_public.resource_message (
  id,
  conversation_id,
  sender_account_id,
  body,
  created_at,
  read_at
)
select
  m.id,
  t.target_conversation_id,
  sender.account_id,
  coalesce(nullif(btrim(m.text), ''), '[image]'),
  coalesce(m.created, now()),
  case
    when exists (
      select 1
      from src_unread_messages um
      join src_participants recipient
        on recipient.id = um.participant_id
      where um.message_id = m.id
        and recipient.conversation_id = sender.conversation_id
        and recipient.account_id <> sender.account_id
    ) then null
    else coalesce(m.received, m.created, now())
  end as read_at
from src_messages m
join src_participants sender
  on sender.id = m.participant_id
join stg_resource_conversation_targets t
  on t.legacy_conversation_id = sender.conversation_id
where sender.account_id in (t.owner_account_id, t.bidder_account_id);

do $$
begin
  if exists (
    select 1
    from pg_trigger
    where tgrelid = 'app_public.resource_message'::regclass
      and tgname = 'trg_resource_message_inbox_notifications'
      and not tgisinternal
  ) then
    alter table app_public.resource_message enable trigger trg_resource_message_inbox_notifications;
  end if;

  if exists (
    select 1
    from pg_trigger
    where tgrelid = 'app_public.resource_message'::regclass
      and tgname = 'trg_resource_message_account_events'
      and not tgisinternal
  ) then
    alter table app_public.resource_message enable trigger trg_resource_message_account_events;
  end if;
end;
$$;

-- Import optional message images.
insert into app_public.resource_message_image (
  message_id,
  image_url,
  sort_order,
  created_at
)
select
  m.id,
  :'cloudinary_base_url' || btrim(i.public_id),
  0,
  coalesce(m.created, now())
from src_messages m
join src_images i
  on i.id = m.image_id
join app_public.resource_message rm
  on rm.id = m.id
where nullif(btrim(i.public_id), '') is not null;

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
  v_conversations integer;
  v_messages integer;
  v_message_images integer;
begin
  select count(*) into v_accounts from app_public.account;
  select count(*) into v_resources from app_public.resource;
  select count(*) into v_categories from app_public.resource_category_assignment;
  select count(*) into v_conversations from app_public.resource_conversation;
  select count(*) into v_messages from app_public.resource_message;
  select count(*) into v_message_images from app_public.resource_message_image;

  raise notice 'Topela migration summary: % accounts, % resources, % category links, % resource conversations, % resource messages, % message images',
    v_accounts,
    v_resources,
    v_categories,
    v_conversations,
    v_messages,
    v_message_images;
end;
$$;

commit;
