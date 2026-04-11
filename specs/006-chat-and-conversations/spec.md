# Feature Specification: Chat And Conversations

**Feature Branch**: `006-chat-and-conversations`  
**Created**: 2026-04-11  
**Status**: Draft  
**Input**: User direction plus audit of Tope-là chat surfaces in `symmetrical-broccoli/backoffice/src/components/chat/Conversation.tsx` and `Conversations.tsx`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Authenticated Account Browses A Unified Conversation List (Priority: P1)

As an authenticated account, I can browse all my conversations about both resources and needs in one chat workspace so I can quickly resume the most recent coordination thread.

**Why this priority**: The shared `Chat` page is still a placeholder, while messaging is already a core Tope-là interaction pattern and a natural bridge between the need and resource domains.

**Independent Test**: Sign in with an account that participates in both need-bound and resource-bound conversations, open `/chat`, and verify that the list mixes both kinds of conversations, orders them by latest activity, supports search, and opens the correct live messenger.

**Acceptance Scenarios**:

1. **Given** the signed-in account participates in conversations about both needs and resources, **When** the account opens the `Chat` page, **Then** the page shows a single mixed list ordered by most recent conversation activity first.
2. **Given** a need-bound conversation and a resource-bound conversation are shown together, **When** the list is rendered, **Then** each row shows a visual discriminator: a left-tailed conversation bubble containing `?` for needs and a right-tailed conversation bubble containing `!` for resources.
3. **Given** the signed-in account enters text into the chat search box, **When** that text matches the other participant’s name, the bound need/resource title, or any message body contained in the conversation, **Then** only matching conversations remain visible.
4. **Given** the account clears the search box, **When** the full list is shown again, **Then** the original latest-activity ordering is restored.
5. **Given** the account clicks a conversation row, **When** navigation occurs, **Then** the correct live messenger for that exact conversation opens.

---

### User Story 2 - Participant Uses The Live Messenger For A Need Or Resource (Priority: P1)

As a conversation participant, I can exchange detailed follow-up messages about a need or resource so we can coordinate logistics, clarify details, and reconnect later if needed.

**Why this priority**: The conversation itself is where the real exchange or support relationship is coordinated, and it must work for both resource and need contexts.

**Independent Test**: Open a live messenger for both a need-bound and a resource-bound conversation, verify the shared layout and context-specific header, send valid messages, and confirm that the related account and listing pages remain reachable from the header.

**Acceptance Scenarios**:

1. **Given** a resource-bound conversation and a need-bound conversation, **When** their live messenger pages are opened, **Then** both use the same overall messenger layout and differ only through the header data and the corresponding need/resource discriminator icon.
2. **Given** a need-bound conversation header, **When** it is shown, **Then** it mirrors the resource header as closely as the need data model allows, including title and the same kinds of navigable account/listing affordances where relevant.
3. **Given** the message composer is available, **When** the participant types a text and optionally selects up to 5 images, **Then** the message can be sent successfully.
4. **Given** the participant attempts to send a message with images but no text, **When** the send action is triggered, **Then** the UI rejects the action because message text is mandatory.
5. **Given** a participant uses emoji or emoticon characters in the message body, **When** the message is sent and displayed, **Then** those characters are preserved in the conversation.
6. **Given** the participant clicks the other account’s name or avatar in the header, **When** navigation occurs, **Then** the UI opens that account’s public details page.
7. **Given** the participant clicks the bound need or resource title/image in the header, **When** navigation occurs, **Then** the UI opens the corresponding need or resource details page.
8. **Given** a conversation already exists between the same two accounts for the same bound need or resource, **When** more messages are sent later, **Then** the system reuses that same conversation rather than creating duplicates.
9. **Given** a bid or claim has already been accepted, settled, declined, expired, or otherwise moved past its initial action point, **When** the two participants return later for follow-up or a future suggestion, **Then** the conversation remains available to those same participants.

---

### User Story 3 - Participant Receives Read, Typing, And Alert Feedback (Priority: P2)

As a conversation participant, I can tell when the other account has seen my latest message, when they are currently typing, and when a new message arrives elsewhere in the app so the conversation feels responsive.

**Why this priority**: Read state and live feedback are important parts of Tope-là’s messenger feel and help the chat workspace replace placeholder pages with a credible real interaction loop.

**Independent Test**: With two signed-in accounts in separate sessions, send messages back and forth, open the conversation on the recipient side, verify the seen mark, typing indicator, inbox notifications, and snackbar behavior.

**Acceptance Scenarios**:

1. **Given** the latest message in a conversation was sent by account A, **When** account B opens that conversation and the messenger reaches the bottom of the thread, **Then** the system marks that message as viewed by its recipient and account A sees a visual seen marker on that last outbound message.
2. **Given** the other participant is actively typing in the open conversation, **When** typing activity is detected within the last 3 to 5 seconds, **Then** a typing indicator icon appears at the bottom of the message list and disappears automatically when typing activity stops or becomes stale.
3. **Given** a new incoming chat message arrives while the signed-in account is not already viewing that exact conversation, **When** the message is received, **Then** the system both creates a persistent notifications-inbox item and shows a bottom-left snackbar-style alert.
4. **Given** the snackbar-style alert is shown, **When** it renders, **Then** it includes the sender account name and the first 100 characters of the message text, with an ellipsis when the message is longer.
5. **Given** the snackbar-style alert is visible, **When** 5 seconds pass without interaction, **Then** the alert dismisses automatically.
6. **Given** the account clicks the snackbar-style alert, **When** the click is handled, **Then** the UI opens the corresponding conversation directly.
7. **Given** the account is already viewing the exact conversation that just received a message, **When** that incoming message arrives, **Then** the app does not show the global snackbar for that message.

