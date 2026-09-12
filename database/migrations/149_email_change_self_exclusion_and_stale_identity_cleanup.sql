begin;

-- assert_local_identifier_available previously never excluded the account
-- being checked, so a self-service email change back to an address the SAME
-- account already owns via a verified social identity (or its own current
-- credential row) was incorrectly rejected as "already exists".
create or replace function app_private.assert_local_identifier_available(
  p_identifier text,
  p_exclude_account_id uuid default null
)
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
      and (p_exclude_account_id is null or c.account_id <> p_exclude_account_id)
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
      and (p_exclude_account_id is null or ai.account_id <> p_exclude_account_id)
  )
  into v_has_verified_external_identity;

  if v_has_verified_external_identity then
    raise exception using message = 'An account with this email already exists';
  end if;
end;
$$;

-- Pass the requesting/confirming account id so reverting to an address the
-- SAME account already owns (e.g. its own linked Google identity email) works.
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

  perform app_private.assert_local_identifier_available(v_identifier, v_account_id);

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

  perform app_private.assert_local_identifier_available(v_new_identifier, v_account_id);

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

-- The credential->identity sync trigger only ever upserted the CURRENT
-- login_identifier's 'local' identity row; it never removed the row for a
-- PREVIOUS identifier after a rename, leaving stale rows behind indefinitely.
create or replace function app_private.sync_local_identity_from_credential()
returns trigger
language plpgsql
as $$
declare
  v_identifier text;
  v_previous_identifier text;
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

  if tg_op = 'UPDATE' then
    v_previous_identifier := app_private.normalize_auth_identifier(old.login_identifier);

    if v_previous_identifier <> '' and v_previous_identifier <> v_identifier then
      delete from app_private.account_identity ai
      where ai.account_id = new.account_id
        and ai.provider = 'local'
        and ai.provider_subject = v_previous_identifier;
    end if;
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

-- One-time cleanup of stale 'local' identity rows left by prior renames
-- (superseded by a newer 'local' row for the same account with a later
-- linked_at, or no longer matching the account's current login_identifier).
delete from app_private.account_identity ai
using app_private.account_credential c
where ai.provider = 'local'
  and ai.account_id = c.account_id
  and lower(ai.provider_subject) <> lower(c.login_identifier);

commit;
