# Feature Specification: Needs Querying And Claiming

**Feature Branch**: `002-needs-query-claiming`  
**Created**: 2026-03-25  
**Status**: Draft  
**Input**: User description: "Visitor needs discovery, weighted ranking, filtering, claims, messaging, and settlement"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visitor Queries Active Needs (Priority: P1)

As a visitor, I can query active, non-expired needs near a location so I can discover relevant opportunities to help.

**Why this priority**: Need discovery is the entry point to all downstream claiming and collaboration.

**Independent Test**: Run a default query from a known location and verify only active non-expired needs are returned, capped to 50 results and sorted by weighted score.

**Acceptance Scenarios**:

1. **Given** active and expired needs in the system, **When** a visitor runs a default query, **Then** only active non-expired needs are returned.
2. **Given** more than 50 matching needs, **When** a visitor runs a default query, **Then** only the first 50 ranked needs are returned.
3. **Given** a default query, **When** needs are ranked, **Then** ranking uses closeness (50%), ease of setup (30%), and ascending delay of expiration (20%).

---

### User Story 2 - User Applies Query Filters (Priority: P1)

As a visitor or authenticated user, I can search with text and tri-state flags so results match specific constraints.

**Why this priority**: Filtering is required for practical use once discovery exists.

**Independent Test**: Apply text and tri-state filters and verify result set changes according to field matching and flag state behavior.

**Acceptance Scenarios**:

1. **Given** a search text, **When** query is executed, **Then** results include only needs where text matches creator name, title, description, tooling required field, or required competence field.
2. **Given** tri-state flags in neutral state, **When** query is executed, **Then** no include or exclude filtering is applied for those flags.
3. **Given** a tri-state flag toggled to set, **When** query is executed, **Then** only needs with that flag set are returned.
4. **Given** a tri-state flag toggled to unset, **When** query is executed, **Then** only needs with that flag not set are returned.
5. **Given** repeated clicks on a filter flag, **When** toggling progresses, **Then** state cycles neutral -> set -> unset -> neutral.

---

### User Story 3 - Authenticated User Claims Need (Priority: P1)

As an authenticated user, I can claim a need with an optional message so the need creator knows I want to help.

**Why this priority**: Claiming transforms discovery into action and collaboration.

**Independent Test**: User submits a claim, claim is persisted, and need creator receives realtime notification.

**Acceptance Scenarios**:

1. **Given** an authenticated user and an active need, **When** the user submits a claim, **Then** claim is stored in the system.
2. **Given** an authenticated user, **When** the user provides an optional message while claiming, **Then** message is stored with the claim.
3. **Given** a newly created claim, **When** claim is registered, **Then** creator of the need receives a realtime notification.
4. **Given** a visitor who is not authenticated, **When** they attempt to claim, **Then** system denies the action and requests authentication.

---

### User Story 4 - Creator And Claimer Exchange Instant Messages (Priority: P2)

As a need creator or claimer, I can exchange instant messages in a claim conversation to coordinate fulfillment.

**Why this priority**: Messaging supports resolution after a claim is made.

**Independent Test**: Need creator sends first message after claim and conversation is created with initial claimer message inserted; both participants can exchange and read messages.

**Acceptance Scenarios**:

1. **Given** a claim with optional claimer message, **When** need creator sends the first conversation message, **Then** conversation is created and claimer claim message is inserted as first message.
2. **Given** an existing conversation, **When** either participant sends a message, **Then** message is persisted with creation datetime.
3. **Given** unread messages, **When** other participant reads them, **Then** read datetime is persisted for each read message.
4. **Given** a message with one or more images, **When** message is sent, **Then** images are attached and retrievable from the message.
5. **Given** a user outside the two participants, **When** they attempt to access conversation messages, **Then** system denies access.

---

### User Story 5 - Need Creator Settles Claim (Priority: P2)

As the need creator, I can settle a claim so the claimer receives token transfer for completed contribution.

**Why this priority**: Settlement closes the loop and enforces incentive mechanics.

**Independent Test**: Creator settles a valid claim and token transfer event is recorded for claimer.

**Acceptance Scenarios**:

1. **Given** a valid claim on a need, **When** need creator settles the claim, **Then** system records settlement and triggers token transfer to claimer.
2. **Given** a user who is not the need creator, **When** they attempt to settle a claim, **Then** system denies the action.
3. **Given** a settled claim, **When** settlement status is queried, **Then** claim is shown as settled and cannot be settled twice.

