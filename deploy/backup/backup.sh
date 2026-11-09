#!/usr/bin/env bash
# Linux host only. Configuration is trusted root-owned shell, never CLI secrets.
set +x
set -Eeuo pipefail
umask 077
exec 3>&2 2>/dev/null
stage=configuration
reason=
work=
cleanup() {
  local result=$?
  trap - EXIT
  if [[ -n "$work" ]]; then rm -rf -- "$work"; fi
  if (( result != 0 )); then
    printf 'mutuity backup failed (%s)%s\n' "$stage" "${reason:+: $reason}" >&3
  fi
  exit "$result"
}
trap cleanup EXIT
trap 'exit 1' HUP INT TERM
die() { reason=${1:-}; exit 1; }
private_file() {
  local label=${2:-configuration file}
  [[ -f "$1" && ! -L "$1" ]] || die "$label must exist as a regular non-symlink file"
  [[ $(stat -c %u "$1") == "$EUID" ]] || die "$label must be owned by the executing user (root under systemd)"
  [[ $(stat -c %a "$1") == 600 || $(stat -c %a "$1") == 400 ]] || die "$label must have mode 0600 or 0400"
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
[[ $# == 0 || ( $# == 1 && $1 == --check ) ]] || die 'unsupported arguments'
stage=preflight
for executable in docker age aws curl tar sha256sum stat flock mktemp date od tr rm mkdir; do
  command -v "$executable" >/dev/null || die "required command not found in PATH: $executable"
done
for setting in AGE_RECIPIENT R2_ENDPOINT R2_BUCKET AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY SUCCESS_HEARTBEAT_URL; do
  [[ -n ${!setting:-} ]] || die "required setting is empty or unset: $setting"
done
[[ "$AGE_RECIPIENT" == age1* && "$AGE_RECIPIENT" != *[[:space:]]* ]] || die 'AGE_RECIPIENT must be an age public recipient without whitespace'
https "$R2_ENDPOINT" || die 'R2_ENDPOINT must use HTTPS without line breaks'
https "$SUCCESS_HEARTBEAT_URL" || die 'SUCCESS_HEARTBEAT_URL must use HTTPS without line breaks'
[[ "$R2_ENDPOINT" =~ ^https://[a-zA-Z0-9.-]+(:[0-9]+)?/?$ ]] || die 'R2_ENDPOINT must be an HTTPS host, not a bucket/object URL'
[[ "$R2_BUCKET" =~ ^[a-z0-9][a-z0-9.-]+[a-z0-9]$ ]] || die 'R2_BUCKET has an invalid bucket name format'
REPO_DIR=${REPO_DIR:-/opt/mutuity}
COMPOSE_PROJECT=${COMPOSE_PROJECT:-mutuity-prod}
COMPOSE_FILE=${COMPOSE_FILE:-$REPO_DIR/docker-compose.prod.yml}
COMPOSE_ENV_FILE=${COMPOSE_ENV_FILE:-$REPO_DIR/.env.prod}
STATE_DIR=${STATE_DIR:-/var/lib/mutuity-backup}
R2_PREFIX=${R2_PREFIX:-postgres}
[[ "$R2_PREFIX" =~ ^[a-zA-Z0-9][a-zA-Z0-9/_-]*$ ]] || die 'R2_PREFIX has an invalid object prefix format'
[[ "$STATE_DIR" == /* ]] || die 'STATE_DIR must be an absolute path'
[[ -d "$REPO_DIR" ]] || die 'REPO_DIR does not point to an accessible directory'
[[ -f "$COMPOSE_FILE" ]] || die 'COMPOSE_FILE does not point to an accessible file; check REPO_DIR and stale overrides'
private_file "$COMPOSE_ENV_FILE" COMPOSE_ENV_FILE
mkdir -p -- "$STATE_DIR" || die 'cannot create STATE_DIR; check permissions and systemd ReadWritePaths'
[[ ! -L "$STATE_DIR" && $(stat -c %u "$STATE_DIR") == "$EUID" && $(stat -c %a "$STATE_DIR") == 700 ]] || die 'STATE_DIR must be a non-symlink directory owned by the executing user with mode 0700'
if [[ ${1:-} == --check ]]; then
  printf 'mutuity backup local preflight checks passed (no dump, upload or heartbeat performed)\n' >&3
  exit 0
fi
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
curl --silent --fail --request POST --proto '=https' --tlsv1.2 --connect-timeout 10 --max-time 30 \
  --retry 2 --output /dev/null "$SUCCESS_HEARTBEAT_URL"
printf 'mutuity backup completed (verified upload)\n' >&3