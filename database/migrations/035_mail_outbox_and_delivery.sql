begin;

create table if not exists app_private.mail_outbox (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references app_public.account(id) on delete set null,
  recipient_email text not null,
  mail_kind text not null,
  auth_token text,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'skipped', 'failed')),
  subject text,
  text_body text,
  html_body text,
  provider_message_id text,
  failure_reason text,
  attempts integer not null default 0,
  last_attempt_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mail_outbox_status_created_idx
  on app_private.mail_outbox (status, created_at asc);

create index if not exists mail_outbox_account_created_idx
  on app_private.mail_outbox (account_id, created_at desc);

create or replace function app_private.queue_mail_outbox(
  p_account_id uuid,
  p_mail_kind text,
  p_auth_token text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_email text;
  v_mail_id uuid;
begin
  if nullif(btrim(p_mail_kind), '') is null then
    return null;
  end if;

  select c.login_identifier
  into v_email
  from app_private.account_credential c
  where c.account_id = p_account_id
    and c.is_active = true
  order by c.created_at asc
  limit 1;

  if nullif(btrim(v_email), '') is null then
    return null;
  end if;

  insert into app_private.mail_outbox (
    account_id,
    recipient_email,
    mail_kind,
    auth_token,
    metadata
  )
  values (
    p_account_id,
    lower(v_email),
    p_mail_kind,
    p_auth_token,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_mail_id;

  return v_mail_id;
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

  perform app_private.queue_mail_outbox(
    v_account_id,
    'auth_email_verification',
    v_token,
    jsonb_build_object('source', 'register_local_account')
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
    return null;
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

  return v_token;
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
    return null;
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

  return v_token;
end;
$$;

grant execute on function app_private.queue_mail_outbox(uuid, text, text, jsonb)
  to identified_account, manager, admin;

comment on table app_private.mail_outbox is
  'Unified outbox of all emails for delivery, auditing, and resend workflows.';

comment on function app_private.queue_mail_outbox(uuid, text, text, jsonb) is
  'Queue an email in the unified outbox.';

revoke all on function app_private.queue_mail_outbox(uuid, text, text, jsonb) from public;

commit;
