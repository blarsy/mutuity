# Feature Specification: Claims Workspace And Settlement

**Feature Branch**: `008-claims-workspace-and-settlement`  
**Created**: 2026-04-12  
**Status**: Draft  
**Input**: User direction plus audit of the existing claims workspace and the already implemented need-claim lifecycle.

## Notification Semantics

In this specification, the term `notification` means an in-app notification persisted in the app-wide notification system and visible from the notifications page (notification center). It does not mean email-only or push-only delivery.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Account Browses Sent And Received Claims (Priority: P1)

As an authenticated account, I can browse the claims I sent and the claims I received on my own needs so I can track who is helping, who still needs an answer, and what changed last.

**Why this priority**: The claims lifecycle already exists, but the current `/claims` page still lacks the practical, Tope-là-style operational workspace needed for daily use.

**Independent Test**: Sign in with an account that has both sent and received claims, open `/claims`, and verify that both sections render separately, default to showing active claims only, support active/inactive/all filtering, use page size 5, and order rows by latest status-switch time descending.

**Acceptance Scenarios**:

1. **Given** the signed-in account has sent claims on other accounts' needs, **When** the account opens the claims page, **Then** the `sent claims` section lists those claims together with the target need, counterparty, current status, and relevant timestamps.
2. **Given** the signed-in account has received claims on needs it owns, **When** the claims page loads, **Then** the `received claims` section lists those claims together with the claimer, target need, current status, and relevant timestamps.
3. **Given** either section is first shown, **When** the claims page renders, **Then** its filter defaults to `active`.
4. **Given** the user changes a section filter to `inactive` or `all`, **When** the list refreshes, **Then** the visible rows match that filter only for that section.
5. **Given** claims in mixed lifecycle states, **When** each list is rendered, **Then** rows are ordered descending by latest status-switch time, falling back to creation time when no later status transition exists.
6. **Given** there are more than 5 claims in a section, **When** the user requests more rows, **Then** the workspace loads the next page without losing the current filter or ordering.

---

### User Story 2 - Claimer Or Need Creator Manages Claim Status (Priority: P1)

As a claimer or need creator, I can cancel, decline, or settle claims directly from the claims workspace so the resolution of a need remains explicit and auditable.

**Why this priority**: Claims are the main operational workflow for needs, and they differ materially from bids because settlement closes the need's competing claims and only transfers Topes at settlement time.

**Independent Test**: Create several open claims on the same need, cancel one as the claimer, decline one as the need creator, and settle another as the need creator, verifying statuses, notifications, auto-decline side effects on competing claims, and token transfer behavior.

**Acceptance Scenarios**:

1. **Given** a sent claim is still open, **When** the claimer cancels it from the claims page, **Then** the claim moves to the withdrawn state and no longer appears in the `active` filter.
2. **Given** a sent claim is still open and already has a conversation, **When** the claimer cancels it, **Then** the cancellation is still allowed because claim cancellation is not blocked by existing messages.
3. **Given** a received claim is still open, **When** the need creator declines it from the claims page, **Then** the claim moves to the declined state and the claimer receives the predefined `Claim declined by the need creator` notification.
4. **Given** a received claim is still open and the need creator has enough Topes for the need's configured amount, **When** the need creator chooses to settle it, **Then** the UI warns that logistics should be handled first because settlement is final, requires explicit confirmation, and then allows settlement.
5. **Given** a received claim is still open but the need creator has fewer Topes than the need's configured amount, **When** the claims page renders, **Then** the settle action is disabled preemptively and shows a validation message explaining why.
6. **Given** a received claim is settled, **When** settlement completes, **Then** that claim moves to `settled`, Topes transfer from the need creator to the claimer exactly once, and every other open claim on the same need is automatically declined atomically.
7. **Given** competing open claims are automatically declined because another claim on the same need was settled, **When** that happens, **Then** each affected claimer receives the same `claim declined` notification as in an explicit decline, without identifying which other claim was settled.

---

### User Story 3 - Account Navigates From A Claim To The Related Need, Counterparty, Or Conversation (Priority: P2)

As a claimer or need creator, I can jump directly from any claim to the related need, counterparty account, or focused conversation so I can continue coordination without searching for context.

**Why this priority**: The claims page should be an operational inbox, not just a historical record.

**Independent Test**: Open sent and received claims, use the need/account/chat affordances, and verify that each opens the correct destination.

