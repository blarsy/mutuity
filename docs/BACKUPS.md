# PostgreSQL backups and recovery

## Contract and limits

This is **implemented tooling, not a disaster-tested recovery claim**. A Linux host
systemd oneshot runs every six hours against the **existing** production PostgreSQL container;
there is no backup container, Docker socket mount, or continuously running agent.
Set `REPO_DIR` to the deployment checkout (`/srv/mutuity` in the example config;
the script falls back to `/opt/mutuity` when unset). Other defaults: Compose project `mutuity-prod`,
`docker-compose.prod.yml`, `.env.prod`, service `postgres`, PostgreSQL **16**.
The host needs Docker CLI + Compose v2, Bash, GNU coreutils, util-linux `flock`,
tar, age, curl and AWS CLI v2. Pin/update trusted packages through host management.

Each run captures a complete custom-format `pg_dump --compress=9 --create` and
`pg_dumpall --roles-only` inside PostgreSQL using `compose exec -T`. No schema,
table, ownership, ACL, policy or row-security filters are applied: data, all
schemas, extensions, functions, grants, owners, RLS policies and the database's
migration ledger are included. Global roles include password hashes, attributes
and memberships (including PG16 membership options); treat them as secrets.
The container's configured `POSTGRES_USER` must remain a superuser able to dump
everything, using its local socket authentication. No database password crosses
host argv. Do not weaken authentication to make backups work.

The dump is a consistent database snapshot, not an atomic cluster-wide snapshot
with the separate roles dump. Avoid migrations/role/permission DDL during the
backup window. Coordinate schema changes with backup/drill operations. Other
databases, tablespace filesystem contents, host files, Compose secrets and
Cloudinary assets are **not** backed up. Inventory non-default tablespaces and
installed extensions before recovery; provision matching PG16 extension packages
and approved isolated tablespace paths. Plain `postgres:16` suffices only when
it contains all required extensions.

**Target RPO: 24 hours; no PITR/WAL archiving.** Recovery points are scheduled
six hours apart; scheduling alone does not guarantee that target. Monitor backup
age, duration and failures; alert before
24h since last verified success. RTO is unmeasured until a drill. File size is
limited to 5,000,000,000 encrypted bytes (single atomic S3 PUT); fail and alert
above that threshold, then redesign/test multipart handling rather than truncate.

## Host installation

Review [backup.sh](../deploy/backup/backup.sh), then install from the repository:

```sh
sudo install -d -o root -g root -m 0700 /etc/mutuity
sudo install -d -o root -g root -m 0755 /usr/local/libexec/mutuity
sudo install -o root -g root -m 0755 deploy/backup/backup.sh /usr/local/libexec/mutuity/backup.sh
sudo install -o root -g root -m 0600 deploy/backup/backup.env.example /etc/mutuity/backup.env
sudoedit /etc/mutuity/backup.env
# Use your configured COMPOSE_ENV_FILE, or REPO_DIR/.env.prod by default.
sudo chown root:root /srv/mutuity/.env.prod
sudo chmod 0600 /srv/mutuity/.env.prod
sudo install -o root -g root -m 0644 deploy/backup/mutuity-backup.service deploy/backup/mutuity-backup-failure.service deploy/backup/mutuity-backup.timer /etc/systemd/system/
sudo systemd-analyze verify /etc/systemd/system/mutuity-backup.service /etc/systemd/system/mutuity-backup-failure.service /etc/systemd/system/mutuity-backup.timer
sudo systemctl daemon-reload
sudo systemctl start mutuity-backup.service
sudo systemctl status mutuity-backup.service
sudo systemctl enable --now mutuity-backup.timer
sudo systemctl list-timers mutuity-backup.timer
```

Configuration is trusted Bash, sourced only after checking owner and mode
(`root:root`, 0600 or 0400). All parent directories, repository, script and Compose
inputs must be root-controlled, not writable by app/deploy users; root executing
a writable script/config is root compromise. The service deliberately runs as root
(Docker access is root-equivalent). Both services invoke the installed copy at
`/usr/local/libexec/mutuity/backup.sh`, independently of the checkout location.
Set `REPO_DIR` once in `/etc/mutuity/backup.env`; `COMPOSE_FILE` and
`COMPOSE_ENV_FILE` default to paths beneath it. Remove stale explicit Compose
path settings from older configs, or update them if intentional overrides are
needed. No service edits or repository move are required. Do not put the checkout
under `/home` (units use `ProtectHome=true`).
Do not install an environment file in systemd with secrets as command arguments.
The script loads `/etc/mutuity/backup.env`; `MUTUITY_BACKUP_CONFIG` is an explicit
operator/test override. Keep AWS configuration files, debug logging and unrelated
ambient AWS credentials out of the service account; its credentials come from
the protected configuration. Do not enable shell tracing or AWS debug mode.