## Edge Cases

- The chat domain is strictly **two-party**; group conversations are out of scope for this slice.
- A conversation is scoped to one pair of accounts and one bound context (`need` or `resource`) and must not duplicate that same pairing/context combination.
- The conversation list must still behave predictably when the last activity is very old and a dormant conversation suddenly receives a new message.
- Search with no matches must return a clear empty state rather than a blank or broken workspace.
- A message body is mandatory even if images are attached.
- A single message may contain zero images, or between 1 and 5 images; any attempt to exceed the limit must be rejected with clear validation feedback.
- New message alerts should not interrupt the user with duplicate snackbar notices when the user already has the relevant live messenger open.
- When the linked need/resource has reached a later lifecycle state, the conversation remains readable and usable by its two participants for follow-up.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The authenticated `Chat` workspace MUST list the signed-in account’s conversations in a single mixed list across both need-bound and resource-bound contexts.
- **FR-002**: The mixed conversation list MUST order rows by latest activity descending, using the most recent message timestamp when one exists and falling back to the conversation’s creation timestamp otherwise.
- **FR-003**: Each conversation row MUST clearly indicate whether it is bound to a `need` or a `resource`.
- **FR-004**: Need-bound conversations MUST use a left-tailed bubble containing `?`, and resource-bound conversations MUST use a right-tailed bubble containing `!`, or an equivalent clearly differentiating visual treatment.
- **FR-005**: The conversation list MUST include a search box.
- **FR-006**: The chat search behavior MUST match text found in the other participant’s display name, the bound need/resource title, or any message body contained in the conversation.
- **FR-007**: Clicking a conversation in the list MUST open its live messenger.
- **FR-008**: A conversation MUST involve exactly two accounts.
- **FR-009**: The system MUST keep at most one conversation for the same pair of accounts and the same bound need/resource context.
- **FR-010**: The live messenger UI for a resource-bound conversation and a need-bound conversation MUST share the same layout and differ only through their context header data and discriminator icon.
- **FR-011**: The need-bound conversation header MUST mirror the resource header as closely as the need model allows.
- **FR-012**: The live messenger header MUST allow navigation to the other participant’s account details page.
- **FR-013**: The live messenger header MUST allow navigation to the bound need or resource details page.
- **FR-014**: The message composer MUST require a non-empty text body for each sent message.
- **FR-015**: Each message MAY include zero or more attached images, up to a maximum of 5 images per message.
- **FR-016**: Emoji and emoticon characters typed in the message body MUST be preserved and displayed correctly.
- **FR-017**: Conversation and message visibility MUST be restricted to the two participating accounts and enforced in PostgreSQL rather than trusted to the client.
- **FR-018**: When the message thread is displayed to the destination account and the messenger reaches the bottom of the thread, the system MUST mark the newly viewed inbound messages as read.
- **FR-019**: The sender-facing UI MUST display a visual seen/read marker on the most recent outbound message once the recipient has viewed it.
- **FR-020**: The live messenger MUST show a typing indicator at the bottom of the message list while recent typing activity from the other participant has been detected within the last 3 to 5 seconds.
- **FR-021**: New incoming chat messages MUST create a persistent inbox notification entry.
- **FR-022**: New incoming chat messages MUST also trigger an app-wide bottom-left snackbar alert when the recipient is not already viewing that exact conversation.
- **FR-023**: The snackbar alert MUST show the sender account name and the first 100 characters of the message text, appending an ellipsis when the text is longer.
- **FR-024**: The snackbar alert MUST be clickable and open the relevant conversation directly.
- **FR-025**: The snackbar alert MUST auto-dismiss after 5 seconds.
- **FR-026**: Existing conversations MUST remain available to their participants for later follow-up even when the related bid or claim has already moved to a later lifecycle state.
- **FR-027**: The `Chat` page and all message-related user-facing strings MUST participate in the project’s i18n approach.

### Key Entities *(include if feature involves data)*

- **ConversationSummary**: A unified read model for the chat list containing the conversation id, context type (`need` or `resource`), context title, other participant details, unread count, last message snippet, and last-activity timestamp.
- **NeedConversation**: A private two-account conversation channel bound to a specific need-side workflow.
- **ResourceConversation**: A private two-account conversation channel bound to a specific resource-side workflow.
- **ChatMessage**: A persisted message containing mandatory text, sender account id, conversation id, creation timestamp, and recipient read/view state.
- **ChatMessageImage**: An attached message image, ordered within a message and limited to 5 per message.
- **TypingPresenceSignal**: A short-lived marker that indicates recent typing activity for a participant inside one specific conversation.
- **ChatAlertNotification**: A persistent inbox item and transient snackbar payload emitted for a newly received chat message.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100 percent of authenticated accounts with existing need/resource conversations can open `/chat` and see a mixed latest-activity-ordered list.
- **SC-002**: 100 percent of search queries that match a participant name, bound listing title, or contained message text correctly filter the visible conversation list.
- **SC-003**: 100 percent of valid sent messages with mandatory text and up to 5 images persist and appear in the corresponding live messenger.
- **SC-004**: 100 percent of newly viewed inbound messages are marked read once the recipient loads the thread and reaches the bottom of the message list.
- **SC-005**: 100 percent of new incoming messages generate both a persistent notification and, when appropriate, a 5-second clickable snackbar alert.
