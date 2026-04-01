#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required"
  exit 1
fi

# Bootstrap a migrations tracking table on first run.
psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 <<'SQL'
  create schema if not exists _migrations;
  create table if not exists _migrations.applied (
    filename text primary key,
    applied_at timestamptz not null default now()
  );
SQL

echo "Applying migrations from database/migrations ..."

for file in $(ls database/migrations/*.sql | sort); do
  filename=$(basename "${file}")
  already_applied=$(psql "${DATABASE_URL}" -tAc \
    "select count(*) from _migrations.applied where filename = '${filename}'")
  if [[ "${already_applied}" == "1" ]]; then
    echo "- skipping  ${file} (already applied)"
    continue
  fi
  echo "- applying  ${file}"
  psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -f "${file}"
  psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -c \
    "insert into _migrations.applied (filename) values ('${filename}')"
done

echo "Migrations complete."