Generate the age identity **off-server**, copy only its public recipient into
configuration. Store the identity redundantly in an offline/password-manager
recovery vault, not on this host or in the backup bucket. Independently escrow
Compose env/secrets, app/session/social/mail credentials, encryption identity,
R2 account recovery and read credentials, DNS/infra instructions, extension and
tablespace inventory, and the matching application source release. Do not rely
on the failed host or its upload token to retrieve backups.

The root-only state directory is `/var/lib/mutuity-backup` (0700). `umask 077`,
nonblocking `flock` and an EXIT/signal trap protect/clean temporary plaintext
dumps. The encrypted tar contains `database.dump`, `roles.sql`, `toc.txt` and
`manifest.txt`. Use encrypted host storage; deletion is not secure erasure on
SSDs/COW filesystems. SIGKILL/power loss cannot run traps: inspect and remove
stale `run.*` directories as root after confirming no backup is active, and
monitor disk space. Never remove the live lock file to bypass locking.

Uploads use unique UTC timestamp + 128-bit random names, never a `latest` key.
Failed dump/tar/encryption never reaches PUT. Failed PUT publishes no successful
heartbeat (an ambiguous network failure may nevertheless have stored a complete
object). Failed HEAD/metadata/size verification leaves the object for inspection,
not automatic deletion. HEAD compares encrypted byte size and user metadata
`sha256`; this is **not** an independent remote content hash or authenticated
proof against a malicious store. A download + local SHA256 + age authentication
and actual restore in drills supply stronger verification. No ETag-as-SHA claim.

## Monitoring

### Diagnosing local startup failures

Failures include the stage and a safe check-specific reason, such as a missing
`age`/`aws` command, an unset setting, inaccessible Compose paths, or incorrect
file ownership/mode. Setting names are logged, never their values. Child command
diagnostics remain suppressed because they may contain credentials.

After refreshing the installed script from the checkout, run on the Production
host:

```sh
sudo install -o root -g root -m 0755 deploy/backup/backup.sh /usr/local/libexec/mutuity/backup.sh
sudo /bin/bash /usr/local/libexec/mutuity/backup.sh --check
sudo systemctl start mutuity-backup.service
sudo journalctl -u mutuity-backup.service -n 30 --no-pager
```

`--check` validates local dependencies/configuration/permissions and may create
the state directory; it performs no database calls, upload or heartbeat. It does
not prove Docker/PostgreSQL/R2 connectivity or reproduce the systemd sandbox/PATH;
the actual service run remains necessary. Do not enable shell tracing or paste
the protected configuration, environment, credentials or heartbeat URLs into chat.

### Heartbeat settings

In GlitchTip, create or edit **one Heartbeat monitor** named "Production PostgreSQL
backup", associate it with a project (for example `mutuity-backups`) with email
alerts/recipients configured, and set **Interval = 25200 seconds (7 hours)**.
This fits the UI's 32767-second maximum and allows roughly one hour of normal
completion-time variation between six-hourly jobs. This interval is the entire
allowed gap between success pings, not an additional seven-hour grace period.
Copy its generated URL into `SUCCESS_HEARTBEAT_URL`; leave
`FAILURE_HEARTBEAT_URL` empty. Existing monitors must be updated in GlitchTip:
changing the systemd timer does not change the monitor's settings. Test missed
heartbeat and recovery notifications with a separate short-interval test monitor,
not by manually pinging the production success URL.

Use a private external heartbeat monitor, for example GlitchTip or Healthchecks,
with independent notification delivery and missed-heartbeat alerts. Set the protected
success URL supplied by the provider. **GlitchTip needs only its success heartbeat
URL**: it has no documented `/fail` endpoint; never invent one by appending a path.
Leave `FAILURE_HEARTBEAT_URL` empty/unset for GlitchTip. Configure that optional URL
only when the provider explicitly supports failure pings (for example Healthchecks).
Success is sent **only after**
PUT and matching HEAD. A failed success ping also fails the service. No heartbeat
is sent by the main script on earlier failures; `OnFailure` invokes the separate
failure unit, including on systemd timeout. That unit sends only an explicitly
configured failure URL; without one it exits successfully without network calls.
With GlitchTip, rely on missed-heartbeat alerts plus independent systemd alerts.
HTTP uses HTTPS/TLS verification, bounded retries/timeouts and no redirects.
Provider endpoints must accept GET. Test both notification and missing-ping
alerts; failure ping cannot work when host/network is gone. Check journal and
systemd failed-unit alerts independently. Logs contain stage names and safe local validation reasons only,
not child diagnostics, credentials or signed heartbeat URLs. Diagnose privately
without publishing command output that contains secrets.

