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

---

### User Story 4 - Authenticated User Manages Their Own Needs (Priority: P1)

As an authenticated user, I can view, edit, and delete my own needs from a dedicated workspace page so I can keep my requests up to date.

**Why this priority**: Without a personal management surface, users have no way to correct, update, or remove the needs they have posted.

**Independent Test**: Sign in, navigate to the `Needs` page, verify that only the signed-in account's needs are listed, sorted by last modification time descending, with a working Edit action, a working Delete action with confirmation dialog, and a fixed "Add need" button leading to the creation flow.

**Acceptance Scenarios**:

1. **Given** an authenticated user who has created several needs, **When** they open the `Needs` page, **Then** only their own needs are shown, newest-modified first.
2. **Given** the user modifies any property of a need (title, description, images, or categories), **When** the change is saved, **Then** the need's last modification time is updated and the need rises to the top of the list.
3. **Given** more than 10 needs exist for the account, **When** the user scrolls to the bottom of the list, **Then** the next 10 needs are loaded automatically; this repeats each time the user reaches the bottom until all needs have been loaded.
4. **Given** a need in the list, **When** the user clicks Edit, **Then** they are taken to the edit-need page with that need's data pre-populated in modification mode.
5. **Given** a need in the list, **When** the user clicks Delete, **Then** a confirmation dialog is shown, and on confirmation the need is soft-deleted and removed from the list.
6. **Given** the needs page, **When** it is open at any scroll position, **Then** the "Add need" button is always visible and navigates to the edit-need page in creation mode when clicked.

---

### User Story 5 - Authenticated User Manages Their Own Resources (Priority: P1)

As an authenticated user, I can view, edit, and delete my own resources from a dedicated workspace page so I can keep my offers up to date.

**Why this priority**: Without a personal management surface, users have no way to correct, update, or remove the resource offers they have published.

**Independent Test**: Sign in, navigate to the `Resources` page, verify that only the signed-in account's resources are listed, sorted by last modification time descending, with a working Edit action, a working Delete action with confirmation dialog, and a fixed "Add resource" button leading to the creation flow.

**Acceptance Scenarios**:

1. **Given** an authenticated user who has created several resources, **When** they open the `Resources` page, **Then** only their own resources are shown, newest-modified first.
2. **Given** the user modifies any property of a resource (title, description, modality flags, images, or categories), **When** the change is saved, **Then** the resource's last modification time is updated and the resource rises to the top of the list.
3. **Given** more than 10 resources exist for the account, **When** the user scrolls to the bottom of the list, **Then** the next 10 resources are loaded automatically; this repeats each time the user reaches the bottom until all resources have been loaded.
4. **Given** a resource in the list, **When** the user clicks Edit, **Then** they are taken to the edit-resource page with that resource's data pre-populated in modification mode.
5. **Given** a resource in the list, **When** the user clicks Delete, **Then** a confirmation dialog is shown, and on confirmation the resource is soft-deleted and removed from the list.
6. **Given** the resources page, **When** it is open at any scroll position, **Then** the "Add resource" button is always visible and navigates to the edit-resource page in creation mode when clicked.

---

### User Story 6 - Authenticated User Reads Contribution Guidance And History (Priority: P2)

As an authenticated user, I can open the Contribution page to understand what Topes are, see my recent token transactions, and discover where to perform token-earning actions.

**Why this priority**: Contribution rules are central to user trust and motivation, and users need a clear, actionable explanation of how Topes are earned.

**Independent Test**: Sign in, open the `Contribution` page, verify that the Topes explanation carousel opens from its button, the first 10 token transactions are shown with a `Load more` action that appends 10 more repeatedly until the first transaction is reached, and a list of earning opportunities is displayed with amount and destination links.

**Acceptance Scenarios**:

1. **Given** the signed-in user is on the `Contribution` page, **When** they click the Topes explanation button, **Then** an explanation carousel opens and can be navigated slide by slide.
2. **Given** the signed-in user has token history, **When** they open the `Contribution` page, **Then** exactly the 10 most recent token transactions are shown first, ordered from newest to oldest.
3. **Given** more than 10 token transactions exist, **When** the user clicks `Load more`, **Then** the next 10 older transactions are appended; repeating this action keeps appending 10 more until the first transaction is displayed.
4. **Given** all token transactions for the account are already displayed, **When** the user reaches the end of the history, **Then** no additional transactions are loaded and the `Load more` action is hidden or disabled.
5. **Given** the signed-in user is on the `Contribution` page, **When** earning opportunities are rendered, **Then** each row shows the earning action label, the amount of Topes that can be earned, and a link to the page where that action can be performed.

---

### User Story 7 - Authenticated User Tunes Delivery Preferences (Priority: P1)

As an authenticated user, I can configure how and how often I receive out-of-app information so I stay informed without feeling spammed.

**Why this priority**: The product already emits attention-worthy events, but user trust and long-term engagement depend on giving people control over immediacy and frequency.

**Independent Test**: Sign in, open the `Preferences` page, configure per-category delivery strategy (`realtime push` or `email summary`), configure summary frequency (`1`, `3`, `7`, `30` days), trigger eligible events while the account has no active session, and verify that immediate push versus deferred 08:00 digest behavior matches the selected preference.

