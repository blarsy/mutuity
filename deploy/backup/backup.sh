#!/usr/bin/env bash
# Linux host only. Configuration is trusted root-owned shell, never CLI secrets.
set +x
set -Eeuo pipefail
umask 077
exec 3>&2 2>/dev/null
stage=configuration
work=
cleanup() {
  local result=$?
  trap - EXIT
  if [[ -n "$work" ]]; then rm -rf -- "$work"; fi
  if (( result != 0 )); then printf 'mutuity backup failed (%s)\n' "$stage" >&3; fi
  exit "$result"
}
trap cleanup EXIT
trap 'exit 1' HUP INT TERM
die() { exit 1; }
private_file() {
  [[ -f "$1" && ! -L "$1" && $(stat -c %u "$1") == "$EUID" ]] || die
  [[ $(stat -c %a "$1") == 600 || $(stat -c %a "$1") == 400 ]] || die
}
https() { [[ "$1" == https://* && "$1" != *$'\n'* && "$1" != *$'\r'* ]]; }
config=${MUTUITY_BACKUP_CONFIG:-/etc/mutuity/backup.env}
private_file "$config"
set -a
source "$config" >/dev/null 2>&1
set +a
# Ignore inherited client debug settings. Never echo config or child diagnostics.
set +x
export AWS_PAGER='' AWS_CLI_AUTO_PROMPT=off AWS_EC2_METADATA_DISABLED=true
export AWS_DEFAULT_REGION=auto
unset AWS_PROFILE AWS_SESSION_TOKEN AWS_ENDPOINT_URL AWS_ENDPOINT_URL_S3
if [[ ${1:-} == --failure-signal && $# == 1 ]]; then
  stage=failure-signal
  # GlitchTip provides a success heartbeat, not a documented failure endpoint.
  # OnFailure remains useful with other providers, but is optional.
  [[ -n ${FAILURE_HEARTBEAT_URL:-} ]] || exit 0
  https "${FAILURE_HEARTBEAT_URL:-}" || die
  command -v curl >/dev/null
  curl --silent --fail --proto '=https' --tlsv1.2 --connect-timeout 10 --max-time 30 \
    --retry 2 --output /dev/null "$FAILURE_HEARTBEAT_URL"
  exit 0
fi
[[ $# == 0 ]] || die
stage=preflight
for executable in docker age aws curl tar sha256sum stat flock mktemp date od tr rm mkdir; do
  command -v "$executable" >/dev/null || die
done
: "${AGE_RECIPIENT:?}" "${R2_ENDPOINT:?}" "${R2_BUCKET:?}" "${AWS_ACCESS_KEY_ID:?}" "${AWS_SECRET_ACCESS_KEY:?}" "${SUCCESS_HEARTBEAT_URL:?}"
[[ "$AGE_RECIPIENT" == age1* && "$AGE_RECIPIENT" != *[[:space:]]* ]] || die
https "$R2_ENDPOINT" && https "$SUCCESS_HEARTBEAT_URL" || die
[[ "$R2_ENDPOINT" =~ ^https://[a-zA-Z0-9.-]+(:[0-9]+)?/?$ ]] || die
[[ "$R2_BUCKET" =~ ^[a-z0-9][a-z0-9.-]+[a-z0-9]$ ]] || die
REPO_DIR=${REPO_DIR:-/opt/mutuity}
COMPOSE_PROJECT=${COMPOSE_PROJECT:-mutuity-prod}
COMPOSE_FILE=${COMPOSE_FILE:-$REPO_DIR/docker-compose.prod.yml}
COMPOSE_ENV_FILE=${COMPOSE_ENV_FILE:-$REPO_DIR/.env.prod}
STATE_DIR=${STATE_DIR:-/var/lib/mutuity-backup}
R2_PREFIX=${R2_PREFIX:-postgres}
[[ "$R2_PREFIX" =~ ^[a-zA-Z0-9][a-zA-Z0-9/_-]*$ && "$STATE_DIR" == /* ]] || die
[[ -d "$REPO_DIR" && -f "$COMPOSE_FILE" ]] || die
private_file "$COMPOSE_ENV_FILE"
mkdir -p -- "$STATE_DIR"
[[ ! -L "$STATE_DIR" && $(stat -c %u "$STATE_DIR") == "$EUID" && $(stat -c %a "$STATE_DIR") == 700 ]] || die
stage=lock
exec 9>"$STATE_DIR/backup.lock"
flock -n 9 || die
work=$(mktemp -d "$STATE_DIR/run.XXXXXXXXXX")
compose=(docker compose --project-directory "$REPO_DIR" --project-name "$COMPOSE_PROJECT" --env-file "$COMPOSE_ENV_FILE" -f "$COMPOSE_FILE")
stage=postgres-preflight
"${compose[@]}" version >/dev/null
version=$("${compose[@]}" exec -T postgres sh -eu -c 'psql -X --no-password -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-mutuity}" -Atqc "SHOW server_version_num"')
[[ "$version" =~ ^16[0-9]{4}$ ]] || die
client=$("${compose[@]}" exec -T postgres pg_dump --version)
[[ "$client" == 'pg_dump (PostgreSQL) 16.'* ]] || die
stage=roles-dump
"${compose[@]}" exec -T postgres sh -eu -c 'exec pg_dumpall --no-password --username="${POSTGRES_USER:-postgres}" --database="${POSTGRES_DB:-mutuity}" --roles-only' >"$work/roles.sql"
[[ -s "$work/roles.sql" ]] || die
stage=database-dump
# No schema filters, --no-owner, --no-acl, or --enable-row-security.
"${compose[@]}" exec -T postgres sh -eu -c 'exec pg_dump --no-password --username="${POSTGRES_USER:-postgres}" --dbname="${POSTGRES_DB:-mutuity}" --format=custom --compress=9 --create' >"$work/database.dump"
[[ -s "$work/database.dump" ]] || die
stage=archive-check
"${compose[@]}" exec -T postgres pg_restore --list <"$work/database.dump" >"$work/toc.txt"
[[ -s "$work/toc.txt" ]] || die
created=$(date -u +%Y%m%dT%H%M%SZ)
nonce=$(od -An -N16 -tx1 /dev/urandom | tr -d ' \n')
key="$R2_PREFIX/mutuity-$created-$nonce.tar.age"
printf 'format=1\ncreated_utc=%s\npostgres_major=16\nproject=%s\n' "$created" "$COMPOSE_PROJECT" >"$work/manifest.txt"
stage=encryption
tar -C "$work" -cf - roles.sql database.dump toc.txt manifest.txt |
  age --recipient "$AGE_RECIPIENT" --output "$work/bundle.tar.age.partial"
[[ -s "$work/bundle.tar.age.partial" ]] || die
checksum=$(sha256sum "$work/bundle.tar.age.partial")
checksum=${checksum%% *}
size=$(stat -c %s "$work/bundle.tar.age.partial")
# Single PUT is atomic and bounded to 5 GB: larger backups fail rather than
# silently changing to multipart semantics. Revisit this limit before growth.
(( size > 0 && size <= 5000000000 )) || die
stage=upload
aws --endpoint-url "$R2_ENDPOINT" --region auto s3api put-object \
  --bucket "$R2_BUCKET" --key "$key" --body "$work/bundle.tar.age.partial" \
  --metadata "sha256=$checksum" --content-type application/octet-stream >/dev/null
stage=verification
remote=$(aws --endpoint-url "$R2_ENDPOINT" --region auto s3api head-object \
  --bucket "$R2_BUCKET" --key "$key" --query '[ContentLength,Metadata.sha256]' --output text)
read -r remote_size remote_checksum extra <<<"$remote"
[[ "$remote_size" == "$size" && "$remote_checksum" == "$checksum" && -z "$extra" ]] || die
stage=success-heartbeat
curl --silent --fail --proto '=https' --tlsv1.2 --connect-timeout 10 --max-time 30 \
  --retry 2 --output /dev/null "$SUCCESS_HEARTBEAT_URL"
printf 'mutuity backup completed (verified upload)\n' >&3