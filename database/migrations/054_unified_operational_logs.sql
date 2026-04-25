begin;

create table if not exists app_public.operational_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  level text not null check (level in ('debug', 'info', 'warn', 'error')),
  component text not null check (component in ('mobile_app', 'backoffice_web', 'web_api', 'worker_job')),
  message text not null,
  context text,
  account_id uuid references app_public.account(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists operational_log_created_at_idx
  on app_public.operational_log (created_at desc);

create index if not exists operational_log_component_created_at_idx
  on app_public.operational_log (component, created_at desc);

create index if not exists operational_log_level_created_at_idx
  on app_public.operational_log (level, created_at desc);

create index if not exists operational_log_context_created_at_idx
  on app_public.operational_log (context, created_at desc)
  where context is not null;

create index if not exists operational_log_account_created_at_idx
  on app_public.operational_log (account_id, created_at desc)
  where account_id is not null;

alter table app_public.operational_log enable row level security;

drop policy if exists operational_log_select_policy on app_public.operational_log;
create policy operational_log_select_policy on app_public.operational_log
  for select
  using (app_private.is_manager());

grant select on app_public.operational_log to manager, admin;

create or replace function app_private.write_operational_log(
  p_level text,
  p_component text,
  p_message text,
  p_context text default null,
  p_account_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_level text;
  v_component text;
  v_message text;
  v_id uuid;
begin
  v_level := lower(coalesce(p_level, ''));
  v_component := lower(coalesce(p_component, ''));
  v_message := btrim(coalesce(p_message, ''));

  if v_level not in ('debug', 'info', 'warn', 'error') then
    raise exception using message = 'Unsupported operational log level';
  end if;

  if v_component not in ('mobile_app', 'backoffice_web', 'web_api', 'worker_job') then
    raise exception using message = 'Unsupported operational log component';
  end if;

  if v_message = '' then
    raise exception using message = 'Operational log message is required';
  end if;

  insert into app_public.operational_log (
    level,
    component,
    message,
    context,
    account_id,
    metadata
  )
  values (
    v_level,
    v_component,
    v_message,
    nullif(btrim(coalesce(p_context, '')), ''),
    p_account_id,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function app_public.write_operational_log(
  p_level text,
  p_component text,
  p_message text,
  p_context text default null,
  p_account_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language sql
security definer
set search_path = app_public, app_private, public
as $$
  select app_private.write_operational_log(
    p_level,
    p_component,
    p_message,
    p_context,
    p_account_id,
    p_metadata
  )
$$;

create or replace function app_public.search_operational_logs(
  p_component text default null,
  p_level text default null,
  p_context text default null,
  p_account_id uuid default null,
  p_limit integer default 100,
  p_offset integer default 0
)
returns table (
  id uuid,
  created_at timestamptz,
  level text,
  component text,
  message text,
  context text,
  account_id uuid,
  metadata jsonb
)
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_limit integer;
  v_offset integer;
  v_component text;
  v_level text;
  v_context text;
begin
  v_limit := greatest(1, least(coalesce(p_limit, 100), 500));
  v_offset := greatest(0, coalesce(p_offset, 0));
  v_component := nullif(lower(coalesce(p_component, '')), '');
  v_level := nullif(lower(coalesce(p_level, '')), '');
  v_context := nullif(btrim(coalesce(p_context, '')), '');

  if v_component is not null and v_component not in ('mobile_app', 'backoffice_web', 'web_api', 'worker_job') then
    raise exception using message = 'Unsupported operational log component filter';
  end if;

  if v_level is not null and v_level not in ('debug', 'info', 'warn', 'error') then
    raise exception using message = 'Unsupported operational log level filter';
  end if;

  return query
  select
    l.id,
    l.created_at,
    l.level,
    l.component,
    l.message,
    l.context,
    l.account_id,
    l.metadata
  from app_public.operational_log l
  where (v_component is null or l.component = v_component)
    and (v_level is null or l.level = v_level)
    and (p_account_id is null or l.account_id = p_account_id)
    and (v_context is null or l.context ilike ('%' || v_context || '%'))
  order by l.created_at desc
  limit v_limit
  offset v_offset;
end;
$$;

grant execute on function app_public.write_operational_log(text, text, text, text, uuid, jsonb)
  to anonymous, identified_account, manager, admin;
grant execute on function app_public.search_operational_logs(text, text, text, uuid, integer, integer)
  to manager, admin;

grant execute on function app_private.write_operational_log(text, text, text, text, uuid, jsonb)
  to identified_account, manager, admin;

comment on table app_public.operational_log is
  'Unified operational log sink for mobile app, backoffice web, web API, and worker jobs.';

comment on function app_public.write_operational_log(text, text, text, text, uuid, jsonb)
  is '@name writeOperationalLog';
comment on function app_public.search_operational_logs(text, text, text, uuid, integer, integer)
  is '@name searchOperationalLogs';

revoke all on function app_private.write_operational_log(text, text, text, text, uuid, jsonb) from public;

commit;
