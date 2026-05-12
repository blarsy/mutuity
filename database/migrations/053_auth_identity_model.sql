begin;

create table if not exists app_private.account_identity (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references app_public.account(id) on delete cascade,
  provider text not null check (provider in ('local', 'google', 'apple')),
  provider_subject text not null,
  provider_email text,
  provider_email_normalized text,
  provider_email_verified boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  linked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_subject)
);

create index if not exists account_identity_account_idx
  on app_private.account_identity (account_id, provider);

create index if not exists account_identity_provider_email_idx
  on app_private.account_identity (provider_email_normalized)
  where provider_email_normalized is not null;

drop trigger if exists trg_account_identity_set_updated_at on app_private.account_identity;
create trigger trg_account_identity_set_updated_at
  before update on app_private.account_identity
  for each row
  execute function app_private.set_updated_at();

create or replace function app_private.normalize_auth_identifier(p_value text)
returns text
language sql
immutable
as $$
  select lower(btrim(coalesce(p_value, '')))
$$;

create or replace function app_private.assert_verified_identity_email_unique(
  p_account_id uuid,
  p_provider_email_normalized text
)
returns void
language plpgsql
as $$
declare
  v_existing_account_id uuid;
begin
  if nullif(p_provider_email_normalized, '') is null then
    return;
  end if;

  select ai.account_id
  into v_existing_account_id
  from app_private.account_identity ai
  where ai.provider_email_verified = true
    and ai.provider_email_normalized = p_provider_email_normalized
    and ai.account_id <> p_account_id
  limit 1;

  if v_existing_account_id is not null then
    raise exception using message = 'A verified identity with this email already exists';
  end if;
end;
$$;

create or replace function app_private.upsert_account_identity(
  p_account_id uuid,
  p_provider text,
  p_provider_subject text,
  p_provider_email text default null,
  p_provider_email_verified boolean default false,
  p_metadata jsonb default '{}'::jsonb
)
returns text
language plpgsql
as $$
declare
  v_provider text;
  v_provider_subject text;
  v_provider_email text;
  v_provider_email_normalized text;
  v_existing_account_id uuid;
begin
  v_provider := app_private.normalize_auth_identifier(p_provider);
  v_provider_subject := app_private.normalize_auth_identifier(p_provider_subject);
  v_provider_email := nullif(btrim(coalesce(p_provider_email, '')), '');
  v_provider_email_normalized := app_private.normalize_auth_identifier(p_provider_email);

  if v_provider not in ('local', 'google', 'apple') then
    raise exception using message = 'Unsupported identity provider';
  end if;

  if v_provider_subject = '' then
    raise exception using message = 'Provider subject is required';
  end if;

  select ai.account_id
  into v_existing_account_id
  from app_private.account_identity ai
  where ai.provider = v_provider
    and ai.provider_subject = v_provider_subject
  limit 1;

  if v_existing_account_id is not null and v_existing_account_id <> p_account_id then
    raise exception using message = 'Identity is already linked to another account';
  end if;

  if p_provider_email_verified = true then
    perform app_private.assert_verified_identity_email_unique(p_account_id, v_provider_email_normalized);
  end if;

  insert into app_private.account_identity (
    account_id,
    provider,
    provider_subject,
    provider_email,
    provider_email_normalized,
    provider_email_verified,
    metadata
  )
  values (
    p_account_id,
    v_provider,
    v_provider_subject,
    v_provider_email,
    nullif(v_provider_email_normalized, ''),
    p_provider_email_verified,
    coalesce(p_metadata, '{}'::jsonb)
  )
  on conflict (provider, provider_subject) do update
    set provider_email = excluded.provider_email,
        provider_email_normalized = excluded.provider_email_normalized,
        provider_email_verified = excluded.provider_email_verified,
        metadata = coalesce(app_private.account_identity.metadata, '{}'::jsonb) || coalesce(excluded.metadata, '{}'::jsonb),
        linked_at = now(),
        updated_at = now()
    where app_private.account_identity.account_id = excluded.account_id;

  if not found then
    raise exception using message = 'Identity is already linked to another account';
  end if;

  return case
    when v_existing_account_id is null then 'linked'
    else 'updated'
  end;
end;
$$;