**Acceptance Scenarios**:

1. **Given** a sent claim, **When** the claimer clicks the need title or image, **Then** the corresponding need details page opens.
2. **Given** a sent claim, **When** the claimer clicks the need creator name or avatar, **Then** the need creator's account details page opens.
3. **Given** a received claim, **When** the need creator clicks the need title or image, **Then** the owned need details page opens.
4. **Given** a received claim, **When** the need creator clicks the claimer name or avatar, **Then** the claimer's account details page opens.
5. **Given** any claim row, active or inactive, **When** the user clicks the `chat` action, **Then** the app opens the conversation for that claim/need context.

---

### User Story 4 - System Closes Claims When Needs Become Unavailable (Priority: P2)

As a claimer or need creator, I want open claims to be closed consistently when the underlying need expires or is deactivated so the claims workspace never shows stale actionable claims.

**Why this priority**: Claims do not reserve Topes and do not need their own validity timer, so their inactivity depends on explicit actions or the need lifecycle.

**Independent Test**: Let a need expire and separately deactivate another need with open claims, then verify that open claims are declined automatically and notifications are emitted according to the notification matrix.

**Acceptance Scenarios**:

1. **Given** a need reaches its expiration time while open claims still exist, **When** the polling worker processes expired needs, **Then** all open claims on that need are automatically declined.
2. **Given** claims are auto-declined because a need expired, **When** notifications are emitted, **Then** each claimer receives `Claim automatically declined because the need expired`, and the need creator receives one summary notification covering the affected claims.
3. **Given** a need creator deactivates a need that still has open claims, **When** the deactivation is confirmed, **Then** all open claims on that need are automatically declined.
4. **Given** claims are auto-declined because the need was deactivated, **When** notifications are emitted, **Then** each claimer receives `Claim automatically declined because the need was deactivated`, and the need creator does not receive a redundant notification for their own explicit action.

## Edge Cases