**Acceptance Scenarios**:

1. **Given** an authenticated user on the `Preferences` page, **When** they view communication settings, **Then** they can configure delivery preferences for these categories: new resources added, new needs added, unread notifications, and new chat message received.
2. **Given** a delivery category in preferences, **When** the user selects `realtime push`, **Then** eligible events in that category are sent immediately as push notifications (mobile app only) while in-app alerts continue unchanged.
3. **Given** a delivery category in preferences, **When** the user selects `email summary`, **Then** eligible events are queued for email digest delivery instead of immediate push.
4. **Given** email summary is selected for a category, **When** the user sets summary frequency to `1`, `3`, `7`, or `30` days, **Then** digest eligibility follows that cadence and defaults to `1 day` for categories with no explicit saved value.
5. **Given** the account has at least one active web or mobile session, **When** an eligible event occurs, **Then** out-of-app push/email delivery for these preference-managed categories is not emitted for that event.
6. **Given** eligible non-broadcasted events exist for one account at the daily digest time, **When** the 08:00 digest job runs, **Then** exactly one email is produced for that account, containing one section per event category with pending items, and those items are marked as broadcasted.
7. **Given** no pending digest items exist for an account, **When** the 08:00 digest job runs, **Then** no digest email is sent.

**Preferences Information Architecture**:

- Channels in scope:
	- `in-app` (always on, not disabled from Preferences)
	- `push` (mobile only, out-of-app)
	- `email summary` (out-of-app digest)
- Managed event categories:
	- `new_resource_added`
	- `new_need_added`
	- `unread_notifications`
	- `new_chat_message_received`

| Category | In-app channel | Realtime push strategy | Email summary strategy |
|---|---|---|---|
| `new_resource_added` | Always emitted to in-app notifications | Send push immediately when activity gate is open | Queue digest item for next eligible cadence window |
| `new_need_added` | Always emitted to in-app notifications | Send push immediately when activity gate is open | Queue digest item for next eligible cadence window |
| `unread_notifications` | Always emitted to in-app notifications | Send push immediately when activity gate is open | Queue digest item for next eligible cadence window |
| `new_chat_message_received` | Always emitted to in-app notifications | Send push immediately when activity gate is open | Queue digest item for next eligible cadence window |

Activity-gating rules:

1. Out-of-app delivery (`push`, `email summary`) is allowed only when the target account has no active web session and no active mobile session at event time.
2. When the activity gate is closed, only in-app delivery is persisted for that event.
3. For `email summary` strategy, pending items are retained until selected by cadence (`1`, `3`, `7`, `30` days, default `1`) and marked broadcasted after successful digest send.
4. The daily digest job runs at `08:00` server time and emits at most one digest email per account per run.

---

### User Story 8 - Account Creation And Access Recovery (Priority: P1)

As a visitor or account holder, I can create and access my account with local email/password credentials, verify my email, and recover my credentials safely.

**Why this priority**: Account entry and recovery are core trust flows; without complete signup/login/recovery options, users drop off before they can participate in needs, resources, chat, or contribution loops.

**Independent Test**: Register with email/password and verify email, sign in immediately after account creation, request forgot-password reset and complete it via tokenized link, and perform authenticated change-password while signed in.

**Acceptance Scenarios**:

1. **Given** a new visitor creating an account, **When** account information is submitted, **Then** `account name` is the only mandatory account-profile field required to create the account.
2. **Given** a new visitor, **When** they choose email/password registration, **Then** an account is created in unverified state and an email verification message is sent.
3. **Given** an unverified local account, **When** the user opens the verification link and token validation succeeds, **Then** the account email is marked verified and the user can continue into authenticated flows.
4. **Given** an account holder who forgot their password, **When** they request password reset by email and submit the reset form with a valid token, **Then** the password is updated and the token cannot be reused.
5. **Given** an authenticated account holder, **When** they change password from account settings with correct current credentials and valid new credentials, **Then** the password is updated and session-security rules are applied.
6. **Given** invalid or expired verification/reset tokens, **When** those links are opened, **Then** the system rejects the request with safe generic copy and offers a resend/retry path.

**Phase Note (Auth Parity Scope)**:

- Local email/password parity (register, immediate sign-in, verification lifecycle, forgot/reset, change-password, token replay protection) is in active implementation scope for the current phase.
- Google/Apple sign-in/up with suggested-name prefill remains documented parity target but is explicitly deferred to a dedicated social-auth increment.

---

### User Story 9 - Operators Can Trace Runtime Behavior With Unified Logs (Priority: P1)

As an operator or developer, I can inspect unified logs from all platform components so I can diagnose incidents and understand recent runtime behavior quickly.

**Why this priority**: Logging is a cross-cutting operational requirement; without coherent logs across clients, web API, and background jobs, production diagnosis is too slow.

**Independent Test**: Trigger representative warning/info/error events from mobile, backoffice web, web API, and non-interactive jobs; verify all entries are persisted in one log table with component labels, optional activity context, severity, and message content suitable for troubleshooting.

**Acceptance Scenarios**:

