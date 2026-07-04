# Feature Specification: Mutuity Mobile Rewrite

**Feature Branch**: `014-mutuity-mobile-rewrite`  
**Created**: 2026-07-03  
**Status**: Draft  
**Input**: User description: "Rewrite the Tope-là mobile app into Mutuity, preserving all existing mobile functionality and adding the new Mutuity campaign and needs features."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Daily Mobile Use Parity (Priority: P1)

As a returning mobile user, I can keep using the app for the everyday actions I already rely on, so the rewrite does not break my current habits.

**Why this priority**: The rewrite only succeeds if the existing mobile experience remains trustworthy for current users.

**Independent Test**: A tester can sign in on mobile and complete the core existing flows without needing the new campaign or needs features.

**Acceptance Scenarios**:

1. **Given** an existing mobile user, **When** they browse and search available resources, **Then** they can find items by category and location as they do today.
2. **Given** an existing mobile user, **When** they view bids, chat, notifications, token balance, and profile settings, **Then** those sections are still available and function as expected.
3. **Given** an existing mobile user, **When** they create, edit, or delete a resource, **Then** the resource lifecycle still works end to end.

**Examples**:

| Condition | Example | Expected Outcome |
|---|---|---|
| Returning user opens the app | User signs in and lands on the main navigation | The same familiar mobile sections are available |
| User searches resources | User filters by category and distance | Matching resources are shown |
| User manages their own resource | User edits title, price, or images | The update is saved and visible |

---

### User Story 2 - Needs Workflow (Priority: P2)

As a mobile user, I can create, update, search, and claim needs so that I can express what I need and respond to what others need.

**Why this priority**: Needs are the major new capability in Mutuity and the main reason the mobile rewrite exists.

**Independent Test**: A tester can create a need, search for it, update it, and claim it from mobile without using campaign features.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they create a need, **Then** the need is saved and appears in their mobile views.
2. **Given** a signed-in user, **When** they search needs, **Then** they can find needs by relevance and available filters.
3. **Given** a signed-in user, **When** they claim a need, **Then** the claim is recorded and the need reflects its claimed state.

**Examples**:

| Condition | Example | Expected Outcome |
|---|---|---|
| User creates a new need | A user posts a need for a bicycle pump | The need becomes visible in their account and search results |
| User edits a need | The user updates the description or timing | The updated details are shown consistently |
| User claims a need | A user commits to help fulfill a need | The need shows as claimed and can no longer be claimed by others |

---

### User Story 3 - Campaign Participation and Moderation (Priority: P3)

As a campaign creator or participant, I can create campaigns and manage what enters them, so campaign activity stays organized and trustworthy.

**Why this priority**: Campaigns are a key Mutuity addition, and campaign trust depends on moderation before participation becomes visible.

**Independent Test**: A tester can create a campaign, confirm it waits for admin validation, and verify that approved campaign owners can moderate campaign resources and needs.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they create a campaign, **Then** the campaign is submitted for admin validation before it becomes active.
2. **Given** an approved campaign, **When** the campaign creator moderates resources or needs, **Then** only approved items enter the campaign.
3. **Given** a campaign waiting for validation, **When** a mobile user views it, **Then** they can see that its status is pending rather than active.

**Examples**:

| Condition | Example | Expected Outcome |
|---|---|---|
| User submits a campaign | A community organizer creates a new campaign | The campaign enters a pending validation state |
| Admin validates a campaign | Tope-là admin approves the submission | The campaign becomes active and visible |
| Creator moderates campaign content | Creator accepts a resource into the campaign | The approved item is associated with the campaign |

---

### User Story 4 - Mobile Trust, Continuity, and Operational Safeguards (Priority: P4)

As a mobile user, I can continue using the app in French or English with reliable session, notification, support, and update behavior, so the rewrite feels familiar and dependable beyond the visible screens.

**Why this priority**: The rewrite must preserve the operational behaviors that make the existing mobile app trustworthy in day-to-day use, not only its visible screens.

**Independent Test**: A tester can relaunch the app into an existing session, receive activity, follow a notification into the right place, switch language, and hit the support/update safeguards without broken continuity.

**Acceptance Scenarios**:

1. **Given** a user prefers French or English, **When** they use the app, **Then** the interface is localized accordingly.
2. **Given** a user previously signed in with a still-valid session, **When** they relaunch the app, **Then** the session is restored without unnecessary reauthentication, and an invalid session is cleared safely.
3. **Given** a user receives activity, **When** they open notifications or tap a notification entry point, **Then** unread/read state and destination routing remain coherent.
4. **Given** a user needs help or runs an outdated build, **When** they open support or the app detects the build is unsupported, **Then** the app provides diagnostics-backed support or clear update guidance instead of failing silently.

**Examples**:

| Condition | Example | Expected Outcome |
|---|---|---|
| User changes language | User switches from French to English | The interface updates to the chosen language |
| User relaunches after prior login | User opens the app the next day | The app restores the session or safely logs out if the token is no longer valid |
| User checks activity | User opens unread notifications or taps a notification | New items are visible, distinguishable, and route to the right destination |
| User reports an issue | User opens support after a problem | The report includes enough diagnostics to investigate the issue |
| User is on an unsupported build | Server marks the minimum version above the installed version | The app blocks normal flow and directs the user to update |

