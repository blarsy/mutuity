-- Keep only the self-exclusion-aware signature. RESTRICT (the default) fails
-- safely if an installation has a catalog dependency on the obsolete overload.
drop function if exists app_private.assert_local_identifier_available(text);

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