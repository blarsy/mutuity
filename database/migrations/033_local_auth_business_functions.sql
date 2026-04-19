begin;

create or replace function app_private.issue_account_auth_token(
  p_account_id uuid,
  p_token_kind text,
  p_ttl_ms bigint,
  p_throttle_ms bigint default 0
)
returns text
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_latest_created_at timestamptz;
  v_token text;
  v_token_hash text;
begin
  if p_ttl_ms <= 0 then
    raise exception using message = 'Token TTL must be positive';
  end if;

  if p_token_kind not in ('email_verification', 'password_reset') then
    raise exception using message = 'Unsupported auth token kind';
  end if;

  select t.created_at
  into v_latest_created_at
  from app_private.account_auth_token t
  where t.account_id = p_account_id
    and t.token_kind = p_token_kind
  order by t.created_at desc
  limit 1;

  if v_latest_created_at is not null
    and p_throttle_ms > 0
    and (extract(epoch from (now() - v_latest_created_at)) * 1000) < p_throttle_ms then
    return null;
  end if;

  v_token := encode(gen_random_bytes(32), 'hex');
  v_token_hash := encode(digest(v_token, 'sha256'), 'hex');

  insert into app_private.account_auth_token (
    account_id,
    token_kind,
    token_hash,
    expires_at
  )
  values (
    p_account_id,
    p_token_kind,
    v_token_hash,
    now() + make_interval(secs => p_ttl_ms::numeric / 1000)
  );

  return v_token;
end;
$$;

create or replace function app_private.consume_account_auth_token(
  p_token text,
  p_token_kind text
)
returns uuid
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_token_hash text;
  v_account_id uuid;
begin
  if nullif(btrim(p_token), '') is null then
    return null;
  end if;

  v_token_hash := encode(digest(p_token, 'sha256'), 'hex');

  update app_private.account_auth_token
  set consumed_at = coalesce(consumed_at, now())
  where token_hash = v_token_hash
    and token_kind = p_token_kind
    and consumed_at is null
    and expires_at > now()
  returning account_id into v_account_id;

  return v_account_id;
end;
$$;

create or replace function app_private.read_account_password_hash(
  p_account_id uuid
)
returns text
language sql
security definer
set search_path = app_public, app_private, public
as $$
  select c.password_hash
  from app_private.account_credential c
  where c.account_id = p_account_id
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

  perform app_private.revoke_account_sessions(p_account_id, p_except_session_id);
end;
$$;

create or replace function app_public.register_local_account(
  identifier text,
  display_name text,
  password_hash text,
  verification_ttl_ms bigint default 86400000
)
returns text
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_identifier text;
  v_account_id uuid;
  v_token text;
begin
  v_identifier := lower(btrim(identifier));

  if v_identifier = '' then
    raise exception using message = 'A valid email address is required';
  end if;

  if nullif(btrim(display_name), '') is null then
    raise exception using message = 'Account name is required';
  end if;

  begin
    insert into app_public.account (external_subject, display_name)
    values (v_identifier, btrim(display_name))
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

  return v_token;
end;
$$;

create or replace function app_public.request_email_verification(
  identifier text,
  verification_ttl_ms bigint default 86400000,
  throttle_ms bigint default 60000
)
returns text
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_identifier text;
  v_credential record;
begin
  v_identifier := lower(btrim(identifier));

  select c.account_id, c.email_verified_at
  into v_credential
  from app_private.account_credential c
  where lower(c.login_identifier) = v_identifier
    and c.is_active = true
  limit 1;

  if v_credential.account_id is null or v_credential.email_verified_at is not null then
    return null;
  end if;

  return app_private.issue_account_auth_token(
    v_credential.account_id,
    'email_verification',
    verification_ttl_ms,
    throttle_ms
  );
end;
$$;

create or replace function app_public.confirm_email_verification(
  token text
)
returns boolean
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
begin
  v_account_id := app_private.consume_account_auth_token(token, 'email_verification');

  if v_account_id is null then
    raise exception using message = 'That verification link is invalid or expired';
  end if;

  update app_private.account_credential
  set email_verified_at = coalesce(email_verified_at, now())
  where account_id = v_account_id
    and is_active = true;

  return true;
end;
$$;

create or replace function app_public.request_password_reset(
  identifier text,
  reset_ttl_ms bigint default 3600000,
  throttle_ms bigint default 60000
)
returns text
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_identifier text;
  v_credential record;
begin
  v_identifier := lower(btrim(identifier));

  select c.account_id, c.email_verified_at
  into v_credential
  from app_private.account_credential c
  where lower(c.login_identifier) = v_identifier
    and c.is_active = true
  limit 1;

  if v_credential.account_id is null or v_credential.email_verified_at is null then
    return null;
  end if;

  return app_private.issue_account_auth_token(
    v_credential.account_id,
    'password_reset',
    reset_ttl_ms,
    throttle_ms
  );
end;
$$;

create or replace function app_public.confirm_password_reset(
  token text,
  next_password_hash text
)
returns boolean
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
begin
  v_account_id := app_private.consume_account_auth_token(token, 'password_reset');

  if v_account_id is null then
    raise exception using message = 'That password reset link is invalid or expired';
  end if;

  perform app_private.update_account_password(v_account_id, next_password_hash, null);

  return true;
end;
$$;

grant execute on function app_public.register_local_account(text, text, text, bigint)
  to anonymous;
grant execute on function app_public.request_email_verification(text, bigint, bigint)
  to anonymous;
grant execute on function app_public.confirm_email_verification(text)
  to anonymous;
grant execute on function app_public.request_password_reset(text, bigint, bigint)
  to anonymous;
grant execute on function app_public.confirm_password_reset(text, text)
  to anonymous;

grant execute on function app_private.issue_account_auth_token(uuid, text, bigint, bigint)
  to identified_account, manager, admin;
grant execute on function app_private.consume_account_auth_token(text, text)
  to identified_account, manager, admin;
grant execute on function app_private.read_account_password_hash(uuid)
  to identified_account, manager, admin;
grant execute on function app_private.update_account_password(uuid, text, uuid)
  to identified_account, manager, admin;

comment on function app_public.register_local_account(text, text, text, bigint)
  is '@name registerLocalAccount';
comment on function app_public.request_email_verification(text, bigint, bigint)
  is '@name requestEmailVerification';
comment on function app_public.confirm_email_verification(text)
  is '@name confirmEmailVerification';
comment on function app_public.request_password_reset(text, bigint, bigint)
  is '@name requestPasswordReset';
comment on function app_public.confirm_password_reset(text, text)
  is '@name confirmPasswordReset';

revoke all on function app_private.issue_account_auth_token(uuid, text, bigint, bigint) from public;
revoke all on function app_private.consume_account_auth_token(text, text) from public;
revoke all on function app_private.read_account_password_hash(uuid) from public;
revoke all on function app_private.update_account_password(uuid, text, uuid) from public;

commit;
