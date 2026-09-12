begin;

alter table app_private.account_auth_token
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table app_private.account_auth_token
  drop constraint if exists account_auth_token_token_kind_check;

alter table app_private.account_auth_token
  add constraint account_auth_token_token_kind_check
  check (token_kind in ('email_verification', 'password_reset', 'email_change'));

-- issue_account_auth_token independently allowlists supported token kinds.
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

  if p_token_kind not in ('email_verification', 'password_reset', 'email_change') then
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

-- Return metadata alongside claimed outbox rows so heads-up mails can reference
-- the requested new email address without a token to decode.
drop function if exists app_private.claim_pending_mail_outbox(uuid, integer);

create or replace function app_private.claim_pending_mail_outbox(
  p_mail_id uuid default null,
  p_batch_size integer default 25
)
returns table (
  id uuid,
  recipient_email text,
  mail_kind text,
  auth_token text,
  locale text,
  metadata jsonb
)
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
begin
  return query
  with candidate as (
    select mo.id
    from app_private.mail_outbox mo
    where mo.status = 'pending'
      and (p_mail_id is null or mo.id = p_mail_id)
    order by mo.created_at asc
    limit greatest(1, coalesce(p_batch_size, 25))
    for update skip locked
  ),
  updated as (
    update app_private.mail_outbox mo
    set status = 'processing',
        updated_at = now()
    from candidate c
    where mo.id = c.id
    returning mo.id, mo.recipient_email, mo.mail_kind, mo.auth_token, mo.locale, mo.metadata, mo.created_at
  )
  select u.id, u.recipient_email, u.mail_kind, u.auth_token, u.locale, u.metadata
  from updated u
  order by u.created_at asc;
end;
$$;

grant execute on function app_private.claim_pending_mail_outbox(uuid, integer)
  to identified_account, admin;

comment on function app_private.claim_pending_mail_outbox(uuid, integer) is
  'Atomically claims pending outbox mails by switching them to processing and returns rows to deliver, including locale and metadata.';

revoke all on function app_private.claim_pending_mail_outbox(uuid, integer) from public;

-- Exposes the authenticated account's current login email (never the raw
-- credential row) so the mobile/web profile screens can display it.
create or replace function app_public.current_account_email()
returns text
language sql
stable
security definer
set search_path = app_public, app_private, public
as $$
  select c.login_identifier
  from app_private.account_credential c
  where c.account_id = app_private.current_account_id()
    and c.is_active = true
  order by c.created_at asc
  limit 1
$$;

grant execute on function app_public.current_account_email() to identified_account, admin;

comment on function app_public.current_account_email() is '@name currentAccountEmail';

revoke all on function app_public.current_account_email() from public;

-- Starts an email change: the new address must confirm ownership by following
-- a one-time link before login_identifier/external_subject actually change.
create or replace function app_public.request_account_email_change(
  new_identifier text,
  verification_ttl_ms bigint default 86400000,
  throttle_ms bigint default 60000
)
returns boolean
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid := app_private.current_account_id();
  v_identifier text;
  v_current_identifier text;
  v_preferred_language text;
  v_token text;
begin
  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  v_identifier := app_private.normalize_auth_identifier(new_identifier);

  if v_identifier = '' then
    raise exception using message = 'A valid email address is required';
  end if;

  select c.login_identifier
  into v_current_identifier
  from app_private.account_credential c
  where c.account_id = v_account_id
    and c.is_active = true
  order by c.created_at asc
  limit 1;

  if v_current_identifier is not null and lower(v_current_identifier) = v_identifier then
    raise exception using message = 'This is already your current email address';
  end if;

  perform app_private.assert_local_identifier_available(v_identifier);

  select coalesce(preferred_language, 'en')
  into v_preferred_language
  from app_public.account
  where id = v_account_id;

  v_token := app_private.issue_account_auth_token(
    v_account_id,
    'email_change',
    verification_ttl_ms,
    throttle_ms
  );

  if v_token is not null then
    update app_private.account_auth_token
    set metadata = jsonb_build_object('newIdentifier', v_identifier)
    where account_id = v_account_id
      and token_kind = 'email_change'
      and token_hash = encode(digest(v_token, 'sha256'), 'hex');

    insert into app_private.mail_outbox (
      account_id,
      recipient_email,
      mail_kind,
      auth_token,
      metadata,
      locale
    )
    values (
      v_account_id,
      v_identifier,
      'account_email_change_confirmation',
      v_token,
      jsonb_build_object('newIdentifier', v_identifier),
      coalesce(v_preferred_language, 'en')
    );

    -- Heads-up to the CURRENT address so an account owner is alerted even if
    -- they did not initiate the change themselves.
    if v_current_identifier is not null then
      perform app_private.queue_mail_outbox(
        v_account_id,
        'account_email_change_requested',
        null,
        jsonb_build_object('newIdentifier', v_identifier)
      );
    end if;
  end if;

  return true;
end;
$$;

-- Consumes the one-time token sent to the NEW address and, only then, applies
-- the email change to the credential row and the public account record.
create or replace function app_public.confirm_account_email_change(
  token text
)
returns boolean
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_token_hash text;
  v_account_id uuid;
  v_new_identifier text;
begin
  if nullif(btrim(coalesce(token, '')), '') is null then
    raise exception using message = 'That confirmation link is invalid or expired';
  end if;

  v_token_hash := encode(digest(token, 'sha256'), 'hex');

  select t.account_id, t.metadata->>'newIdentifier'
  into v_account_id, v_new_identifier
  from app_private.account_auth_token t
  where t.token_hash = v_token_hash
    and t.token_kind = 'email_change'
    and t.consumed_at is null
    and t.expires_at > now();

  if v_account_id is null or nullif(btrim(coalesce(v_new_identifier, '')), '') is null then
    raise exception using message = 'That confirmation link is invalid or expired';
  end if;

  -- Re-check uniqueness to close the window between request and confirmation.
  perform app_private.assert_local_identifier_available(v_new_identifier);

  perform app_private.consume_account_auth_token(token, 'email_change');

  update app_private.account_credential
  set login_identifier = v_new_identifier,
      email_verified_at = now()
  where account_id = v_account_id
    and is_active = true;

  update app_public.account
  set external_subject = v_new_identifier
  where id = v_account_id;

  return true;
end;
$$;

grant execute on function app_public.request_account_email_change(text, bigint, bigint)
  to identified_account;
grant execute on function app_public.confirm_account_email_change(text)
  to anonymous, identified_account;

comment on function app_public.request_account_email_change(text, bigint, bigint) is '@name requestAccountEmailChange';
comment on function app_public.confirm_account_email_change(text) is '@name confirmAccountEmailChange';

revoke all on function app_public.request_account_email_change(text, bigint, bigint) from public;
revoke all on function app_public.confirm_account_email_change(text) from public;

commit;
