begin;

-- Add preferred_language to the session lookup so AuthSessionAccount can expose it.
drop function if exists app_private.find_account_session(text);

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
    c.email_verified_at,
    a.preferred_language
  from app_private.account_session s
  join app_public.account a on a.id = s.account_id
  left join lateral (
    select ac.email_verified_at
    from app_private.account_credential ac
    where ac.account_id = s.account_id
      and ac.is_active = true
    order by ac.created_at asc
    limit 1
  ) c on true
  where s.session_token_hash = p_session_token_hash
    and s.revoked_at is null
    and s.expires_at > now()
  limit 1;
$$;

revoke all on function app_private.find_account_session(text) from public;

commit;
