#!/usr/bin/env bash
set -euo pipefail

BOOTSTRAP_FILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --bootstrap-file)
      if [[ $# -lt 2 ]]; then
        echo "--bootstrap-file requires a file path"
        exit 1
      fi
      BOOTSTRAP_FILE="$2"
      shift 2
      ;;
    --help|-h)
      cat <<'USAGE'
Usage: ./database/migrate.sh [--bootstrap-file <schema.sql>]

Modes:
  default                     Apply pending migrations from database/migrations
  --bootstrap-file <file>     Apply consolidated schema file, then mark all
                              migrations currently present as applied.
USAGE
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

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

if [[ -n "${BOOTSTRAP_FILE}" ]]; then
  if [[ ! -f "${BOOTSTRAP_FILE}" ]]; then
    echo "Bootstrap file not found: ${BOOTSTRAP_FILE}"
    exit 1
  fi

  applied_count=$(psql "${DATABASE_URL}" -tAc "select count(*) from _migrations.applied")
  if [[ "${applied_count}" != "0" ]]; then
    echo "Bootstrap mode requires an empty _migrations.applied table"
    echo "Current applied count: ${applied_count}"
    exit 1
  fi

  echo "Applying bootstrap schema: ${BOOTSTRAP_FILE}"
  psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -f "${BOOTSTRAP_FILE}"

  echo "Marking all current migration files as applied ..."
  for file in $(printf '%s\n' database/migrations/*.sql | sort); do
    filename=$(basename "${file}")
    psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -c \
      "insert into _migrations.applied (filename) values ('${filename}') on conflict do nothing"
  done

  echo "Bootstrap complete."
  exit 0
fi

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
