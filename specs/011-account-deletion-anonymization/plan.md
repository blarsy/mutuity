# Implementation Plan: Account Deletion And Anonymization

## Goal

Deliver a profile-driven account deletion flow that anonymizes/deactivates identity data, revokes access, preserves referential integrity, and exposes policy-safe deleted-state outputs for public rendering.

## Phase 1 - Data Policy And Backend Contract

- Define anonymization field matrix (private, public-identity, relational).
- Define authenticated self-delete mutation contract with idempotent success semantics and safe error envelope.
- Implement backend deletion/anonymization routine with transactional safety and rollback on partial failure.
- Implement session/token revocation atomically with successful deletion completion.
- Emit deletion audit event/log entry with non-identifying payload constraints.

Exit criteria:

- Backend mutation is idempotent, secure, and policy-complete.

## Phase 2 - Profile UX Flow

- Add mild-emphasis delete action in profile danger/privacy section.
- Implement confirmation dialog with explicit consequences.
- Add confirmation guard (toggle/checkbox/text-confirm) before enabling final action.
- Handle loading, success, and error states.
- On success: force local sign-out and redirect to signed-out route.

Exit criteria:

- End-to-end user deletion flow works from profile UI.

## Phase 3 - Public Projection Integration

- Define deleted account public projection fields and required omitted fields.
- Ensure feature `010` can consume deleted-visible signals and placeholders.
- Validate metadata behavior for deleted account/listing pages.
- Ensure no identifying data leaks in page payloads, SSR HTML, metadata, or structured data.

Exit criteria:

- Deleted-state rendering is consistent and safe across public pages.

## Phase 4 - Retention And Operational Controls

### Policy Decisions (T011-016, T011-017)

- Define approved retention periods for conversation history, financial records, deletion audit evidence, backups, and cache artifacts.
  - **Conversation content**: 90 days (grace period for user recovery; then redact identifying refs)
  - **Financial records**: 7 years (business/tax/regulatory requirement)
  - **Deletion audit evidence**: 3 years (security/compliance retention)
  - **Backups**: 30 days (standard backup TTL)
  - **CDN/cache artifacts**: 15 minutes (with 5-minute hard SLA)

- Define operational SLAs:
  - **Backup purge window**: 30 days maximum after deletion
  - **Cache invalidation**: 5 minutes maximum (15 seconds target) after deletion
  - **Async cleanup**: 24 hours maximum after deletion

### Implementation Mapping (T011-018)

Each retention matrix row maps to one or more implementation controls:

| Data category | Implementation control | Owner | Verification |
|---|---|---|---|
| Account private identity fields | Delete/anonymize executed synchronously in `delete_my_account()` SQL function during mutation; all PII fields nulled or masked in single transaction | Backend mutation handler | Unit test: anonymization matrix completeness; Integration test: verify no email/avatar/bio post-deletion |
| Auth credentials/sessions | `account_session` table purged and push tokens invalidated in same transaction as account update; no background job needed | Backend mutation handler + Session manager | Integration test: verify no valid tokens exist post-deletion; E2E test: verify immediate session invalidation |
| Public listing references | Feature 010 consumed policy-safe projection (account.externalSubject masked with `deleted-` prefix); referential FK remains intact | Policy layer + Feature 010 integration | Unit test: verify VISIBLE_DELETED state mapping; E2E test: verify bookmarked URLs still resolve with anonymized creator |
| Conversation content/message history | Scheduled background job runs every 6 hours; queries deletion audit log for events older than 90 days; redacts identifying references from messages (user name, email in body, etc.) while preserving message structure and timestamps | Message redaction job (scheduled, `backend/src/worker/`); audit log consumer | Job execution dashboard; alert if job fails or runs > 6 hours; audit trail shows which messages were redacted |
| Financial/ledger records | No application-level action required; records remain immutable and auditable; finance team retains access for 7 years per compliance policy; code comment in ledger table references this retention window | Finance/compliance runbook + inline code documentation | Audit: verify finance db access logs; compliance: include retention matrix in annual data governance review |
| Deletion audit evidence | Audit events written to immutable append-only table with non-identifying payload (deletion_user_id, deletion_timestamp, account_id only); purge/archive job runs annually to archive events > 3 years old to cold storage | Audit log pipeline + Annual purge job | Test: verify audit event has no PII; Operational: verify cold storage archival annually; compliance: verify archived events are retrievable for disputes |
| Backups (full snapshots, WAL, replication) | Backup retention policy set at infrastructure level (30-day TTL for full backups; WAL archive retention set to 30 days); no custom app code needed; verified via backup infrastructure alerts | Infrastructure/DBA team + Backup policy config | Monitor: backup age dashboard; alert if backup > 30 days old; manual quarterly audit of backup retention settings |
| CDN/cache artifacts | Deletion mutation triggers immediate cache purge via `cacheInvalidation.purge(['/accounts/[id]', '/needs?creatorId=...', '/campaigns?creatorId=...'])` API call; secondary validation job runs every 1 minute and 5 minutes post-deletion to catch missed edge nodes; fallback: TTL expiry (1 hour) | Backend mutation handler + Cache validation job | Integration test: verify cache purge called on deletion; E2E test: load account page immediately post-deletion and verify stale content not served; dashboard: log all cache invalidations and alert if SLA breached |

### Audit Evidence Payload Contract (T011-019)

Deletion audit events emitted to `audit_log` table with the following non-identifying schema:

```sql
-- Example deletion audit event (ensure NO PII)
INSERT INTO audit_log (event_type, event_data, created_at) VALUES (
  'account_deletion',
  jsonb_build_object(
    'account_id', '550e8400-e29b-41d4-a716-446655440000', -- UUID only, no email/name
    'deletion_timestamp', now(),
    'actor_id', 'admin-or-self-id',                       -- who triggered deletion (self = account itself)
    'reason_category', 'user-initiated'                    -- never include user-typed reason text
  ),
  now()
);
```

Payload must NEVER include: email, display name, avatar URL, bio, external links, location, or any other PII. These fields are sufficient for audit trail and dispute resolution without leaking private data.

Exit criteria:

- Every retention category has an approved period and a mapped implementation control.
- Operational windows are documented and implementation-ready.
- Implementation mapping table is complete with owner and verification strategy.
- Audit evidence payload schema is defined and tested.

## Phase 5 - Verification And Hardening

- Add backend tests for anonymization matrix and idempotency.
- Add integration tests for session revocation after deletion.
- Add UI tests for confirmation flow and post-delete redirect.
- Add public-page snapshot checks for no-PII leakage across account, need, and campaign pages after deletion.
- Verify cache invalidation and retention-control paths execute within approved operational windows.

Exit criteria:

- Deletion behavior is stable, test-covered, and privacy-safe.
- All retention matrix rows have at least one automated test or verified operational control.