1. **Given** events emitted from mobile app, backoffice web, web API, and worker/background jobs, **When** they are logged, **Then** all entries are stored in one unified log table rather than split client/server tables.
2. **Given** any emitted log entry, **When** persisted, **Then** it includes a `component` field identifying the source component (`mobile_app`, `backoffice_web`, `web_api`, `worker_job`, or another registered component value).
3. **Given** client-side events tied to an authenticated session activity, **When** logs are emitted from mobile/backoffice during that activity, **Then** an activity/session identifier may be stored in optional `context` to correlate those entries.
4. **Given** an error event, **When** persisted, **Then** `message` contains contextual error description concatenated with stack trace when available.
5. **Given** a warning or info event, **When** persisted, **Then** `message` contains actionable contextual information rather than opaque text.
6. **Given** an exception while interacting with PostgreSQL (GraphQL path or other DB client path), **When** the exception is caught in mobile/backoffice/web API/worker code, **Then** it is logged as error and includes context when available.
7. **Given** an exception while interacting with external systems (Google auth, Apple auth, Cloudinary, Expo push, or other external APIs), **When** the exception is caught, **Then** it is logged as error with component and contextual message.
8. **Given** no explicit retention override is configured, **When** log cleanup runs, **Then** logs older than 7 days are deleted according to the default retention setting.

---

### User Story 10 - Account Claims A Targeted Grant (Priority: P1)

As an account holder, I can open a specific grant route and claim a grant when I satisfy its criteria so token seeding can be distributed without creating a full campaign.

**Why this priority**: Grants are a flexible growth/seeding mechanism for administrators and a direct token on-ramp for targeted users and campaign participants.

**Independent Test**: Create grant definitions as administrator with combinations of criteria (target accounts/emails, max grants, expiry datetime, campaign participation), then sign in as matching/non-matching users and verify claim route behavior, award outcomes, and denial reasons.

**Acceptance Scenarios**:

1. **Given** a non-admin account, **When** it attempts to create or modify a grant, **Then** the action is denied.
2. **Given** a system administrator, **When** a grant is created, **Then** an expiration datetime is required and at least one additional criterion must be defined among: allowed accounts, allowed emails (including future users), max total grants, or linked campaign participation requirement.
3. **Given** a grant with multiple criteria, **When** an account attempts to claim it, **Then** the account must satisfy all configured criteria to receive the grant.
4. **Given** a grant targeted by email, **When** an account with matching email claims it, **Then** the claim succeeds even if the account did not exist when the grant was created.
5. **Given** a grant with `max amount of grants`, **When** successful claims reach that cap, **Then** further claims are denied indefinitely.
6. **Given** a grant with an expiration datetime, **When** claim is attempted after expiration, **Then** the claim is denied.
7. **Given** a grant linked to a campaign participation criterion, **When** account ownership includes at least one approved linked need or one approved linked resource in that campaign, **Then** that criterion is satisfied.
8. **Given** an unauthenticated user opening the claim route with a grant id, **When** the grant page loads, **Then** it shows the login form, and after successful authentication the route continues in the current session context and displays grant title and description before showing a success or error message after claim evaluation.
9. **Given** an account that already claimed a grant, **When** it attempts to claim the same grant again, **Then** no second token award is issued.

**Grant Claim Denial Categories (user-safe):**

- `not_authenticated`: user must sign in to claim.
- `not_targeted`: account does not match targeted account/email criteria.
- `expired`: grant expiration datetime has passed.
- `cap_reached`: max successful-claim count is already reached.
- `already_claimed`: account has already received this grant once.
- `campaign_criterion_not_satisfied`: required campaign participation criterion is not met.
- `grant_unavailable`: grant id is unknown, archived, or otherwise unavailable for claim.

Each category should map to user-safe copy on the claim page and avoid exposing internal SQL/system details.

---

### User Story 11 - Administrator Inspects System Data For Support And Troubleshooting (Priority: P1)

As a system administrator, I can access focused admin-only data pages with fast search and contextual actions so I can support users and troubleshoot recent platform behavior efficiently.

**Why this priority**: Admin support and incident triage require immediate visibility into recent accounts, activity, messaging, notifications, campaigns, grants, and operational logs without ad hoc SQL access.

**Independent Test**: Sign in as admin and verify each admin page loads most-recent-first table data, supports configured search fields, and exposes page-specific actions (mail replay, campaign moderation handoff, dialogs, grant creation, and full-message viewers). Verify non-admin accounts cannot access these pages.

**Acceptance Scenarios**:

1. **Given** an authenticated non-admin account, **When** it accesses any admin support page, **Then** access is denied.
2. **Given** an authenticated admin account, **When** it opens an admin support page, **Then** the page shows a table of the corresponding data item ordered by most recent records first.
3. **Given** an admin support page with search input, **When** a query is entered, **Then** the system filters results using only the configured searchable fields for that data item with case-insensitive contains matching.
4. **Given** the `Accounts` page, **When** records are shown, **Then** each row includes: id, name, email, language, amount of tokens, creation datetime, and address; filtering matches email and name.
5. **Given** the `Bids` page, **When** records are shown, **Then** each row includes: id, bidder name, receiver name, resource title, intensity, amount of tokens, status, creation datetime, and expiration datetime; filtering matches bidder name, receiver name, and resource title.
6. **Given** the `Resources` page, **When** records are shown, **Then** each row includes: id, title, creator name, intensity, amount of tokens, number of images, location, creation datetime, and expiration datetime; filtering matches title, description, and creator name.
7. **Given** the `Notifications` page, **When** records are shown, **Then** each row includes: id, account name, data (JSON), creation datetime, and read datetime; filtering matches account name and data.
8. **Given** the `Mails` page, **When** records are shown, **Then** each row includes: id, email, subject, recipient account name, and creation datetime; filtering matches email, recipient account name, and subject.
9. **Given** the `Campaigns` page, **When** records are shown, **Then** each row includes: id, creator name, summary, moderation status, airdrop datetime, airdrop amount of tokens, begin datetime, end datetime, resource rewards multiplier, and creation datetime; filtering matches summary, creator name, and description, and the page also supports moderation-status filtering including awaiting adaptation.
10. **Given** the `Grants` page, **When** records are shown, **Then** each row includes: id, title, description, expiration datetime, amount granted, and creation datetime; filtering matches title and description.
11. **Given** the `Logs` page, **When** records are shown, **Then** each row includes: component, timestamp, severity, message, and context; filtering matches component, message, and context.
12. **Given** a row in `Mails`, **When** `view content` is clicked, **Then** a fullscreen dialog opens showing the mail HTML content.
13. **Given** a row in `Mails`, **When** `send again` is clicked, **Then** the system re-sends that email immediately by recomputing recipients and template context from current account data using the same routine used by mailing jobs.
14. **Given** a row in `Campaigns`, **When** `View description` is clicked, **Then** a fullscreen dialog opens showing campaign description.
15. **Given** a row in `Campaigns`, **When** `moderate` is clicked, **Then** the admin moderation-note flow from feature `001-campaign-needs` is exposed from this admin surface.
16. **Given** the `Grants` page, **When** `Create` is clicked, **Then** a dialog opens with the grant creation form.
17. **Given** a row in `Logs`, **When** `View message` is clicked, **Then** a fullscreen dialog opens showing the full log message in a wrapping text block.

**Admin Support Page Matrix**

