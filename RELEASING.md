# Release runbook

This document defines how to roll out Mutuity across its four artifacts: the
**backend** (Postgres schema/migrations + PostGraphile server + Graphile worker),
the **website** (frontend/Next.js), and the **mobile app** (Expo / iOS + Android),
plus the combined "everything" upgrade.

## Version model

The mobile app has a server-authoritative **minimum version floor**:

- Source of truth: `app_private.app_version_policy` (migration
  `153_app_version_policy.sql`), one row with `min_ios_semver` and
  `min_android_semver`.
- Exposed via `GET /health` → `appVersionPolicy` (used by the app at boot) and the
  `appVersionPolicy` GraphQL query.
- The backend enforces the floor on `/graphql`: any request carrying an
  `x-app-version` header **below** the floor for its `x-app-platform` gets an
  `APP_UPDATE_REQUIRED` GraphQL error. Requests without the headers (web,
  tooling) are unaffected.
- The mobile app sends `x-app-version` / `x-app-platform` on every request and
  shows the `UpdateRequiredScreen` when `getAppVersionStatus(current, minimum)`
  reports an update is required. The bundled `MINIMUM_SUPPORTED_APP_VERSION` is
  only a first-boot fallback.
- Two floor surfaces exist and must stay in sync:
  - `GET /health` → `appVersionPolicy` — the **bootstrap** source, a plain
    REST GET never subject to the GraphQL gate, so a too-old client can always
    learn the floor (`mobile-app/src/services/app/versionGate.ts`).
  - `appVersionPolicy` GraphQL query — the programmatic/consistency source
    (`mobile-app/src/services/graphql/appVersionPolicy.ts`). It cannot be the
    bootstrap mechanism for a too-old client, because the gate blocks that
    request before the query resolves.

Because an already-shipped binary cannot be edited, **any** breaking change that
depends on a newer app must raise the floor **in the same migration** that
introduces the break.

## The four scenarios

### 1. Backend only (services + database)

Order matters: migrate the DB first, then restart the long-running services.

1. Write migrations as new `database/migrations/NNN_*.sql` files (append-only).
   Keep canonical SQL in `database/functions/**` in sync with the migrations.
   - *If the change is breaking for older app clients*, bump
     `app_private.app_version_policy.min_*_semver` in the same migration.
2. Run migrations:
   ```bash
   docker compose run --rm migrate   # or DATABASE_URL=... ./database/migrate.sh
   ```
3. Rebuild and restart backend + worker (worker runs baked `dist/` artifacts,
   so `--build` is required after TS worker changes):
   ```bash
   docker compose up -d --build backend worker
   ```
4. Verify:
   - `GET /health` returns `200` and reports the expected `appVersionPolicy`.
   - Worker logs show tasks registered (`docker compose logs --tail=50 worker`).
   - `npm --workspace backend test`.

Constraints:

- Prod runs `POSTGRAPHILE_WATCH_PG: "false"`, so a restart is mandatory for any
  SQL/function change to be visible.
- Dropping/renaming a column mid-deploy breaks the currently-running app — gate
  it behind the version floor (see above).

### 2. Website only (frontend / Next.js)

Lowest-risk roll-out; no DB or API-contract change.

1. `npm --workspace frontend run typecheck` (runs GraphQL codegen against the
   checked-in schema snapshot) and `npm --workspace frontend run build`.
2. Rebuild + swap the container (build args are baked at image build time, so
   confirm `.env.prod` values first):
   ```bash
   docker compose up -d --build frontend
   ```
3. Verify the deployed URL serves and the Caddy healthcheck passes.

If the frontend change depends on a new schema, deploy the backend first (or
behind the version floor).

### 3. Mobile app only

Slowest path due to App Store Connect / Play Console review.

1. Bump `APP_VERSION` and `APP_VERSION_CODE` in `mobile-app/app.config.ts`.
2. Build with `TARGET_ENV=review`; that embeds the stable review API host.
3. Deploy/migrate the review stack and confirm it is healthy. Set
   `REVIEW_CANDIDATE_VERSION` to the exact `APP_VERSION` using
   `bash scripts/set-review-candidate-version.sh <version>`. Verify this version
   is newer than `PRODUCTION_APP_VERSION`, reaches review, and the released
   version still reaches production.
4. Submit that exact binary for review (both stores). Review latency ranges from
   hours (routine bugfix) to days (new app / major change).
5. After approval and production readiness checks, promote the exact binary by
   running `bash scripts/promote-review-candidate.sh`. It advances
   `PRODUCTION_APP_VERSION`, disables the candidate route, and sends the same
   embedded review hostname to production for that version.
6. Release, ideally with a staged/phased rollout, and monitor. Set the next
   candidate version only when ready to test it on the review stack.

The mobile binary is the one artifact you cannot change after shipping, so it is
the long pole in any combined upgrade.

### 4. Combined upgrade (all three)