The timer runs at **02:00, 08:00, 14:00 and 20:00 UTC**, with persistent catch-up
after downtime (one catch-up run, not a replay of every missed slot), no random
delay, no automatic retry storm, and a **one-hour execution limit**. Confirm that
normal backup duration is comfortably below an hour; investigate timeouts rather
than silently extending them into the next slot. Root can manually start the
service after resolving a failure. A lock contender fails without a success signal.
Configure alert grace around measured duration, not an extra day.

When upgrading an existing installation, refresh the installed script and the
service/timer units from this checkout using the Host installation commands above.
**Keep the existing protected configuration and credentials**: do not copy the
example over `/etc/mutuity/backup.env`. Instead edit `REPO_DIR` and remove/update
any stale `COMPOSE_FILE`/`COMPOSE_ENV_FILE` overrides. Install the script before
reloading the services, then run
`systemctl daemon-reload`, then `systemctl restart mutuity-backup.timer` and
`systemctl list-timers mutuity-backup.timer` as root. An already-running backup
is not restarted by this timer update; schedule the update while the service is
idle. Update the GlitchTip interval separately as described above.

These are full snapshots, not incremental backups: four runs per day mean roughly
four times the daily dump/upload work and retained storage compared with daily
backups. The unchanged seven-day lifecycle/lock policy retains approximately
**28 objects instead of 7** (plus manual/catch-up runs and asynchronous expiry).
Check storage quotas/costs, host load and deployment windows accordingly.

## R2 provisioning: off-server administrator only

1. In Cloudflare, create a dedicated **private**, Standard-storage R2 bucket.
   Disable public development URL/custom public access. Set the HTTPS account
   S3 endpoint in protected config. Do not use HTTP or `--no-verify-ssl`.
2. From a separate administrator session, create a bucket lifecycle rule scoped
   to prefix `postgres/` (or configured prefix) to expire objects **seven days
   after creation**. Review the dashboard's actual rule/prefix before enabling.
   Lifecycle is retention/cost management, not a success-aware rotation policy:
   **after prolonged backup failure, expiration can delete every usable backup**.
   Alert promptly and keep a separate longer-lived/offline recovery copy where
   the recovery policy requires it. Do not configure restic-style pruning here.
3. Before uploading production data, use R2 **Bucket Locks** to create a matching
   prefix retention rule for **seven days**. Use the dashboard's Bucket Locks
   configuration (not AWS S3 Object Lock commands; R2 semantics differ). Verify
   its effective scope/duration and that a disposable uploaded probe cannot be
   deleted/overwritten during retention. Verify lifecycle expiry after the lock
   releases; asynchronous cleanup may be later than exactly day seven.
4. Create an R2 API token restricted to **Object Read & Write for this bucket
   only** (PUT plus HEAD/GET). Standard R2 write permissions may include DELETE;
   do not pretend they are append-only. Bucket Lock is the additional control.
   No account/bucket administration, token management, lifecycle or lock-rule
   modification credentials belong on the production server. Provision and
   audit these rules with separate off-server administrator credentials.
5. Test upload/HEAD and denied early deletion with a disposable probe from the
   off-server admin workstation. Record results, date, retention rule settings
   and operator; do not test deletion of a recovery object. Recheck after changes.

R2 Bucket Locks are **not immutable against account administrators** who can
change/remove rules or compromise the account. Protect administrator MFA and
recovery credentials; separate accounts/offline copies are needed for that threat.
No provisioning is performed by the backup job; actual R2 policies must be
verified by an operator. Review current Cloudflare UI/API documentation and
pricing before deployment (storage, operations and quotas may change).

## Exact isolated restore procedure (PostgreSQL 16)

