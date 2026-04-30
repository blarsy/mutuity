# Tasks: Chat And Conversations

**Input**: Design documents from `/specs/006-chat-and-conversations/`  
**Prerequisites**: `spec.md`, `plan.md`

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependency)
- **[Story]**: User story scope (`US1`, `US2`, `US3`)
- All task descriptions include concrete file paths

## Phase 1: Spec Foundation

- [x] T001 Confirm the chat-and-conversations feature scope in `specs/006-chat-and-conversations/spec.md`
- [x] T002 Draft the implementation plan in `specs/006-chat-and-conversations/plan.md`
- [x] T003 Audit the relevant Tope-là chat surfaces plus the current unified app conversation baseline before coding begins

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T004 Create the database migration for unified chat listing, resource-side conversations, read-state helpers, and typing-signal support in `database/migrations/076_chat_and_conversations_foundation.sql`
- [x] T005 [P] Add SQL helpers for listing/searching mixed conversations in `database/functions/chat/`
- [x] T006 [P] Add SQL helpers for sending resource-side messages, marking messages read, and persisting typing activity in `database/functions/chat/` and/or `database/functions/resource/`
- [x] T007 Add GraphQL/backend wiring for the unified chat workspace queries and mutations in `backend/src/postgraphile/server.ts` and related SQL exposure files
- [x] T008 Add shared frontend chat types and query documents in `frontend/src/features/chat/`

## Phase 3: User Story 1 - Unified Conversation List (Priority: P1)

**Goal**: Authenticated accounts can browse a mixed latest-activity-ordered list of need and resource conversations.

**Independent Test**: Seed mixed conversations, open `/chat`, verify ordering, search, unread markers, and the need/resource discriminator visuals.

### Tests (US1)

- [ ] T009 [P] [US1] Add backend integration tests for mixed conversation listing and text search in `backend/tests/integration/chat-conversations.spec.ts`
- [ ] T010 [P] [US1] Add frontend tests for `/chat` list rendering, search filtering, and discriminator icons in `frontend/tests/chat/chat-page.spec.tsx`

### Implementation (US1)

- [ ] T011 [US1] Replace the placeholder page in `frontend/src/pages/chat.tsx` with the real authenticated chat workspace shell
- [ ] T012 [US1] Build the mixed `ConversationListPanel` with latest-activity ordering and unread indicators in `frontend/src/features/chat/`
- [ ] T013 [US1] Add the participant/title/message search box and empty-state handling in `frontend/src/features/chat/`

## Phase 4: User Story 2 - Shared Live Messenger For Needs And Resources (Priority: P1)

**Goal**: Participants can use a shared messenger UI for both need-bound and resource-bound conversations, with text-required messages and navigable headers.

**Independent Test**: Open both a need thread and a resource thread, verify the shared layout, send valid messages, reject image-only messages, and confirm navigation links.

### Tests (US2)

- [ ] T014 [P] [US2] Add backend integration tests for message validation, participant-only access, and one-conversation-per-pair/context behavior in `backend/tests/integration/chat-message-composer.spec.ts`
- [ ] T015 [P] [US2] Add frontend tests for the unified conversation header and mandatory-text composer behavior in `frontend/tests/chat/conversation-thread.spec.tsx`

### Implementation (US2)

- [ ] T016 [US2] Build the shared `ConversationHeader` for both need and resource contexts in `frontend/src/features/chat/`
- [ ] T017 [US2] Build the normalized `ConversationThread` and `MessageComposer` with support for up to 5 images per message in `frontend/src/features/chat/`
- [ ] T018 [US2] Reuse or refactor the existing need conversation UI in `frontend/src/features/needs/ClaimConversationPanel.tsx` so the top-level chat workspace and inline claim messaging stay aligned
- [ ] T019 [US2] Wire header navigation to `frontend/src/pages/accounts/[accountId].tsx`, `frontend/src/pages/needs/[needId].tsx`, and `frontend/src/pages/resources/[resourceId].tsx`

## Phase 5: User Story 3 - Read Receipts, Typing Awareness, And Global Alerts (Priority: P2)

**Goal**: Participants can see when the other person viewed the latest message, detect active typing, and receive app-wide snackbar/inbox alerts for new chat messages.

**Independent Test**: Use two sessions to exchange messages, verify read markers, typing indicator timeouts, notification creation, snackbar display/suppression, and click-through navigation.

### Tests (US3)

- [ ] T020 [P] [US3] Add backend integration tests for read-state transitions, typing-signal timeout behavior, and new-message notification payloads in `backend/tests/integration/chat-realtime-feedback.spec.ts`
- [ ] T021 [P] [US3] Add frontend tests for seen markers, typing indicator rendering, and snackbar behavior in `frontend/tests/chat/chat-alerts.spec.tsx`

### Implementation (US3)

- [ ] T022 [US3] Implement mark-as-viewed behavior when the destination thread reaches the bottom in `database/functions/chat/` and `frontend/src/features/chat/`
- [ ] T023 [US3] Add the sender-facing seen marker on the latest outbound message in `frontend/src/features/chat/ConversationThread.tsx`
- [ ] T024 [US3] Implement typing activity capture and the 3–5 second indicator timeout in `frontend/src/features/chat/` plus the chosen backend delivery mechanism
- [ ] T025 [US3] Emit persistent inbox notifications for new chat messages in `database/functions/notification/` and/or `database/functions/chat/`
- [ ] T026 [US3] Add the app-wide clickable bottom-left snackbar bridge in `frontend/src/features/layout/` or `frontend/src/features/chat/`

## Phase 6: Polish & Validation

- [ ] T027 [P] Ensure all chat-related copy and labels are translated and user-friendly in `frontend/src/i18n/messages/`
- [ ] T028 [P] Add responsive/mobile layout polish for the conversation list and live messenger in `frontend/src/features/chat/`
- [ ] T029 Run end-to-end verification for mixed chat listing, messaging, seen state, typing indicators, and global alerts
- [ ] T030 Capture any differences between legacy Tope-là chat behavior and the rebuilt MVP back into `specs/006-chat-and-conversations/spec.md`

## Dependencies & Execution Order

- Phase 1 tasks are already complete and establish the feature scope.
- Phase 2 foundational work blocks the rest of the implementation.
- US1 should land before the full messenger because `/chat` needs a real list and selection model.
- US2 depends on the foundational conversation/message model and should align the existing need thread UI with the new shared chat workspace.
- US3 depends on both the persisted message flow and the active conversation UI from US1/US2.

## Parallel Execution Examples

- T005 and T006 can run in parallel.
- T009 and T010 can run in parallel.
- T014 and T015 can run in parallel.
- T020 and T021 can run in parallel.
- T027 and T028 can run in parallel.

## Implementation Strategy

1. Establish the unified chat data model and SQL permissions first.
2. Replace the `/chat` placeholder with a mixed list and search experience.
3. Normalize the live messenger so need and resource conversations share the same UI shell.
4. Add read receipts, typing feedback, and alerting once the base message flow is stable.
5. Finish with i18n, responsive polish, and end-to-end verification.
