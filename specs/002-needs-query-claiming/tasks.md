# Tasks: Needs Querying And Claiming

**Input**: Design documents from `/specs/002-needs-query-claiming/`  
**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependency)
- **[Story]**: User story scope (`US1`, `US2`, `US3`, `US4`, `US5`)
- Every task references concrete file paths

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Create feature folders for needs discovery and claim flows in `frontend/src/features/needs/` and `frontend/src/pages/needs/`
- [x] T002 [P] Add placeholder test files for need search, claims, messaging, and settlement in `backend/tests/integration/` and `backend/tests/contract/`
- [x] T003 [P] Add shared frontend types for search filters, need cards, and claim thread state in `frontend/src/features/needs/types.ts`

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T004 Create migration `008_need_search_and_claims.sql` for location coordinates, claim tables, conversation/message tables, notification records, and supporting enums/indexes in `database/migrations/`
- [x] T005 [P] Implement SQL helper functions for search scoring and location fallback in `database/functions/need/search_needs.sql`
- [x] T006 [P] Implement SQL mutations for `claim_need`, `send_claim_message`, `mark_claim_messages_read`, and `settle_need_claim` in `database/functions/claim/`
- [x] T007 Expose new query/mutation functions cleanly through PostGraphile comments/config in `database/functions/` and `backend/src/postgraphile/server.ts`
- [x] T008 Add shared backend test seed helpers for accounts, needs, and claims in `backend/tests/integration/need-test-helpers.ts`
- [x] T009 Add or wire a recurring expiry/notification job for overdue needs and claims in `backend/src/jobs/` or the existing worker runtime

## Phase 3: User Story 1 - Visitor Queries Active Needs (Priority: P1)

**Goal**: Visitors can discover active, non-expired needs near a location, ranked by the specified weighted score.

**Independent Test**: Run a default query from a known location and verify only active non-expired needs are returned, capped to 50, in deterministic rank order.

### Tests (US1)

- [ ] T010 [P] [US1] Add backend integration tests for active/expired filtering, score ordering, and 50-result cap in `backend/tests/integration/need-search.spec.ts`
- [ ] T011 [P] [US1] Add backend contract coverage for the public search query payload in `backend/tests/contract/need-search.contract.spec.ts`

### Implementation (US1)

- [ ] T012 [US1] Add GraphQL search query and fragments in `frontend/src/features/needs/needs.queries.ts`
- [ ] T013 [US1] Build the public discovery screen in `frontend/src/features/needs/PublicNeedsPage.tsx`
- [ ] T014 [US1] Add the public route and home-page entry point in `frontend/src/pages/needs/index.tsx` and `frontend/src/pages/index.tsx`

## Phase 4: User Story 2 - User Applies Query Filters (Priority: P1)

**Goal**: Visitors and signed-in users can refine need results with text and tri-state filters.

**Independent Test**: Apply search text and tri-state toggles, then verify the result set updates according to the spec.

### Tests (US2)

- [ ] T015 [P] [US2] Add frontend tests for tri-state toggle cycling and filter-to-query mapping in `frontend/tests/needs/need-filters.spec.tsx`
- [ ] T016 [P] [US2] Add backend integration tests for text matching and location fallback order in `backend/tests/integration/need-filtering.spec.ts`

### Implementation (US2)

- [ ] T017 [US2] Add tri-state filter helpers and query-state management in `frontend/src/features/needs/needFilters.ts`
- [ ] T018 [US2] Connect text + tri-state controls to the discovery page in `frontend/src/features/needs/PublicNeedsPage.tsx`
- [ ] T019 [US2] Implement account/browser/Tournai coordinate fallback in `frontend/src/features/needs/locationFallback.ts` and the search query adapter

## Phase 5: User Story 3 - Authenticated User Claims Need (Priority: P1)

**Goal**: Signed-in users can claim an active need with an optional message, and the creator receives a notification.

**Independent Test**: Submit a claim as an authenticated user and verify persistence plus creator notification; confirm signed-out attempts are denied.

### Tests (US3)

