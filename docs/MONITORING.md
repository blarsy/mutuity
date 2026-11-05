## Architecture

Run the Test application and GlitchTip on the **Test VPS**, while Production and
Review remain on their existing VPS. The monitoring Compose project runs pinned
GlitchTip 6.2.6 (web + embedded worker) and its own PostgreSQL. No Valkey is
required. The PostgreSQL network is private; GlitchTip joins the existing
`mutuity-test-edge` network under the `glitchtip-test` alias. It publishes **no
host ports**. Test's existing Caddy is the only ingress and serves
`errors.test.tope-la.com`; do not start another Caddy or bind ports 80/443 for
the monitoring project. The app, GlitchTip and Test ingress remain separate
Compose projects, volumes and databases. Production and Review use their existing
`docker-compose.prod.yml` project independently. Production backups run on the
Production VPS; encrypted copies live off-host in R2; the private recovery key
stays off-host. See [BACKUPS.md](BACKUPS.md).

GlitchTip and its PostgreSQL limits total **448 MiB** (320 + 128), swap disabled.
This is only the monitoring share: Test's PostgreSQL, backend, worker, frontend,
Caddy, Docker and OS need additional memory and disk. The previous monitoring
smoke measured isolated idle services; it did not measure both app stacks under
load. Size/measure the combined VPS, monitor OOM/restart counters and retain
headroom. Keep an independent external uptime check for GlitchTip/Test VPS: if
that host fails, GlitchTip cannot report its own outage. GlitchTip can still
monitor Production because Production is on the other VPS.

## Install on the Test VPS

Prerequisites: the existing Test VPS deployment and external Docker network
`mutuity-test-edge`, Docker/Compose v2, DNS A/AAAA for
`errors.test.tope-la.com` pointing to the Test VPS, inbound TCP 80/443 (already
used by Test Caddy), outbound SMTP/HTTPS and persistent disk. Restrict other
inbound ports. Review pinned releases/security advisories before deployment and
regularly thereafter. Never reuse Mutuity database credentials.

```bash
cp .env.monitoring.example .env.monitoring
chmod 600 .env.monitoring
# Edit the protected file locally: Test edge network, SMTP and two independent secrets.
# Use long random hex strings; the DB password must be URL-safe.
docker network inspect mutuity-test-edge >/dev/null
docker compose -p mutuity-monitoring -f docker-compose.monitoring.yml --env-file .env.monitoring config --quiet
docker compose -p mutuity-monitoring -f docker-compose.monitoring.yml --env-file .env.monitoring pull
docker compose -p mutuity-monitoring -f docker-compose.monitoring.yml --env-file .env.monitoring up -d
# Test Caddy config is bind-mounted; restart it to load the new hostname.
docker compose -p mutuity-test-ingress -f docker-compose.test-ingress.yml --env-file .env.test-ingress restart caddy
docker compose -p mutuity-monitoring -f docker-compose.monitoring.yml --env-file .env.monitoring exec glitchtip python manage.py createsuperuser
docker compose -p mutuity-monitoring -f docker-compose.monitoring.yml --env-file .env.monitoring ps
docker compose -p mutuity-monitoring -f docker-compose.monitoring.yml --env-file .env.monitoring stats --no-stream
```

Enter the admin password interactively in the terminal, never in CLI args or
chat. Registration is disabled from the start; create the initial operator via
CLI before exposing an uninitialized service to untrusted users. GlitchTip may
permit first-user bootstrap even with registration disabled. Restrict initial
network access until setup is complete. Confirm HTTPS certificate, then sign in
and create an organization and projects. Enable MFA. Do not enable public
registration, private-IP uptime targets, admin API, bulk logs, or analytics extras
without reviewing resource/security implications.

The monitor's health endpoint is `https://errors.test.tope-la.com/_health/`. The public
HTTP endpoint verifies its web process; `/api/0/internal/health/` also checks
internal service health. The smoke suite tests both.
Configure an external service/operator to alert when GlitchTip itself is down.
SMTP is a separate dependency: test actual delivery and spam filtering.

