#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: bash scripts/deploy-stack.sh <test|review|prod> [--images <release.env>] [backend|worker|frontend ...]" >&2
  exit 2
}

[[ $# -ge 1 ]] || usage
environment="$1"
shift
case "$environment" in test|review|prod) ;; *) usage ;; esac
release_file=""
if [[ "${1:-}" == "--images" ]]; then
  [[ $# -ge 2 ]] || usage
  # Resolve before changing directories, so caller-relative paths work.
  release_file="$(cd "$(dirname "$2")" && pwd)/$(basename "$2")"
  shift 2
fi
services=("$@")
if [[ ${#services[@]} -eq 0 ]]; then services=(backend worker frontend); fi
for service in "${services[@]}"; do
  case "$service" in backend|worker|frontend) ;; *) usage ;; esac
done

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"
env_file=".env.$environment"
[[ -f "$env_file" ]] || { echo "Missing $env_file; configure it from its example first." >&2; exit 1; }
if [[ -n "$release_file" ]]; then
  [[ -f "$release_file" ]] || { echo "Missing release manifest." >&2; exit 1; }
  # Never source/eval downloaded files. Reject unknown, duplicate or unsafe input.
  unset RELEASE_COMMIT RELEASE_ENVIRONMENT BACKEND_IMAGE FRONTEND_IMAGE
  while IFS= read -r line || [[ -n "$line" ]]; do
    key="${line%%=*}"
    value="${line#*=}"
    case "$key" in
      RELEASE_COMMIT|RELEASE_ENVIRONMENT|BACKEND_IMAGE|FRONTEND_IMAGE) ;;
      *) echo "Unknown manifest field." >&2; exit 1 ;;
    esac
    if [[ "$line" != *=* || -n "${!key:-}" ]]; then echo "Invalid/duplicate manifest field." >&2; exit 1; fi
    case "$key" in
      RELEASE_COMMIT) [[ "$value" =~ ^[a-f0-9]{40}$ ]] || { echo "Invalid release commit." >&2; exit 1; } ;;
      RELEASE_ENVIRONMENT) [[ "$value" == "$environment" ]] || { echo "Release environment mismatch." >&2; exit 1; } ;;
      *) [[ "$value" =~ ^ghcr\.io/[a-z0-9._/-]+@sha256:[a-f0-9]{64}$ ]] || { echo "Expected an immutable GHCR digest." >&2; exit 1; } ;;
    esac
    printf -v "$key" '%s' "$value"
  done < "$release_file"
  if [[ -z "${RELEASE_COMMIT:-}" || "${RELEASE_ENVIRONMENT:-}" != "$environment" || "$(git rev-parse HEAD)" != "$RELEASE_COMMIT" ]]; then
    echo "Release commit/environment must match this checkout and target." >&2; exit 1
  fi
  # Untracked (non-ignored) files can include migrations; fail closed.
  if [[ -n "$(git status --porcelain --untracked-files=normal)" ]]; then
    echo "Image deployment requires a clean release checkout; keep live envs/manifests ignored or outside it." >&2; exit 1
  fi
  for service in "${services[@]}"; do
    if [[ "$service" == frontend ]]; then image="${FRONTEND_IMAGE:-}"; else image="${BACKEND_IMAGE:-}"; fi
    [[ -n "$image" ]] || { echo "Manifest has no image for $service; select only published services." >&2; exit 1; }
  done
  export BACKEND_IMAGE="${BACKEND_IMAGE:-}" FRONTEND_IMAGE="${FRONTEND_IMAGE:-}"
  # Runtime monitoring release follows the compiled client release.
  export SENTRY_RELEASE="$RELEASE_COMMIT"
fi
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
if [[ -n "$release_file" ]]; then compose+=(-f docker-compose.images.yml); fi
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
if [[ -n "$release_file" ]]; then
  echo "Pulling ${services[*]} while existing services remain running..."
  "${compose[@]}" pull "${services[@]}"
  for service in "${services[@]}"; do
    if [[ "$service" == frontend ]]; then image="$FRONTEND_IMAGE"; else image="$BACKEND_IMAGE"; fi
    revision="$(docker image inspect --format '{{index .Config.Labels "org.opencontainers.image.revision"}}' "$image")"
    [[ "$revision" == "$RELEASE_COMMIT" ]] || { echo "Image commit mismatch for $service." >&2; exit 1; }
    if [[ "$service" == frontend ]]; then
      target="$(docker image inspect --format '{{index .Config.Labels "com.mutuity.environment"}}' "$image")"
      [[ "$target" == "$environment" ]] || { echo "Frontend image environment mismatch." >&2; exit 1; }
    fi
  done
else
  echo "Building ${services[*]} while existing services remain running..."
  "${compose[@]}" build "${services[@]}"
fi

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