Ordering resolves the chicken-and-egg between "new backend breaks old app" and
the immutable store candidate:

1. **Build version `n+1` with `TARGET_ENV=review`**; keep the currently released
   version `n` routed to production.
2. **Deploy the matching review backend + DB** (scenario 1), migrate the review
   database independently, then set `n+1` as the candidate and smoke-test it.
   Submit that exact binary to the stores only after this route is verified.
3. **Prepare production deployment artifacts** and verify compatibility. You
   may prebuild images and apply additive changes, but do not activate a
   breaking migration or raise the production version floor while the candidate
   is still awaiting approval unless intentionally forcing all older clients
   to update.
4. **Deploy the website** (scenario 2) if it depends on the new backend/schema,
   preserving compatibility with currently released clients until cutover.
5. Once store approval is granted, deploy the production backend + DB changes.
   For a breaking change, raise the minimum-version floor in the same migration
   as the break and confirm the candidate version passes that floor.
6. Verify production, then **promote version `n+1`** with
   `bash scripts/promote-review-candidate.sh`. This records `n+1` as production
   and disables its review route; the embedded review hostname now routes it to
   production. Version `n` stayed on production throughout.
7. **Release the approved binary** using a staged/phased rollout and monitor.
   After release, set `n+2` as the next review candidate when ready. Any rollback
   must restore a known-good **production** backend; never send released users
   to the isolated review database.

Decide up front: **backward-compatible** (ship backend/web independently, let
mobile users update lazily) vs **breaking** (the sequence above is mandatory and
the floor is the failsafe).

## Mobile review and backend cutover

The app keeps a stable API hostname per build, while routing selection is
version-aware. `TARGET_ENV=prod` uses `www.tope-la.com`; `TARGET_ENV=review` uses
`review.tope-la.com`. On the review host, the ingress matches the exact
`x-app-version` header for GraphQL/health and `appVersion` query parameter for
OAuth starts. The matching candidate reaches review; all other *versioned mobile
requests* reach production. Health requests carry both version and platform
headers. Versionless review-website GraphQL/auth requests and OAuth callbacks
already in flight stay on review. New mobile OAuth starts carry a version and
are routed by it.

Release state in `.env.ingress` records both `PRODUCTION_APP_VERSION` (`n`) and
`REVIEW_CANDIDATE_VERSION` (`n+1`). The candidate must exactly match
`APP_VERSION` in `mobile-app/app.config.ts` and be newer than production. Manage
the candidate with `bash scripts/set-review-candidate-version.sh <version|none>`;
use `none` only to cancel a candidate, not to promote it:

1. Deploy the isolated review stack, then set `n+1` before submitting its
   `TARGET_ENV=review` binary. Version `n` continues to use production while
   `n+1` and its health/version floor use the review stack.
2. After approval and production readiness checks, run
   `bash scripts/promote-review-candidate.sh`. No app rebuild is needed: the
   script atomically sets production to `n+1` and disables candidate routing,
   so `n+1` now routes to production.
3. When preparing the next release, set `n+2`; only that exact version returns
   to review. The candidate setting is singular, so only one version is tested
   on review at a time.

Versioned mobile requests with a version other than the configured candidate
default to production. On the review hostname, requests without version
metadata stay on review to support the review website and OAuth callback flows;
the production hostname always routes API paths to production. This routing
setting is not an authorization boundary: keep review credentials and data
isolated, and retain each stack's independent minimum-version floor. Never use a
version route rollback to send an already-released version to review. For
post-release rollback, restore a known-good production backend/image and leave
version routing pointed at production.

Review and production databases are intentionally separate. Review accounts,
sessions, and test data do not move to production. A session/token created on the
review stack may be invalid after cutover; test with a fresh production sign-in
and ensure the app clears or recovers from stale review credentials and cached
account data. Do not copy reviewer/test data into production as part of the
switch.

The repository provides a single shared Caddy ingress in
`docker-compose.ingress.yml`. It joins the external `mutuity-edge` network, as do
the production and review backend/frontend services. Do not start Caddy in each
application stack.

The candidate config is embedded in the immutable binary, but promotion does not
change its hostname. Instead, exact version routing maps the same review origin
to review before approval and production after promotion. A separately built
`TARGET_ENV=prod` binary is not the same artifact approved from the review
submission.

## Environment isolation (review / prod stacks)

Each application stack = `postgres + migrate + backend + worker + frontend`,
with its own volume, network, and `.env`. Use the Compose `-p` project flag to
isolate stack resources. Prepare `.env.prod` and `.env.review` from their
examples, set distinct secrets and public URLs, and make sure their backend
CORS settings allow the review app origin. Prepare `.env.ingress` from its
example with the real public hostnames and the existing Caddy data/config volume
names. The production mobile API hostname must remain stable; with the current
mobile config it is `www.tope-la.com`.

Set the release-state values in `.env.ingress` to the currently live version
and the candidate (or the disabled sentinel):

