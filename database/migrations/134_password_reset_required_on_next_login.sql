begin;

alter table app_public.account
  add column if not exists require_password_reset_on_next_login boolean not null default false;

-- Backfill: all accounts imported by the Tope-la migration are marked via local identity metadata.
update app_public.account a
set require_password_reset_on_next_login = true
where exists (
  select 1
  from app_private.account_identity ai
  where ai.account_id = a.id
    and ai.provider = 'local'
    and coalesce(ai.metadata ->> 'legacyMigration', 'false') = 'true'
);

  drop function if exists app_private.find_login_candidate(text);

create or replace function app_private.find_login_candidate(p_identifier text)
returns table (
  account_id uuid,
  display_name text,
  external_subject text,
  avatar_url text,
  password_hash text,
  role_name text,
  email_verified_at timestamptz,
  preferred_language text,
  require_password_reset_on_next_login boolean
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
    c.role_name,
    c.email_verified_at,
    a.preferred_language,
    a.require_password_reset_on_next_login
  from app_private.account_credential c
  join app_public.account a on a.id = c.account_id
  where lower(c.login_identifier) = lower(p_identifier)
    and c.is_active = true
  limit 1
$$;

create or replace function app_private.update_account_password(
  p_account_id uuid,
  p_password_hash text,
  p_except_session_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
begin
  update app_private.account_credential
  set password_hash = p_password_hash,
      updated_at = now()
  where account_id = p_account_id
    and is_active = true;

  update app_public.account
  set require_password_reset_on_next_login = false,
      updated_at = now()
  where id = p_account_id;

  perform app_private.revoke_account_sessions(p_account_id, p_except_session_id);
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
  v_subject_account_id uuid;
  v_subject_requires_password_reset boolean;
  v_local_email_account_id uuid;
  v_local_email_requires_password_reset boolean;
  v_has_link_required_match boolean;
begin
  v_provider := app_private.normalize_auth_identifier(p_provider);
  v_subject := app_private.normalize_auth_identifier(p_provider_subject);
  v_email_normalized := app_private.normalize_auth_identifier(p_provider_email);

  if v_provider not in ('google', 'apple') then
    raise exception using message = 'Unsupported identity provider';
  end if;

  -- 1) Subject match: existing social identity.
  if v_subject <> '' then
    select ai.account_id, a.require_password_reset_on_next_login
    into v_subject_account_id, v_subject_requires_password_reset
    from app_private.account_identity ai
    join app_public.account a on a.id = ai.account_id
    where ai.provider = v_provider
      and ai.provider_subject = v_subject
    limit 1;

    if v_subject_account_id is not null then
      if coalesce(v_subject_requires_password_reset, false) then
        return query
        select v_subject_account_id, 'password_reset_required'::text;
      else
        return query
        select v_subject_account_id, 'subject_match'::text;
      end if;
      return;
    end if;
  end if;

  -- 2) Verified email matches an existing local credential: explicit link or forced reset.
  if p_provider_email_verified = true and v_email_normalized <> '' then
    select c.account_id, a.require_password_reset_on_next_login
    into v_local_email_account_id, v_local_email_requires_password_reset
    from app_private.account_credential c
    join app_public.account a on a.id = c.account_id
    where c.is_active = true
      and lower(c.login_identifier) = v_email_normalized
    limit 1;

    if v_local_email_account_id is not null then
      if coalesce(v_local_email_requires_password_reset, false) then
        return query
        select v_local_email_account_id, 'password_reset_required'::text;
      else
        return query
        select null::uuid, 'explicit_link_required'::text;
      end if;
      return;
    end if;

    select exists (
      select 1
      from app_private.account_identity ai
      where ai.provider_email_normalized = v_email_normalized
        and ai.provider_email_verified = true
        and ai.provider <> v_provider
    )
    into v_has_link_required_match;

    if v_has_link_required_match then
      return query
      select null::uuid, 'explicit_link_required'::text;
      return;
    end if;
  end if;

  return query
  select null::uuid, 'no_match'::text;
end;
$$;

comment on function app_private.resolve_account_for_external_identity(text, text, text, boolean)
  is 'Resolves by subject first; returns password_reset_required when matched account is flagged, else explicit link for verified email collisions.';

commit;
