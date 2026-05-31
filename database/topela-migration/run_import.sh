#!/usr/bin/env bash
set -euo pipefail

# Usage examples:
#   TARGET_DATABASE_URL=postgres://postgres:postgres@localhost:5432/mutuity \
#   LEGACY_DUMP_PATH=/path/to/backup.dump \
#   ./database/topela-migration/run_import.sh
#
#   TARGET_DATABASE_URL=postgres://postgres:postgres@localhost:5432/mutuity \
#   SOURCE_DATABASE_URL=postgres://postgres:postgres@localhost:5432/topela_legacy \
#   ./database/topela-migration/run_import.sh
#
# Optional target bootstrap (fresh DB + Mutuity migrations):
#   TARGET_DATABASE_URL=postgres://postgres:postgres@localhost:5432/mutuity \
#   CREATE_TARGET_DB=true \
#   TARGET_DB_ADMIN_URL=postgres://postgres:postgres@localhost:5432/postgres \
#   LEGACY_DUMP_PATH=/path/to/backup.dump \
#   ./database/topela-migration/run_import.sh

if [[ -z "${TARGET_DATABASE_URL:-}" ]]; then
  echo "TARGET_DATABASE_URL is required"
  exit 1
fi

CLOUDINARY_BASE_URL="${CLOUDINARY_BASE_URL:-https://res.cloudinary.com/topela/image/upload/}"
SOURCE_DATABASE_URL="${SOURCE_DATABASE_URL:-}"
CREATE_TARGET_DB="${CREATE_TARGET_DB:-false}"
RESET_TARGET_DB="${RESET_TARGET_DB:-false}"
TARGET_DB_ADMIN_URL="${TARGET_DB_ADMIN_URL:-}"

parse_db_name() {
  local db_url="$1"
  db_url="${db_url%%\?*}"
  echo "${db_url##*/}"
}

if [[ "${CREATE_TARGET_DB}" == "true" ]]; then
  if [[ -z "${TARGET_DB_ADMIN_URL}" ]]; then
    echo "TARGET_DB_ADMIN_URL is required when CREATE_TARGET_DB=true"
    exit 1
  fi

  TARGET_DB_NAME="$(parse_db_name "${TARGET_DATABASE_URL}")"
  if [[ -z "${TARGET_DB_NAME}" ]]; then
    echo "Unable to parse target database name from TARGET_DATABASE_URL"
    exit 1
  fi

  if [[ "${RESET_TARGET_DB}" == "true" ]]; then
    echo "[target 1/3] Dropping target database '${TARGET_DB_NAME}' if it exists"
    psql "${TARGET_DB_ADMIN_URL}" -v ON_ERROR_STOP=1 -c "drop database if exists \"${TARGET_DB_NAME}\";"
  fi

  echo "[target 2/3] Creating target database '${TARGET_DB_NAME}' if missing"
  TARGET_DB_EXISTS="$(psql "${TARGET_DB_ADMIN_URL}" -v ON_ERROR_STOP=1 -tAc "select 1 from pg_database where datname = '${TARGET_DB_NAME}'")"
  if [[ "${TARGET_DB_EXISTS}" != "1" ]]; then
    psql "${TARGET_DB_ADMIN_URL}" -v ON_ERROR_STOP=1 -c "create database \"${TARGET_DB_NAME}\";"
  fi

  echo "[target 3/3] Applying Mutuity schema migrations on target database"
  DATABASE_URL="${TARGET_DATABASE_URL}" ./database/migrate.sh
fi