create or replace function app_private.resolve_account_for_external_identity(
  p_provider text,
  p_provider_subject text,
  p_provider_email text default null,
  p_provider_email_verified boolean default false
)
returns table (
  account_id uuid,
  resolution text
)
language plpgsql
stable
as $$
declare
  v_provider text;
  v_subject text;
  v_email_normalized text;
  v_email_match_count integer;
  v_email_match_account_id uuid;
begin
  v_provider := app_private.normalize_auth_identifier(p_provider);
  v_subject := app_private.normalize_auth_identifier(p_provider_subject);
  v_email_normalized := app_private.normalize_auth_identifier(p_provider_email);

  if v_provider not in ('google', 'apple') then
    raise exception using message = 'Unsupported identity provider';
  end if;

  if v_subject <> '' then
    return query
    select ai.account_id, 'subject_match'::text
    from app_private.account_identity ai
    where ai.provider = v_provider
      and ai.provider_subject = v_subject
    limit 1;

    if found then
      return;
    end if;
  end if;

  if p_provider_email_verified = true and v_email_normalized <> '' then
    -- min(uuid) is not directly recognised by plpgsql_check, so cast through text.
    select count(distinct ai.account_id), min(ai.account_id::text)::uuid
    into v_email_match_count, v_email_match_account_id
    from app_private.account_identity ai
    where ai.provider_email_verified = true
      and ai.provider_email_normalized = v_email_normalized;

    if v_email_match_count = 1 then
      return query
      select v_email_match_account_id, 'verified_email_match'::text;
      return;
    end if;

    if v_email_match_count > 1 then
      return query
      select null::uuid, 'verified_email_conflict'::text;
      return;
    end if;
  end if;

  return query
  select null::uuid, 'no_match'::text;
end;
$$;

create or replace function app_public.link_account_external_identity(
  p_provider text,
  p_provider_subject text,
  p_provider_email text default null,
  p_provider_email_verified boolean default false,
  p_metadata jsonb default '{}'::jsonb
)
returns text
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_provider text;
begin
  v_account_id := app_private.current_account_id();
  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  v_provider := app_private.normalize_auth_identifier(p_provider);
  if v_provider not in ('google', 'apple') then
    raise exception using message = 'Unsupported identity provider';
  end if;

  return app_private.upsert_account_identity(
    v_account_id,
    v_provider,
    p_provider_subject,
    p_provider_email,
    p_provider_email_verified,
    p_metadata
  );
end;
$$;

create or replace function app_private.sync_local_identity_from_credential()
returns trigger
language plpgsql
as $$
declare
  v_identifier text;
begin
  if tg_op = 'DELETE' then
    delete from app_private.account_identity ai
    where ai.account_id = old.account_id
      and ai.provider = 'local';
    return old;
  end if;

  if new.is_active = false then
    delete from app_private.account_identity ai
    where ai.account_id = new.account_id
      and ai.provider = 'local';
    return new;
  end if;

  v_identifier := app_private.normalize_auth_identifier(new.login_identifier);
  if v_identifier = '' then
    raise exception using message = 'A valid email address is required';
  end if;

  perform app_private.upsert_account_identity(
    new.account_id,
    'local',
    v_identifier,
    v_identifier,
    new.email_verified_at is not null,
    jsonb_build_object('source', 'account_credential')
  );

  return new;
end;
$$;

drop trigger if exists trg_account_credential_sync_local_identity on app_private.account_credential;
create trigger trg_account_credential_sync_local_identity
  after insert or update of login_identifier, email_verified_at, is_active or delete
  on app_private.account_credential
  for each row
  execute function app_private.sync_local_identity_from_credential();

-- Backfill local identity rows for existing credential records.
insert into app_private.account_identity (
  account_id,
  provider,
  provider_subject,
  provider_email,
  provider_email_normalized,
  provider_email_verified,
  metadata
)
select
  c.account_id,
  'local',
  app_private.normalize_auth_identifier(c.login_identifier),
  app_private.normalize_auth_identifier(c.login_identifier),
  app_private.normalize_auth_identifier(c.login_identifier),
  c.email_verified_at is not null,
  jsonb_build_object('source', 'backfill_053')
