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
begin
  v_provider := app_private.normalize_auth_identifier(p_provider);
  v_subject := app_private.normalize_auth_identifier(p_provider_subject);
  v_email_normalized := app_private.normalize_auth_identifier(p_provider_email);

  if v_provider not in ('google', 'apple') then
    raise exception using message = 'Unsupported identity provider';
  end if;

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

  if p_provider_email_verified = true and v_email_normalized <> '' then
    return query
    select null::uuid, 'explicit_link_required'::text;
    return;
  end if;

  return query
  select null::uuid, 'no_match'::text;
end;
$$;

grant execute on function app_private.resolve_account_for_external_identity(text, text, text, boolean)
  to identified_account, admin;

comment on function app_private.resolve_account_for_external_identity(text, text, text, boolean)
  is 'Resolves account candidates by provider subject only; verified email fallback now requires explicit link confirmation.';

commit;
