#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required"
  exit 1
fi

OUT_FILE="${1:-database/bootstrap/schema.sql}"
OUT_DIR="$(dirname "${OUT_FILE}")"
TMP_FILE="$(mktemp)"

cleanup() {
  rm -f "${TMP_FILE}"
}
trap cleanup EXIT

mkdir -p "${OUT_DIR}"

# Export a schema-only snapshot suitable for bootstrap installs.
# Exclude migration bookkeeping so bootstrap can recreate tracking state itself.
pg_dump "${DATABASE_URL}" \
  --schema-only \
  --no-owner \
  --exclude-schema=_migrations \
  --file "${TMP_FILE}"

# Remove pg_dump output settings that are version-specific and can break when
# bootstrapping on an older PostgreSQL server.
grep -vE '^SET transaction_timeout = ' "${TMP_FILE}" > "${OUT_FILE}"

echo "Bootstrap schema written to ${OUT_FILE}"
