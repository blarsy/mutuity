begin;

create or replace function app_private.current_session_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('jwt.claims.session_id', true), '')::uuid
$$;

create or replace function app_private.assert_recent_social_link_reauth(
  p_account_id uuid,
  p_session_id uuid,
  p_max_age interval default interval '15 minutes'
)
returns void
language plpgsql
as $$
declare
  v_is_recent boolean;
begin
  if p_session_id is null then
    raise exception using message = 'Recent re-authentication is required to link social identities';
  end if;

  select exists (
    select 1
    from app_private.account_session s
    where s.id = p_session_id
      and s.account_id = p_account_id
      and s.revoked_at is null
      and s.expires_at > now()
      and s.created_at >= now() - p_max_age
  )
  into v_is_recent;

  if not v_is_recent then
    raise exception using message = 'Recent re-authentication is required to link social identities';
  end if;
end;
$$;

create or replace function app_public.link_account_external_identity(
  p_provider text,
  p_provider_subject text,
  p_provider_email text default null,
  p_provider_email_verified boolean default false,
  p_metadata jsonb default '{}'::jsonb
)
returns text
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_provider text;
  v_session_id uuid;
begin
  v_account_id := app_private.current_account_id();
  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  v_provider := app_private.normalize_auth_identifier(p_provider);
  if v_provider not in ('google', 'apple') then
    raise exception using message = 'Unsupported identity provider';
  end if;

  v_session_id := app_private.current_session_id();
  perform app_private.assert_recent_social_link_reauth(v_account_id, v_session_id);

  return app_private.upsert_account_identity(
    v_account_id,
    v_provider,
    p_provider_subject,
    p_provider_email,
    p_provider_email_verified,
    p_metadata
  );
end;
$$;

grant execute on function app_private.current_session_id()
  to identified_account, admin;
grant execute on function app_private.assert_recent_social_link_reauth(uuid, uuid, interval)
  to identified_account, admin;
grant execute on function app_public.link_account_external_identity(text, text, text, boolean, jsonb)
  to identified_account, admin;

comment on function app_private.current_session_id()
  is 'Returns current authenticated session id from jwt claims.';
comment on function app_private.assert_recent_social_link_reauth(uuid, uuid, interval)
  is 'Requires a fresh authenticated session before linking external social identities.';
comment on function app_public.link_account_external_identity(text, text, text, boolean, jsonb)
  is '@name linkAccountExternalIdentity';

revoke all on function app_private.current_session_id() from public;
revoke all on function app_private.assert_recent_social_link_reauth(uuid, uuid, interval) from public;

commit;
