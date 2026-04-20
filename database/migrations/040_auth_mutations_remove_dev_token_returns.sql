begin;

-- Stop exposing verification/reset tokens through GraphQL-facing mutations.
drop function if exists app_public.register_local_account_with_password(text, text, text, bigint);
drop function if exists app_public.register_local_account(text, text, text, bigint);
drop function if exists app_public.request_email_verification(text, bigint, bigint);
drop function if exists app_public.request_password_reset(text, bigint, bigint);

create or replace function app_public.register_local_account(
  identifier text,
  display_name text,
  password_hash text,
  verification_ttl_ms bigint default 86400000
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

  perform app_private.queue_mail_outbox(
    v_account_id,
    'auth_email_verification',
    v_token,
    jsonb_build_object('source', 'register_local_account')
  );

  return true;
end;
$$;

create or replace function app_public.register_local_account_with_password(
  identifier text,
  display_name text,
  password text,
  verification_ttl_ms bigint default 86400000
)
returns boolean
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_password_hash text;
begin
  v_password_hash := app_private.hash_local_password(password);

  return app_public.register_local_account(
    identifier,
    display_name,
    v_password_hash,
    verification_ttl_ms
  );
end;
$$;

create or replace function app_public.request_email_verification(
  identifier text,
  verification_ttl_ms bigint default 86400000,
  throttle_ms bigint default 60000
)
returns boolean
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_identifier text;
  v_credential record;
  v_token text;
begin
  v_identifier := lower(btrim(identifier));

  select c.account_id, c.email_verified_at
  into v_credential
  from app_private.account_credential c
  where lower(c.login_identifier) = v_identifier
    and c.is_active = true
  limit 1;

  if v_credential.account_id is null or v_credential.email_verified_at is not null then
    return true;
  end if;

  v_token := app_private.issue_account_auth_token(
    v_credential.account_id,
    'email_verification',
    verification_ttl_ms,
    throttle_ms
  );

  if v_token is not null then
    perform app_private.queue_mail_outbox(
      v_credential.account_id,
      'auth_email_verification',
      v_token,
      jsonb_build_object('source', 'request_email_verification')
    );
  end if;

  return true;
end;
$$;

create or replace function app_public.request_password_reset(
  identifier text,
  reset_ttl_ms bigint default 3600000,
  throttle_ms bigint default 60000
)
returns boolean
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_identifier text;
  v_credential record;
  v_token text;
begin
  v_identifier := lower(btrim(identifier));

  select c.account_id, c.email_verified_at
  into v_credential
  from app_private.account_credential c
  where lower(c.login_identifier) = v_identifier
    and c.is_active = true
  limit 1;

  if v_credential.account_id is null or v_credential.email_verified_at is null then
    return true;
  end if;

  v_token := app_private.issue_account_auth_token(
    v_credential.account_id,
    'password_reset',
    reset_ttl_ms,
    throttle_ms
  );

  if v_token is not null then
    perform app_private.queue_mail_outbox(
      v_credential.account_id,
      'auth_password_reset',
      v_token,
      jsonb_build_object('source', 'request_password_reset')
    );
  end if;

  return true;
end;
$$;

grant execute on function app_public.register_local_account(text, text, text, bigint)
  to anonymous;
grant execute on function app_public.register_local_account_with_password(text, text, text, bigint)
  to anonymous;
grant execute on function app_public.request_email_verification(text, bigint, bigint)
  to anonymous;
grant execute on function app_public.request_password_reset(text, bigint, bigint)
  to anonymous;

comment on function app_public.register_local_account(text, text, text, bigint)
  is '@name registerLocalAccount';
comment on function app_public.register_local_account_with_password(text, text, text, bigint)
  is '@name registerLocalAccountWithPassword';
comment on function app_public.request_email_verification(text, bigint, bigint)
  is '@name requestEmailVerification';
comment on function app_public.request_password_reset(text, bigint, bigint)
  is '@name requestPasswordReset';

commit;
