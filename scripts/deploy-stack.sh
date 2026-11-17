#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: bash scripts/deploy-stack.sh <test|review|prod> [backend|worker|frontend ...]" >&2
  exit 2
}

[[ $# -ge 1 ]] || usage
environment="$1"
shift
case "$environment" in test|review|prod) ;; *) usage ;; esac
services=("$@")
if [[ ${#services[@]} -eq 0 ]]; then services=(backend worker frontend); fi
for service in "${services[@]}"; do
  case "$service" in backend|worker|frontend) ;; *) usage ;; esac
done

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"
env_file=".env.$environment"
[[ -f "$env_file" ]] || { echo "Missing $env_file; configure it from its example first." >&2; exit 1; }
readiness_timeout="${DEPLOY_READINESS_TIMEOUT_SECONDS:-180}"
[[ "$readiness_timeout" =~ ^[1-9][0-9]*$ ]] || { echo "Readiness timeout must be a positive integer." >&2; exit 2; }

# mkdir is atomic and works on Linux and macOS without an extra flock dependency.
# Keep this outside the build context. Never automatically steal a stale lock.
lock_key="$(printf '%s' "$repo_root" | cksum | awk '{print $1}')"
lock_dir="${TMPDIR:-/tmp}/mutuity-deploy-$lock_key-$environment.lock"
if ! mkdir "$lock_dir" 2>/dev/null; then
  echo "Deployment locked: $lock_dir. If a previous process was killed, confirm it has stopped before removing the lock." >&2
  exit 1
fi
trap 'rmdir "$lock_dir"' EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# Fixed projects match the runbook; never operate on ingress or another stack.
compose=(docker compose -p "mutuity-$environment" -f docker-compose.prod.yml --env-file "$env_file")
export DOCKER_BUILDKIT=1
# Avoid simultaneous frontend/backend compilation starving the live app on a VPS.
export COMPOSE_PARALLEL_LIMIT="${COMPOSE_PARALLEL_LIMIT:-1}"

wait_for_services() {
  local deadline=$((SECONDS + readiness_timeout)) service ids id state ready
  while true; do
    ready=true
    for service in "$@"; do
      ids="$("${compose[@]}" ps -a -q "$service")"
      if [[ -z "$ids" ]]; then ready=false; continue; fi
      for id in $ids; do
        state="$(docker inspect --format '{{.State.Status}}|{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$id")"
        case "$state" in
          running\|healthy|running\|none) ;;
          exited\|*|dead\|*|*\|unhealthy)
            echo "$service failed readiness ($state). Inspect its logs; no automatic rollback was attempted." >&2
            return 1 ;;
          *) ready=false ;;
        esac
      done
    done
    if [[ "$ready" == true ]]; then return 0; fi
    if (( SECONDS >= deadline )); then
      echo "Readiness timed out for: $*. Inspect service status/logs; no automatic rollback was attempted." >&2
      return 1
    fi
    sleep 2
  done
}

echo "Validating $environment configuration (without printing secrets)..."
"${compose[@]}" config --quiet
echo "Building ${services[*]} while existing services remain running..."
"${compose[@]}" build "${services[@]}"

# Only after ALL builds succeed may we touch the database. Do not recreate an
# existing PostgreSQL container just because its configuration/image changed.
echo "Starting PostgreSQL if needed, then applying migrations..."
"${compose[@]}" up -d --no-recreate postgres
wait_for_services postgres
"${compose[@]}" run --rm --no-deps migrate

echo "Replacing ${services[*]} using the prepared images (no build, no ingress changes)..."
# Recreate even for SQL-only releases: PostGraphile schema watching is disabled.
"${compose[@]}" up -d --no-build --no-deps --force-recreate "${services[@]}"
wait_for_services "${services[@]}"
echo "Deployment ready. Backend/frontend use container healthchecks; worker is checked for running state only."
echo "Verify public health, GraphQL/WebSocket, OAuth and worker task registration before releasing traffic."