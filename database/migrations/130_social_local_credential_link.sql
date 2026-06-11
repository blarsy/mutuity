begin;

create or replace function app_private.resolve_account_for_external_identity(
  p_provider text,
  p_provider_subject text,
  p_provider_email text default null,
  p_provider_email_verified boolean default false
)
returns table (
  account_id uuid,
  resolution text
)
language plpgsql
stable
as $$
declare
  v_provider text;
  v_subject text;
  v_email_normalized text;
  v_has_link_required_match boolean;
begin
  v_provider := app_private.normalize_auth_identifier(p_provider);
  v_subject := app_private.normalize_auth_identifier(p_provider_subject);
  v_email_normalized := app_private.normalize_auth_identifier(p_provider_email);

  if v_provider not in ('google', 'apple') then
    raise exception using message = 'Unsupported identity provider';
  end if;

  -- 1. Subject match: existing social identity → sign in directly.
  if v_subject <> '' then
    return query
    select ai.account_id, 'subject_match'::text
    from app_private.account_identity ai
    where ai.provider = v_provider
      and ai.provider_subject = v_subject
    limit 1;

    if found then
      return;
    end if;
  end if;

  -- 2. Email match: a verified social identity OR any local (password) identity
  --    with the same email → explicit link required.
  --    Requires the provider to report a verified email before trusting the match.
  if p_provider_email_verified = true and v_email_normalized <> '' then
    select exists (
      select 1
      from app_private.account_identity ai
      where ai.provider_email_normalized = v_email_normalized
        and (
          (ai.provider_email_verified = true and ai.provider <> v_provider)
          or ai.provider = 'local'
        )
    )
    into v_has_link_required_match;

    if v_has_link_required_match then
      return query
      select null::uuid, 'explicit_link_required'::text;
      return;
    end if;
  end if;

  return query
  select null::uuid, 'no_match'::text;
end;
$$;

comment on function app_private.resolve_account_for_external_identity(text, text, text, boolean)
  is 'Resolves by provider subject first; requests explicit link when a local credential or a verified social identity already exists for the provider email.';

commit;