## Projects and application configuration

Create projects for web, API, worker, and mobile (or split browser/server web if
desired). Use DSNs copied from this instance, not placeholder strings. Public
DSNs are routing identifiers, **not** upload/admin secrets. Scope upload tokens
to the necessary projects, retain them in a protected build runner only, and
never place them in `NEXT_PUBLIC_*`, `EXPO_PUBLIC_*` or Expo `extra`.

Test `.env.test`, Production `.env.prod` and Review `.env.review` accept:

| Variable | Consumer |
| --- | --- |
| `BACKEND_SENTRY_DSN` | API process |
| `WORKER_SENTRY_DSN` | Graphile worker process |
| `FRONTEND_SENTRY_DSN` | Next.js server |
| `NEXT_PUBLIC_SENTRY_DSN` | Browser (build-time) |
| `SENTRY_ENVIRONMENT` | `test`, `production` or `review` |
| `SENTRY_RELEASE` | Stable app release/commit identifier, same as uploaded artifacts |
| `SENTRY_TRACES_SAMPLE_RATE` | Default 0.01; range 0–1, invalid values fall back to 0.01 |

These are opt-in: empty DSNs send nothing. The Node SDKs require `NODE_ENV=production`
and skip environments named local/test/development/Jest. Thus Test DSNs can
collect events only when using the production-mode Test Compose stack and
`SENTRY_ENVIRONMENT=test`; local/test-mode processes remain inactive. Rebuild
frontend after changing public settings; runtime environment replacement cannot
change the browser bundle. Rebuild backend/worker images after code/dependency
changes. These are additive changes, with no business database migration or
minimum-mobile-version bump. Review DSNs/environment must not silently default
to production telemetry. Server runtime has its own DSN, separate from the public
browser variable. Existing development Compose does not enable telemetry.

For Expo set `EXPO_PUBLIC_GLITCHTIP_DSN` at build time. The app preserves target
environment and native version/build metadata. Local, dev, Jest, Storybook and
Expo Go do not initialize. See [mobile instructions](../mobile-app/README.md)
for reviewed native prebuild/pods/rebuild steps and privacy caveats. Checked-in
native projects are **not** automatically updated by adding a JS dependency.
Do not enable native telemetry on existing binaries without validating the SDK.

## Data minimization and performance scope

Exception events use allowlists: request bodies/headers/queries, cookies, user,
extras, breadcrumbs, source context, GraphQL variables, SQL and arbitrary error
text are not forwarded. Recognizable safe runtime diagnostics, stack coordinates,
release and validated sourcemap debug IDs remain. No replay/screenshots/profiling,
session tracking or console log firehose. Native crash events do not pass through
JS privacy hooks; validate native envelopes before enabling production.
IP addresses remain observable at the network/proxy layer even if absent from
SDK payloads. Limit operator access, configure instance-side scrubbing, review
retention/privacy notice and avoid putting sensitive data in exception messages.

Browser timing groups static Next page templates. Backend timing groups safe
registered HTTP routes; `/graphql` is intentionally aggregated, not labeled with
untrusted client operation names or documents. Mobile measures root navigation
timing only. Span categories retain timing, not raw SQL/URLs. Worker failures are
reported and rethrown, preserving Graphile retries. This is **basic** performance
tracking, not per-resolver database profiling or cross-service distributed traces
(outbound trace propagation is intentionally disabled). Start at 1% and validate
useful volume before increasing it. API initialization catches unhandled/fatal
errors; fatal errors exit nonzero after a bounded flush so Compose can restart.

## Uptime and backup alerts

Create GET monitors with expected status 200 for:

1. Production website `/` (frontend + external HTTPS/ingress reachability).
2. Production `/api/ready` (API + a bounded PostgreSQL ping).
3. Optional review website/readiness checks, only while review is expected up.
4. A heartbeat monitor for daily backup success, using its generated URL in the
   protected backup configuration. Configure cadence/grace around the daily
   02:00 UTC timer and measured job duration. GlitchTip supports missed-heartbeat
   alerts; no generic `/fail` URL is assumed. The optional failure URL is only for
   providers that explicitly support it. Success comes after upload verification.

`/health` still supplies the mobile version policy and intentionally fails open
on policy lookup errors: do **not** use it to prove database readiness. The new
`/ready` handler returns 503 on timeout/database error. Existing `/api/*` Caddy
routing already exposes `/api/ready`; no OAuth/mobile routing changes are needed.
Do not point monitors at Docker/private IPs or expose PostgreSQL for monitoring.

Associate every monitor with a project and configure project email alerts and
recipients. Test down **and recovery** messages. A stopped backup should trigger
missing-success alerts even if its own host cannot report an explicit failure.
Alert on job duration/failure immediately via systemd operational supervision;
a daily heartbeat alone cannot guarantee a 24h recovery-point objective.

## Source maps and debug symbols

The web build generates hidden maps, copies them plus the corresponding assets
to `.monitoring-artifacts/frontend/<BUILD_ID>` at repository root, then **removes `.map` files from
`.next/static`**. Hidden source maps alone are not access control. The build
performs no automatic network upload and does not use a Sentry SaaS auth token.
Debug IDs remain in deployed JS. Keep artifacts private, keyed to `SENTRY_RELEASE`.
The Docker `artifacts` target exports them independently of the final runner:

```bash
# Use the SAME public build args/release as the actual frontend image build.
# Include the app URL/config build args used by your normal release pipeline.
docker build --target artifacts -f frontend/Dockerfile --output type=local,dest=./private-monitoring-artifacts .
```

The command above is a template for an artifact build, **not** a replacement for
the existing configured deployment build. Export from the matching cached build
or supply identical args; different configuration produces different bundles.
Use the instance-supported GlitchTip CLI/source-map upload workflow against
`https://errors.test.tope-la.com`, then verify a synthetic browser exception resolves to
source lines. Inspect the CLI's actual authenticated options for the pinned
instance version; never assume Sentry SaaS artifact endpoints are compatible.
Artifacts contain source contents: do not publish them in a public CI artifact,
Git repository, application webroot or container registry layer intended public.
Server-side maps remain private inside `.next/server`; archive/upload separately
if server symbolication requires it. Expo needs matching Hermes maps and native
dSYMs/Android symbols per build, including a separate workflow for OTA updates.
No symbolication claim is made until a real instance resolves a synthetic event.

## Acceptance, maintenance and rollback

Before enabling production DSNs:

- Confirm healthy service status, TLS, operator access/MFA and SMTP delivery.
- Confirm one synthetic handled/unhandled error per app/worker project; check
  release/environment, grouping, symbolication and captured envelope privacy.
- Confirm one sampled navigation/request transaction with sensible timings.
- Simulate API DB unavailability only in an isolated environment: `/api/ready`
  must return 503 while `/health` retains its compatibility behavior.
- Exercise monitor downtime/recovery and missed backup heartbeat notifications.
- Complete the [backup/restore acceptance](BACKUPS.md), including R2 locks.
- Measure real peak memory under representative load and an error burst.

Logs rotate per-container. GlitchTip keeps errors/uptime 14 days and transactions
7 days initially. Back up its own database/uploads separately if issue history
must survive Test VPS loss; the Mutuity backup deliberately covers the Production
application database, not GlitchTip's database. Keep GlitchTip's SECRET_KEY recoverable.
Review dependency/image advisories and upgrades regularly; back up the monitor
database before migrations, review release notes, and test upgrades in isolation.
Do not downgrade a migrated volume blindly. Disable DSNs/rebuild clients to stop
collection; stopping the monitoring project does not affect production services.
Never use `down -v` on a production monitoring project to perform an upgrade.

## Local checks and actual evidence