Run on an **isolated recovery Linux host**, not production. Treat SQL archives
as executable trusted code and sensitive data. Disable outbound mail/push/OAuth
and do not point production services at this instance. Commands below create a
new isolated container/volume, never connect to or clean a production database.
Do not rerun them against a partially restored cluster: stop, inspect the failure,
and choose a **new** unique name/volume for the next attempt. No `--clean`, DROP,
or blanket "ignore role exists" is allowed.

1. Using separate off-host read credentials, select one exact verified object
   key from monitoring/history or bucket listing. Set the variables below to
   real values; enter credentials using a protected AWS profile rather than shell
   history. Obtain the age identity from the recovery vault. Verify the pinned
   PostgreSQL 16 image/extension set before executing SQL. These commands require
   the default root-starting official entrypoint (no `--user` override).

```bash
set -Eeuo pipefail
umask 077
export AWS_PROFILE=mutuity-recovery
endpoint=https://ACCOUNT.r2.cloudflarestorage.com
bucket=mutuity-backups
key=postgres/REPLACE_EXACT_OBJECT.tar.age
identity=/secure/offline/recovery.agekey
recovery_dir=$(mktemp -d)
cd "$recovery_dir"
aws --endpoint-url "$endpoint" --region auto s3api get-object --bucket "$bucket" --key "$key" bundle.tar.age >download.json
expected=$(aws --endpoint-url "$endpoint" --region auto s3api head-object --bucket "$bucket" --key "$key" --query Metadata.sha256 --output text)
expected_size=$(aws --endpoint-url "$endpoint" --region auto s3api head-object --bucket "$bucket" --key "$key" --query ContentLength --output text)
[[ "$expected" =~ ^[a-f0-9]{64}$ && "$(stat -c %s bundle.tar.age)" == "$expected_size" ]]
printf '%s  bundle.tar.age\n' "$expected" | sha256sum --check --status
age --decrypt --identity "$identity" --output bundle.tar bundle.tar.age
# Inspect names before extracting trusted data; there must be exactly these four.
tar -tf bundle.tar >entries.txt
printf '%s\n' database.dump manifest.txt roles.sql toc.txt | sort >expected-entries.txt
sort entries.txt >actual-entries.txt
cmp expected-entries.txt actual-entries.txt
tar --extract --file bundle.tar --no-same-owner --no-same-permissions
cat manifest.txt
```

2. Use the **same initdb bootstrap superuser name as the source** (`postgres` in
   the default deployment). Confirm its name from independently recorded source
   inventory, not by guessing from the archive. PG16 treats this role's bootstrap
   identity specially for explicit membership grantors. A differently named
   bootstrap followed by creating `postgres` failed the actual smoke with
   `permission denied to grant privileges as role "postgres"`, even after switching
   session authorization. Therefore this procedure explicitly reconciles exactly
   **one** already-created bootstrap role, only after proving the target is fresh.
   It does not suppress arbitrary duplicate roles or restore into an existing DB.

