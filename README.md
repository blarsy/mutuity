# Mutuity

Monorepo for Mutuity frontend, backend (PostGraphile + Graphile Worker), and PostgreSQL schema.

## Project Structure

- `frontend/`: Next.js web app
- `backend/`: PostGraphile API server + Graphile Worker runtime
- `database/`: SQL migrations and function files

## Local Development (Without Docker)

### Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 15+ (running locally)
- `psql` CLI available in shell

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment files

Backend:

```bash
cp backend/.env.example backend/.env
```

Frontend:

```bash
cp frontend/.env.example frontend/.env.local
```

If your PostgreSQL credentials differ, update `DATABASE_URL` in `backend/.env`.
For browser access from local frontend, set `BACKEND_CORS_ORIGINS` (comma-separated if needed).

Auth email delivery configuration (`backend/.env`):

- `MAIL_DELIVERY_ENABLED=false` keeps delivery disabled (default for local/non-production)
- `MAIL_WEB_APP_URL=http://localhost:3000` controls verification/reset links
- `MAIL_FROM_ADDRESS=Mutuity <noreply@mutuity.local>` controls sender identity
- `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_API_URL` are required only when `MAIL_DELIVERY_ENABLED=true`

Auth mails are always persisted to `app_private.mail_outbox` for audit/resend workflows, even when delivery is disabled.

### 3. Create database and run migrations

```bash
createdb mutuity
DATABASE_URL=postgres://postgres:postgres@localhost:5432/mutuity ./database/migrate.sh
```

Optional fast-path bootstrap (for fresh environments):

```bash
# 1) Export a consolidated schema snapshot from an up-to-date database
DATABASE_URL=postgres://postgres:postgres@localhost:5432/mutuity ./database/export_bootstrap_schema.sh database/bootstrap/schema.sql

# 2) Initialize a fresh database from that snapshot and mark migrations as applied
createdb mutuity_bootstrap
DATABASE_URL=postgres://postgres:postgres@localhost:5432/mutuity_bootstrap ./database/migrate.sh --bootstrap-file database/bootstrap/schema.sql
```

After bootstrap, keep using the normal migration flow for future changes.

### 4. Start services (3 terminals)

Terminal A:

```bash
npm run dev:backend
```

Terminal B:

```bash
npm run dev:worker
```

Terminal C:

```bash
npm run dev:frontend
```

### 5. Open app endpoints

- Frontend: `http://localhost:3000`
- Login page: `http://localhost:3000/login`
- GraphQL endpoint: `http://localhost:5050/graphql`
- GraphiQL: `http://localhost:5050/graphiql`

### 5b. Refresh frontend GraphQL schema snapshot

The frontend validates all GraphQL operations during typecheck against a checked-in schema snapshot.

Run this when backend GraphQL schema changes:

```bash
npm --workspace frontend run graphql:schema
```

Then regenerate typed GraphQL artifacts:

```bash
npm --workspace frontend run graphql:codegen
```

### 6. Local auth test flow

The browser login flow now uses server-managed sessions. For local testing, you can seed a demo account into PostgreSQL and then sign in through the UI or curl:

```bash
HASH=$(node --input-type=module -e "import { hashSync } from 'bcryptjs'; console.log(hashSync('password123', 12));")

psql postgres://postgres:postgres@localhost:5432/mutuity <<SQL
insert into app_public.account (external_subject, display_name)
values ('demo@example.com', 'Demo User')
on conflict (external_subject) do update
set display_name = excluded.display_name,
    updated_at = now();

insert into app_private.account_credential (account_id, login_identifier, password_hash, role_name, is_active)
select id, 'demo@example.com', '$HASH', 'identified_account', true
from app_public.account
where external_subject = 'demo@example.com'
on conflict (account_id) do update
set login_identifier = excluded.login_identifier,
    password_hash = excluded.password_hash,
    role_name = excluded.role_name,
    is_active = excluded.is_active,
    updated_at = now();
SQL
```

