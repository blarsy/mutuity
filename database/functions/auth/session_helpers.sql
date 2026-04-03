create or replace function app_private.find_account_session(p_session_token_hash text)
returns table (
  session_id uuid,
  account_id uuid,
  role_name text,
  expires_at timestamptz,
  display_name text,
  external_subject text
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
    a.external_subject
  from app_private.account_session s
  join app_public.account a on a.id = s.account_id
  where s.session_token_hash = p_session_token_hash
    and s.revoked_at is null
    and s.expires_at > now()
  limit 1
$$;

create or replace function app_private.touch_account_session(p_session_token_hash text)
returns void
language sql
as $$
  update app_private.account_session
  set last_seen_at = now()
  where session_token_hash = p_session_token_hash
    and revoked_at is null
$$;

create or replace function app_private.revoke_account_session(p_session_token_hash text)
returns void
language sql
as $$
  update app_private.account_session
  set revoked_at = coalesce(revoked_at, now())
  where session_token_hash = p_session_token_hash
$$;