- [ ] T020 [P] [US3] Add backend integration tests for successful and denied claim creation in `backend/tests/integration/need-claim.spec.ts`
- [ ] T021 [P] [US3] Add contract coverage for the claim mutation and notification payload in `backend/tests/contract/need-claim.contract.spec.ts`

### Implementation (US3)

- [ ] T022 [US3] Add claim mutation/query helpers in `frontend/src/features/needs/needClaims.queries.ts`
- [ ] T023 [US3] Build the claim CTA and optional-message dialog in `frontend/src/features/needs/NeedClaimDialog.tsx`
- [ ] T024 [US3] Surface creator notifications or pending-claim state in `frontend/src/features/needs/ClaimNotificationsPanel.tsx`

## Phase 6: User Story 4 - Creator And Claimer Exchange Instant Messages (Priority: P2)

**Goal**: Both participants can exchange messages in a private claim conversation.

**Independent Test**: The creator sends the first message, the conversation is created, and both participants can read/send messages while outsiders are denied.

### Tests (US4)

- [ ] T025 [P] [US4] Add backend integration tests for conversation creation, access control, and read timestamps in `backend/tests/integration/claim-messaging.spec.ts`
- [ ] T026 [P] [US4] Add frontend tests for message thread rendering and send flow in `frontend/tests/needs/claim-thread.spec.tsx`

### Implementation (US4)

- [ ] T027 [US4] Add conversation queries and mutations in `frontend/src/features/needs/claimConversation.queries.ts`
- [ ] T028 [US4] Build the conversation UI in `frontend/src/features/needs/ClaimConversationPanel.tsx`
- [ ] T029 [US4] Add optional image attachment metadata handling in `frontend/src/features/needs/ClaimConversationPanel.tsx` and supporting upload adapter/service

## Phase 7: User Story 5 - Need Creator Settles Claim (Priority: P2)

**Goal**: The need creator can settle one claim atomically and close the remaining open ones.

**Independent Test**: Settle a valid claim as the creator and verify settlement state, sibling closure, and Topes transfer/audit recording.

### Tests (US5)

- [ ] T030 [P] [US5] Add backend integration tests for creator-only atomic settlement and idempotency in `backend/tests/integration/claim-settlement.spec.ts`
- [ ] T031 [P] [US5] Add contract tests for the settlement mutation response in `backend/tests/contract/claim-settlement.contract.spec.ts`

### Implementation (US5)

- [ ] T032 [US5] Build creator claim-management and settlement actions in `frontend/src/features/needs/NeedClaimManagementPage.tsx`
- [ ] T033 [US5] Surface settled/declined state and Topes event summaries in `frontend/src/features/needs/NeedClaimStatusChip.tsx`
- [ ] T034 [US5] Ensure the expiry sweep also closes stale open claims and emits notifications in the worker/backend job layer

## Phase 8: Polish & Cross-Cutting

- [ ] T035 [P] Add search-performance indexes and query-plan tuning in `database/migrations/009_need_search_indexes.sql`
- [ ] T036 [P] Document local QA scenarios and seed guidance in `specs/002-needs-query-claiming/quickstart.md` and `README.md`
- [ ] T037 Run end-to-end validation and capture any spec divergences back into `specs/002-needs-query-claiming/spec.md`

## Dependencies & Execution Order

- Phase 1 first, then Phase 2.
- US1 depends on the foundational migration and search functions.
- US2 depends on US1 search wiring.
- US3 depends on the Feature 004 auth/session flow already being present.
- US4 depends on live claim creation from US3.
- US5 depends on the claim lifecycle and audit data established in US3 and US4.

## Parallel Execution Examples

- T002 and T003 can run in parallel.
- T005 and T006 can run in parallel.
- T010 and T011 can run in parallel.
- T015 and T016 can run in parallel.
- T020 and T021 can run in parallel.
- T025 and T026 can run in parallel.
- T030 and T031 can run in parallel.

## Implementation Strategy

1. Land the database/search foundation first.
2. Ship public search and filters as the first visible slice.
3. Add authenticated claiming and creator notifications next.
4. Finish with messaging, settlement, and expiry/audit polish.
