# Tasks: Claims Workspace And Settlement

**Input**: Design documents from `/specs/008-claims-workspace-and-settlement/`  
**Prerequisites**: `spec.md`, `plan.md`

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependency)
- **[Story]**: User story scope (`US1`, `US2`, `US3`, `US4`)
- All task descriptions include concrete file paths

## Phase 1: Spec Foundation

- [x] T001 Confirm the claims-workspace feature scope in `specs/008-claims-workspace-and-settlement/spec.md`
- [x] T002 Draft the implementation plan in `specs/008-claims-workspace-and-settlement/plan.md`
- [x] T003 Audit the existing `/claims` page, claim lifecycle SQL, and current notification behavior before coding begins

## Phase 2: Foundational (Blocking Prerequisites)

- [ ] T004 Review the current `need_claim` lifecycle model and reconcile any legacy `expired` semantics with the product rule that claims themselves do not independently expire in `database/migrations/025_claims_workspace_and_settlement.sql`
- [ ] T005 [P] Add SQL helpers or views for sent/received claim ordering by latest status-change time and tri-state active/inactive/all filtering in `database/functions/claim/`
- [ ] T006 [P] Add or expose SQL-owned claimer-side cancellation and creator-side decline behavior for direct use from the workspace in `database/functions/claim/`
- [ ] T007 [P] Add or expose a SQL helper for validating need-creator balance before settlement in `database/functions/claim/` and/or `database/functions/token/`
- [ ] T008 [P] Add a scheduled worker task and SQL function for polling expired needs and auto-declining linked open claims in `backend/src/worker/tasks/` and `database/functions/claim/`
- [ ] T009 Add shared frontend claim-workspace types and query documents in `frontend/src/features/needs/`, including page-size-5 pagination and section-scoped tri-state filters

## Phase 3: User Story 1 - Browse Sent And Received Claims (Priority: P1)

**Goal**: Accounts can browse sent and received claims in a practical workspace with tri-state filters, ordering, and pagination.

**Independent Test**: Seed mixed claim histories, open `/claims`, and verify the two sections, default `active` filters, latest-status ordering, and page-size-5 loading behavior.

### Tests (US1)

- [ ] T010 [P] [US1] Add backend integration tests for sent/received claim ordering and tri-state filtering in `backend/tests/integration/claims-workspace.spec.ts`
- [ ] T011 [P] [US1] Add frontend tests for `ClaimsPage` rendering, tri-state filters, and pagination in `frontend/tests/claims/claims-page.spec.tsx`

### Implementation (US1)

- [ ] T012 [US1] Extend `frontend/src/pages/claims.tsx` to order by latest status-change time rather than creation time alone
- [ ] T013 [US1] Add separate `active/inactive/all` tri-state filters with default `active` to sent and received sections in `frontend/src/pages/claims.tsx`
- [ ] T014 [US1] Add load-more pagination behavior with a page size of 5 to large claim histories in `frontend/src/pages/claims.tsx` and the supporting queries

## Phase 4: User Story 2 - Manage Claim Status From The Workspace (Priority: P1)

**Goal**: Claimers and need creators can cancel, decline, and settle claims directly from the claims workspace.

**Independent Test**: Cancel an open sent claim, decline an open received claim, and settle another open received claim while verifying balance checks, competing-claim auto-declines, and notifications.

### Tests (US2)

- [ ] T015 [P] [US2] Add backend integration tests for claimer-side cancellation, explicit decline, settlement auto-decline side effects, and insufficient-balance settlement failures in `backend/tests/integration/claims-settlement.spec.ts`
- [ ] T016 [P] [US2] Add frontend tests for cancel/decline/settle controls, settlement disabled-state messaging, and final-confirmation messaging in `frontend/tests/claims/claim-actions.spec.tsx`

### Implementation (US2)

- [ ] T017 [US2] Add cancel actions to sent claims in `frontend/src/pages/claims.tsx` and the relevant claim card component
- [ ] T018 [US2] Add decline actions to received claims in `frontend/src/pages/claims.tsx` and the relevant claim card component
- [ ] T019 [US2] Add settle actions to received claims in `frontend/src/pages/claims.tsx` with a preemptive balance guard and final confirmation dialog
- [ ] T020 [US2] Surface inactive explanations for settled, declined, and withdrawn claims in the workspace UI