from app_private.account_credential c
where c.is_active = true
on conflict (provider, provider_subject) do update
  set account_id = excluded.account_id,
      provider_email = excluded.provider_email,
      provider_email_normalized = excluded.provider_email_normalized,
      provider_email_verified = excluded.provider_email_verified,
      metadata = coalesce(app_private.account_identity.metadata, '{}'::jsonb) || excluded.metadata,
      linked_at = now(),
      updated_at = now();

create or replace function app_private.assert_local_identifier_available(p_identifier text)
returns void
language plpgsql
as $$
declare
  v_identifier text;
  v_has_local_credential boolean;
  v_has_verified_external_identity boolean;
begin
  v_identifier := app_private.normalize_auth_identifier(p_identifier);

  if v_identifier = '' then
    raise exception using message = 'A valid email address is required';
  end if;

  select exists (
    select 1
    from app_private.account_credential c
    where lower(c.login_identifier) = v_identifier
  )
  into v_has_local_credential;

  if v_has_local_credential then
    raise exception using message = 'An account with this email already exists';
  end if;

  select exists (
    select 1
    from app_private.account_identity ai
    where ai.provider in ('google', 'apple')
      and ai.provider_email_verified = true
      and ai.provider_email_normalized = v_identifier
  )
  into v_has_verified_external_identity;

  if v_has_verified_external_identity then
    raise exception using message = 'An account with this email already exists';
  end if;
end;
$$;

drop function if exists app_public.register_local_account(text, text, text, bigint, text);

create or replace function app_public.register_local_account(
  identifier text,
  display_name text,
  password_hash text,
  verification_ttl_ms bigint default 86400000,
  preferred_language text default null
)
returns boolean
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_identifier text;
  v_account_id uuid;
  v_token text;
  v_preferred_language text;
begin
  v_identifier := app_private.normalize_auth_identifier(identifier);

  if v_identifier = '' then
    raise exception using message = 'A valid email address is required';
  end if;

  if nullif(btrim(display_name), '') is null then
    raise exception using message = 'Account name is required';
  end if;

  v_preferred_language := lower(coalesce(nullif(btrim(preferred_language), ''), 'fr'));

  if v_preferred_language not in ('en', 'fr') then
    v_preferred_language := 'fr';
  end if;

  perform app_private.assert_local_identifier_available(v_identifier);

  begin
    insert into app_public.account (external_subject, display_name, preferred_language)
    values (v_identifier, btrim(display_name), v_preferred_language)
    returning id into v_account_id;

    insert into app_private.account_credential (
      account_id,
      login_identifier,
      password_hash,
      role_name,
      is_active,
      email_verified_at
    )
    values (
      v_account_id,
      v_identifier,
      password_hash,
      'identified_account',
      true,
      null
    );
  exception
    when unique_violation then
      raise exception using message = 'An account with this email already exists';
  end;

  v_token := app_private.issue_account_auth_token(
    v_account_id,
    'email_verification',
    verification_ttl_ms,
    0
  );

  perform app_private.queue_mail_outbox(
    v_account_id,
    'auth_email_verification',
    v_token,
    jsonb_build_object('source', 'register_local_account')
  );

  return true;
end;
$$;

grant execute on function app_public.link_account_external_identity(text, text, text, boolean, jsonb)
  to identified_account, manager, admin;
grant execute on function app_private.resolve_account_for_external_identity(text, text, text, boolean)
  to identified_account, manager, admin;

grant execute on function app_public.register_local_account(text, text, text, bigint, text)
  to anonymous;

comment on table app_private.account_identity is
  'Linked account identities for local credentials and external providers (google/apple).';

comment on function app_public.link_account_external_identity(text, text, text, boolean, jsonb)
  is '@name linkAccountExternalIdentity';
comment on function app_private.resolve_account_for_external_identity(text, text, text, boolean)
  is 'Resolves account candidates for provider sign-in by subject then verified email.';

revoke all on function app_private.normalize_auth_identifier(text) from public;
revoke all on function app_private.assert_verified_identity_email_unique(uuid, text) from public;
revoke all on function app_private.upsert_account_identity(uuid, text, text, text, boolean, jsonb) from public;
revoke all on function app_private.sync_local_identity_from_credential() from public;
revoke all on function app_private.assert_local_identifier_available(text) from public;

commit;
