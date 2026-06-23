begin;

alter table app_public.account
  add column if not exists activation_verified_at timestamptz;

update app_public.account a
set activation_verified_at = coalesce(a.activation_verified_at, c.email_verified_at)
from app_private.account_credential c
where c.account_id = a.id
  and c.is_active = true
  and c.email_verified_at is not null
  and a.activation_verified_at is null;

create or replace function app_private.is_account_email_verified(p_account_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from app_public.account a
    where a.id = p_account_id
      and a.activation_verified_at is not null
  );
$$;

drop function if exists app_private.find_account_session(text);

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
    a.activation_verified_at as email_verified_at,
    a.preferred_language
  from app_private.account_session s
  join app_public.account a on a.id = s.account_id
  where s.session_token_hash = p_session_token_hash
    and s.revoked_at is null
    and s.expires_at > now()
  limit 1;
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
  v_account_id uuid;
  v_is_verified boolean;
  v_token text;
begin
  v_identifier := lower(btrim(identifier));

  select c.account_id, c.email_verified_at is not null
  into v_account_id, v_is_verified
  from app_private.account_credential c
  where lower(c.login_identifier) = v_identifier
    and c.is_active = true
  limit 1;

  if v_account_id is null then
    select a.id, a.activation_verified_at is not null
    into v_account_id, v_is_verified
    from app_public.account a
    where lower(a.external_subject) = v_identifier
    limit 1;
  end if;

  if v_account_id is null or v_is_verified then
    return true;
  end if;

  v_token := app_private.issue_account_auth_token(
    v_account_id,
    'email_verification',
    verification_ttl_ms,
    throttle_ms
  );

  if v_token is not null then
    perform app_private.queue_mail_outbox(
      v_account_id,
      'auth_email_verification',
      v_token,
      jsonb_build_object('source', 'request_email_verification')
    );
  end if;

  return true;
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

  update app_public.account
  set activation_verified_at = coalesce(activation_verified_at, now())
  where id = v_account_id;

  return true;
end;
$$;

commit;