## Edge Cases

- Existing mobile users should not lose access to current resource, bid, chat, token, notification, or profile flows during the rewrite.
- A campaign that is not yet validated must remain visibly pending and must not behave like an active campaign.
- A need or campaign item that is already claimed, moderated, or rejected must show its current status clearly to avoid duplicate actions.
- If a user loses connectivity while saving a need, campaign, or profile change, the app should not imply the action succeeded until it is confirmed.
- If a user uses the app in the non-default language, all critical actions and statuses must remain understandable in that language.
- If push permission is denied or unavailable, the app should continue functioning without blocking normal signed-in use.
- If a stored session token is expired or invalid, the app must clear it and return to a safe signed-out state instead of looping indefinitely.
- If client logging or diagnostics submission fails, the app must not crash or block the primary user flow.
- If the backend marks the installed build as unsupported, the app must stop the normal flow and show update guidance.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The mobile app MUST preserve the existing core mobile functionality available in Tope-là 1.0, including resource discovery, resource management, bidding, chat, notifications, tokens, and profile flows.
- **FR-002**: The mobile app MUST allow users to create needs from mobile.
- **FR-003**: The mobile app MUST allow users to update needs from mobile.
- **FR-004**: The mobile app MUST allow users to search needs from mobile.
- **FR-005**: The mobile app MUST allow users to claim needs from mobile.
- **FR-006**: The mobile app MUST allow users to create campaigns from mobile.
- **FR-007**: The mobile app MUST show newly created campaigns in a pending validation state until a Tope-là admin approves them.
- **FR-008**: The mobile app MUST allow campaign creators to moderate which resources and needs are included in their campaigns after validation.
- **FR-009**: The mobile app MUST prevent unvalidated campaigns from being treated as active campaigns.
- **FR-010**: The mobile app MUST present all user-facing text in French and English.
- **FR-011**: The mobile app MUST keep account, notification, and profile actions understandable and consistent during the rewrite.
- **FR-012**: The mobile rewrite MUST execute per main screen in this order: UI rework and approval first, then screen porting from Tope-la mobile.
- **FR-013**: Screen porting for a main screen MUST NOT start before that screen has an approved UI contract.
- **FR-014**: The canonical main screens for migration planning are Search resources, Search needs, My resources, My needs, My bids, My claims, Chat, Notifications, My campaigns, My profile, My preferences, and My economics.
- **FR-015**: UI contract approval for each main screen MUST include navigation placement, empty state, loading state, error state, core actions, and French and English labels.
- **FR-016**: The mobile app MUST restore a previously valid authenticated session on launch and MUST clear expired or invalid sessions safely.
- **FR-017**: The mobile app MUST register and synchronize mobile push notification tokens when available and MUST support notification-driven routing into the relevant mobile destination.
- **FR-018**: The mobile app MUST preserve notification continuity, including unread/read state and account/activity refresh behavior.
- **FR-019**: The mobile app MUST capture client-side failures and important API failures with correlated diagnostic context suitable for support and monitoring.
- **FR-020**: The mobile app MUST expose a support/report-issue flow that includes app and session diagnostics needed to investigate user-reported issues.
- **FR-021**: The mobile app MUST block unsupported client versions and provide a clear update path.
- **FR-022**: The mobile app MUST preserve notification preference controls for immediate versus summary-style delivery when those backend capabilities are available.

### Key Entities

- **Need**: A request for help, goods, or services that can be created, updated, searched, and claimed.
- **Campaign**: A structured program that groups resources and needs under a validated, moderated initiative.
- **Campaign Validation**: The approval state that determines whether a campaign is active or still pending review.
- **Campaign Membership**: The association between a campaign and the resources or needs it contains.
- **Mobile Session**: The authenticated user context that preserves continuity across resource, need, campaign, chat, and profile flows.
- **Operational Diagnostics Context**: The correlated app, account, device, and session metadata attached to logs or support reports.
- **Notification Preference**: The user's delivery preference for immediate or summary-style mobile notifications.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Current mobile users can complete their existing core workflows after the rewrite without losing access to any previously available major section.
- **SC-002**: At least 90% of test users can create, search, and claim a need on mobile without assistance.
- **SC-003**: Campaigns created on mobile remain visibly pending until admin validation, and approved campaigns become active without ambiguity.
- **SC-004**: Campaign creators can correctly moderate included resources and needs in routine test scenarios.
- **SC-005**: French and English users can complete the main mobile tasks with no untranslated critical labels or statuses.
- **SC-006**: 100% of canonical main screens have approved UI contracts before any corresponding porting task starts.
- **SC-007**: Returning users on supported builds can relaunch into a valid existing session in routine test scenarios without manual reauthentication.
- **SC-008**: Unsupported builds consistently show update guidance instead of proceeding into normal app flows.
- **SC-009**: Support issue reproduction runs always include enough diagnostic context to correlate the report with app version and session activity.

## Assumptions

- The current mobile app surface in Tope-là 1.0 is treated as the baseline that must continue working after the rewrite.
- Campaign validation by Tope-là admins is preserved as a trust gate before a campaign becomes active.
- The rewrite is mobile-first, but the product remains consistent with the broader Mutuity platform direction.
