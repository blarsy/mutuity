begin;

alter table app_private.account_credential
  add column if not exists email_verified_at timestamptz;

-- Preserve current behavior for existing local credentials; new registrations set this to null.
update app_private.account_credential
set email_verified_at = coalesce(email_verified_at, now());

create table if not exists app_private.account_auth_token (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references app_public.account(id) on delete cascade,
  token_kind text not null check (token_kind in ('email_verification', 'password_reset')),
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz
);

create index if not exists account_auth_token_account_kind_idx
  on app_private.account_auth_token (account_id, token_kind, created_at desc);

create index if not exists account_auth_token_lookup_idx
  on app_private.account_auth_token (token_hash, token_kind, expires_at)
  where consumed_at is null;

drop function if exists app_private.find_login_candidate(text);

create or replace function app_private.find_login_candidate(p_identifier text)
returns table (
  account_id uuid,
  display_name text,
  external_subject text,
  avatar_url text,
  password_hash text,
  role_name text,
  email_verified_at timestamptz
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
    c.email_verified_at
  from app_private.account_credential c
  join app_public.account a on a.id = c.account_id
  where lower(c.login_identifier) = lower(p_identifier)
    and c.is_active = true
  limit 1
$$;

create or replace function app_private.revoke_account_sessions(
  p_account_id uuid,
  p_except_session_id uuid default null
)
returns void
language sql
as $$
  update app_private.account_session
  set revoked_at = coalesce(revoked_at, now())
  where account_id = p_account_id
    and revoked_at is null
    and (p_except_session_id is null or id <> p_except_session_id)
$$;

revoke all on function app_private.revoke_account_sessions(uuid, uuid) from public;

comment on table app_private.account_auth_token is
  'One-time tokens for local email verification and password reset flows.';

commit;
