#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

DB_URL="${DATABASE_URL:-postgres://postgres:postgres@localhost:5432/mutuity}"

echo "[e2e] Starting local stack services (postgres, backend, frontend)..."
docker compose up -d postgres

echo "[e2e] Applying migrations..."
DATABASE_URL="${DB_URL}" ./database/migrate.sh

if curl -fsS "http://localhost:5050/health" >/dev/null; then
  echo "[e2e] Reusing existing backend on :5050"
else
  echo "[e2e] Starting backend container..."
  docker compose up -d backend
fi

if curl -fsS "http://localhost:3000" >/dev/null; then
  echo "[e2e] Reusing existing frontend on :3000"
else
  echo "[e2e] Starting frontend container..."
  docker compose up -d frontend
fi

echo "[e2e] Waiting for backend health endpoint..."
for i in {1..60}; do
  if curl -fsS "http://localhost:5050/health" >/dev/null; then
    break
  fi
  sleep 1
  if [[ "$i" -eq 60 ]]; then
    echo "Backend did not become healthy in time"
    exit 1
  fi
done

echo "[e2e] Waiting for frontend..."
for i in {1..60}; do
  if curl -fsS "http://localhost:3000" >/dev/null; then
    break
  fi
  sleep 1
  if [[ "$i" -eq 60 ]]; then
    echo "Frontend did not become ready in time"
    exit 1
  fi
done

echo "[e2e] Seeding smoke users/data..."
DATABASE_URL="${DB_URL}" node ./e2e/scripts/seed-smoke-users.mjs

echo "[e2e] Running smoke scenarios..."
E2E_BASE_URL="${E2E_BASE_URL:-http://localhost:3000}" npm run test:e2e:smoke

echo "[e2e] Smoke sanity run completed successfully."