Then sign in with:

- **identifier**: `demo@example.com`
- **password**: `password123`

For local-only manual testing, dev headers (`x-role`, `x-account-id`) are still supported when `ALLOW_DEV_AUTH_HEADERS=true`, but the browser flow should use the real session cookie path above.

## Local Deployment With Docker Compose

### Prerequisites

- Docker Engine with Compose plugin

### 1. Build and start stack

```bash
docker compose up --build -d postgres
```

### 2. Run migrations (one-off)

```bash
docker compose run --rm migrate
```

Optional bootstrap mode (fresh DB only):

```bash
# Export schema snapshot from a source DB
DATABASE_URL=postgres://postgres:postgres@localhost:5432/mutuity ./database/export_bootstrap_schema.sh database/bootstrap/schema.sql

# Apply snapshot instead of replaying all historical migrations
docker compose run --rm -e DATABASE_URL=postgres://postgres:postgres@postgres:5432/mutuity migrate --bootstrap-file database/bootstrap/schema.sql
```

### 3. Start API, worker, and frontend

```bash
docker compose up --build -d backend worker frontend
```

To temporarily enable GraphiQL locally for schema exploration:

```bash
BACKEND_NODE_ENV=development ALLOW_GRAPHIQL=true docker compose up --build -d backend
```

Production-safe defaults remain:
- `BACKEND_NODE_ENV=production`
- `ALLOW_GRAPHIQL=false`

### 4. Verify

```bash
docker compose ps
curl http://localhost:5050/health
```

### 5. Stop stack

```bash
docker compose down
```

To reset all data:

```bash
docker compose down -v
```

## Remote Docker Server Deployment

Use the same `docker-compose.yml` on the target server.

### Recommended flow

1. Install Docker and Compose plugin on server.
2. Pull repository on server.
3. Create/update env files (`backend/.env`, `frontend/.env.local`) with server values.
   - Backend hardening minimums for non-dev environments:
     - `ALLOW_GRAPHIQL=false`
     - `ALLOW_DEV_AUTH_HEADERS=false`
     - `BACKEND_CORS_ORIGINS=https://your-frontend-domain`
4. Run:

```bash
docker compose pull
# or docker compose build if building on server

docker compose up -d postgres

docker compose run --rm migrate

docker compose up -d backend worker frontend
```

5. Put a reverse proxy (Nginx/Caddy/Traefik) in front of frontend and backend.
6. Enable TLS certificates.
7. Automate backups for the PostgreSQL volume.

## Feature 002 local QA (`/needs`)

After starting the stack and seeding the demo accounts, this is the recommended manual flow:

1. Open `http://localhost:3000/needs`
2. Browse and filter public needs while signed out
3. Sign in as `claimer@example.com` / `password123` and submit a claim
4. Sign in as `creator@example.com` and verify the incoming claim notification
5. Reply in the claim conversation, then settle the chosen claim
6. Verify the sibling claim is declined and expiry notifications appear for stale claims

Useful verification commands:

```bash
npm --workspace frontend run build
npm --workspace frontend test -- --runInBand tests/needs/need-filters.spec.ts tests/needs/claim-thread.spec.tsx
npm --workspace backend test -- --runInBand \
  tests/integration/need-search.spec.ts \
  tests/integration/need-filtering.spec.ts \
  tests/integration/need-claim.spec.ts \
  tests/integration/claim-messaging.spec.ts \
  tests/integration/claim-settlement.spec.ts \
  tests/integration/worker-bootstrap.spec.ts
```

## Quality Checks

```bash
npm run typecheck
npm run lint
npm test
```

`npm run typecheck` now includes frontend GraphQL document validation via codegen.

## Notes

- GraphQL role/account simulation headers are supported in backend: `x-role`, `x-account-id`.
- SQL functions in `app_public` are exposed by PostGraphile as GraphQL mutations.
