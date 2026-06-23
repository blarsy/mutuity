begin;

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
  v_locale text;
begin
  if nullif(btrim(p_mail_kind), '') is null then
    return null;
  end if;

  select c.login_identifier, coalesce(a.preferred_language, 'en')
  into v_email, v_locale
  from app_private.account_credential c
  join app_public.account a on a.id = c.account_id
  where c.account_id = p_account_id
    and c.is_active = true
  order by c.created_at asc
  limit 1;

  if nullif(btrim(v_email), '') is null then
    select ai.provider_email_normalized, coalesce(a.preferred_language, 'en')
    into v_email, v_locale
    from app_private.account_identity ai
    join app_public.account a on a.id = ai.account_id
    where ai.account_id = p_account_id
      and nullif(btrim(ai.provider_email_normalized), '') is not null
    order by case when ai.provider_email_verified then 0 else 1 end, ai.created_at asc
    limit 1;
  end if;

  if nullif(btrim(v_email), '') is null then
    return null;
  end if;

  insert into app_private.mail_outbox (
    account_id,
    recipient_email,
    mail_kind,
    auth_token,
    metadata,
    locale
  )
  values (
    p_account_id,
    lower(v_email),
    p_mail_kind,
    p_auth_token,
    coalesce(p_metadata, '{}'::jsonb),
    v_locale
  )
  returning id into v_mail_id;

  return v_mail_id;
end;
$$;

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

  if provider_email_verified then
    return true;
  end if;

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

create or replace function app_private.is_account_email_verified(p_account_id uuid)
returns boolean
language sql
stable
security definer
set search_path = app_private, app_public, public
as $$
  select (
    exists (
      select 1
      from app_private.account_credential c
      where c.account_id = p_account_id
        and c.is_active = true
        and c.email_verified_at is not null
    )
    or exists (
      select 1
      from app_private.account_identity ai
      where ai.account_id = p_account_id
        and ai.provider in ('google', 'apple')
        and ai.provider_email_verified = true
    )
  );
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
    coalesce(c.email_verified_at, si.verified_at) as email_verified_at,
    a.preferred_language
  from app_private.account_session s
  join app_public.account a on a.id = s.account_id
  left join lateral (
    select ac.email_verified_at
    from app_private.account_credential ac
    where ac.account_id = s.account_id
      and ac.is_active = true
      and ac.email_verified_at is not null
    order by ac.created_at asc
    limit 1
  ) c on true
  left join lateral (
    select coalesce(min(ai.linked_at), min(ai.created_at)) as verified_at
    from app_private.account_identity ai
    where ai.account_id = s.account_id
      and ai.provider in ('google', 'apple')
      and ai.provider_email_verified = true
  ) si on true
  where s.session_token_hash = p_session_token_hash
    and s.revoked_at is null
    and s.expires_at > now()
  limit 1;
$$;

commit;
