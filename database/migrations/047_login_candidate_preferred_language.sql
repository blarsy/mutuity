begin;

-- Add preferred_language to the login candidate lookup so it can be persisted to the session.
drop function if exists app_private.find_login_candidate(text);

create or replace function app_private.find_login_candidate(p_identifier text)
returns table (
  account_id uuid,
  display_name text,
  external_subject text,
  avatar_url text,
  password_hash text,
  role_name text,
  email_verified_at timestamptz,
  preferred_language text
)
language sql
stable
as $$
  select
    a.id,
    a.display_name,
    a.external_subject,
    a.avatar_url,
    c.password_hash,
    c.role_name,
    c.email_verified_at,
    a.preferred_language
  from app_private.account_credential c
  join app_public.account a on a.id = c.account_id
  where lower(c.login_identifier) = lower(p_identifier)
    and c.is_active = true
  limit 1
$$;

revoke all on function app_private.find_login_candidate(text) from public;

commit;
