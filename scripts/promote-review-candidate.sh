#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

env_file=".env.ingress"
if [[ ! -f "$env_file" ]]; then
  echo "Missing $env_file. Copy .env.ingress.example and configure it first." >&2
  exit 1
fi

candidate_version="$(awk -F= '$1 == "REVIEW_CANDIDATE_VERSION" { print substr($0, index($0, "=") + 1); exit }' "$env_file")"
production_version="$(awk -F= '$1 == "PRODUCTION_APP_VERSION" { print substr($0, index($0, "=") + 1); exit }' "$env_file")"
if [[ ! "$candidate_version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "No valid REVIEW_CANDIDATE_VERSION is configured in $env_file." >&2
  exit 1
fi
if [[ ! "$production_version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "PRODUCTION_APP_VERSION must be set to the currently released semver in $env_file." >&2
  exit 1
fi
if ! grep -q '^REVIEW_CANDIDATE_VERSION=' "$env_file" || ! grep -q '^PRODUCTION_APP_VERSION=' "$env_file"; then
  echo "Required release version settings are missing from $env_file." >&2
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
  echo "Configured candidate $candidate_version does not match APP_VERSION $configured_version." >&2
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

tmp_file="$(mktemp "${TMPDIR:-/tmp}/mutuity-ingress.XXXXXX")"
trap 'rm -f "$tmp_file"' EXIT
if ! awk -v version="$candidate_version" '
  /^PRODUCTION_APP_VERSION=/ {
    print "PRODUCTION_APP_VERSION=" version
    found_production = 1
    next
  }
  /^REVIEW_CANDIDATE_VERSION=/ {
    print "REVIEW_CANDIDATE_VERSION=__NO_REVIEW_CANDIDATE__"
    found_candidate = 1
    next
  }
  { print }
  END { if (!found_production || !found_candidate) exit 1 }
' "$env_file" > "$tmp_file"; then
  echo "Required release version settings are missing from $env_file; no changes made." >&2
  exit 1
fi

compose=(docker compose -p mutuity-ingress -f docker-compose.ingress.yml --env-file "$tmp_file")
"${compose[@]}" run --rm --no-deps caddy caddy validate \
  --config /etc/caddy/Caddyfile --adapter caddyfile

mv "$tmp_file" "$env_file"
trap - EXIT

compose=(docker compose -p mutuity-ingress -f docker-compose.ingress.yml --env-file "$env_file")
"${compose[@]}" up -d --force-recreate caddy

echo "Promoted app version $candidate_version to production routing; the review candidate is now disabled."
echo "Verify /health, GraphQL, subscriptions, OAuth start/callback, and sign-in before releasing traffic."