```bash
name=mutuity-drill-$(date -u +%Y%m%dT%H%M%SZ)-$(openssl rand -hex 4)
bootstrap=postgres # MUST match the independently inventoried source initdb role.
[[ "$bootstrap" =~ ^[a-z_][a-z0-9_]*$ ]]
volume=$name-data
[[ -z "$(docker ps -aq --filter "name=^/$name$")" ]]
if docker volume inspect "$volume" >/dev/null 2>&1; then
  printf 'Refusing existing volume\n' >&2; exit 1
fi
openssl rand -hex 32 >bootstrap-password
chmod 0600 bootstrap-password
docker volume create "$volume"
docker run -d --name "$name" --network none \
  --mount "type=volume,src=$volume,dst=/var/lib/postgresql/data" \
  --mount "type=bind,src=$recovery_dir/bootstrap-password,dst=/run/bootstrap-password,readonly" \
  -e "POSTGRES_USER=$bootstrap" -e POSTGRES_DB=postgres \
  -e POSTGRES_PASSWORD_FILE=/run/bootstrap-password postgres:16
# Bounded readiness wait; errors/timeouts must stop recovery.
ready=false
for attempt in {1..60}; do
   # Ignore the temporary initdb server; wait until entrypoint has exec'd postgres.
   if docker exec "$name" sh -c 'test "$(cat /proc/1/comm)" = postgres' &&
       docker exec "$name" pg_isready -U "$bootstrap" -d postgres >/dev/null 2>&1; then
    ready=true; break
  fi
  sleep 1
done
[[ "$ready" == true ]]
docker exec "$name" psql -X -v ON_ERROR_STOP=1 -U "$bootstrap" -d postgres -Atc \
  "SELECT rolname FROM pg_roles WHERE rolname !~ '^pg_' ORDER BY rolname" >target-roles.txt
printf '%s\n' "$bootstrap" >expected-roles.txt
cmp expected-roles.txt target-roles.txt
docker exec -i "$name" pg_restore --list <database.dump >restore-toc.txt
# Confirm the sole target role is the special initdb bootstrap identity.
[[ "$(docker exec "$name" psql -X -v ON_ERROR_STOP=1 -U "$bootstrap" -d postgres -Atc \
   "SELECT oid FROM pg_roles WHERE rolname = '$bootstrap' AND rolsuper")" == 10 ]]
# This narrowly reviewed exception is ONLY for the one proven-fresh initdb role.
# Require exactly one matching statement; keep the original archive untouched.
[[ "$(grep -Fxc "CREATE ROLE $bootstrap;" roles.sql)" == 1 ]]
awk -v bootstrap="$bootstrap" '
   $0 == "CREATE ROLE " bootstrap ";" {
      print "-- inventoried bootstrap role already created by initdb"; next
   }
   { print }
' roles.sql >roles-restore.sql
# Every ALTER ROLE (password/attributes), other CREATE, and GRANT remains intact.
# Any other conflict/error aborts the transaction; never blanket-ignore errors.
docker exec -i "$name" psql -X --no-password -v ON_ERROR_STOP=1 --single-transaction \
   -U "$bootstrap" -d postgres <roles-restore.sql
# Connect to template1; --create recreates the source database under its original name.
# A source database named postgres/template1 conflicts: STOP and plan an explicitly
# reviewed alternate fresh-cluster procedure, do not add --clean to this command.
docker exec -i "$name" pg_restore --no-password --exit-on-error --create \
  -U "$bootstrap" --dbname=template1 <database.dump
```

This preserves role memberships/attributes/password hashes, ownership, grants
and RLS. The official cached PG16 entrypoint tested below reads the password file
as root in `docker_setup_env` **before** `gosu`, exports the password and unsets
the file variable. A root-owned 0600 bind therefore works with its default startup;
it is not reread as postgres. If using a reviewed image/entrypoint that reads it
after dropping privileges, or `--user postgres`, instead use a dedicated secret
directory/file owned by that image's verified postgres UID/GID (999:999 in the
tested Debian image), directory 0700 and file 0600. Never make it world-readable;
verify the chosen startup in isolation. Do not assume Alpine uses the same UID.

The role replay substitutes only the single exact unquoted `CREATE ROLE` for the
inventoried source bootstrap; its ALTER statements restore the source attributes
and password hash. The target's generated bootstrap password is consequently
replaced. This is an explicit fresh-cluster reconciliation, not an "ignore role
exists" policy. If the source bootstrap identity is unknown, uses a quoted name,
is absent from the dump, or role topology differs from the tested fixture, stop
and have a DBA review/test an alternate replay. Membership grants/options and
grantor identities must compare exactly after restoration.

Do not use `--no-owner`, `--no-acl`, `--role` substitution, or restore
with row-security enabled. If recovering onto a cluster already containing
app roles or anything beyond the single inventoried fresh bootstrap, **stop**;
do not skip arbitrary CREATE ROLE statements and then blindly apply
ALTER/GRANT statements to unrelated identities. A DBA must compare role
attributes, passwords and membership options, authorize an explicit reconciliation
plan, and test it separately. Do not remove the recovered source bootstrap role
as if it were a temporary account. Do not expose this container's socket or a
host port to production.