```bash
npm run test:monitoring
npm run test:monitoring:stack
```

The opt-in Docker smoke test uses unique project/volume/network names, temporary
random credentials, no published ports or external mail, and cleans up only its
own resources. It validates image/settings, migrations, HTTP health, admin
creation, embedded uptime worker activity, monitoring memory caps and the shared
Test Caddy configuration. It does not deploy DNS/TLS/SMTP/R2, generate native
binaries, verify live email, or prove the combined Test VPS can support production
traffic.
# Monitoring deployment and acceptance

## Architecture

Deploy `docker-compose.monitoring.yml` on a **different Linux host** from Mutuity.
It runs pinned GlitchTip 6.2.6 (web + embedded worker), PostgreSQL and HTTPS Caddy.
No Valkey is required. PostgreSQL has no published port; only Caddy publishes
80/443. Do not combine this Compose file with the application Compose project.
Production and review use the existing `docker-compose.prod.yml` independently.
Backups run on the production host; encrypted copies live off-host in R2; the
private recovery key stays off-host. See [BACKUPS.md](BACKUPS.md).

Container limits total **496 MiB** (GlitchTip 320, PostgreSQL 128, Caddy 48), with
swap disabled per container. This is a workload budget, **not** a guarantee that
a 512 MiB machine can also fit its OS/Docker or sustain an error storm. Reserve
host overhead, measure real traffic and inspect OOM/restart counters. The smoke
test established idle startup, migrations and worker activity, not load capacity.
Use a larger host if necessary rather than disabling uptime or silently dropping
events to claim a memory target. Limits prevent runaway usage; OOM still means
monitoring failure. Keep an independent external check on this monitoring host.

## Install on the monitoring host

Prerequisites: Docker/Compose v2, DNS A/AAAA for a dedicated monitoring hostname,
inbound 80/443, outbound SMTP/HTTPS, persistent disk, separate operator access.
Restrict all other inbound ports. Review pinned releases and security advisories
before deployment and regularly thereafter. Never reuse Mutuity DB credentials.

```bash
cp .env.monitoring.example .env.monitoring
chmod 600 .env.monitoring
# Edit the protected file locally: hostname, mail delivery, two independent secrets.
# Use long random hex strings for both secrets; DB password must be URL-safe.
docker compose -p mutuity-monitoring -f docker-compose.monitoring.yml --env-file .env.monitoring config --quiet
docker compose -p mutuity-monitoring -f docker-compose.monitoring.yml --env-file .env.monitoring pull
docker compose -p mutuity-monitoring -f docker-compose.monitoring.yml --env-file .env.monitoring up -d
docker compose -p mutuity-monitoring -f docker-compose.monitoring.yml --env-file .env.monitoring exec glitchtip ./manage.py createsuperuser
docker compose -p mutuity-monitoring -f docker-compose.monitoring.yml --env-file .env.monitoring ps
docker compose -p mutuity-monitoring -f docker-compose.monitoring.yml --env-file .env.monitoring stats --no-stream
```

Enter the admin password interactively in the terminal, never in CLI args or
chat. Registration is disabled from the start; create the initial operator via
CLI before exposing an uninitialized service to untrusted users. GlitchTip may
permit first-user bootstrap even with registration disabled. Restrict initial
network access until setup is complete. Confirm HTTPS certificate, then sign in
and create an organization and projects. Enable MFA. Do not enable public
registration, private-IP uptime targets, admin API, bulk logs, or analytics extras
without reviewing resource/security implications.

The monitor's health endpoint is `https://<monitoring-host>/_health/`. The public
HTTP endpoint verifies its web process; `/api/0/internal/health/` also checks
internal service health. The smoke suite tests both.
Configure an external service/operator to alert when GlitchTip itself is down.
SMTP is a separate dependency: test actual delivery and spam filtering.

## Projects and application configuration

