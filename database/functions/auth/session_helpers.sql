drop function if exists app_private.find_login_candidate(text);
drop function if exists app_private.find_account_session(text);

create or replace function app_private.find_login_candidate(p_identifier text)
returns table (
  account_id uuid,
  display_name text,
  external_subject text,
  avatar_url text,
  password_hash text,
  role_name text,
  email_verified_at timestamptz,
  preferred_language text
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
    a.preferred_language
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
  avatar_url text,
  email_verified_at timestamptz,
  preferred_language text
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
    a.avatar_url,
    c.email_verified_at,
    a.preferred_language
  from app_private.account_session s
  join app_public.account a on a.id = s.account_id
  left join lateral (
    select ac.email_verified_at
    from app_private.account_credential ac
    where ac.account_id = s.account_id
      and ac.is_active = true
    order by ac.created_at asc
    limit 1
  ) c on true
  where s.session_token_hash = p_session_token_hash
    and s.revoked_at is null
    and s.expires_at > now()
  limit 1
$$;

create or replace function app_private.touch_account_session(p_session_token_hash text)
returns void
language sql
as $$
  update app_private.account_session
  set last_seen_at = now()
  where session_token_hash = p_session_token_hash
    and revoked_at is null
$$;

create or replace function app_private.create_account_session(
  p_account_id uuid,
  p_role_name text,
  p_session_token_hash text,
  p_expires_at timestamptz
)
returns uuid
language sql
as $$
  insert into app_private.account_session (
    account_id,
    role_name,
    session_token_hash,
    expires_at
  )
  values (
    p_account_id,
    p_role_name,
    p_session_token_hash,
    p_expires_at
  )
  returning id
$$;

create or replace function app_private.revoke_account_session(p_session_token_hash text)
returns void
language sql
as $$
  update app_private.account_session
  set revoked_at = coalesce(revoked_at, now())
  where session_token_hash = p_session_token_hash
$$;

revoke all on function app_private.find_login_candidate(text) from public;
revoke all on function app_private.find_account_session(text) from public;
revoke all on function app_private.touch_account_session(text) from public;
revoke all on function app_private.create_account_session(uuid, text, text, timestamptz) from public;
revoke all on function app_private.revoke_account_session(text) from public;