### Edge Cases

- Query location unavailable from both account and browser; fallback must use Tournai city center coordinates.
- Needs with identical weighted score; tie-breaking must be deterministic.
- Expiration datetime reached exactly at query time.
- Text filter includes accents, case differences, or partial words.
- Tri-state filters in conflicting combinations produce zero results.
- Claimer submits empty optional message.
- Multiple claims for the same need created close in time.
- Need creator sends first message when claim has no optional message.
- Message with large image count or unsupported image formats.
- Settlement attempted after need expiration or claim withdrawal.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow any visitor to query needs that are active and not expired.
- **FR-002**: Default query MUST return at most 50 needs.
- **FR-003**: Default ranking MUST be based on weighted score composed of closeness (50%), ease of setup (30%), and ascending delay of expiration (20%).
- **FR-004**: System MUST compute ease of setup as 100% baseline and reduce by 25% for each set flag among tooling required, competence required, and multiple people required.
- **FR-005**: Query MUST require a location parameter for scoring closeness.
- **FR-006**: If authenticated account runs query without explicit location, system MUST default location to account location.
- **FR-007**: If account location is unavailable, system MUST default to browser-collected location when available.
- **FR-008**: If neither account nor browser location is available, system MUST default to Tournai city center in Belgium.
- **FR-009**: Query MUST support optional text filter.
- **FR-010**: Text filter MUST match against creator name, need title, need description, tooling required field, and required competence field.
- **FR-011**: Query MUST support tri-state flags for multiple people required, tooling required, competence required, and object required.
- **FR-012**: Tri-state flags MUST support states neutral, set, and unset.
- **FR-013**: Tri-state flags MUST toggle in order neutral -> set -> unset -> neutral on each click.
- **FR-014**: In neutral state, flag MUST not constrain result set.
- **FR-015**: In set state, flag MUST include only needs where flag is true.
- **FR-016**: In unset state, flag MUST include only needs where flag is false.
- **FR-017**: Only authenticated users MUST be allowed to claim a need.
- **FR-018**: Claiming a need MUST allow an optional message.
- **FR-019**: Claim registration MUST be persisted with claimer id, need id, optional message, and created datetime.
- **FR-020**: Creating a claim MUST trigger a realtime notification to the need creator.
- **FR-021**: Need creator and claimer MUST be able to exchange instant messages for a claim.
- **FR-022**: Conversation MUST be created when need creator sends the first message for a claim.
- **FR-023**: If a claim message exists, it MUST be inserted as the first message when conversation is created.
- **FR-024**: Each instant message MUST include created datetime, optional read datetime, and zero or more images.
- **FR-025**: Only conversation participants MUST have access to conversation messages.
- **FR-026**: Need creator MUST be able to settle a claim.
- **FR-027**: Settling a claim MUST trigger token transfer to the claimer and persist settlement status.
- **FR-028**: A settled claim MUST not be settled more than once.
- **FR-029**: System MUST maintain an audit trail for claims, notifications, conversation creation, messages, read events, and settlements.

### Key Entities *(include if feature involves data)*

- **NeedQueryRequest**: Query input with location, optional text filter, and tri-state flag filters.
- **NeedRankingScore**: Computed score components per need including closeness, ease of setup, and expiration delay contribution.
- **NeedClaim**: Claim record linking claimer and need with optional initial message, created datetime, and settlement status.
- **NeedClaimNotification**: Realtime event payload emitted to need creator when claim is created.
- **ClaimConversation**: Conversation channel associated with one need claim and its two participants.
- **ClaimMessage**: Instant message with sender id, created datetime, optional read datetime, optional images, and content.
- **ClaimSettlement**: Settlement event that records claim completion and token transfer execution.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of default queries return only active non-expired needs during acceptance tests.
- **SC-002**: 100% of default queries return at most 50 results ranked by specified weighted model.
- **SC-003**: 100% of missing-location queries resolve location fallback in this order: account, browser, Tournai center.
- **SC-004**: 100% of tri-state filter transitions follow neutral -> set -> unset -> neutral.
- **SC-005**: 100% of unauthenticated claim attempts are denied.
- **SC-006**: 100% of successful claims generate a persisted claim record and realtime notification to need creator.
- **SC-007**: 100% of first creator messages create conversation and include claim optional message as first message when present.
- **SC-008**: 100% of settled claims trigger exactly one token transfer record.