if [[ -z "${SOURCE_DATABASE_URL}" ]]; then
  if [[ -z "${LEGACY_DUMP_PATH:-}" ]]; then
    echo "Either SOURCE_DATABASE_URL or LEGACY_DUMP_PATH is required"
    exit 1
  fi

  LEGACY_RESTORE_DATABASE="${LEGACY_RESTORE_DATABASE:-topela_legacy_restore}"
  SOURCE_DB_HOST="${SOURCE_DB_HOST:-localhost}"
  SOURCE_DB_PORT="${SOURCE_DB_PORT:-5432}"
  SOURCE_DB_USER="${SOURCE_DB_USER:-postgres}"
  SOURCE_DB_PASSWORD="${SOURCE_DB_PASSWORD:-}"

  echo "[1/3] Recreating local restore database '${LEGACY_RESTORE_DATABASE}'"
  if [[ -n "${SOURCE_DB_PASSWORD}" ]]; then
    PGPASSWORD="${SOURCE_DB_PASSWORD}" dropdb --if-exists -h "${SOURCE_DB_HOST}" -p "${SOURCE_DB_PORT}" -U "${SOURCE_DB_USER}" "${LEGACY_RESTORE_DATABASE}" || true
    PGPASSWORD="${SOURCE_DB_PASSWORD}" createdb -h "${SOURCE_DB_HOST}" -p "${SOURCE_DB_PORT}" -U "${SOURCE_DB_USER}" "${LEGACY_RESTORE_DATABASE}"
  else
    dropdb --if-exists -h "${SOURCE_DB_HOST}" -p "${SOURCE_DB_PORT}" -U "${SOURCE_DB_USER}" "${LEGACY_RESTORE_DATABASE}" || true
    createdb -h "${SOURCE_DB_HOST}" -p "${SOURCE_DB_PORT}" -U "${SOURCE_DB_USER}" "${LEGACY_RESTORE_DATABASE}"
  fi

  echo "[2/3] Restoring legacy custom-format dump"
  # Pre-check: ensure legacy dump file exists and is readable
  if [[ ! -r "${LEGACY_DUMP_PATH}" ]]; then
    echo "[ERROR] Legacy dump file '${LEGACY_DUMP_PATH}' does not exist or is not readable."
    ls -l "${LEGACY_DUMP_PATH}" 2>/dev/null || ls -l "$(dirname "${LEGACY_DUMP_PATH}")"
    echo "[INFO] Checking for macOS extended attributes (quarantine, etc.):"
    command -v xattr >/dev/null 2>&1 && xattr -l "${LEGACY_DUMP_PATH}" || echo "xattr not available"
    echo "[HINT] If you see 'com.apple.quarantine', try: xattr -d com.apple.quarantine '${LEGACY_DUMP_PATH}'"
    exit 1
  fi
  # Temporarily disable 'exit on error' to allow pg_restore to complete even if it returns non-zero (e.g., for ignorable errors)
  set +e
  if [[ -n "${SOURCE_DB_PASSWORD}" ]]; then
    PGPASSWORD="${SOURCE_DB_PASSWORD}" pg_restore \
      --no-owner \
      --no-privileges \
      --clean \
      --if-exists \
      -h "${SOURCE_DB_HOST}" \
      -p "${SOURCE_DB_PORT}" \
      -U "${SOURCE_DB_USER}" \
      -d "${LEGACY_RESTORE_DATABASE}" \
      "${LEGACY_DUMP_PATH}"
  else
    pg_restore \
      --no-owner \
      --no-privileges \
      --clean \
      --if-exists \
      -h "${SOURCE_DB_HOST}" \
      -p "${SOURCE_DB_PORT}" \
      -U "${SOURCE_DB_USER}" \
      -d "${LEGACY_RESTORE_DATABASE}" \
      "${LEGACY_DUMP_PATH}"
  fi
  RESTORE_EXIT_CODE=$?
  set -e
  if [[ $RESTORE_EXIT_CODE -ne 0 ]]; then
    echo "[WARN] pg_restore exited with code $RESTORE_EXIT_CODE. This may be due to ignorable errors (e.g., unrecognized SET commands). Continuing with import."
  fi

  if [[ -n "${SOURCE_DB_PASSWORD}" ]]; then
    SOURCE_DATABASE_URL="postgresql://${SOURCE_DB_USER}:${SOURCE_DB_PASSWORD}@${SOURCE_DB_HOST}:${SOURCE_DB_PORT}/${LEGACY_RESTORE_DATABASE}"
  else
    SOURCE_DATABASE_URL="postgresql://${SOURCE_DB_USER}@${SOURCE_DB_HOST}:${SOURCE_DB_PORT}/${LEGACY_RESTORE_DATABASE}"
  fi
fi


echo "[3/3] Running atomic accounts/resources import"
# Force psql to never use a pager and suppress extra output
export PSQL_PAGER=""
psql "${TARGET_DATABASE_URL}" \
  -v ON_ERROR_STOP=1 \
  -v source_db_url="${SOURCE_DATABASE_URL}" \
  -v cloudinary_base_url="${CLOUDINARY_BASE_URL}" \
  -q -X \
  -f ./database/topela-migration/import_accounts_resources.sql

echo "Import completed successfully."

echo "Note: Legacy md5-crypt passwords are not bcrypt-compatible."
echo "Affected users must use password-recovery on first login."