3. Validate against the manifest and independently recorded inventory: source DB
   name (default `mutuity`), migration version/row count, critical table counts,
   owners, function security modes, role attributes and memberships, grants,
   RLS enable/force flags and policies. Inspect restore output for *any* error.
   Run the repository's read-only privilege boundary verifier with `psql -X
   -v ON_ERROR_STOP=1` against this restored DB and require zero returned
   violations; run application smoke/security checks only in the isolated drill
   environment. Verify representative account/login, private data isolation,
   claims/resources/chat and migration ledger consistency. Successful `pg_restore`
   alone is not functional or security validation. Do not replay all migrations
   blindly on a restored ledger; select the matching app release first.
4. A production recovery needs an approved cutover plan: stop writers, assess
   lost transactions, rotate compromised credentials, provision reviewed
   networking/secrets, validate before enabling mail/worker jobs, and obtain
   explicit authorization before switching endpoints. This document deliberately
   does not automate production replacement or delete the recovery container,
   volume, identity or plaintext evidence. Securely dispose of drill data under
   the incident/data-retention policy after review.

## Monthly drills and acceptance evidence

Every month, and after PostgreSQL/extensions/roles/storage/tooling changes,
download an actual scheduled object and execute the isolated procedure. Record
object key/hash, source backup age, actual package versions, start/end times,
restore/role/membership/RLS/grant and application validation results, achieved
RPO/RTO, operator, failures and follow-ups in an access-controlled incident log.
Exercise off-host identity/account recovery and failure/missed-heartbeat alerts.
Test lifecycle/lock configuration on probes, never delete recovery objects to
test retention. No drill evidence exists merely because this code was merged.

## Local regression checks

```sh
bash -n deploy/backup/backup.sh
node --test scripts/tests/backup.test.mjs
# Opt-in: Docker daemon, cached postgres:16, age and age-keygen on PATH.
# Resolve configured container CLI before running; the script uses docker.
node scripts/tests/backup.integration.mjs
```

Tests run real Bash/tar with mocked external commands; they cover partial dump,
roles, archive, encryption, upload, HEAD failure/mismatch, heartbeat failures,
secret-safe diagnostics, cleanup, permission checks, unique naming and concurrent
locking, including unset/empty optional failure URLs. Linux uses native GNU
`stat`, `sha256sum` and util-linux `flock`; macOS uses process-aware shims and
skips the Linux-specific lock test. External PG/age/AWS/HTTP calls in that suite
are mocks.

The opt-in integration script uses actual PG16, tar and age, synthetic data and
fresh random container/volume names, `--network none`, no ports, no Compose and
no production configuration/credentials. It never pulls an image. Set
`BACKUP_TEST_PG_IMAGE` to an already available reviewed PG16 image if needed.
It removes only its own containers/volumes and temporary fixture files in
`finally`; interrupted/killed processes may require cleanup of their exact
printed/inspected names. Do not blanket-delete other PostgreSQL resources.

### Executed local evidence — 2026-11-03

- Cached image: PostgreSQL **16.13**, Debian, amd64;
   image ID `sha256:49767d69e57428bc8229d8427521605e90b230c908d19542644d92b77dc1984d`.
   age **1.2.1** on macOS; Node **20.19.6** locally, cached Node 22 Linux container.
- Real `pg_dumpall --database=backup_smoke --roles-only` succeeded: PG16 accepts
   this simple database name as the connection string; this syntax is not a bug.
   Real custom dump, archive listing, exact documented bootstrap-role awk
   reconciliation, transactional role replay and `pg_restore --create` passed.
- Exact source/restored comparisons passed for role attributes/password hashes,
   membership grantors and PG16 ADMIN/INHERIT/SET options, schema/table owners and
   ACLs, forced RLS flags/policies, definer-function definition/ACL/settings,
   synthetic table data and migration ledger. Reader saw only one of two rows;
   unauthorized INSERT failed.
- Real age encryption/decryption recovered the byte-identical tar and dump/roles;
   modified ciphertext was rejected. Final fixture: 11,464 encrypted bytes,
   SHA256 `17e0685685c25f698fb041e3bf4449f94ffab07c8b40a71699011a6b0896f9ff`.
   This is a disposable synthetic fixture, not a retained production backup.
- Default password bind startup passed. A separate actual PG16 startup with a
   Linux `root:root` 0600 password file passed even though postgres could not read
   it, confirming entrypoint reads before `gosu`. No permission relaxation needed.
- Actual backup Bash suite: **18 passed, 1 Linux-only skip** on macOS;
   **19 passed, 0 skipped** in disposable network-disabled Linux, including native
   `stat`/`flock`. PG/age/upload/HTTP were mocked in this suite, not in the real
   integration smoke above. No errors reported by editor diagnostics.
- Final smoke prefix `mutuity-backup-smoke-5a8b0a0c152f81040b6803dd` cleaned up.
   Earlier interrupted smoke-only resources were inspected and removed by exact
   names; no smoke containers/volumes remained. Existing app/production containers
   were not modified.

**Not executed:** R2 upload/download, cloud permissions/locks/lifecycle, live
GlitchTip notification/missed-heartbeat delivery, systemd installation/timers,
real application-data recovery/security checks or a disaster drill. The local
fixture does not establish production RPO/RTO or extension/tablespace parity.
All remain mandatory operator acceptance checks.