- Claims do not have their own independent expiry timer; they remain open until withdrawn, declined, settled, or indirectly closed by need expiry/deactivation.
- The `active` filter must return open claims only; settled, declined, withdrawn, and any legacy non-open states must be treated as inactive.
- If the domain still retains a legacy `expired` claim status, the claims workspace must either hide it behind the `inactive` filter or normalize it consistently during this slice.
- Claim cancellation remains allowed even if a claim conversation already exists.
- Settling one claim must automatically decline all competing open claims on the same need in the same transaction.
- A claimer whose claim was auto-declined because another claim settled must not be told which other claim was settled.
- Settlement must fail safely if the need creator does not have enough Topes, and this failure must not emit a settlement notification to the claimer.
- Need-expiry processing must be idempotent so repeated polling does not duplicate status changes or notifications.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The authenticated `Claims` page MUST show the current account's sent claims and received claims as two distinct sections in the same workspace.
- **FR-002**: Each claim row MUST always include a header mentioning the target need and the relevant counterparty account, plus the current claim status and relevant lifecycle timestamps.
- **FR-003**: Clicking the target need title or image from any sent or received claim MUST navigate to that need's details page.
- **FR-004**: Clicking the counterparty name or avatar from a sent claim MUST navigate to the need creator's account details page.
- **FR-005**: Clicking the counterparty name or avatar from a received claim MUST navigate to the claimer's account details page.
- **FR-006**: Sent claims MUST support a tri-state `active/inactive/all` filter with default value `active`.
- **FR-007**: Received claims MUST support a tri-state `active/inactive/all` filter with default value `active`.
- **FR-008**: The `active` filter MUST treat a claim as active only while its status is `open`.
- **FR-009**: Sent claims MUST be ordered by latest status-switch time descending.
- **FR-010**: Received claims MUST be ordered by latest status-switch time descending.
- **FR-011**: The claims workspace MUST use paged loading with a default page size of 5 rows per section, while preserving current filters and ordering when loading more.
- **FR-012**: The claimer MUST be able to cancel an open sent claim from the claims workspace, even if that claim already has a conversation.
- **FR-013**: The need creator MUST be able to decline an open received claim from the claims workspace.
- **FR-014**: The need creator MUST be able to settle an open received claim from the claims workspace.
- **FR-015**: Inactive claims MUST show a clear inactive reason or status summary and MUST not present invalid lifecycle actions.
- **FR-016**: Any claim row, whether active or inactive, MUST provide a direct way to open the focused conversation for that claim/need context.
- **FR-017**: Claims MUST NOT reserve Topes at creation time.
- **FR-018**: Claims MUST NOT have their own independent validity window; claim inactivity MUST result only from withdrawal, decline, settlement, need expiry, or need deactivation.
- **FR-019**: Settling a claim MUST transfer the need's configured Topes amount from the need creator to the claimer exactly once.
- **FR-020**: The settle action MUST be disabled preemptively when the need creator's current Topes balance is lower than the need's configured Topes amount, and the UI MUST display a validation message explaining why settlement is unavailable.
- **FR-021**: Before final settlement is submitted, the UI MUST warn the need creator to take care of the logistics first because settlement is final, and then require explicit confirmation.
- **FR-022**: Settling one open claim MUST automatically decline all other open claims on the same need atomically.
- **FR-023**: Claims that are automatically declined because another claim was settled MUST emit the same `claim declined` notification as an explicit creator-side decline, without revealing which other claim was settled.
- **FR-024**: A scheduled background worker MUST regularly poll for expired needs and automatically decline all still-open claims linked to those needs.
- **FR-025**: When need expiry triggers automatic claim declines, the system MUST notify each affected claimer with reason `Claim automatically declined because the need expired` and MUST notify the need creator once for the batch of declined claims.
- **FR-026**: When a need creator deactivates a need with open claims, the system MUST automatically decline those still-open claims.
- **FR-027**: When need deactivation triggers automatic claim declines, the system MUST notify each affected claimer with reason `Claim automatically declined because the need was deactivated` and MUST NOT notify the need creator for their own explicit action.
- **FR-028**: Claim-related notifications MUST only be sent to the party who did not explicitly trigger the status change. For system-automatic events, all directly affected parties MUST be notified according to the notification matrix.
- **FR-029**: Creating a claim MUST notify the need creator.
- **FR-030**: Cancelling a claim MUST notify the need creator.
- **FR-031**: Explicitly declining a claim MUST notify the claimer with reason `Claim declined by the need creator`.
- **FR-032**: Settling a claim MUST notify the settled claimer.
- **FR-033**: Claim status handling MUST remain auditable in PostgreSQL and not rely on client-only transitions.
- **FR-034**: The claims workspace MUST use the project's i18n approach for all labels, actions, validation messages, inactive-state explanations, notifications, and error messages.

### Key Entities *(include if feature involves data)*

- **NeedClaimWorkspaceSummary**: A read model representing one sent or received claim with latest status, latest status-change timestamp, need summary, counterparty summary, and conversation linkage.
- **NeedClaimStatusTransition**: An auditable lifecycle change such as open, settled, declined, or withdrawn.
- **NeedClaimWorkspaceFilter**: A section-scoped tri-state filter with values `active`, `inactive`, and `all`.
- **NeedClaimSettlementEffect**: The one-time token transfer that occurs only when a claim is settled.
- **NeedClaimNotificationRule**: A deterministic notification rule describing who gets notified for explicit and automatic claim lifecycle events.

## Notification Delivery Scope

- Unless explicitly stated otherwise, every claim-related notification in this feature MUST be created in the app-wide in-app notification center data model.
- Notifications created by this feature MUST be visible from the notifications page for the targeted recipient account.
- Additional channels (email/push) are optional complements and are out of scope for satisfying notification requirements in this spec.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100 percent of authenticated accounts with existing claims can open `/claims` and see distinct sent and received sections ordered by the latest status-switch timestamp.
- **SC-002**: 100 percent of claims-page filters correctly separate open claims from inactive claims, with `active` as the default in both sections.
- **SC-003**: 100 percent of valid cancel, decline, and settle actions update the target claim correctly and hide it from the `active` filter when appropriate.
- **SC-004**: 100 percent of successful settlements transfer exactly one auditable Topes amount from the need creator to the claimer, and automatically decline competing open claims on the same need.
- **SC-005**: 100 percent of insufficient-balance settlement attempts are blocked before submission with a visible validation message.
- **SC-006**: 100 percent of claim rows provide working navigation to the related account, need, and conversation destination.
- **SC-007**: 100 percent of need expiry and need deactivation events with open claims automatically decline those claims and emit notifications according to the notification matrix.