## Phase 5: User Story 3 - Navigate To Need, Counterparty, Or Conversation (Priority: P2)

**Goal**: Users can move directly from any claim row to the corresponding need, account, or conversation.

**Independent Test**: Use the need/account/chat controls from both sent and received claim rows and verify each destination opens correctly.

### Tests (US3)

- [x] T021 [P] [US3] Add frontend tests for account/need/chat deep links from claim cards in `frontend/tests/claims/claim-navigation.spec.tsx`
- [x] T022 [P] [US3] Add integration coverage for claim-conversation routing if additional APIs are required in `backend/tests/integration/claim-conversation-link.spec.ts`

### Implementation (US3)

- [x] T023 [US3] Add counterparty account navigation affordances to sent and received claim rows in `frontend/src/pages/claims.tsx`
- [x] T024 [US3] Add target need navigation affordances to both claim sections in `frontend/src/pages/claims.tsx`
- [x] T025 [US3] Add direct `chat` shortcuts from claim cards using the existing claim conversation model in `frontend/src/pages/claims.tsx` and shared chat utilities

## Phase 6: User Story 4 - System Closes Claims When Needs Become Unavailable (Priority: P2)

**Goal**: Open claims are automatically declined when their target need expires or is deactivated.

**Independent Test**: Expire one need and deactivate another with open claims, then verify statuses and notifications for claimers and need creator.

### Tests (US4)

- [ ] T026 [P] [US4] Add backend integration tests for need-expiry polling declines, need-deactivation declines, and the related notification matrix in `backend/tests/integration/claim-auto-decline.spec.ts`
- [ ] T027 [P] [US4] Add frontend tests for need-deactivation effects surfaced in claims-related UI where applicable in `frontend/tests/claims/claim-auto-decline.spec.tsx`

### Implementation (US4)

- [ ] T028 [US4] Wire the expired-needs worker into the current worker schedule and task registry for claim auto-declines
- [ ] T029 [US4] Apply the notification matrix for need-expiry declines, need-deactivation declines, and creator-triggered declines in SQL-owned claim lifecycle functions
- [ ] T030 [US4] Ensure the claims workspace refreshes and presents the correct decline reasons after automatic need-driven claim closure

## Phase 7: Polish & Validation

- [ ] T031 [P] Ensure claim-related copy remains i18n-backed, including decline reasons and insufficient-balance messaging, in `frontend/src/i18n/messages/`
- [ ] T032 [P] Add responsive layout polish for the side-by-side sent/received claims workspace on small screens in `frontend/src/pages/claims.tsx`
- [ ] T033 Run end-to-end verification for claim browsing, lifecycle actions, settlement guards, auto-declines, and conversation links
- [ ] T034 Capture any remaining differences between the old claims workflow and the rebuilt MVP in `specs/008-claims-workspace-and-settlement/spec.md`

## Dependencies & Execution Order

- Phase 1 is complete and establishes the scope.
- Phase 2 must land before the main claims-workspace parity work.
- US1 should land first because the page structure, filters, ordering, and pagination are the base for lifecycle actions.
- US2 depends on the SQL lifecycle helpers and settlement validation work.
- US3 depends on the workspace card structure and current claim conversation model.
- US4 depends on the worker integration and notification rules.

## Parallel Execution Examples

- T005, T006, T007, and T008 can run in parallel.
- T010 and T011 can run in parallel.
- T015 and T016 can run in parallel.
- T021 and T022 can run in parallel.
- T026 and T027 can run in parallel.
- T031 and T032 can run in parallel.

## Implementation Strategy

1. Reconcile the lifecycle model and add the missing SQL helpers, worker behavior, and settlement validation surfaces first.
2. Bring `/claims` up to workspace parity with filters, ordering, pagination, and direct actions.
3. Add account/need/chat navigation affordances and ensure the current conversation model remains the single source of truth.
4. Finish with i18n cleanup, responsive polish, and end-to-end verification.
