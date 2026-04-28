begin;

-- Consolidate persisted role assignments to admin-only semantics.
update app_private.account_credential
set role_name = 'admin'
where role_name = 'manager';

update app_private.account_session
set role_name = 'admin'
where role_name = 'manager';

alter table app_private.account_credential
  drop constraint if exists account_credential_role_name_check;

alter table app_private.account_credential
  add constraint account_credential_role_name_check
  check (role_name in ('identified_account', 'admin'));

alter table app_private.account_session
  drop constraint if exists account_session_role_name_check;

alter table app_private.account_session
  add constraint account_session_role_name_check
  check (role_name in ('identified_account', 'admin'));

-- Keep is_manager for backward compatibility, but map it to admin-only behavior.
create or replace function app_private.is_manager()
returns boolean
language sql
stable
as $$
  select app_private.current_role() = 'admin'
$$;

revoke execute on function app_private.current_account_id() from manager;
revoke execute on function app_private.current_role() from manager;
revoke execute on function app_private.is_admin() from manager;
revoke execute on function app_private.is_manager() from manager;

-- Remove all direct SQL privileges from the legacy manager role.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'manager') then
    revoke usage on schema app_public from manager;
    revoke usage on schema app_private from manager;
    revoke usage on schema audit from manager;

    revoke all privileges on all tables in schema app_public from manager;
    revoke all privileges on all tables in schema app_private from manager;
    revoke all privileges on all tables in schema audit from manager;

    revoke all privileges on all sequences in schema app_public from manager;
    revoke all privileges on all sequences in schema app_private from manager;
    revoke all privileges on all sequences in schema audit from manager;

    revoke all privileges on all functions in schema app_public from manager;
    revoke all privileges on all functions in schema app_private from manager;
    revoke all privileges on all functions in schema audit from manager;

    reassign owned by manager to admin;
    drop owned by manager;
    drop role manager;
  end if;
end;
$$;

commit;