| Data Item | Default Ordering | Field Projection (table columns) | Search Fields (case-insensitive contains) | Action Buttons |
|---|---|---|---|---|
| Accounts | `created_at DESC` | id, name, email, language, amount of tokens, creation datetime, address | email, name | none |
| Bids | `created_at DESC` | id, bidder name, receiver name, resource title, intensity, amount of tokens, status, creation datetime, expiration datetime | bidder name, receiver name, resource title | none |
| Resources | `created_at DESC` | id, title, creator name, intensity, amount of tokens, number of images, location, creation datetime, expiration datetime | title, description, creator name | none |
| Notifications | `created_at DESC` | id, account name, data (JSON), creation datetime, read datetime | account name, data | none |
| Mails | `created_at DESC` | id, email, subject, recipient account name, creation datetime | email, recipient account name, subject | `View content`, `Send again` |
| Campaigns | `created_at DESC` | id, creator name, summary, moderation status, airdrop datetime, airdrop amount of tokens, begin datetime, end datetime, resource rewards multiplier, creation datetime | summary, creator name, description plus explicit moderation-status filter | `View description`, `Moderate` |
| Grants | `created_at DESC` | id, title, description, expiration datetime, amount granted, creation datetime | title, description | `Create` |
| Logs | `created_at DESC` | component, timestamp, severity, message, context | component, message, context | `View message` |

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
- In-app alerts remain enabled and visible in the product regardless of the delivery preferences configured on the `Preferences` page.
- Push delivery is mobile-app-only; accounts without a valid push token should still receive digest delivery when configured for email summary.
- The `new resources added` and `new needs added` categories require ranked account targeting, not global fanout.
- Digest generation must avoid duplicate sends of the same event item and must keep idempotent behavior across retries.
- Local email/password accounts may exist without social identities and vice versa; account linking should avoid duplicate accounts on same verified email.
- Social-provider callbacks may omit optional profile fields; account creation should still succeed with safe defaults.
- Social-provider callbacks should prefill provider account name as a suggestion, and the user should be able to edit that value before account creation is finalized.
- Password-reset and email-verification tokens must be one-time-use and expire after a bounded duration.
- Log-ingestion failures must not crash user-facing flows; a fallback sink should preserve minimal diagnostics.
- Grants capped by `max amount of grants` must remain race-safe under concurrent claim attempts so the cap cannot be exceeded.
- Email-targeted grant matching should rely on the system invariant that emails are stored lower-cased and trimmed; comparisons should use that stored canonical value.
- Plus-addressed emails are supported as unique identifiers and should not be collapsed to a base address for duplicate prevention.
- A grant may have no campaign criterion; in that case campaign participation should not be required.
- Admin searches over JSON/text-heavy fields (for example notifications data and logs message) should remain responsive and paginated even on large datasets.
- Mail replay should preserve existing send guards (rate limits/retry protections) to avoid accidental spam bursts, while recomputing recipients and template context from current account data.
- Datetime values are stored with time zone and displayed to users in their current session locale/time-zone representation.

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
- **FR-012**: Authenticated users MUST be able to create and edit resource offers with the modality flags `isProduct`, `isService`, `canBeGiven`, `canBeExchanged`, `canBeTakenAway`, and `canBeDelivered`.
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
- **FR-034**: The authentication surface MUST support sign-in and account registration with local email/password credentials, password reset request, reset-token-based access restoration, and authenticated change-password as first-class reusable flows.
- **FR-034a**: The profile surface MUST allow an account to store its profile links as a zero-or-more collection, and each saved link MUST include a URL, a user-facing caption, and a type chosen from `facebook`, `instagram`, `x`, or `website`.
- **FR-035**: The platform MUST persist notifications as distinct account-scoped entities with their own creation timestamp, read timestamp, event type, and structured payload.
- **FR-036**: The notifications inbox MUST surface at least the following attention-worthy events when relevant: claim received on one of the account’s needs; bid received on one of the account’s resources; bid-expiring-soon warning; campaign airdrop-soon warning; campaign airdrop completion; welcome/profile-completion encouragement; tokens received as a gift; claim settled; bid accepted, rejected, cancelled, or expired without response; campaign moderation note received by a creator; campaign approved; and creator adaptation submitted on a campaign awaiting administrator review.
- **FR-037**: Each supported notification type MUST map to a clear user-facing message and destination route, including `/claims`, `/bids`, `/contribution`, `/profile`, the relevant campaign public page, the creator campaign moderation page, or the admin campaigns page with prefilled filters as appropriate.
- **FR-038**: Opening a notification from the notifications page MUST mark that notification as read and then navigate to its mapped destination.
- **FR-039**: The notifications page MUST allow an account owner to mark any individual unread notification as read directly from the inbox without navigating away.
- **FR-040**: The notifications page MUST provide a `Set all as read` action guarded by an explicit yes/no confirmation dialog, and that action MUST affect all currently unread notifications for the account.
- **FR-041**: The system MUST delete notifications only when they are at least 7 days old and have already been marked as read for at least 24 hours.
- **FR-042**: Timed notification events such as bid-expiring-soon and campaign-airdrop-soon MUST be emitted by scheduled or background processing rather than relying on the client UI to generate them.
- **FR-043**: The contribution/token ledger MUST support explicitly documented positive and negative token movements tied to profile completion, resource lifecycle milestones, campaign airdrops, gifting, bid lifecycle, and claim settlement events.
- **FR-044**: Profile-completion token rewards for first avatar upload, first bio, first address/location, and the first added profile link (across the account’s zero-or-more typed links) MUST each be granted at most once over the lifetime of an account.
- **FR-045**: Resource-related token rewards for a resource reaching 24 hours of age, first image addition, and first default Topes amount (`price` legacy field) assignment MUST each be granted at most once over the lifetime of the corresponding resource.
- **FR-046**: Campaign-airdrop token credits MUST grant the configured campaign amount at airdrop time at most once per account and per campaign, and an account is eligible only when, at airdrop time, the same account owns at least two approved campaign-linked items across these categories for that campaign: linked need(s) approved by the campaign creator and linked resource(s) approved by the campaign creator.
- **FR-047**: Gifting tokens to another account MUST create equal and opposite ledger effects: a negative movement for the sender and a matching positive movement for the receiver for the exact gifted amount.
- **FR-048**: Creating a bid MUST reserve or deduct the bid amount from the bidder, and cancelling, expiring, or automatically cancelling that bid because the target resource expired or was deleted MUST restore that same amount to the bidder.
- **FR-049**: Settling a claim MUST create opposite token movements based on the settled claim amount: a positive movement for the claimer whose claim was selected and a negative movement for the account that settles the claim on its need.
- **FR-050**: A claim that remains valid for 24 hours after creation MUST grant a one-time `+10` token reward over that claim’s lifetime.
- **FR-051**: Authenticated users MUST have access to a `Resources` workspace page that lists only the resources they created.
- **FR-052**: The `Resources` workspace page MUST sort resources by last modification time descending, with the most recently modified resource shown first.
- **FR-053**: Any property change on a resource — including title, description, modality flags, images, categories, or any other linked data — MUST update the resource's last modification time.
- **FR-054**: The `Resources` workspace page MUST display the first 10 resources by default; each time the user scrolls to the bottom of the list, 10 more resources MUST be appended until all resources for the account have been loaded (infinite scroll, page size 10).
- **FR-055**: Each resource entry on the `Resources` workspace page MUST display an Edit action that navigates to the edit-resource page in modification mode with that resource's data pre-populated.
- **FR-056**: Each resource entry on the `Resources` workspace page MUST display a Delete action that opens a confirmation dialog and, on confirmation, performs a soft delete of the resource.
- **FR-057**: The `Resources` workspace page MUST display a fixed "Add resource" button that is always visible regardless of scroll position and navigates to the edit-resource page in creation mode.
- **FR-058**: Authenticated users MUST have access to a `Needs` workspace page that lists only the needs they created.
- **FR-059**: The `Needs` workspace page MUST sort needs by last modification time descending, with the most recently modified need shown first.
- **FR-060**: Any property change on a need — including title, description, images, categories, or any other linked data — MUST update the need's last modification time.
- **FR-061**: The `Needs` workspace page MUST display the first 10 needs by default; each time the user scrolls to the bottom of the list, 10 more needs MUST be appended until all needs for the account have been loaded (infinite scroll, page size 10).
- **FR-062**: Each need entry on the `Needs` workspace page MUST display an Edit action that navigates to the edit-need page in modification mode with that need's data pre-populated.
- **FR-063**: Each need entry on the `Needs` workspace page MUST display a Delete action that opens a confirmation dialog and, on confirmation, performs a soft delete of the need.
- **FR-064**: The `Needs` workspace page MUST display a fixed "Add need" button that is always visible regardless of scroll position and navigates to the edit-need page in creation mode.
- **FR-065**: The `Contribution` page MUST provide a dedicated button that opens a carousel explaining Topes and contribution principles.
- **FR-066**: The `Contribution` page MUST show exactly the 10 most recent token transactions for the signed-in account on first render, ordered from newest to oldest.
- **FR-067**: The `Contribution` page MUST provide a `Load more` action that appends the next 10 older token transactions each time it is triggered, until the first transaction is reached.
- **FR-068**: Once all token transactions are loaded, the `Load more` action on the `Contribution` page MUST be hidden or disabled.
- **FR-069**: The `Contribution` page MUST display a list of Topes-earning opportunities, and each opportunity MUST include the action label, the amount of Topes that can be earned, and a link to the page where that action is performed.
- **FR-070**: The platform MUST expose an authenticated `Preferences` page where users configure out-of-app delivery behavior for information events.
- **FR-071**: The `Preferences` page MUST manage only out-of-app channels (`email summaries` and `push notifications`) and MUST NOT disable or alter in-app alerts.
- **FR-072**: The system MUST support these preference-managed event categories: `new resources added`, `new needs added`, `unread notifications`, and `new chat message received`.
- **FR-073**: For each managed category, the user MUST be able to choose one delivery strategy: `realtime push` or `email summary`.
- **FR-074**: `Realtime push` delivery MUST be limited to mobile push notifications.
- **FR-075**: `Email summary` delivery MUST support frequencies of `1`, `3`, `7`, or `30` days and MUST default to `1 day` when unset.
- **FR-076**: Preference-managed out-of-app deliveries MUST be emitted only when the account has no active web or mobile app session at event time.
- **FR-077**: For `new resources added`, account targeting MUST follow the same ranking behavior reverse engineered from Tope-la `sb.get_accounts_to_notify_of_new_resource`: combine proximity, active-campaign participation, and search-intent signals; exclude the publisher; require cumulative score over threshold; and cap recipients to the top-ranked set.
- **FR-078**: For `new needs added`, account targeting MUST use the same ranking strategy as `new resources added`, adapted to the new-need entity and fields.
- **FR-079**: For `unread notifications`, the system MUST emit realtime push immediately when that category is configured as realtime and the activity gate allows out-of-app delivery.
- **FR-080**: For `new chat message received`, the system MUST emit realtime push immediately when that category is configured as realtime and the activity gate allows out-of-app delivery.
- **FR-081**: For categories configured as `email summary`, eligible events MUST be persisted as pending digest items until broadcasted.
- **FR-082**: A scheduled digest process MUST run daily at `08:00` server time and evaluate pending digest items against each account's configured frequency.
- **FR-083**: Each digest run MUST generate at most one email per account, and that email MUST include one section per category that has pending items selected for broadcast.
- **FR-084**: After successful digest send, included pending items MUST be marked as broadcasted so they are not re-sent.
- **FR-085**: If an account has no eligible pending items at digest time, no digest email MUST be sent.
- **FR-086**: The backend MUST expose SQL-owned preference read/write operations and SQL-owned selection helpers for digest candidate extraction and mark-as-broadcasted updates.
- **FR-087**: The preference model MUST remain extensible to future channels and event categories without schema-breaking migration patterns.
- **FR-088**: Email/password account registration MUST require email verification before the account is treated as fully verified for protected account-owner operations.
- **FR-089**: The system MUST support resend of email-verification messages for unverified local accounts with abuse-safe throttling.
- **FR-090**: The platform MUST support sign-in and account creation through Google OAuth (deferred from current local-auth phase).
- **FR-091**: The platform MUST support sign-in and account creation through Apple OAuth (deferred from current local-auth phase).
- **FR-092**: External-identity login MUST map to existing accounts safely when identity/email matches, and MUST avoid duplicate-account creation (deferred from current local-auth phase).
- **FR-093**: Forgot-password flow MUST issue one-time reset tokens with expiration, deliver reset links by email, and reject expired/invalid/reused tokens.
- **FR-094**: Authenticated users MUST be able to change their password by providing current password plus valid new password.
- **FR-095**: Password and token handling MUST follow secure storage and transport patterns: salted password hashing, server-side token hashing, and sanitized error responses.
- **FR-096**: The web information architecture MUST include explicit entry points for `Register`, `Login`, `ResetPassword`, and email verification completion.
- **FR-097**: Account creation MUST require only `account name` as mandatory account-profile information; all other profile fields are optional at creation time.
- **FR-098**: Local email/password authentication setup MUST require an email and password for that auth method, while remaining separate from the minimal account-profile requirement.
- **FR-099**: During first-time account creation via Google or Apple, the provider account name MUST be used to prefill a suggested account name, and the user MUST be able to edit it before final submission (deferred from current local-auth phase).
- **FR-100**: The platform MUST persist operational logs in a single unified database table across mobile app, backoffice web, web API, and non-interactive jobs.
- **FR-101**: Each log entry MUST include at least: `created_at`, `level`, `component`, and `message`.
- **FR-102**: Each log entry MUST support optional `context` for activity/session correlation, especially for mobile/backoffice user activity traces.
- **FR-103**: Log entry `component` MUST identify log origin and be enumerable (including at least `mobile_app`, `backoffice_web`, `web_api`, and `worker_job`).
- **FR-104**: For error-level entries, `message` MUST include the error message plus stack trace when stack is available.
- **FR-105**: The system MUST log any exception raised during PostgreSQL interactions, including GraphQL execution paths and non-GraphQL DB client usage.
- **FR-106**: The system MUST log any exception raised during external-system interactions, including Google auth, Apple auth, Cloudinary, Expo push notifications, and other third-party APIs.
- **FR-107**: Logging APIs used by mobile/backoffice SHOULD accept optional account identifier and optional context/activity identifier, and SHOULD include them when available.
- **FR-108**: Existing split storage patterns equivalent to separate `client_logs` and `server_logs` MUST be replaced by the unified table for new writes.
- **FR-109**: Non-error logging (`info`, `warn`) SHOULD mirror the practical Tope-la operational events where possible, including startup lifecycle, background job execution, notification dispatch preparation, and notable ignored/unexpected runtime conditions.
- **FR-110**: If primary log persistence fails, the runtime MUST use a fallback logger path (console and/or file) and MUST NOT terminate the main user flow solely because logging failed.
- **FR-111**: The platform MUST expose a system-wide setting for log retention in days, stored in a database-backed system settings table or equivalent SQL-owned configuration source.
- **FR-112**: Default log retention MUST be 7 days when no override is configured, and scheduled cleanup MUST delete log entries older than the configured retention window.

