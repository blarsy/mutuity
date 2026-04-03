# Quickstart: Needs Querying And Claiming

## Prerequisites
- Local stack running (`docker compose up -d`)
- Frontend on `http://localhost:3000`
- Backend GraphQL/API on `http://localhost:5050`
- At least two local accounts available: one need creator and one claimer

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

## Suggested verification commands

```bash
npm --workspace backend run typecheck
npm --workspace backend test -- --runInBand \
  tests/integration/need-search.spec.ts \
  tests/integration/need-claim.spec.ts \
  tests/integration/claim-messaging.spec.ts \
  tests/integration/claim-settlement.spec.ts
```
