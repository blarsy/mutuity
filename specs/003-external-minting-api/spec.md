# Feature Specification: External Topes Minting API Integration

**Feature Branch**: `003-external-minting-api`  
**Created**: 2026-03-27  
**Status**: Draft  
**Input**: User description: "External API for minting distribution, balances, and event signaling from Mutuity"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mutuity Sends Minting Signals To External System (Priority: P1)

As Mutuity, I can emit domain signals to the external rewards system so minting eligibility and campaign reward actions are processed externally.

**Why this priority**: Signal delivery is the core integration boundary and enables delayed and campaign-based rewards.

**Independent Test**: Trigger each domain event in Mutuity and verify the external system receives one corresponding minting-oriented API call with expected payload.

**Acceptance Scenarios**:

1. **Given** a newly created need, **When** 24 hours have elapsed since creation, **Then** Mutuity sends a minting signal for that need to the external API.
2. **Given** a need joined to a campaign, **When** the campaign creator approves the joined need, **Then** Mutuity sends a minting signal for that approval event to the external API.
3. **Given** a campaign reaching its airdrop datetime, **When** Mutuity computes eligible accounts, **Then** Mutuity sends a minting signal including the eligible account list to the external API.

---

### User Story 2 - External API Supports Balance, And Minting Actions (Priority: P1)

As Mutuity, I can query balances, and request minting actions through dedicated external API routes so token state remains in the external system.

**Why this priority**: Core runtime operations depend on deterministic external API contracts.

**Independent Test**: Execute balance query, and minting request against external API sandbox and verify status and payload contracts.

**Acceptance Scenarios**:

1. **Given** an account id, **When** Mutuity requests current balance, **Then** external API returns Topes balance with a successful status and correlation id.
2. **Given** a reward trigger event, **When** Mutuity requests reward creation, **Then** external API exposes this action via minting-named route semantics and returns a minting transaction id.

---

### User Story 3 - Settlement Triggers External Distribution (Priority: P1)

As Mutuity, I can call the external API when a claim is settled so the proposed Topes amount for the need is distributed to the claimer.

**Why this priority**: Settlement distribution is the end-user visible reward outcome.

**Independent Test**: Settle a claim in Mutuity and verify exactly one successful external distribution action is registered for that claim.

**Acceptance Scenarios**:

1. **Given** a claim tied to a need with proposed Topes amount, **When** the need creator settles the claim, **Then** Mutuity requests external token distribution for that exact amount to the claimer.
2. **Given** a settlement retry or duplicate command, **When** Mutuity sends integration request again with same idempotency context, **Then** external side resolves it as one effective distribution.
3. **Given** an external API error during settlement distribution, **When** Mutuity receives the failure, **Then** claim remains unsettled or marked pending-distribution according to policy and error is auditable.


### Edge Cases

- Duplicate signal delivery caused by retries or event replay => signal is immune to double execution by using idempotency keys, which are supported by the external API
- External API timeout after request dispatch but before response => all api operations accept an idempotency key, guaranteeing only-once execution of the operations. Such failed idempotent operations are retried using the retry policy mentioned in the functional requirements.
- Campaign airdrop signal payload too large for one request and requiring pagination or chunking => the API fails with a "Max size exceeded" error message, which is logged for urgent technical investigation and resolution, that may involve enlarging max payload size and/or rework to split the operation in chunks.
- Eligible account list contains duplicate or invalid account identifiers. => the client deduplicates the account list, the api returns a list of feedback lines: warnings for duplicate accounts, non-blocking errors for not found accounts, errors for malformed account ids. If this response contains at least one error, it is logged
- Need is deleted or deactivated during 24-hour anti-farming delay window. => the reward collection routine running every 10 minutes will simply not send a signal for the external api
- Settlement command issued while external system is unavailable. => a queue of DistributionAttempt objects are stored to be retried using the retry policy described in the functional requirements. The UI shows the settlement as 'Retrying on remote system', and refuses any other attempt to settle before all the scheduled retries have failed, or the settlement succeeded.
- Balance query stale relative to last transfer due to eventual consistency. => Mutuity app listens to the external system's balance modification channel, updating the balance in near-realtime. Asynchronous operations on the external system switch the visual state of the token balance as 'updating ...'
- Minting request accepted by external system but webhook confirmation delayed. => api routes that modify a single account all return the latest token balance in their response, so webhook delay is irrelevant.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Mutuity MUST treat the external rewards API as source of truth for token balances and minting transactions.
- **FR-002**: Mutuity MUST expose integration operations for balance query, and reward minting using external API contracts.
- **FR-003**: Routes and operation names for reward creation in the integration layer MUST use minting terminology.
- **FR-004**: Mutuity MUST emit a delayed minting signal 24 hours after need creation for anti-farming purposes.
- **FR-005**: Mutuity MUST emit a minting signal when a campaign creator approves a need joined to that campaign.
- **FR-006**: Mutuity MUST emit a minting signal at campaign airdrop datetime including list of eligible accounts.
- **FR-007**: Campaign airdrop minting payload MUST include campaign id, airdrop timestamp, and each eligible account identifier.
- **FR-008**: Settling a claim in Mutuity MUST trigger an external distribution request for the proposed Topes amount attached to the need.
- **FR-009**: Every external API request MUST include a correlation id for traceability.
- **FR-010**: Minting and settlement distribution requests MUST include idempotency semantics to prevent duplicate effective rewards.
- **FR-011**: Integration failures MUST be persisted in audit logs with request payload reference, response data if available, and retry state.
- **FR-012**: Mutuity MUST NOT present fiat equivalence wording in UI or API messages related to Topes value.
- **FR-013**: Balance data shown in Mutuity MUST come from external balance query response or explicitly labeled cached snapshot.
- **FR-014**: External API authentication and authorization credentials MUST be managed securely and never exposed to client applications.
- **FR-015**: When a state changing operation on the external API fails with a Timeout, it is queued along with its idempotency key, to be retried. The retry policy is: 6 times at 10 seconds interval, then 10 times at 1 minute interval, then 3 times at 30 minutes interval. If all retries fail, the queued operation is switched to "Failed" state, so that the UI may inform the user that a technical investigation is ongoing, and an error is logged

### Key Entities *(include if feature involves data)*

- **MintingSignalEvent**: Outbound event emitted by Mutuity to external API for reward minting triggers.
- **MintingRequest**: Request payload for external reward issuance actions using minting route names.
- **BalanceSnapshot**: Local read model for last known external balance response per account.
- **DistributionAttempt**: Settlement-linked external call record including idempotency key, status, and error metadata.
- **AirdropEligibilityBatch**: Computed account list and metadata for campaign airdrop signal dispatch.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the three specified domain triggers produce externally observable minting-oriented API calls during integration tests.
- **SC-002**: 100% of settlement-triggered distributions execute with exactly-once effective outcome under retry tests.
- **SC-003**: 100% of balance views in Mutuity are traceable to an external balance query response or labeled cached snapshot.
- **SC-004**: 100% of external API failures are logged with correlation id and retry status.
