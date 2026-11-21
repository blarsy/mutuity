begin;

create or replace function app_private.confirm_social_identity_link(
  p_account_id uuid,
  p_session_id uuid,
  p_provider text,
  p_provider_subject text,
  p_provider_email text,
  p_provider_email_verified boolean
)
returns text
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_provider text;
  v_provider_email text;
begin
  v_provider := app_private.normalize_auth_identifier(p_provider);
  v_provider_email := app_private.normalize_auth_identifier(p_provider_email);

  if v_provider not in ('google', 'apple') or p_provider_email_verified is distinct from true then
    raise exception using message = 'A verified social identity is required';
  end if;

  perform app_private.assert_recent_social_link_reauth(p_account_id, p_session_id);

  if not exists (
    select 1
    from app_private.account_credential c
    where c.account_id = p_account_id
      and c.is_active = true
      and app_private.normalize_auth_identifier(c.login_identifier) = v_provider_email
  ) then
    raise exception using message = 'Social identity email does not match the signed-in account';
  end if;

  return app_private.upsert_account_identity(
    p_account_id,
    v_provider,
    p_provider_subject,
    p_provider_email,
    p_provider_email_verified,
    jsonb_build_object('source', 'explicit_password_authenticated_link')
  );
end;
$$;

revoke all on function app_private.confirm_social_identity_link(uuid, uuid, text, text, text, boolean) from public;

commit;