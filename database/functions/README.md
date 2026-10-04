# Database Functions

This directory stores SQL functions exposed through PostGraphile.

Implemented / planned functions include:
- create_campaign
- add_campaign_moderation_note
- approve_campaign
- create_need
- accept_campaign_need
- reject_campaign_need
- search_needs
- claim_need
- send_claim_message
- mark_claim_messages_read
- settle_need_claim

## Function-only claim/chat writes

Migration 156 removes raw INSERT/UPDATE/DELETE (and administrative table-write
privileges) on claim/chat tables from anonymous, identified_account and admin.
Ordinary reads and dedicated send/read/typing/claim/settlement functions remain.
Generated CRUD may remain in a schema introspected with a privileged connection;
execution by application roles is denied by PostgreSQL grants regardless.

`chat/send_conversation_messages.sql` is the canonical source for
`send_claim_conversation_message` and `send_resource_conversation_message`.
These accept an existing conversation ID, derive the sender from the session,
verify participation without an admin bypass, and insert text/images atomically.
They support threads that do not yet have a claim or bid.

### Production rollout warning

Older mobile builds send messages/images through generated raw CRUD mutations.
They will no longer be able to send chat messages after migration 156. For a
staged rollout, deploy the canonical message functions additively first, release
the updated mobile client, and enforce an appropriate minimum supported app
version before applying the revocations in migration 156. Audit other external
GraphQL consumers for raw claim/chat CRUD before deployment. Migration 156 safely
redefines the same functions when subsequently applied by the normal runner.

Migration 157 (`chat/participant_privacy.sql`) removes resource-chat SELECT admin
bypasses and all obsolete claim/chat write policies. App-role direct reads of the
owner-executed summary view are revoked; use account-filtered list/count functions
instead. No application caller uses direct summary reads. External consumers that
do must migrate to the scoped functions. Dedicated administrative functions and
public listing/moderation policies are unchanged.

## Authorization verification gate

Set `TEST_DATABASE_URL` (preferred) or `DATABASE_URL` explicitly, then use
`npm run guard:admin-boundaries` for read-only catalog verification, or
`npm run test:security-boundaries` for that guard plus row-isolation and verifier
regression tests. Both are root-workspace scripts. The guard exits nonzero on
violations, connection errors or missing configuration, so it can gate CI.

The shared query in [the boundary contract](../verify_admin_privilege_boundaries.sql)
checks effective privileges (including PUBLIC grants and inheritance), exact
function signatures/EXECUTE/security modes, app-role safety, table ownership/RLS,
summary-view access and policy regressions. Catalog checks are not a complete
proof of function behavior; the accompanying participant/recipient tests remain
mandatory. The existing campaign-resource administrative DELETE is explicitly
preserved, not treated as new ordinary-user access.

Run the tests only against a disposable/local test database with migrations
through 157. The fixture connection must own the test objects (or be a test
superuser), be able to SET ROLE, and alter transactional grants/policies for
negative tests. All fixture writes and simulated security regressions roll back,
but negative tests briefly acquire DDL locks; do not run them on production or
concurrently with migrations. The read-only guard itself is suitable for deployed
database checks. No HTTP backend, mobile simulator or new migration is required.

## Full role inheritance assessment (point 5)

After migrations 155-157, inheriting `identified_account` would add only:

- Raw INSERT/UPDATE on `campaign_resource`.
- EXECUTE on `request_account_email_change(text,bigint,bigint)` and
	`confirm_account_email_change(text)`.

The assessment tests apply `GRANT identified_account TO admin WITH INHERIT TRUE,
SET FALSE` inside a rolled-back transaction. Claim/chat raw writes remain denied
and tested participant reads remain isolated. However, campaign-resource raw
UPDATE permits bypassing pending-only triage transitions and retaining stale
decision metadata; it is outside the approved function-based write boundary.
Inheritance would also automatically pick up every future regular-user grant.

**Decision: retain explicit scoped grants for now; no persistent role membership
is deployed.** Before full capability parity, move campaign-resource link writes
behind validated functions and migrate its web/mobile raw-create callers, or
deliberately validate and accept those direct grants. Add separately reviewed
admin email-change EXECUTE grants if that user feature is needed. These are
remaining feature gaps, not evidence of full user/admin capability parity.
The membership-separation assertion is intentional until that follow-up work is
approved. Hypothetical inheritance tests require PostgreSQL 16+ and a test
superuser/role-administration connection; all grants and fixtures roll back.
