begin;

create table if not exists app_private.account_credential (
  account_id uuid primary key references app_public.account(id) on delete cascade,
  login_identifier text not null,
  password_hash text not null,
  role_name text not null default 'identified_account'
    check (role_name in ('identified_account', 'manager', 'admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists account_credential_login_identifier_key
  on app_private.account_credential (lower(login_identifier));

drop trigger if exists trg_account_credential_set_updated_at on app_private.account_credential;
create trigger trg_account_credential_set_updated_at
  before update on app_private.account_credential
  for each row
  execute function app_private.set_updated_at();

create table if not exists app_private.account_session (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references app_public.account(id) on delete cascade,
  role_name text not null default 'identified_account'
    check (role_name in ('identified_account', 'manager', 'admin')),
  session_token_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists account_session_account_id_idx
  on app_private.account_session (account_id);

create index if not exists account_session_active_lookup_idx
  on app_private.account_session (session_token_hash, expires_at)
  where revoked_at is null;

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

comment on table app_private.account_credential is
  'Private account login credentials used for browser authentication.';

comment on table app_private.account_session is
  'Server-managed browser sessions identified by hashed session tokens.';

commit;