```dotenv
PRODUCTION_APP_VERSION=1.0.0
REVIEW_CANDIDATE_VERSION=__NO_REVIEW_CANDIDATE__
```

```bash
# Create the shared network once, then bring up each isolated database and migrate it.
docker network create mutuity-edge  # omit if it already exists
docker compose -p mutuity-prod  -f docker-compose.prod.yml --env-file .env.prod  up -d postgres
docker compose -p mutuity-prod  -f docker-compose.prod.yml --env-file .env.prod  run --rm migrate
docker compose -p mutuity-review -f docker-compose.prod.yml --env-file .env.review up -d postgres
docker compose -p mutuity-review -f docker-compose.prod.yml --env-file .env.review run --rm migrate

# Start/upgrade app services only after their database migrations complete.
docker compose -p mutuity-prod  -f docker-compose.prod.yml --env-file .env.prod  up -d --build --remove-orphans backend worker frontend
docker compose -p mutuity-review -f docker-compose.prod.yml --env-file .env.review up -d --build --remove-orphans backend worker frontend

# Start the one shared ingress after both stacks are reachable.
docker compose -p mutuity-ingress -f docker-compose.ingress.yml --env-file .env.ingress up -d
```

- The app stacks publish PostgreSQL only on loopback and use distinct defaults
  (`5532` production, `5533` review); neither publishes backend port 5050 or
  frontend port 3000 to the host. Set `POSTGRES_HOST_PORT` if those local ports
  are already occupied.
- The ingress owns host ports 80/443. Before moving an existing deployment,
  back up and configure `.env.ingress` to reuse that Caddy project's existing
  data and config volume names. The first production app-stack `up` above uses
  `--remove-orphans` to remove its old per-stack Caddy container; do not start
  the shared ingress until that container has released ports 80/443. Do not
  delete the old volumes; they hold ACME certificates/state. On a fresh install,
  create the configured external Caddy volumes before starting ingress. DNS for
  every configured public host must resolve to this ingress.
- Initialize `PRODUCTION_APP_VERSION` to the currently live version. Before
   candidate review, set `REVIEW_CANDIDATE_VERSION` to the candidate's exact
   `APP_VERSION`; the setter rejects mismatches and candidates not newer than
   production. After approval and production verification, run
   `bash scripts/promote-review-candidate.sh` to update production version and
   disable candidate routing together. Use `set-review-candidate-version.sh
   none` only to cancel a candidate. Both scripts validate Caddy before
   recreating ingress. Verify `/health`, GraphQL, WebSocket, OAuth, and sign-in
   for `n` (production) and `n+1` (review, then production after promotion). For
   rollback after release, restore the previous production backend/image without
   routing users to review.

## Pre-release checklist

### Realtime balance and inbox rollout (migration 161)

- Deploy `database/migrations/161_notification_realtime_foundation.sql` before
  either updated client. Restart PostGraphile when schema watching is disabled:
  all three notification ordering enums must expose `CREATED_AT_DESC` and `ID_DESC`.
- This migration is additive/backward-compatible; older mobile binaries continue
  working and no minimum-version floor increase is required for this change alone.
- The clients share one account subscription, reconcile after reconnect/foreground,
  and retain loaded balance/history/inbox windows during refresh. Notification
  pagination expands the chronological window in **every** source, rather than
  paginating only generic account notifications.
- On the review stack, check with two accounts/devices: incoming gifts/refunds/rewards
  update the open contribution balance and history; all three inbox event sources
  increase the unread badge; single/all-read actions clear it across devices.
- Repeat after background/offline recovery and logout/login as another account.
  Old-account counts, balances and rows must never remain visible.
- Narrow-screen web navigation shows unread badges inside the navigation drawer;
  the native app shows its badge on the Notifications bottom tab.

### General checks

- [ ] All migrations written and locally verified (`./database/migrate.sh`).
- [ ] `app_private.app_version_policy` floor bumped **iff** this release breaks
      older clients.
- [ ] Backend `npm --workspace backend test` green; `/health` reports the correct
      `appVersionPolicy`.
- [ ] Worker rebuilt with the backend (`--build`).
- [ ] Frontend `typecheck` + `build` green.
- [ ] Mobile `APP_VERSION` / `APP_VERSION_CODE` bumped; binary built with the
      correct `TARGET_ENV`.
- [ ] `PRODUCTION_APP_VERSION` matches the released version and
      `REVIEW_CANDIDATE_VERSION` matches a newer candidate `APP_VERSION`.
- [ ] Verify current production version routes to production and candidate
      version routes to review for health, GraphQL, subscriptions, and OAuth.
- [ ] After approval, promotion advanced production version and disabled
      candidate routing; verify production without rebuilding the binary.
- [ ] Production cutover tested with fresh sign-in; review sessions and data
      are treated as isolated and are not assumed to transfer.
- [ ] Rollback path agreed (previous image tag / previous migration set
      documented).