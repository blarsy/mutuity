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
2. Build with the target env (`TARGET_ENV=prod` selects the API URL from
   `mobile-app/config/environments/prod.json`).
3. Submit for review (both stores). Review latency ranges from hours (routine
   bugfix) to days (new app / major change).
4. Release, ideally with a staged/phased rollout, and monitor.

The mobile binary is the one artifact you cannot change after shipping, so it is
the long pole in any combined upgrade.

### 4. Combined upgrade (all three)

Ordering resolves the chicken-and-egg between "new backend breaks old app":

1. **Prepare the new mobile binary first** and submit it for review (it takes the
   longest), but do not force-release yet.
2. **Deploy backend + DB** (scenario 1), bumping the version floor **in the same
   migration** that introduces any breaking change.
3. **Deploy the website** (scenario 2) once the backend is live.
4. **Release the mobile app** once the backend is confirmed stable and review
   has passed.
5. **Coordinate the cutover**: between "backend live" and "mobile released",
   old clients are held by the version floor + `UpdateRequiredScreen` rather than
   corrupting writes. For zero-breakage, run the new backend on the review stack
   while prod keeps serving the old app, then flip (blue/green).

Decide up front: **backward-compatible** (ship backend/web independently, let
mobile users update lazily) vs **breaking** (the sequence above is mandatory and
the floor is the failsafe).

## Environment isolation (review / prod stacks)

Each stack = `postgres + migrate + backend + worker + frontend (+ caddy)` with its
own volume, network, and `.env`. `docker-compose.prod.yml` is already
parameterized via `.env.prod`; use the Compose `-p` project flag to keep two
stacks fully isolated:

```bash
# Production
docker compose -p mutuity-prod  -f docker-compose.prod.yml --env-file .env.prod  up -d --build
# Review / app-store staging
docker compose -p mutuity-review -f docker-compose.prod.yml --env-file .env.review up -d --build
```

- The app-store/play-store review build targets the *review* stack by building
  with `TARGET_ENV=review` (the `mobile-app/config/environments/review.json`
  already points at `https://review.tope-la.com`, and `start:review` /
  `android:review` / `ios:review` scripts exist), which keeps an unreleased app
  fully exercisable against its own unreleased backend **and** its own DB.
- Add a matching site block to `deploy/caddy/Caddyfile` for the review host
  (mirror the existing `test.tope-la.com` block).

## Pre-release checklist

- [ ] All migrations written and locally verified (`./database/migrate.sh`).
- [ ] `app_private.app_version_policy` floor bumped **iff** this release breaks
      older clients.
- [ ] Backend `npm --workspace backend test` green; `/health` reports the correct
      `appVersionPolicy`.
- [ ] Worker rebuilt with the backend (`--build`).
- [ ] Frontend `typecheck` + `build` green.
- [ ] Mobile `APP_VERSION` / `APP_VERSION_CODE` bumped; binary built with the
      correct `TARGET_ENV`.
- [ ] Review environment provisioned (second compose project + Caddy block) if
      this release requires staging before cutover.
- [ ] Rollback path agreed (previous image tag / previous migration set
      documented).