Create projects for web, API, worker, and mobile (or split browser/server web if
desired). Use DSNs copied from this instance, not placeholder strings. Public
DSNs are routing identifiers, **not** upload/admin secrets. Scope upload tokens
to the necessary projects, retain them in a protected build runner only, and
never place them in `NEXT_PUBLIC_*`, `EXPO_PUBLIC_*` or Expo `extra`.

Production `.env.prod` and review `.env.review` accept:

| Variable | Consumer |
| --- | --- |
| `BACKEND_SENTRY_DSN` | API process |
| `WORKER_SENTRY_DSN` | Graphile worker process |
| `FRONTEND_SENTRY_DSN` | Next.js server |
| `NEXT_PUBLIC_SENTRY_DSN` | Browser (build-time) |
| `SENTRY_ENVIRONMENT` | `production` or `review` |
| `SENTRY_RELEASE` | Stable app release/commit identifier, same as uploaded artifacts |
| `SENTRY_TRACES_SAMPLE_RATE` | Default 0.01; range 0–1, invalid values fall back to 0.01 |

These are opt-in: empty DSNs send nothing. Backend/web only initialize in a
production Node build; local/development/test/Jest remain inactive. Rebuild
frontend after changing public settings; runtime environment replacement cannot
change the browser bundle. Rebuild backend/worker images after code/dependency
changes. These are additive changes, with no business database migration or
minimum-mobile-version bump. Review DSNs/environment must not silently default
to production telemetry. Server runtime has its own DSN, separate from the public
browser variable. Existing development Compose does not enable telemetry.

For Expo set `EXPO_PUBLIC_GLITCHTIP_DSN` at build time. The app preserves target
environment and native version/build metadata. Local, dev, Jest, Storybook and
Expo Go do not initialize. See [mobile instructions](../mobile-app/README.md)
for reviewed native prebuild/pods/rebuild steps and privacy caveats. Checked-in
native projects are **not** automatically updated by adding a JS dependency.
Do not enable native telemetry on existing binaries without validating the SDK.

## Data minimization and performance scope

Exception events use allowlists: request bodies/headers/queries, cookies, user,
extras, breadcrumbs, source context, GraphQL variables, SQL and arbitrary error
text are not forwarded. Recognizable safe runtime diagnostics, stack coordinates,
release and validated sourcemap debug IDs remain. No replay/screenshots/profiling,
session tracking or console log firehose. Native crash events do not pass through
JS privacy hooks; validate native envelopes before enabling production.
IP addresses remain observable at the network/proxy layer even if absent from
SDK payloads. Limit operator access, configure instance-side scrubbing, review
retention/privacy notice and avoid putting sensitive data in exception messages.

Browser timing groups static Next page templates. Backend timing groups safe
registered HTTP routes; `/graphql` is intentionally aggregated, not labeled with
untrusted client operation names or documents. Mobile measures root navigation
timing only. Span categories retain timing, not raw SQL/URLs. Worker failures are
reported and rethrown, preserving Graphile retries. This is **basic** performance
tracking, not per-resolver database profiling or cross-service distributed traces
(outbound trace propagation is intentionally disabled). Start at 1% and validate
useful volume before increasing it. API initialization catches unhandled/fatal
errors; fatal errors exit nonzero after a bounded flush so Compose can restart.

## Uptime and backup alerts

Create GET monitors with expected status 200 for:

1. Production website `/` (frontend + external HTTPS/ingress reachability).
2. Production `/api/ready` (API + a bounded PostgreSQL ping).
3. Optional review website/readiness checks, only while review is expected up.
4. A heartbeat monitor for daily backup success, using its generated URL in the
   protected backup configuration. Configure cadence/grace around the daily
   02:00 UTC timer and measured job duration. GlitchTip supports missed-heartbeat
   alerts; no generic `/fail` URL is assumed. The optional failure URL is only for
   providers that explicitly support it. Success comes after upload verification.

