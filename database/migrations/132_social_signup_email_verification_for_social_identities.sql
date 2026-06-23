begin;

create or replace function app_public.register_local_account_with_social_identity(
  identifier text,
  display_name text,
  password text default null,
  provider text default null,
  provider_subject text default null,
  provider_email text default null,
  provider_email_verified boolean default false,
  preferred_language text default null,
  verification_ttl_ms bigint default 86400000
)
returns boolean
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_identifier text;
  v_provider text;
  v_provider_subject text;
  v_provider_email text;
  v_password text;
  v_password_hash text;
  v_preferred_language text;
  v_account_id uuid;
  v_token text;
begin
  v_identifier := app_private.normalize_auth_identifier(identifier);
  v_provider := app_private.normalize_auth_identifier(provider);
  v_provider_subject := app_private.normalize_auth_identifier(provider_subject);
  v_provider_email := app_private.normalize_auth_identifier(provider_email);
  v_password := nullif(btrim(coalesce(password, '')), '');

  if v_identifier = '' then
    raise exception using message = 'A valid email address is required';
  end if;

  if nullif(btrim(display_name), '') is null then
    raise exception using message = 'Account name is required';
  end if;

  if v_provider not in ('google', 'apple') then
    raise exception using message = 'Unsupported identity provider';
  end if;

  if v_provider_subject = '' then
    raise exception using message = 'Provider subject is required';
  end if;

  v_preferred_language := lower(coalesce(nullif(btrim(preferred_language), ''), 'fr'));
  if v_preferred_language not in ('en', 'fr') then
    v_preferred_language := 'fr';
  end if;

  if v_password is not null then
    perform app_private.assert_local_identifier_available(v_identifier);
    v_password_hash := app_private.hash_local_password(v_password);
  end if;

  begin
    insert into app_public.account (external_subject, display_name, preferred_language)
    values (v_identifier, btrim(display_name), v_preferred_language)
    returning id into v_account_id;

    if v_password_hash is not null then
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
        v_password_hash,
        'identified_account',
        true,
        case when provider_email_verified then now() else null end
      );
    end if;

    perform app_private.upsert_account_identity(
      v_account_id,
      v_provider,
      v_provider_subject,
      v_provider_email,
      provider_email_verified,
      jsonb_build_object('source', 'register_local_account_with_social_identity')
    );
  exception
    when unique_violation then
      raise exception using message = 'An account with this social identity already exists';
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
    jsonb_build_object('source', 'register_local_account_with_social_identity')
  );

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
  v_updated_social_count integer;
begin
  v_account_id := app_private.consume_account_auth_token(token, 'email_verification');

  if v_account_id is null then
    raise exception using message = 'That verification link is invalid or expired';
  end if;

  update app_private.account_credential
  set email_verified_at = coalesce(email_verified_at, now())
  where account_id = v_account_id
    and is_active = true;

  if not found then
    update app_private.account_identity
    set provider_email_verified = true,
        updated_at = now()
    where account_id = v_account_id
      and provider in ('google', 'apple')
      and provider_email_verified = false;

    get diagnostics v_updated_social_count = row_count;
  end if;

  return true;
end;
$$;

commit;
