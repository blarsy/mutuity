# Feature Specification: Resource Discovery And Publishing

**Feature Branch**: `005-resource-discovery-and-publishing`  
**Created**: 2026-04-05  
**Status**: Draft  
**Input**: User direction: "Start the first concrete merged-product slice by rebuilding Tope-là’s core resource offer flow in the unified platform."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visitor Browses Active Resources (Priority: P1)

As a visitor, I can browse active resources near me so I can discover offers of objects, competences, and exchanges that may help me.

**Why this priority**: Resource discovery is a central Tope-là capability and a key complement to Mutuity’s needs flow.

**Independent Test**: Open the public resources page, run a default query from a known location, and verify that active results are returned sorted by geographical closeness, with newest-first tie-breaking for equal distances.

**Acceptance Scenarios**:

1. **Given** a set of active, expired, and non-expiring resources, **When** a visitor opens the discovery page, **Then** only active resources that are not yet expired, plus resources with no expiration datetime, are shown.
2. **Given** multiple active resources at different distances from the query location, **When** browsing results are returned, **Then** the closest resources appear first.
3. **Given** two or more matching resources at the same distance, **When** browsing results are returned, **Then** the most recently created resource appears first among that tied group.
4. **Given** a resource reaches its expiration datetime, **When** browsing queries run after that moment, **Then** the resource is treated as expired and no longer returned.
5. **Given** the six modality flags on resources, **When** the visitor leaves their corresponding browse filters at `neutral`, **Then** resources with either `true` or `false` values for each flag remain eligible in the result set.
6. **Given** the visitor switches any modality filter to `yes` or `no`, **When** the query is re-run, **Then** only resources matching that boolean value for the selected flag are returned.
7. **Given** a visitor without an explicit saved location, **When** discovery runs, **Then** the location fallback behavior is explicit and deterministic.

---

### User Story 2 - Authenticated User Publishes A Resource (Priority: P1)

As an authenticated user or organization representative, I can publish a resource offer so others can discover and respond to it.

**Why this priority**: Publishing is the core creation flow that powers the resource side of the unified product.

**Independent Test**: Sign in, create a resource with category, location, modality flags, a mandatory intensity value, an optional negotiated Topes reference amount, availability, and optional media, and verify it becomes visible in discovery according to the publication rules.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they complete the publish form with valid data, a mandatory intensity value, any intended combination of modality flags, and an optional rich-text description, **Then** the new resource is stored and becomes visible in the public or intended scope.
2. **Given** a resource with an optional negotiated Topes reference amount (legacy/internal `price` field), **When** the user saves it, **Then** the amount is stored as the default Topes amount for future bids while remaining negotiable in the conversation.
3. **Given** a resource with optional images or media metadata and a rich-text description, **When** the user saves it, **Then** the description and media references are persisted safely and rendered on the resource detail UI.
4. **Given** invalid, incomplete, intensity-incompatible, or overlong description input, **When** the user attempts to publish, **Then** the UI shows clear validation feedback without storing a broken listing.

---

### User Story 3 - Interested User Responds To A Resource (Priority: P2)

As an interested user, I can send a bid or response to a resource so I can start a negotiation or coordination flow with its publisher.

**Why this priority**: Discovery without response/coordination would not reproduce the real Tope-là product loop.

**Independent Test**: Open a resource as a non-owner, submit a valid response, and verify that it appears in the publisher’s management view and can lead into conversation.

**Acceptance Scenarios**:

1. **Given** an active resource, **When** an authenticated non-owner submits a bid or response, **Then** the publisher receives a notification and can review it.
2. **Given** a resource with an optional negotiated Topes reference amount, **When** a user starts a bid, **Then** that amount is used as the default bid amount without being treated as a fixed commercial price.
3. **Given** an expired resource, **When** any account attempts to submit a new bid or response, **Then** the action is rejected and no new response is created.
4. **Given** a resource response with terms specific to the offer type, **When** the response is created, **Then** those terms are preserved separately from Mutuity’s need-claim semantics.
5. **Given** the publisher accepts, declines, or closes a response, **When** the lifecycle changes, **Then** the correct state and conversation access rules apply.

### Edge Cases