Unified logging contract (phase-ready definition):
- Single sink: all new operational writes must target one SQL-owned table (`component_logs` naming TBD at migration time); no new writes to split client/server log stores.
- Required columns per entry: `created_at`, `level`, `component`, `message`.
- Optional columns: `account_id`, `context`, and provider/system metadata payload.
- `component` is mandatory and enumerable across at least `mobile_app`, `backoffice_web`, `web_api`, `worker_job`.
- Message rules by severity:
	- `info`: concise operational milestone or state transition.
	- `warn`: recoverable anomaly that did not stop the primary flow.
	- `error`: contextual statement that includes error message and stack trace when stack is available.
- **FR-113**: A grant MUST be creatable or modifiable only by system administrators.
- **FR-114**: A grant definition MUST require an expiration datetime and MUST require at least one additional eligibility constraint among: target account ids, target emails, max successful-claim count, or linked campaign participation requirement.
- **FR-114a**: A grant definition MUST include a fixed awarded token amount that does not vary per claim for that grant.
- **FR-115**: Grant eligibility MUST require that an account satisfies all configured criteria on that grant.
- **FR-116**: Grants targeted by email MUST allow future accounts to claim when their authenticated email matches a targeted email value using lower-cased and trimmed stored emails.
- **FR-116a**: Plus-addressed emails MUST be treated as distinct email identifiers; the system MUST NOT collapse them to a base address for duplicate-account prevention.
- **FR-117**: A grant with a max successful-claim count MUST stop awarding tokens once that count is reached, and subsequent claims MUST be denied indefinitely.
- **FR-118**: A grant MUST deny claims after its expiration datetime.
- **FR-119**: Campaign-participation criterion MUST be satisfied when the claiming account owns at least one approved linked need or at least one approved linked resource in the linked campaign.
- **FR-120**: The grant claim flow MUST use a dedicated route carrying grant id; when no session is active the route MUST render a login form, and after successful login it MUST continue in the current session context and display grant title and description.
- **FR-121**: After claim evaluation, the grant claim page MUST show either a success message (award granted) or an error message (award denied).
- **FR-122**: Each account MUST be awardable at most once per grant.
- **FR-123**: Successful grant claims MUST produce a token movement entry tied to the grant identifier and awarded amount.
- **FR-124**: Grant claim evaluation and award issuance MUST be atomic and idempotent to prevent duplicate awards under retries or concurrent requests.
- **FR-125**: Grant claim denial responses SHOULD expose user-safe reason categories (for example: not targeted, expired, cap reached, already claimed, campaign criterion not satisfied) without leaking sensitive internal data.
- **FR-126**: The platform MUST expose admin-only support/troubleshooting pages for these data items: accounts, bids, resources, notifications, mails, campaigns, grants, and logs.
- **FR-127**: Access to these pages and their actions MUST be restricted to administrator role.
- **FR-128**: Each admin data page MUST display records sorted by most recent first using the data item's creation/event timestamp semantics.
- **FR-129**: Each admin data page MUST provide a search box that filters results using only configured fields for that data item, with case-insensitive contains matching.
- **FR-130**: Accounts page MUST display: id, name, email, language, amount of tokens, creation datetime, address; search fields: email, name.
- **FR-131**: Bids page MUST display: id, bidder name, receiver name, resource title, intensity, amount of tokens, status, creation datetime, expiration datetime; search fields: bidder name, receiver name, resource title.
- **FR-132**: Resources page MUST display: id, title, creator name, intensity, amount of tokens, number of images, location, creation datetime, expiration datetime; search fields: title, description, creator name.
- **FR-133**: Notifications page MUST display: id, account name, data (JSON), creation datetime, read datetime; search fields: account name, data.
- **FR-134**: Mails page MUST display: id, email, subject, recipient account name, creation datetime; search fields: email, recipient account name, subject.
- **FR-135**: Campaigns page MUST display: id, creator name, summary, airdrop datetime, airdrop amount of tokens, begin datetime, end datetime, resource rewards multiplier, creation datetime; search fields: summary, creator name, description.
- **FR-136**: Grants page MUST display: id, title, description, expiration datetime, amount granted, creation datetime; search fields: title, description.
- **FR-137**: Logs page MUST display: component, timestamp, severity, message, context; search fields: component, message, context.
- **FR-138**: Mails page MUST provide `view content` action that opens a fullscreen dialog showing stored HTML content.
- **FR-139**: Mails page MUST provide `send again` action that triggers immediate resend through the same routine used by scheduled mailing jobs, recomputing recipients and template context from current account data.
- **FR-140**: Campaigns page MUST provide `View description` action that opens a fullscreen dialog showing campaign description.
- **FR-141**: Campaigns page MUST provide `moderate` action exposing the admin moderation-note flow from feature `001-campaign-needs`.
- **FR-142**: Grants page MUST provide `Create` action opening the grant-creation form in a dialog, with a required expiration datetime editor and validation that at least one additional grant constraint is configured.
- **FR-143**: Logs page MUST provide `View message` action opening a fullscreen dialog showing the raw full message text with wrapping enabled.
- **FR-146**: Datetime values used across admin support and grant claim surfaces MUST be stored with time zone and rendered in the current user's session locale/time-zone representation.
- **FR-144**: Admin table queries SHOULD support pagination and indexed filtering suitable for high-cardinality datasets.
- **FR-145**: Admin actions that trigger side effects (`send again`, moderation note submission, grant creation) MUST be audited in logs.

