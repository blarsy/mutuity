# Tasks: Bids Workspace And Settlement

**Input**: Design documents from `/specs/007-bids-workspace-and-settlement/`  
**Prerequisites**: `spec.md`, `plan.md`

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependency)
- **[Story]**: User story scope (`US1`, `US2`, `US3`)
- All task descriptions include concrete file paths

## Phase 1: Spec Foundation

- [x] T001 Confirm the bids-workspace feature scope in `specs/007-bids-workspace-and-settlement/spec.md`
- [x] T002 Draft the implementation plan in `specs/007-bids-workspace-and-settlement/plan.md`
- [x] T003 Audit the relevant Tope-là bids surfaces plus the current rebuilt `/bids` page before coding begins

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T004 Review the current `resource_bid` lifecycle model and add any missing status timestamp, validity, or settlement helpers in `database/migrations/084_bid_validity_settlement_and_workspace_helpers.sql`, including enforcement of the 12–48 hour bid-validity window
- [x] T005 [P] Add SQL helpers or views for sent/received bid ordering by latest status-change time and active-only filtering based on `validUntil`, status, and resource state in `database/migrations/084_bid_validity_settlement_and_workspace_helpers.sql`
- [x] T006 [P] Add or expose SQL-owned cancel-bid behavior for bidder-side cancellation from the workspace plus automatic cancellation when a resource expires or is deactivated in `database/migrations/084_bid_validity_settlement_and_workspace_helpers.sql`
- [x] T007 Verify or complete the accepted-bid settlement transfer path in `database/migrations/084_bid_validity_settlement_and_workspace_helpers.sql`, while preserving the rule that accepting one bid does not auto-close the others and that reserved Topes move directly to the receiver on acceptance
	- [x] T008 Add shared frontend bid-workspace types and query documents in `frontend/src/features/resources/` and/or `frontend/src/features/bids/`, including the page-size-5 pagination contract
	- [x] T009 Create the background worker task `process_resource_bid_expirations` in `backend/src/worker/tasks/process-resource-bid-expirations.ts` and the corresponding SQL function in `database/functions/resource/process_resource_bid_expirations.sql` that automatically expires open bids after their `validUntil` timestamp, refunds reserved Topes, and issues notifications

## Phase 3: User Story 1 - Browse Sent And Received Bids (Priority: P1)

**Goal**: Accounts can see sent and received bids in a practical workspace ordered by latest status-switch time.

**Independent Test**: Seed mixed bid histories, open `/bids`, and verify the two sections, ordering, filters, and pagination behavior.

### Tests (US1)

- [x] T009 [P] [US1] Add backend integration tests for sent/received bid ordering and active-only filtering in `backend/tests/integration/bids-workspace.spec.ts`
- [x] T010 [P] [US1] Add frontend tests for `BidsPage` rendering, filters, and status ordering in `frontend/tests/bids/bids-page.spec.tsx`

### Implementation (US1)

	- [x] T011 [US1] Extend `frontend/src/pages/bids.tsx` to order by latest status-change time rather than creation time alone
	- [x] T012 [US1] Add separate `only active bids` filters for sent and received sections in `frontend/src/pages/bids.tsx`
	- [x] T013 [US1] Add load-more pagination behavior with a page size of 5 to large bid histories in `frontend/src/pages/bids.tsx` and the supporting queries

## Phase 4: User Story 2 - Manage Bid Status From The Workspace (Priority: P1)

**Goal**: Bidders and resource owners can cancel, accept, and reject bids directly from the bids workspace.

**Independent Test**: Cancel a sent bid, then accept or reject a received bid, and verify the status, visibility, ledger, and notification side effects.

### Tests (US2)

- [x] T014 [P] [US2] Add backend integration tests for token reservation on bid creation, bidder-side cancellation refunds, expiry/rejection refunds, and accepted-bid settlement effects in `backend/tests/integration/bids-settlement.spec.ts`
- [x] T015 [P] [US2] Add frontend tests for cancel/accept/reject controls, final-acceptance confirmation messaging, and inactive-state messaging in `frontend/tests/bids/bid-actions.spec.tsx`

### Implementation (US2)

	- [x] T016 [US2] Add cancel actions to sent bids in `frontend/src/pages/bids.tsx` and the relevant bid card component
	- [x] T017 [US2] Add accept/reject actions to received bids in `frontend/src/pages/bids.tsx` and the relevant bid card component
	- [x] T018 [US2] Surface inactive explanations for accepted, rejected, cancelled, and expired bids in the workspace UI
- [ ] T019 [US2] Ensure the workspace reflects settlement/refund outcomes clearly on the `Contribution` page and through notifications, including auto-cancellation caused by resource expiry or confirmed deactivation

## Phase 5: User Story 3 - Navigate To Resource, Counterparty, Or Conversation (Priority: P2)

**Goal**: Users can move directly from any bid row to the corresponding resource, account, or chat thread.

**Independent Test**: Use the account/resource/chat controls from both sent and received bid rows and verify each destination opens correctly.

### Tests (US3)

- [ ] T020 [P] [US3] Add frontend tests for account/resource/chat deep links from bid cards in `frontend/tests/bids/bid-navigation.spec.tsx`
- [ ] T021 [P] [US3] Add backend/integration coverage for the focused conversation lookup path if additional APIs are needed in `backend/tests/integration/bid-conversation-link.spec.ts`

### Implementation (US3)

- [ ] T022 [US3] Add creator/bidder account navigation affordances to the sent and received bid rows in `frontend/src/pages/bids.tsx`
- [ ] T023 [US3] Add target resource navigation affordances to both bid sections in `frontend/src/pages/bids.tsx`
- [ ] T024 [US3] Integrate the direct chat shortcut with the resource-bound conversation model from `specs/006-chat-and-conversations/` in `frontend/src/pages/bids.tsx` and the shared chat utilities

## Phase 6: Polish & Validation

- [ ] T025 [P] Ensure bid-related copy remains i18n-backed and uses negotiation-friendly Topes wording in `frontend/src/i18n/messages/`
- [ ] T026 [P] Add responsive layout polish for the side-by-side sent/received workspace on small screens in `frontend/src/pages/bids.tsx`
- [ ] T027 Add the resource-deactivation confirmation flow when open bids exist in the relevant resource management UI and mutation path
- [ ] T028 Run end-to-end verification for bid browsing, actions, settlement effects, resource-expiry/deactivation auto-cancellation, and chat deep links
- [ ] T029 Capture any differences between legacy Tope-là bid behavior and the rebuilt MVP back into `specs/007-bids-workspace-and-settlement/spec.md`

## Dependencies & Execution Order

- Phase 1 is complete and establishes the scope.
- Phase 2 must land before the main workspace parity work.
- US1 should land first because the page structure, sorting, and filters are the base for all other actions.
- US2 depends on the list workspace and the SQL lifecycle helpers.
- US3 depends on both the bid workspace and the shared chat direction from Feature 006.

## Parallel Execution Examples

- T005 and T006 can run in parallel.
- T009 and T010 can run in parallel.
- T014 and T015 can run in parallel.
- T020 and T021 can run in parallel.
- T025 and T026 can run in parallel.

## Implementation Strategy

1. Close any remaining lifecycle/settlement gaps in SQL first.
2. Bring the `/bids` page up to Tope-là parity for ordering, filters, and direct actions.
3. Wire the navigation shortcuts to the related resource, account, and focused conversation.
4. Finish with responsive polish, i18n cleanup, and end-to-end verification.
