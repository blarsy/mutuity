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
- **FR-025**: The web UI MUST expose an authentication-aware top bar whose menu items and account actions differ between signed-in and signed-out states.
- **FR-026**: When an account is signed in, the top bar MUST provide navigation entries for `Search`, `Contribute`, `Resources`, `Bids`, `Needs`, `Claims`, `Chat`, and `Notifications`, plus a visible token counter shortcut to `Contribution` and an avatar menu with `Profile`, `Preferences`, `Contribution`, and `Log out`.
- **FR-027**: When no account is signed in, the top bar MUST provide at least `Search` plus a compact login trigger that opens the sign-in UI in a dialog.
- **FR-028**: Resource browse results MUST be renderable through a reusable card surface that summarizes title, creator, preview image when available, expiration, and a shortened description, while keeping creator-click and card-click behaviors independently configurable.
- **FR-029**: Need browse results MUST be renderable through a reusable card surface that summarizes title, creator, expiration, and a shortened description, while keeping creator-click and card-click behaviors independently configurable.
- **FR-030**: The resource detail page MUST expose creator navigation, image zoom when media exists, authenticated chat initiation, and bid entry for exchangeable resources; if no account is signed in, those gated actions MUST open a contextual sign-in dialog.
- **FR-031**: The need detail page MUST expose creator navigation, authenticated chat initiation, and claim entry; if no account is signed in, those gated actions MUST open a contextual sign-in dialog.
- **FR-032**: The initial web information architecture MUST reserve dedicated top-level page surfaces for `Search`, `Contribute`, `Resources`, `Bids`, `Needs`, `Claims`, `Chat`, `Notifications`, `Profile`, `Preferences`, `Contribution`, and `RestoreAccess`, even when some remain unimplemented in the current MVP.
- **FR-033**: Account detail pages MUST show the public account profile plus the account’s active resources and needs, and campaign detail pages MUST show linked approved resources and needs together with create-resource and create-need entry points.
- **FR-034**: The authentication surface MUST support sign-in, account registration with local credentials and future external providers, password reset request, and reset-token-based access restoration as first-class reusable flows.
- **FR-035**: The platform MUST persist notifications as distinct account-scoped entities with their own creation timestamp, read timestamp, event type, and structured payload.
- **FR-036**: The notifications inbox MUST surface at least the following attention-worthy events when relevant: claim received on one of the account’s needs; bid received on one of the account’s resources; bid-expiring-soon warning; campaign airdrop-soon warning; campaign airdrop completion; welcome/profile-completion encouragement; tokens received as a gift; claim settled; and bid accepted, rejected, cancelled, or expired without response.
- **FR-037**: Each supported notification type MUST map to a clear user-facing message and destination route, including `/claims`, `/bids`, `/contribution`, `/profile`, or the relevant campaign public page as appropriate.
- **FR-038**: Opening a notification from the notifications page MUST mark that notification as read and then navigate to its mapped destination.
- **FR-039**: The notifications page MUST allow an account owner to mark any individual unread notification as read directly from the inbox without navigating away.
- **FR-040**: The notifications page MUST provide a `Set all as read` action guarded by an explicit yes/no confirmation dialog, and that action MUST affect all currently unread notifications for the account.
- **FR-041**: The system MUST delete notifications only when they are at least 7 days old and have already been marked as read for at least 24 hours.
- **FR-042**: Timed notification events such as bid-expiring-soon and campaign-airdrop-soon MUST be emitted by scheduled or background processing rather than relying on the client UI to generate them.
- **FR-043**: The contribution/token ledger MUST support explicitly documented positive and negative token movements tied to profile completion, resource lifecycle milestones, campaign airdrops, gifting, bid lifecycle, and claim settlement events.
- **FR-044**: Profile-completion token rewards for first avatar upload, first bio, first address/location, and first external link MUST each be granted at most once over the lifetime of an account.
- **FR-045**: Resource-related token rewards for a resource reaching 24 hours of age, first image addition, and first default Topes amount (`price` legacy field) assignment MUST each be granted at most once over the lifetime of the corresponding resource.
- **FR-046**: Campaign-airdrop token credits MUST grant the configured campaign amount at airdrop time at most once per account and per campaign.
- **FR-047**: Gifting tokens to another account MUST create equal and opposite ledger effects: a negative movement for the sender and a matching positive movement for the receiver for the exact gifted amount.
- **FR-048**: Creating a bid MUST reserve or deduct the bid amount from the bidder, and cancelling, expiring, or automatically cancelling that bid because the target resource expired or was deleted MUST restore that same amount to the bidder.
- **FR-049**: Settling a claim MUST create opposite token movements based on the settled claim amount: a positive movement for the claimer whose claim was selected and a negative movement for the account that settles the claim on its need.
- **FR-050**: A claim that remains valid for 24 hours after creation MUST grant a one-time `+10` token reward over that claim’s lifetime.

### Planned Web UI Surfaces *(documentation scope for the current feature wave)*

The following UI surfaces are important enough to be documented now at the behavior and routing level, even when some remain for later implementation:

- **Reusable components**: `AvatarIconButton`, `ResourceCard`, `NeedCard`, `Login`, `Register`, and `ResetPassword`
- **Top-level pages**: `Search`, `Contribute`, `Resources`, `Bids`, `Needs`, `Claims`, `Chat`, `Notifications`, `Profile`, `Preferences`, `Contribution`, `RestoreAccess`
- **Supporting pages**: create-resource, create-need, resource detail, need detail, account detail, and campaign detail pages
- **Login-gated interactions**: bidding, claiming, chatting, and create flows should redirect to or open a contextual sign-in experience when the visitor is anonymous

### Notification Event Catalog *(current documented messages and destinations)*

| Description | Default user-facing message | Destination |
| ----------- | --------------------------- | ----------- |
| A claim has been sent about one of the account owner’s needs | `You got a claim for your need <need name>` | `Claims` page |
| A bid has been received on one of the account owner’s resources | `You got a bid for your resource <resource name>` | `Bids` page |
| A bid you received is about to expire (2 hours before resource expiration) | `A bid you received is about to expire` | `Bids` page |
| A campaign with at least one of the account owner’s needs or resources is 48 hours from airdrop time | `The airdrop of campaign <campaign name> is coming soon !` | public campaign page |
| The airdrop of such a campaign has occurred | `Airdrop done on campaign <campaign name> ! Check your contribution page to see if you got it` | `Contribution` page |
| Welcome/profile-completion encouragement | `Welcome to tope-là, make a polished profile, and earn some Topes !` | `Profile` page |
| Tokens received from another account as a gift | `<sender name> gave you <amount received> Topes !` | `Contribution` page |
| A claim you have sent has been settled | `Congratulations, your claim on <need name> has been settled` | `Claims` page |
| A bid you sent has been accepted | `Congratulations, your bid on <resource name> has been accepted` | `Bids` page |
| A bid you sent has been rejected | `Your bid on <resource name> has been rejected` | `Bids` page |
| A bid you sent has been cancelled because the resource expired or was deleted | `Your bid on <resource name> has been cancelled` | `Bids` page |
| A bid you sent has expired without a response | `Your bid on <resource name> has expired without a response` | `Bids` page |

> Future grant-related notifications remain explicitly out of the current slice until their payload and destination rules are specified.

### Token Movement Catalog *(documented contribution ledger rules)*

| When | Amount of tokens | Frequency |
| ---- | ---------------- | --------- |
| First time an image is uploaded as avatar icon on the profile | `+20` | once over an account’s lifetime |
| First time a bio is set on the profile | `+20` | once over an account’s lifetime |
| First time a location is set as address of the profile | `+20` | once over an account’s lifetime |
| First time a link is added on the profile | `+20` | once over an account’s lifetime |
| Resource created 24 hours ago | `+20` | once over a resource’s lifetime |
| First image added to a resource | `+20` | once over a resource’s lifetime |
| First time a default Topes amount / legacy `price` is set on a resource | `+20` | once over a resource’s lifetime |
| Airdrop of a campaign received | `+<campaign’s configured airdrop amount>` | once per account and per campaign at airdrop time |
| Token gifted to another account | `-<given amount>` | each time the account owner gives tokens |
| Token received from another account | `+<given amount>` | each time another account gives tokens to this account |
| Bid created | `-<bid amount>` | each time the account owner creates a bid |
| Bid cancelled / expired / auto-cancelled | `+<bid amount>` | each time the bid is cancelled, expires, or is cancelled due to resource expiry/deletion |
| Bid accepted | `-<bid amount>` | corresponds to the accepted bid remaining committed |
| My claim settled | `+<claim amount>` | whenever a claim created by the account is settled |
| Settled a claim on my need | `-<claim amount>` | whenever the account settles a received claim |
| Claim created 24 hours ago | `+10` | once over a claim’s lifetime |

### Key Entities *(include if feature involves data)*

- **Resource**: An offer of an object, service, skill, or exchange opportunity, characterized by independent modality flags describing what it is (`isProduct`, `isService`) and how it can be fulfilled (`canBeGiven`, `canBeExchanged`, `canBeTakenAway`, `canBeDelivered`), plus a mandatory `intensity`, an optional negotiated Topes reference amount, and an optional rich-text `description` displayed on the resource detail UI.
- **ResourceCategory**: A category or taxonomy entry used for browsing and filtering.
- **ResourceBid**: A response or negotiation object linked to a resource and governed by resource-specific rules, optionally seeded with the resource’s default Topes amount when one is provided.
- **Notification**: A persisted, account-scoped attention event aggregated into the notifications inbox, carrying a typed payload, read state, destination mapping, and retention-cleanup eligibility.
- **TokenMovement**: An auditable ledger entry representing a positive or negative Topes change caused by profile completion, gifting, campaign airdrop, bid lifecycle, claim settlement, or other contribution rules.
- **ResourceMediaAsset**: Uploaded or referenced media metadata for the resource listing.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A reviewer can identify a clear end-to-end resource flow covering discovery, publishing, and response handling from the spec.
- **SC-002**: The feature is decomposed into slices that are implementation-ready and consistent with the migration foundation.
- **SC-003**: The resource flow clearly complements, rather than conflates, the already-documented need/claim flow.