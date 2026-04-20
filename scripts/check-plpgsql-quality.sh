#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required"
  exit 1
fi

SCHEMAS_CSV="${DB_CHECK_SCHEMAS:-app_public,app_private}"

echo "Running plpgsql_check for schemas: ${SCHEMAS_CSV}"

psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -v schemas_csv="${SCHEMAS_CSV}" <<'SQL'
create extension if not exists plpgsql_check;

with non_trigger_findings as (
  select
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as function_args,
    c.level,
    c.sqlstate,
    c.message,
    c.detail,
    c.hint,
    null::text as trigger_table
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  join pg_language l on l.oid = p.prolang
  cross join lateral plpgsql_check_function_tb(p.oid) c
  where l.lanname = 'plpgsql'
    and n.nspname = any (string_to_array(:'schemas_csv', ','))
    and p.prorettype <> 'pg_catalog.trigger'::regtype
),
trigger_findings as (
  select
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as function_args,
    c.level,
    c.sqlstate,
    c.message,
    c.detail,
    c.hint,
    format('%I.%I', tn.nspname, tc.relname) as trigger_table
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  join pg_language l on l.oid = p.prolang
  join pg_trigger t on t.tgfoid = p.oid and t.tgisinternal = false
  join pg_class tc on tc.oid = t.tgrelid
  join pg_namespace tn on tn.oid = tc.relnamespace
  cross join lateral plpgsql_check_function_tb(p.oid, t.tgrelid) c
  where l.lanname = 'plpgsql'
    and n.nspname = any (string_to_array(:'schemas_csv', ','))
    and p.prorettype = 'pg_catalog.trigger'::regtype
),
findings as (
  select * from non_trigger_findings
  union all
  select * from trigger_findings
)
select *
from findings
order by schema_name, function_name, function_args, trigger_table, level, message;
SQL

error_count=$(psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -v schemas_csv="${SCHEMAS_CSV}" -At <<'SQL'
with non_trigger_findings as (
  select c.level
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  join pg_language l on l.oid = p.prolang
  cross join lateral plpgsql_check_function_tb(p.oid) c
  where l.lanname = 'plpgsql'
    and n.nspname = any (string_to_array(:'schemas_csv', ','))
    and p.prorettype <> 'pg_catalog.trigger'::regtype
),
trigger_findings as (
  select c.level
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  join pg_language l on l.oid = p.prolang
  join pg_trigger t on t.tgfoid = p.oid and t.tgisinternal = false
  cross join lateral plpgsql_check_function_tb(p.oid, t.tgrelid) c
  where l.lanname = 'plpgsql'
    and n.nspname = any (string_to_array(:'schemas_csv', ','))
    and p.prorettype = 'pg_catalog.trigger'::regtype
),
findings as (
  select level from non_trigger_findings
  union all
  select level from trigger_findings
)
select count(*)
from findings
where lower(level) in ('error', 'fatal');
SQL
)

if [[ "${error_count}" != "0" ]]; then
  echo "plpgsql_check reported ${error_count} error(s)."
  exit 1
fi

echo "plpgsql_check passed with no error-level findings."