- A resource can represent a gift, loan, exchange, or competence offer, and not all form fields apply equally to each subtype.
- The modality flags `isProduct`, `isService`, `canBeGiven`, `canBeExchanged`, `canBeTakenAway`, and `canBeDelivered` are all independent booleans; any combination may be valid, including both gift and exchange options on the same resource.
- The optional legacy/internal `price` field is not a fixed commercial price; it is a negotiated Topes reference amount and user-facing UI should avoid the label `price`.
- A resource description may contain rich text and can be relatively long, but it must remain within the configured maximum length (currently 8000 characters).
- A resource may exist in draft, published, expired, or withdrawn states, each with different discovery and response rules.
- A resource with no expiration datetime is considered permanent and remains eligible for browsing until it is withdrawn, closed, or otherwise deactivated.
- Expired resources are not only hidden from browsing queries; they also reject any new bids or responses.
- A resource that can both be given and exchanged may still carry an optional Topes reference amount, which applies only as the default for the exchange/bid path and does not prevent a free gift arrangement.
- `bid` behavior is related to `claim` behavior but must remain distinct where outcome rules or extra terms differ.
- A resource may be visible publicly, organization-only, or under campaign constraints.
- Older Tope-là records may contain media or location data in formats that need normalization during migration.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The unified platform MUST support public or intended-scope discovery of active resource offers.
- **FR-002**: Discovery MUST support text, category, location-aware, and modality-flag filtering.
- **FR-003**: Default resource browsing order MUST sort solely by geographical closeness to the query location, with closer resources shown first.
- **FR-004**: If two or more matching resources have the same computed distance from the query location, the more recently created resource MUST be shown first.
- **FR-005**: Browsing queries MUST return only resources that are active and either not yet expired or not assigned any expiration datetime.
- **FR-006**: If a resource has an expiration datetime, it MUST become expired at that moment and stop appearing in browsing results.
- **FR-007**: Expired resources MUST reject any new bids or responses.
- **FR-008**: If a resource has no expiration datetime, it MUST be treated as permanent until it is withdrawn, closed, or otherwise deactivated.
- **FR-009**: Each of the six resource modality flags MUST expose a tri-state browse filter with values `neutral`, `yes`, and `no`.
- **FR-010**: A modality filter value of `neutral` MUST include resources regardless of whether the underlying flag is `true` or `false`.
- **FR-011**: A modality filter value of `yes` MUST restrict results to resources whose corresponding flag is `true`, and a value of `no` MUST restrict results to resources whose corresponding flag is `false`.
- **FR-012**: Authenticated users MUST be able to publish resource offers with the modality flags `isProduct`, `isService`, `canBeGiven`, `canBeExchanged`, `canBeTakenAway`, and `canBeDelivered`.
- **FR-013**: Resource creation MUST require an `intensity` value using the same four discrete levels already defined for needs: `leg up`, `sharing`, `commitment`, and `rare contribution`.
- **FR-014**: Resource publishing MAY include an optional negotiated Topes reference amount (legacy/internal `price` field), but user-facing copy MUST avoid the label `price` and instead describe it as a suggested, reference, or default Topes amount for negotiation.
- **FR-015**: When the optional Topes reference amount is provided, it MUST follow the same intensity range mapping used for needs: `leg up` (10 to 99), `sharing` (100 to 999), `commitment` (1000 to 4999), and `rare contribution` (5000 or more).
- **FR-016**: When the optional Topes reference amount is provided, it MUST be used as the default amount proposed in a bid on that resource, while remaining negotiable between participants.
- **FR-017**: The resource modality flags MUST be stored as independent booleans; no flag implicitly enables or disables any other flag, and combinations such as both giveable and exchangeable MUST be supported.
- **FR-018**: Resource publishing MUST support an optional rich-text `description` field for the resource detail UI.
- **FR-019**: The resource `description` field MUST accept up to 8000 characters and be validated/sanitized safely before storage and rendering.
- **FR-020**: Resource publishing MUST support optional media references and safe validation of user input.
- **FR-021**: The domain model MUST keep `resource` distinct from `need` in the initial migration wave.
- **FR-022**: The response flow for resources MUST keep `bid` distinct from `claim` where lifecycle or business terms differ.
- **FR-023**: Resource visibility and response permissions MUST be enforced in PostgreSQL and not trusted to the client.
- **FR-024**: The initial slice SHOULD reuse the successful discovery/search patterns already established for needs where appropriate.

### Key Entities *(include if feature involves data)*

- **Resource**: An offer of an object, service, skill, or exchange opportunity, characterized by independent modality flags describing what it is (`isProduct`, `isService`) and how it can be fulfilled (`canBeGiven`, `canBeExchanged`, `canBeTakenAway`, `canBeDelivered`), plus a mandatory `intensity`, an optional negotiated Topes reference amount, and an optional rich-text `description` displayed on the resource detail UI.
- **ResourceCategory**: A category or taxonomy entry used for browsing and filtering.
- **ResourceBid**: A response or negotiation object linked to a resource and governed by resource-specific rules, optionally seeded with the resource’s default Topes amount when one is provided.
- **ResourceMediaAsset**: Uploaded or referenced media metadata for the resource listing.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A reviewer can identify a clear end-to-end resource flow covering discovery, publishing, and response handling from the spec.
- **SC-002**: The feature is decomposed into slices that are implementation-ready and consistent with the migration foundation.
- **SC-003**: The resource flow clearly complements, rather than conflates, the already-documented need/claim flow.