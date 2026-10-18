#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: bash scripts/set-review-candidate-version.sh <major.minor.patch|none>" >&2
  exit 2
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

env_file=".env.ingress"
if [[ ! -f "$env_file" ]]; then
  echo "Missing $env_file. Copy .env.ingress.example and configure it first." >&2
  exit 1
fi

candidate_version="$1"
if [[ "$candidate_version" == "none" ]]; then
  candidate_version="__NO_REVIEW_CANDIDATE__"
elif [[ ! "$candidate_version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Candidate version must be a semver major.minor.patch value, or 'none'." >&2
  exit 2
else
  production_version="$(awk -F= '$1 == "PRODUCTION_APP_VERSION" { print substr($0, index($0, "=") + 1); exit }' "$env_file")"
  if [[ ! "$production_version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "PRODUCTION_APP_VERSION must be set to the currently released semver in $env_file." >&2
    exit 1
  fi

  app_version_line="$(grep -E '^[[:space:]]*const APP_VERSION = ' mobile-app/app.config.ts | head -n 1 || true)"
  if [[ "$app_version_line" =~ \"([0-9]+\.[0-9]+\.[0-9]+)\" ]]; then
    configured_version="${BASH_REMATCH[1]}"
  else
    echo "Could not read a semver APP_VERSION from mobile-app/app.config.ts." >&2
    exit 1
  fi
  if [[ "$candidate_version" != "$configured_version" ]]; then
    echo "Candidate $candidate_version does not match APP_VERSION $configured_version in mobile-app/app.config.ts." >&2
    exit 1
  fi
  if ! awk -v candidate="$candidate_version" -v production="$production_version" '
    BEGIN {
      split(candidate, c, /[.]/)
      split(production, p, /[.]/)
      for (i = 1; i <= 3; i++) {
        if ((c[i] + 0) > (p[i] + 0)) exit 0
        if ((c[i] + 0) < (p[i] + 0)) exit 1
      }
      exit 1
    }
  '; then
    echo "Candidate $candidate_version must be newer than production $production_version." >&2
    exit 1
  fi
fi

tmp_file="$(mktemp "${TMPDIR:-/tmp}/mutuity-ingress.XXXXXX")"
trap 'rm -f "$tmp_file"' EXIT

if ! awk -v version="$candidate_version" '
  /^REVIEW_CANDIDATE_VERSION=/ {
    print "REVIEW_CANDIDATE_VERSION=" version
    found = 1
    next
  }
  { print }
  END { if (!found) exit 1 }
' "$env_file" > "$tmp_file"; then
  echo "REVIEW_CANDIDATE_VERSION is missing from $env_file; no changes made." >&2
  exit 1
fi

compose=(docker compose -p mutuity-ingress -f docker-compose.ingress.yml --env-file "$tmp_file")
"${compose[@]}" run --rm --no-deps caddy caddy validate \
  --config /etc/caddy/Caddyfile --adapter caddyfile

mv "$tmp_file" "$env_file"
trap - EXIT

compose=(docker compose -p mutuity-ingress -f docker-compose.ingress.yml --env-file "$env_file")
"${compose[@]}" up -d --force-recreate caddy

if [[ -n "$candidate_version" ]]; then
  if [[ "$candidate_version" == "__NO_REVIEW_CANDIDATE__" ]]; then
    echo "No review candidate is configured; all versioned mobile requests route to production."
  else
    echo "App version $candidate_version routes to review; all other versions route to production."
  fi
fi
echo "Verify /health, GraphQL, subscriptions, OAuth start/callback, and sign-in before releasing traffic."