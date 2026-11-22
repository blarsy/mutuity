begin;

create table app_private.support_report (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default clock_timestamp(),
  account_id uuid references app_public.account(id) on delete set null,
  summary text not null check (summary ~ '[^[:space:]]' and char_length(summary) <= 200),
  description text check (char_length(description) <= 8000),
  diagnostics jsonb not null default '{}'::jsonb
    check (jsonb_typeof(diagnostics) = 'object' and octet_length(diagnostics::text) <= 16384)
);
create index support_report_account_created_idx on app_private.support_report (account_id, created_at desc);
create index support_report_created_idx on app_private.support_report (created_at desc, id desc);
alter table app_private.support_report enable row level security;
revoke all on app_private.support_report from public, anonymous, identified_account, admin;

-- Updating this row serializes submissions and causes a serialization failure
-- instead of a stale count under REPEATABLE READ / SERIALIZABLE.
create table app_private.support_report_rate_lock (
  account_id uuid primary key references app_public.account(id) on delete cascade,
  touched_at timestamptz not null
);
alter table app_private.support_report_rate_lock enable row level security;
revoke all on app_private.support_report_rate_lock from public, anonymous, identified_account, admin;

-- Snapshot of functions/support/support_reports.sql.
-- Report content is only accessible through these functions, never raw CRUD.
create or replace function app_public.submit_support_report(
  p_summary text,
  p_description text default null,
  p_diagnostics jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
volatile
security definer
set search_path = pg_catalog, app_public, app_private
as $$
declare
  v_account_id uuid := app_private.current_account_id();
  v_summary text := btrim(p_summary);
  v_description text := nullif(btrim(p_description), '');
  v_diagnostics jsonb := coalesce(p_diagnostics, '{}'::jsonb);
  v_now timestamptz;
  v_id uuid;
  v_admin record;
begin
  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;
  if v_summary is null or v_summary !~ '[^[:space:]]' or char_length(v_summary) > 200 then
    raise exception using message = 'Support report summary must be between 1 and 200 characters';
  end if;
  if char_length(v_description) > 8000 then
    raise exception using message = 'Support report description must be 8000 characters or fewer';
  end if;
  if jsonb_typeof(v_diagnostics) <> 'object' or octet_length(v_diagnostics::text) > 16384 then
    raise exception using message = 'Support report diagnostics must be an object of at most 16384 bytes';
  end if;

  perform 1 from app_public.account a where a.id = v_account_id;
  if not found then
    raise exception using message = 'Authentication required';
  end if;
  -- The write serializes this account's submissions; stricter isolation levels
  -- fail rather than allowing a stale snapshot to bypass the limit.
  insert into app_private.support_report_rate_lock (account_id, touched_at)
  values (v_account_id, clock_timestamp())
  on conflict (account_id) do update set touched_at = excluded.touched_at;
  v_now := clock_timestamp();
  if (select count(*) from app_private.support_report r
      where r.account_id = v_account_id and r.created_at > v_now - interval '1 hour') >= 5 then
    raise exception using message = 'Support report rate limit exceeded';
  end if;

  insert into app_private.support_report (account_id, summary, description, diagnostics, created_at)
  values (v_account_id, v_summary, v_description, v_diagnostics, v_now)
  returning id into v_id;

  -- This is part of the same transaction, including notification triggers.
  for v_admin in select a.id from app_public.account a where a.role_name = 'admin' loop
    perform app_private.create_account_notification(
      v_admin.id, 'support_report_created', jsonb_build_object('reportId', v_id)
    );
  end loop;
  return v_id;
end;
$$;

create or replace function app_public.admin_list_support_reports(
  p_search text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  id uuid,
  created_at timestamptz,
  account_id uuid,
  account_name text,
  summary text,
  description text,
  diagnostics jsonb,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = pg_catalog, app_public, app_private
as $$
declare
  v_account_id uuid := app_private.current_account_id();
  v_search text := nullif(btrim(p_search), '');
  v_limit integer := greatest(1, least(coalesce(p_limit, 50), 500));
  v_offset integer := greatest(0, coalesce(p_offset, 0));
begin
  if not app_private.is_admin() or v_account_id is null or not exists (
    select 1 from app_public.account a where a.id = v_account_id and a.role_name = 'admin'
  ) then
    raise exception using message = 'Only administrators can access admin support data';
  end if;

  return query
  select r.id, r.created_at, r.account_id, a.display_name, r.summary,
    r.description, r.diagnostics, count(*) over ()
  from app_private.support_report r
  left join app_public.account a on a.id = r.account_id
  where v_search is null
    or strpos(lower(r.summary), lower(v_search)) > 0
    or strpos(lower(coalesce(r.description, '')), lower(v_search)) > 0
    or strpos(lower(coalesce(a.display_name, '')), lower(v_search)) > 0
    or strpos(r.id::text, lower(v_search)) > 0
  order by r.created_at desc, r.id desc
  limit v_limit offset v_offset;
end;
$$;

revoke all on function app_public.submit_support_report(text, text, jsonb) from public, anonymous;
grant execute on function app_public.submit_support_report(text, text, jsonb) to identified_account, admin;
revoke all on function app_public.admin_list_support_reports(text, integer, integer) from public, anonymous, identified_account;
grant execute on function app_public.admin_list_support_reports(text, integer, integer) to admin;

-- Reports can contain personal data and cannot be reliably anonymized as free text.
create or replace function app_private.remove_deleted_account_support_reports()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, app_private
as $$
begin
  delete from app_private.support_report where account_id = new.id;
  delete from app_private.support_report_rate_lock where account_id = new.id;
  return new;
end;
$$;

revoke all on function app_private.remove_deleted_account_support_reports() from public, anonymous, identified_account, admin;
drop trigger if exists trg_remove_deleted_account_support_reports on app_public.account;
create trigger trg_remove_deleted_account_support_reports
  after update of external_subject on app_public.account
  for each row
  when (new.external_subject like 'deleted-%' and old.external_subject is distinct from new.external_subject)
  execute function app_private.remove_deleted_account_support_reports();

commit;