`/health` still supplies the mobile version policy and intentionally fails open
on policy lookup errors: do **not** use it to prove database readiness. The new
`/ready` handler returns 503 on timeout/database error. Existing `/api/*` Caddy
routing already exposes `/api/ready`; no OAuth/mobile routing changes are needed.
Do not point monitors at Docker/private IPs or expose PostgreSQL for monitoring.

Associate every monitor with a project and configure project email alerts and
recipients. Test down **and recovery** messages. A stopped backup should trigger
missing-success alerts even if its own host cannot report an explicit failure.
Alert on job duration/failure immediately via systemd operational supervision;
a daily heartbeat alone cannot guarantee a 24h recovery-point objective.

## Source maps and debug symbols

The web build generates hidden maps, copies them plus the corresponding assets
to `.monitoring-artifacts/frontend/<BUILD_ID>` at repository root, then **removes `.map` files from
`.next/static`**. Hidden source maps alone are not access control. The build
performs no automatic network upload and does not use a Sentry SaaS auth token.
Debug IDs remain in deployed JS. Keep artifacts private, keyed to `SENTRY_RELEASE`.
The Docker `artifacts` target exports them independently of the final runner:

```bash
# Use the SAME public build args/release as the actual frontend image build.
# Include the app URL/config build args used by your normal release pipeline.
docker build --target artifacts -f frontend/Dockerfile --output type=local,dest=./private-monitoring-artifacts .
```

The command above is a template for an artifact build, **not** a replacement for
the existing configured deployment build. Export from the matching cached build
or supply identical args; different configuration produces different bundles.
Use the instance-supported GlitchTip CLI/source-map upload workflow against
`https://<monitoring-host>`, then verify a synthetic browser exception resolves to
source lines. Inspect the CLI's actual authenticated options for the pinned
instance version; never assume Sentry SaaS artifact endpoints are compatible.
Artifacts contain source contents: do not publish them in a public CI artifact,
Git repository, application webroot or container registry layer intended public.
Server-side maps remain private inside `.next/server`; archive/upload separately
if server symbolication requires it. Expo needs matching Hermes maps and native
dSYMs/Android symbols per build, including a separate workflow for OTA updates.
No symbolication claim is made until a real instance resolves a synthetic event.

## Acceptance, maintenance and rollback

Before enabling production DSNs:

- Confirm healthy service status, TLS, operator access/MFA and SMTP delivery.
- Confirm one synthetic handled/unhandled error per app/worker project; check
  release/environment, grouping, symbolication and captured envelope privacy.
- Confirm one sampled navigation/request transaction with sensible timings.
- Simulate API DB unavailability only in an isolated environment: `/api/ready`
  must return 503 while `/health` retains its compatibility behavior.
- Exercise monitor downtime/recovery and missed backup heartbeat notifications.
- Complete the [backup/restore acceptance](BACKUPS.md), including R2 locks.
- Measure real peak memory under representative load and an error burst.

Logs rotate per-container. GlitchTip keeps errors/uptime 14 days and transactions
7 days initially. Back up its own database/uploads separately if issue history
must survive monitoring-host loss; the Mutuity backup deliberately covers the
application database, not this server. Keep GlitchTip's SECRET_KEY recoverable.
Review dependency/image advisories and upgrades regularly; back up the monitor
database before migrations, review release notes, and test upgrades in isolation.
Do not downgrade a migrated volume blindly. Disable DSNs/rebuild clients to stop
collection; stopping the monitoring project does not affect production services.
Never use `down -v` on a production monitoring project to perform an upgrade.

## Local checks and actual evidence

```bash
npm run test:monitoring
npm run test:monitoring:stack
```

The opt-in Docker smoke test uses unique project/volume names, temporary random
credentials, isolated networks, no published ports or external mail, and cleans
up only its own resources. It validates image/settings, migrations, HTTP health,
admin creation, embedded uptime worker activity, memory caps and Caddy syntax.
It does not deploy DNS/TLS/SMTP/R2, generate native binaries, verify live email,
or prove a 512 MiB host can support production traffic.