begin;

-- Align account default with frontend fallback language.
alter table app_public.account
  alter column preferred_language set default 'fr';

-- Recreate registration functions to persist preferred language at account creation time.
drop function if exists app_public.register_local_account_with_password(text, text, text, bigint);
drop function if exists app_public.register_local_account(text, text, text, bigint);

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
  v_identifier := lower(btrim(identifier));

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

create or replace function app_public.register_local_account_with_password(
  identifier text,
  display_name text,
  password text,
  verification_ttl_ms bigint default 86400000,
  preferred_language text default null
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
    verification_ttl_ms,
    preferred_language
  );
end;
$$;

grant execute on function app_public.register_local_account(text, text, text, bigint, text)
  to anonymous;
grant execute on function app_public.register_local_account_with_password(text, text, text, bigint, text)
  to anonymous;

comment on function app_public.register_local_account(text, text, text, bigint, text)
  is '@name registerLocalAccount';
comment on function app_public.register_local_account_with_password(text, text, text, bigint, text)
  is '@name registerLocalAccountWithPassword';

commit;
