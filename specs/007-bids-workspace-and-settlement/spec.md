# Feature Specification: Bids Workspace And Settlement

**Feature Branch**: `007-bids-workspace-and-settlement`  
**Created**: 2026-04-11  
**Status**: Draft  
**Input**: User direction plus audit of Tope-là bid surfaces in `symmetrical-broccoli/backoffice/src/components/bids/BidsList.tsx`, `BidSent.tsx`, and `BidReceived.tsx`.

## Differences from Legacy Tope-là Behavior

The following intentional changes and enhancements were made during the rebuild, diverging from the original Tope-là implementation:

1. **Single unified workspace**: Tope-là split sent and received bids across separate component files (`BidSent.tsx`, `BidReceived.tsx`). The rebuilt app consolidates both sections into a single `/bids` page with a responsive two-column layout on wider screens.

2. **Enforced bid validity window**: Tope-là did not constrain bid validity to a specific duration. The rebuilt system enforces a 12–48 hour validity window (default 24 h), expressed in `valid_until` and computed by a scheduled background worker that auto-expires and refunds when the window lapses.

3. **Immediate Topes reservation at creation**: Tope-là did not visibly surface that the proposed Topes were unavailable until resolution. The rebuilt system reserves the amount immediately on `submit_resource_bid`, shows a "Topes reserved" chip on active sent bids, and surfaces `resource_bid_reserved` / `resource_bid_refunded` ledger entries to the bidder via the Contribution page.

4. **Acceptance confirmation step**: Tope-là did not include a pre-acceptance warning. The rebuilt app inserts an explicit confirmation dialog reminding the receiver to handle logistics before confirming because the Topes transfer is immediate and irreversible.

5. **Auto-cancellation on resource deactivation with UI gate**: Tope-là's resource deactivation did not surface a warning when open bids existed. The rebuilt manage-resources page now queries the open bid count and shows a warning alert in the confirmation dialog before proceeding, with the confirm button disabled until the count check completes.

6. **Direct chat shortcut on bid cards**: Tope-là's bid workspace did not provide a direct link to the focused resource conversation. The rebuilt app adds a Chat action button on each bid card that deep-links to the resource-bound conversation thread when one exists.

7. **Notification routing rule for resource deactivation**: Tope-là sent notifications to all parties. The rebuilt notification logic (FR-021) explicitly skips notifying the resource owner who manually triggered a deactivation while sending the bid-cancelled notification only to the affected bidder(s).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Account Browses Sent And Received Bids (Priority: P1)

As an authenticated account, I can browse the bids I sent and the bids I received on my own resources so I can track negotiation status and decide what to do next.

**Why this priority**: The resource response flow already exists in the rebuilt product, but the dedicated Tope-là-style bids workspace is still incomplete and is important for daily practical use.

**Independent Test**: Sign in with an account that has both sent and received bids, open `/bids`, and verify that both lists render separately, show the latest status, and order rows by the most recent status-switch timestamp.

**Acceptance Scenarios**:

1. **Given** the signed-in account has sent bids on other accounts’ resources, **When** the account opens the bids page, **Then** the `sent bids` section lists those bids together with the target resource, counterparty, amount, and current status.
2. **Given** the signed-in account has received bids on resources it owns, **When** the bids page loads, **Then** the `received bids` section lists those bids together with the bidder, target resource, amount, and current status.
3. **Given** bids in any lifecycle state, **When** each list is rendered, **Then** rows are ordered descending by the latest status-switch time, falling back to creation time when no later status timestamp exists yet.
4. **Given** the user wants to focus only on active bids, **When** the `only active bids` filter is enabled for sent bids or received bids, **Then** accepted, rejected, cancelled, or expired bids are hidden from that visible list while the still-active bids remain visible.
5. **Given** there are more bids than fit in the initial page size, **When** the user requests more rows, **Then** the workspace loads the next page in increments of 5 without losing the current filters or ordering.

---

### User Story 2 - Bidder Or Resource Owner Manages Bid Status (Priority: P1)

As a bidder or resource owner, I can cancel, accept, or reject bids from the bids workspace so the negotiation remains clear and auditable.

**Why this priority**: Tope-là uses bid status handling to make exchanges practical and unambiguous, especially when Topes are involved.

**Independent Test**: Create a bid with a short validity period, verify that the proposed Topes are immediately reserved, then cancel it as the bidder and confirm the refund; create another bid and accept or reject it as the resource owner, verifying the status changes, timestamps, notifications, and token-side effects.

**Acceptance Scenarios**:

1. **Given** I create a bid with a validity window between 12 and 48 hours, **When** the bid is persisted, **Then** the proposed Topes amount is immediately reserved and removed from my currently available balance for the duration of the bid.
2. **Given** a bid I sent is still active, **When** I cancel it from the bids page, **Then** the bid status changes to the cancelled/withdrawn state, the reserved Topes return to my account, and the bid no longer appears in the active-only view.
3. **Given** a bid I received on one of my resources is still active, **When** I choose to accept it, **Then** the UI first advises me to take care of the logistics before accepting because the action is final, and then asks for explicit confirmation.
4. **Given** a bid I received on one of my resources is still active, **When** I confirm acceptance from the bids page, **Then** the bid moves to the accepted state and the result is persisted with an auditable timestamp.
5. **Given** a bid I received is still active, **When** I reject it from the bids page, **Then** the bid moves to the rejected/declined state, the reserved Topes return to the bidder, and the result is persisted with an auditable timestamp.
6. **Given** a bid is no longer active because it was already accepted, rejected, cancelled, or expired, **When** the workspace displays it, **Then** the action buttons are hidden or disabled and the inactive reason is shown clearly.
7. **Given** one bid on a resource is accepted, **When** the acceptance is confirmed, **Then** any other still-open bids on that same resource remain open until they are individually withdrawn, declined, expired, or cancelled by resource deactivation/expiry.
8. **Given** a bid is accepted, **When** the acceptance is confirmed, **Then** the Topes amount committed by the bidder is transferred/finalized for the resource owner exactly once and remains auditable in the contribution ledger.

---

### User Story 3 - Account Navigates From A Bid To The Related Resource, Counterparty, Or Conversation (Priority: P2)

As a bidder or resource owner, I can jump directly from a bid to the related account, resource, or focused conversation so the negotiation can continue smoothly.

**Why this priority**: The value of the bids page comes from being an operational workspace, not just a static list of old records.

**Independent Test**: Open sent and received bids, use the account/resource/chat links, and verify that each takes the user to the correct destination.

**Acceptance Scenarios**:

1. **Given** a sent bid, **When** the bidder clicks the resource creator, **Then** the corresponding account details page opens.
2. **Given** a sent bid, **When** the bidder clicks the target resource, **Then** the resource details page opens.
3. **Given** a received bid, **When** the resource owner clicks the bidder, **Then** the bidder’s account details page opens.
4. **Given** a received bid, **When** the resource owner clicks the target resource, **Then** the details page for that owned resource opens.
5. **Given** any bid row, **When** the user clicks the conversation shortcut, **Then** the app opens the focused live messenger conversation between the two accounts for that resource context.

## Edge Cases