### Planned Web UI Surfaces *(documentation scope for the current feature wave)*

The following UI surfaces are important enough to be documented now at the behavior and routing level, even when some remain for later implementation:

- **Reusable components**: `AvatarIconButton`, `ResourceCard`, `NeedCard`, `Login`, `Register`, `ResetPassword`, and `ChangePassword`
- **Top-level pages**: `Search`, `Contribute`, `Resources`, `Bids`, `Needs`, `Claims`, `Chat`, `Notifications`, `Profile`, `Preferences`, `Contribution`, and `RestoreAccess`
- **Supporting pages**: edit-resource (handles both creation and modification of resources), edit-need (handles both creation and modification of needs), resource detail, need detail, account detail, campaign detail pages, and grant-claim page (`/grants/[id]`) that renders login when no active session exists
- **Admin pages**: `AdminAccounts`, `AdminBids`, `AdminResources`, `AdminNotifications`, `AdminMails`, `AdminCampaigns`, `AdminGrants`, and `AdminLogs`
- **Login-gated interactions**: bidding, claiming, chatting, and create flows should redirect to or open a contextual sign-in experience when the visitor is anonymous

### Notification Event Catalog *(current documented messages and destinations)*

| Description | Default user-facing message | Destination |
| ----------- | --------------------------- | ----------- |
| A claim has been sent about one of the account owner’s needs | `You got a claim for your need <need name>` | `Claims` page |
| A bid has been received on one of the account owner’s resources | `You got a bid for your resource <resource name>` | `Bids` page |
| A bid you received is about to expire (2 hours before resource expiration) | `A bid you received is about to expire` | `Bids` page |
| A campaign for which the account has at least one need linked (approved or not) or one resource linked (approved or not) is within 48 hours of airdrop time | `The airdrop of campaign <campaign name> is coming soon !` | public campaign page |
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
| Airdrop of a campaign received | `+<campaign’s configured airdrop amount>` | once per account and per campaign at airdrop time, only when the account has at least two approved linked items across needs/resources in that campaign |
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
- **Grant**: Administrator-created token seeding rule with optional targeting and gating criteria, including target accounts/emails, max claim count, expiration datetime, and optional linked campaign condition.
- **GrantClaim**: Immutable claim record connecting grant id, account id, claim timestamp, and resulting status used for idempotency and audit.
- **OperationalLogEntry**: Unified cross-component log record storing severity, component, contextual correlation identifiers, optional account linkage, and message payload for diagnostics.
- **AccountProfileLink**: A typed profile link owned by an account, storing a URL, a caption, and a type among `facebook`, `instagram`, `x`, or `website`.
- **ResourceMediaAsset**: Uploaded or referenced media metadata for the resource listing.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A reviewer can identify a clear end-to-end resource flow covering discovery, publishing, and response handling from the spec.
- **SC-002**: The feature is decomposed into slices that are implementation-ready and consistent with the migration foundation.
- **SC-003**: The resource flow clearly complements, rather than conflates, the already-documented need/claim flow.