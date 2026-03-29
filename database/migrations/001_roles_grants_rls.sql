begin;

create extension if not exists pgcrypto;

create schema if not exists app_public;
create schema if not exists app_private;
create schema if not exists audit;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anonymous') then
    create role anonymous nologin;
  end if;

  if not exists (select 1 from pg_roles where rolname = 'identified_account') then
    create role identified_account nologin;
  end if;

  if not exists (select 1 from pg_roles where rolname = 'manager') then
    create role manager nologin;
  end if;

  if not exists (select 1 from pg_roles where rolname = 'admin') then
    create role admin nologin;
  end if;
end;
$$;

grant usage on schema app_public to anonymous, identified_account, manager, admin;
grant usage on schema app_private to identified_account, manager, admin;
grant usage on schema audit to manager, admin;

create or replace function app_private.current_account_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('jwt.claims.account_id', true), '')::uuid
$$;

create or replace function app_private.current_role()
returns text
language sql
stable
as $$
  select coalesce(nullif(current_setting('jwt.claims.role', true), ''), current_user)
$$;

create or replace function app_private.is_admin()
returns boolean
language sql
stable
as $$
  select app_private.current_role() = 'admin'
$$;

create or replace function app_private.is_manager()
returns boolean
language sql
stable
as $$
  select app_private.current_role() in ('manager', 'admin')
$$;

grant execute on function app_private.current_account_id() to identified_account, manager, admin;
grant execute on function app_private.current_role() to anonymous, identified_account, manager, admin;
grant execute on function app_private.is_admin() to identified_account, manager, admin;
grant execute on function app_private.is_manager() to identified_account, manager, admin;

create table if not exists app_public.account (
  id uuid primary key default gen_random_uuid(),
  external_subject text unique not null,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table app_public.account enable row level security;

create policy account_select_policy on app_public.account
  for select
  using (
    id = app_private.current_account_id()
    or app_private.is_admin()
  );

create policy account_insert_policy on app_public.account
  for insert
  with check (
    id = app_private.current_account_id()
    or app_private.is_admin()
  );

create policy account_update_policy on app_public.account
  for update
  using (
    id = app_private.current_account_id()
    or app_private.is_admin()
  )
  with check (
    id = app_private.current_account_id()
    or app_private.is_admin()
  );

grant select, insert, update on app_public.account to identified_account, manager, admin;

commit;