- A bid becomes inactive when it has been accepted, declined, withdrawn/cancelled, expired by `validUntil`, or affected by the target resource becoming inactive or reaching its own expiry.
- The active-only filter must not hide genuinely open bids that still remain within their validity window.
- Bid validity must stay intentionally short: at least 12 hours and at most 48 hours.
- Ordering by status-switch time must remain deterministic for bids that were created at similar times or changed state at the same moment.
- Attempting to accept, reject, or cancel a bid after it is no longer active must fail safely and present a clear user message.
- Accepting one bid on a resource must not automatically close the other open bids on that resource, because some resources may be reusable, rentable, or service-based.
- When a bid is created, its proposed Topes amount must be reserved immediately so the receiver can trust that the amount is actually available.
- When a bid expires without answer, is declined, or is cancelled, the reserved Topes must return to the bidder exactly once.
- When a resource reaches the end of its validity, all open bids on that resource must be automatically cancelled with the expected refund and notification side effects.
- When a user turns a resource from active to inactive while open bids exist, the UI should require confirmation before those open bids are automatically cancelled.
- Accepting a bid is final from the token-settlement perspective, so the UI should warn the receiver to take care of logistics before confirming acceptance.
- Token settlement on accepted bids must be idempotent and must not credit the same exchange twice.
- Navigation to the focused chat conversation should reuse the resource-bound conversation if it already exists, and otherwise open the correct creation/start path.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The authenticated `Bids` page MUST show the current account’s sent bids and received bids as two distinct sections in the same workspace.
- **FR-002**: Each bid row MUST always include a header mentioning the target resource and the relevant counterparty account, plus the current bid status, Topes amount, and relevant lifecycle timestamps.
- **FR-003**: Clicking the target resource title or image from any sent or received bid MUST navigate to that resource’s details page.
- **FR-004**: Clicking the counterparty name or avatar from a sent bid MUST navigate to the target resource creator’s account details page.
- **FR-005**: Clicking the counterparty name or avatar from a received bid MUST navigate to the bidder’s account details page.
- **FR-006**: Sent bids MUST be ordered by latest status-switch time descending.
- **FR-007**: Received bids MUST be ordered by latest status-switch time descending.
- **FR-008**: The workspace MUST support an `only active bids` filter for sent bids and for received bids as separate controls.
- **FR-009**: The bids workspace MUST use paged loading with a default page size of 5 rows per section, while preserving current filters and ordering when loading more.
- **FR-010**: Creating a bid MUST immediately reserve the proposed Topes amount by removing it from the bidder’s currently available balance for the duration of the bid.
- **FR-011**: A bid MUST have a relatively short validity period, with a minimum of 12 hours and a maximum of 48 hours.
- **FR-012**: The bidder MUST be able to cancel an active sent bid from the bids workspace.
- **FR-013**: The resource owner MUST be able to accept an active received bid from the bids workspace.
- **FR-014**: The resource owner MUST be able to reject an active received bid from the bids workspace.
- **FR-015**: Inactive bids MUST show a clear inactive reason or status summary and MUST not present invalid actions.
- **FR-016**: Any bid row, whether active or inactive, MUST provide a direct way to open the focused live messenger conversation between the bidder and the resource owner for the bid’s target resource.
- **FR-017**: Bid status handling MUST remain auditable in PostgreSQL and not rely on client-only transitions.
- **FR-018**: If a bid expires without answer, is rejected, or is cancelled, the reserved Topes MUST return to the bidder exactly once.
- **FR-019**: When a bid is accepted, the reserved Topes MUST be transferred directly to the bid receiver exactly once through an unambiguous and auditable settlement path.
- **FR-020**: Before final acceptance is submitted, the UI MUST warn the receiver to take care of the logistics first because acceptance is final, and then require explicit confirmation.
- **FR-021**: Bid-related notifications MUST only be sent to the party who did **not** explicitly trigger the status change. The account that actively performed an action (e.g. cancelling their own bid or accepting a received bid) MUST NOT receive a redundant notification for their own action. For system-automatic events (bid expiry by background worker, resource-expiry-triggered auto-cancellation) all directly affected parties MUST be notified. For manually confirmed resource deactivation that auto-cancels bids, only the bidder MUST be notified since the resource owner explicitly triggered the deactivation.
- **FR-022**: User-facing copy on the bids workspace MUST continue to describe the Topes amount as a negotiated exchange value rather than a fixed fiat-style commercial price.
- **FR-023**: The bids workspace MUST use the project’s i18n approach for all labels, actions, inactive-state explanations, and error messages.
- **FR-024**: Bid activity MUST become inactive once the bid’s validity time has passed, with activity determined at query time by comparing the bid validity against the current time together with the persisted status.
- **FR-025**: Accepting one bid on a resource MUST NOT automatically close, reject, or cancel other still-open bids on that same resource.
- **FR-026**: When the target resource reaches the end of its validity, the system MUST automatically cancel all still-open bids on that resource and issue the corresponding refunds and notifications.
- **FR-027**: When a user attempts to toggle a resource from active to inactive while one or more open bids still exist, the UI MUST ask for confirmation before applying the change.
- **FR-028**: If the user confirms a resource deactivation that would affect open bids, the system MUST automatically cancel all still-open bids on that resource and issue the corresponding refunds and notifications.
- **FR-029**: The active-only filters MUST treat a bid as active only while it is open, its validity has not passed, and its target resource remains active and not expired.
- **FR-030**: A scheduled background worker MUST periodically check for bids that have reached their `validUntil` timestamp without a response from the receiver and automatically transition those bids to an expired state, refunding the reserved Topes to the bidder exactly once, and issuing the corresponding `resource_bid_expired` notifications.

### Key Entities *(include if feature involves data)*

- **ResourceBidSummary**: A workspace read model representing one bid with the latest status, latest status-change timestamp, amount in Topes, target resource summary, and counterparty summary.
- **ResourceBidStatusTransition**: An auditable lifecycle change such as sent/open, accepted, declined/rejected, cancelled/withdrawn, or expired.
- **BidSettlementEffect**: The ledger-visible token consequence that occurs when a bid amount is reserved at creation, refunded after expiry/rejection/cancellation, or finalized to the receiver after acceptance.
- **BidConversationLink**: A routing or lookup bridge that opens the two-account resource-bound conversation linked to the bid’s target resource.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100 percent of authenticated accounts with existing bids can open `/bids` and see distinct sent and received sections ordered by the latest status-switch timestamp.
- **SC-002**: 100 percent of valid cancel/accept/reject actions update the bid state correctly and remove the row from active-only views when appropriate.
- **SC-003**: 100 percent of accepted bids finalize exactly one auditable Topes settlement path for the accepted amount.
- **SC-004**: 100 percent of bid rows provide working navigation to the related account, resource, and focused conversation destination.
- **SC-005**: 100 percent of inactive bids display a clear status explanation instead of allowing invalid lifecycle actions.
- **SC-006**: 100 percent of resource expiry events and confirmed manual resource deactivations with open bids automatically cancel those bids and surface the expected refund and notification effects.
- **SC-007**: 100 percent of accepted bids leave unrelated still-open bids on the same resource untouched until those bids are separately acted upon or expire.
