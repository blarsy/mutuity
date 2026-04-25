begin;

create table if not exists app_public.system_setting (
  key text primary key,
  value_text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (btrim(key) <> ''),
  check (btrim(value_text) <> '')
);

alter table app_public.system_setting enable row level security;

drop policy if exists system_setting_select_policy on app_public.system_setting;
create policy system_setting_select_policy on app_public.system_setting
  for select
  using (app_private.is_manager());

drop policy if exists system_setting_admin_write_policy on app_public.system_setting;
create policy system_setting_admin_write_policy on app_public.system_setting
  for all
  using (app_private.is_admin())
  with check (app_private.is_admin());

grant select on app_public.system_setting to manager, admin;
grant insert, update on app_public.system_setting to admin;

insert into app_public.system_setting (key, value_text)
values ('operational_log_retention_days', '7')
on conflict (key) do nothing;

create or replace function app_public.get_operational_log_retention_days()
returns integer
language plpgsql
stable
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_value text;
  v_retention integer := 7;
begin
  select s.value_text
  into v_value
  from app_public.system_setting s
  where s.key = 'operational_log_retention_days';

  begin
    if v_value is not null then
      v_retention := greatest(1, least(v_value::integer, 3650));
    end if;
  exception
    when invalid_text_representation then
      v_retention := 7;
  end;

  return v_retention;
end;
$$;

create or replace function app_public.cleanup_operational_logs(
  p_now timestamptz default now()
)
returns integer
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_retention_days integer := app_public.get_operational_log_retention_days();
  v_deleted integer := 0;
begin
  delete from app_public.operational_log
  where created_at < p_now - make_interval(days => v_retention_days);

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

grant execute on function app_public.get_operational_log_retention_days() to manager, admin;
grant execute on function app_public.cleanup_operational_logs(timestamptz) to manager, admin;

comment on table app_public.system_setting is
  'SQL-owned system configuration values used for operational controls such as retention windows.';
comment on function app_public.get_operational_log_retention_days()
  is '@name getOperationalLogRetentionDays';
comment on function app_public.cleanup_operational_logs(timestamptz)
  is '@name cleanupOperationalLogs';

commit;
