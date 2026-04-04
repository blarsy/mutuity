# Quickstart: Needs Querying And Claiming

## Prerequisites
- Local stack running (`docker compose up -d` or the three local dev processes)
- Frontend on `http://localhost:3000`
- Backend GraphQL/API on `http://localhost:5050`
- At least two local accounts available: one need creator and one claimer
- Database migrated through `009_need_search_indexes.sql`

## Suggested demo seed setup

Create three browser-login accounts for manual QA:

```bash
HASH=$(node --input-type=module -e "import { hashSync } from 'bcryptjs'; console.log(hashSync('password123', 12));")

psql postgres://postgres:postgres@localhost:5432/mutuity <<SQL
insert into app_public.account (external_subject, display_name, latitude, longitude)
values
  ('creator@example.com', 'Need Creator', 50.6072, 3.3889),
  ('claimer@example.com', 'Helpful Claimer', 50.6056, 3.3878),
  ('claimer-two@example.com', 'Backup Claimer', 50.6110, 3.3950)
on conflict (external_subject) do update
set display_name = excluded.display_name,
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    updated_at = now();

insert into app_private.account_credential (account_id, login_identifier, password_hash, role_name, is_active)
select id, external_subject, '$HASH', 'identified_account', true
from app_public.account
where external_subject in ('creator@example.com', 'claimer@example.com', 'claimer-two@example.com')
on conflict (account_id) do update
set login_identifier = excluded.login_identifier,
    password_hash = excluded.password_hash,
    role_name = excluded.role_name,
    is_active = excluded.is_active,
    updated_at = now();
SQL
```

Use password `password123` for each seeded account.

## Scenario 1: Public discovery query
1. Seed several active needs plus at least one expired need.
2. Open the public needs page.
3. Run the default query from a known location.
4. Verify:
   - only active, non-expired needs appear
   - no more than 50 results are returned
   - nearer/easier/sooner-expiring needs appear first

## Scenario 2: Filter behavior
1. Enter a search term that should match a title or creator name.
2. Toggle each tri-state filter through `neutral -> set -> unset -> neutral`.
3. Verify the result set updates correctly for each state.
4. Verify accent/case differences still match expected needs.

## Scenario 3: Claim a need
1. Sign in as a standard authenticated account.
2. Open an active need from the search results.
3. Submit a claim with an optional message.
4. Verify the claim is persisted and the creator sees a fresh notification.

## Scenario 4: Exchange messages
1. Sign in as the need creator.
2. Open the incoming claim.
3. Send the first reply.
4. Verify the conversation is created and the claimer’s original claim note appears first when present.
5. Exchange follow-up messages from both accounts.

## Scenario 5: Settle a claim
1. As the need creator, settle one valid open claim.
2. Verify the selected claim becomes `settled`.
3. Verify sibling open claims become `declined` or closed.
4. If the need has a Topes amount, verify a transfer event/audit record is created.

## Scenario 6: Expiry sweep
1. Seed or edit a need so its `expires_at` is already in the past while it still has an open claim.
2. Let the worker run or trigger the expiry task locally.
3. Verify the need becomes inactive, the linked open claims become `expired`, and the claimer receives a `claim_expired` notification.

## Suggested verification commands

```bash
npm --workspace frontend run typecheck
npm --workspace frontend test -- --runInBand \
  tests/needs/need-filters.spec.ts \
  tests/needs/claim-thread.spec.tsx

npm --workspace backend run typecheck
npm --workspace backend test -- --runInBand \
  tests/integration/need-search.spec.ts \
  tests/integration/need-filtering.spec.ts \
  tests/integration/need-claim.spec.ts \
  tests/integration/claim-messaging.spec.ts \
  tests/integration/claim-settlement.spec.ts \
  tests/integration/worker-bootstrap.spec.ts
```
