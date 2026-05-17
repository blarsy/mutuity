# Tasks: Account Deletion And Anonymization

## Milestone A - Backend Policy Contract

- [x] T011-001 Define anonymization field matrix (private/public/relational).
- [x] T011-002 Define authenticated self-delete mutation contract with idempotent success semantics.
- [x] T011-003 Implement transactional delete-account/anonymization routine with rollback safety on partial failure.
- [x] T011-004 Revoke active sessions/tokens atomically with successful deletion completion.
- [x] T011-005 Emit deletion audit event/log record with non-identifying payload constraints.

## Milestone B - Profile UX

- [x] T011-006 Add profile danger/privacy section for deletion action.
- [x] T011-007 Add mild-emphasis `Delete account` button.
- [x] T011-008 Implement confirmation dialog (yes/no actions + consequences copy).
- [x] T011-009 Add explicit confirmation guard before enabling final confirm action.
- [x] T011-010 Implement loading/error/success handling, forced local sign-out, and post-delete redirect.

## Milestone C - Public Projection And SEO Safety

- [x] T011-011 Define deleted account public projection placeholders and required omitted fields.
- [x] T011-012 Integrate deleted-state outputs with feature 010 page-state mapper.
- [x] T011-013 Ensure deleted account metadata uses neutral non-identifying templates.
- [x] T011-014 Verify bookmarked links remain resolvable where policy allows.
- [ ] T011-015 Ensure no identifying fields leak in public payloads, SSR HTML, metadata, or structured data.

## Milestone D - Retention And Operational Controls

- [x] T011-016 Define approved retention periods for conversation history, financial records, deletion audit evidence, backups, and cache artifacts.
- [x] T011-017 Define operational SLAs for backup purge, cache invalidation, and async cleanup after deletion.
- [x] T011-018 Map each retention-matrix row to an implementation control (code path, job, infrastructure rule, or documented operator process).
- [x] T011-019 Ensure audit evidence retention and payload shape remain non-identifying while still supporting deletion proof.

## Milestone E - Validation

- [x] T011-020 Add backend tests for anonymization matrix completeness.
- [x] T011-021 Add backend tests for idempotent deletion retries.
- [x] T011-022 Add integration test for session invalidation after deletion.
- [x] T011-023 Add frontend tests for confirmation flow and redirect.
- [x] T011-024 Add public-page snapshot checks for no-PII leakage post-deletion across account, need, and campaign pages.
- [ ] T011-025 Add verification that cache invalidation and retention-control paths execute within the approved operational windows.
