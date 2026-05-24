# Feature Specification: Campaign And Need Management

**Feature Branch**: `001-campaign-needs`  
**Created**: 2026-03-24  
**Status**: Draft  
**Input**: User description: "Campaign creation, moderation, approval, need creation, and campaign need triage"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Authenticated Account Creates Campaign (Priority: P1)

As any authenticated account, I can create a campaign with required scheduling and reward parameters so I can propose a contribution campaign for moderation.

**Why this priority**: This is the entry point for all campaign-related value and moderation workflow.

**Independent Test**: Create a campaign with valid values and verify it is stored as pending moderation and not publicly visible. Also verify that unauthenticated requests return a generic error message.

**Acceptance Scenarios**:

1. **Given** an authenticated account, **When** the user submits a campaign with valid required fields, **Then** the system creates the campaign in pending status.
2. **Given** an authenticated account, **When** the user sets rewards multiplier outside 5 to 10, **Then** the system rejects the submission with a validation error.
3. **Given** an authenticated account, **When** the user sets airdrop amount outside 3000 to 8000, **Then** the system rejects the submission with a validation error.
4. **Given** an authenticated account, **When** start datetime is not before end datetime or airdrop datetime is outside campaign time bounds, **Then** the system rejects the submission with a validation error.
5. **Given** an unauthenticated user, **When** the user attempts to create a campaign, **Then** the system returns an authentication error with a user-friendly message (e.g., "You must sign in to continue") and does not reveal technical database or schema details.

---

### User Story 2 - Administrator Moderates With Note (Priority: P1)

As the Mutuity administrator, I can send a moderation note to the campaign creator so the creator knows what is missing before approval.

**Why this priority**: Moderation feedback is required to make approval actionable and transparent.

**Independent Test**: Administrator submits a moderation note for a pending campaign, the campaign moves to awaiting-adaptation, the creator receives a notification, and the creator can view the resulting event in campaign moderation history.

**Acceptance Scenarios**:

1. **Given** a pending campaign, **When** the administrator sends a moderation note, **Then** the note is attached to the campaign, visible to the campaign creator, and the campaign status becomes awaiting adaptation.
2. **Given** a pending campaign, **When** a non-admin account tries to send a moderation note, **Then** the system denies the action.
3. **Given** a pending or awaiting-adaptation campaign with existing moderation history, **When** the administrator sends a new note, **Then** previous moderation events remain accessible in most-recent-first order.
4. **Given** an administrator sends a moderation note, **When** the campaign creator opens the resulting notification from the notifications page, **Then** the system marks the notification as read, navigates to the campaign moderation page, and opens the relevant campaign moderation context.

---

### User Story 3 - Campaign Creator Reviews Moderation And Adapts Campaign (Priority: P1)

As a campaign creator, I can review the full moderation timeline of my campaign and edit the campaign while moderation is still open so I can answer administrator feedback and resubmit a valid campaign.

**Why this priority**: Moderation is only actionable if the creator can see the whole exchange, understand the latest requested changes, and safely revise the campaign without breaking validation rules.

**Independent Test**: Creator opens a campaign moderation page, sees creation plus later moderation events in most-recent-first order, edits a pending or awaiting-adaptation campaign through the campaign editor, and the system records the creator modification as a new moderation event and notifies administrators when the prior status was awaiting adaptation.

**Acceptance Scenarios**:

1. **Given** a campaign created by the signed-in account, **When** the creator opens the moderation page, **Then** the page shows moderation events in most-recent-first order.
2. **Given** a campaign moderation page, **When** events are shown, **Then** the event list includes at least the initial campaign creation event, administrator moderation-note events, and creator modification events.
3. **Given** a campaign in pending or awaiting-adaptation status, **When** the creator views the moderation page, **Then** an `Edit campaign` action is enabled.
4. **Given** a campaign in approved status, **When** the creator views the moderation page, **Then** the moderation history remains viewable but the `Edit campaign` action is disabled.
5. **Given** the creator edits a campaign from the moderation page, **When** the update is submitted, **Then** the system applies the same validation contract used for campaign creation and rejects invalid date combinations or other invalid values.
6. **Given** moderation has lasted long enough that the prior schedule no longer satisfies the current campaign-validation rules, **When** the creator edits the campaign, **Then** the creator must update the schedule so the saved values satisfy the same active validation rules as a newly created campaign at edit time.
7. **Given** a campaign currently in awaiting-adaptation status, **When** the creator saves a valid modification, **Then** the system appends a creator-modified moderation event and emits an in-app notification to administrators.

---

### User Story 4 - Administrator Approves Campaign (Priority: P1)

As the Mutuity administrator, I can approve a campaign so it becomes visible on the platform public interface.

**Why this priority**: Approval is the publication gate that protects trust and public quality.

**Independent Test**: Administrator approves a pending or awaiting-adaptation campaign, the creator receives a notification with a deep link to the moderation page, and the campaign appears in the public campaign listing.

**Acceptance Scenarios**:

1. **Given** a pending or awaiting-adaptation campaign, **When** the administrator approves it, **Then** campaign status becomes approved and it becomes publicly viewable.
2. **Given** a pending or awaiting-adaptation campaign, **When** a non-admin account attempts approval, **Then** the system denies the action.
3. **Given** the administrator approves a campaign, **When** the creator opens the resulting notification from the notifications page, **Then** the system marks the notification as read, navigates to the campaign moderation page, and opens the relevant campaign moderation context.
4. **Given** a campaign already approved, **When** public users browse campaigns, **Then** they can view approved campaign summary fields.
5. **Given** a campaign already approved, **When** the creator later opens the moderation page, **Then** the moderation history is still viewable but no new moderation events are appended and campaign editing remains unavailable.

---

### User Story 5 - Authenticated Account Creates Need (Priority: P1)

As any authenticated account, I can create a need either attached to a campaign or standalone, with type and intensity classification and optionally a proposed Topes amount.

**Why this priority**: Needs are core product data and can exist independently from campaigns.

**Independent Test**: Create one standalone need and one campaign-linked need with valid classification values and a Topes amount consistent with the selected intensity range. Also verify that unauthenticated requests return a generic error message.

**Acceptance Scenarios**:

1. **Given** an authenticated account, **When** the user creates a need without campaign reference, **Then** the system stores it as a standalone need.
2. **Given** an authenticated account and an existing campaign, **When** the user creates a need linked to that campaign, **Then** the system stores it as a standalone need **And** the system stores the need's association to the campaign in a 'pending approval' state.
3. **Given** an authenticated account, **When** the user sets intensity outside leg up, sharing, commitment, rare contribution, **Then** the system rejects the submission with a validation error.
4. **Given** an authenticated account, **When** the user sets a Topes amount outside the allowed range for the selected intensity, **Then** the system rejects the submission with a validation error.
5. **Given** an unauthenticated user, **When** the user attempts to create a need, **Then** the system returns an authentication error with a user-friendly message (e.g., "You must sign in to continue") and does not reveal technical database or schema details.

---

### User Story 6 - Campaign Creator Accepts Or Rejects Joined Needs (Priority: P2)

As a campaign creator, I can accept or reject needs joined to my campaign so campaign scope is curated intentionally.

**Why this priority**: This controls campaign relevance after needs are submitted.

**Independent Test**: Campaign creator accepts one joined need and rejects another; statuses update and are auditable.

**Acceptance Scenarios**:

1. **Given** a need joined to a campaign, **When** the campaign creator accepts it, **Then** need-campaign relation status becomes accepted.
2. **Given** a need joined to a campaign, **When** the campaign creator rejects it, **Then** need-campaign relation status becomes rejected.
3. **Given** a need joined to a campaign, **When** a user who is not the campaign creator attempts accept or reject, **Then** the system denies the action.

### User Story 7 - Campaign Creator Accepts Or Rejects Joined Resources (Priority: P2)

As a campaign creator, I can accept or reject resources joined to my campaign so campaign scope is curated intentionally.

**Why this priority**: Resource participation requires the same explicit campaign-owner triage safeguards as need participation.

**Independent Test**: Campaign creator accepts one joined resource and rejects another; statuses update and are auditable.

**Acceptance Scenarios**:

1. **Given** a resource joined to a campaign, **When** the campaign creator accepts it, **Then** resource-campaign relation status becomes accepted.
2. **Given** a resource joined to a campaign, **When** the campaign creator rejects it, **Then** resource-campaign relation status becomes rejected.
3. **Given** a resource joined to a campaign, **When** a user who is not the campaign creator attempts accept or reject, **Then** the system denies the action.

### Edge Cases

- Campaign submission where start datetime equals end datetime => the system should prevent campaign creation with a validation error
- Campaign submission where airdrop datetime is earlier than start datetime => the system should prevent campaign creation with a validation error
- Campaign submission where airdrop datetime is later than end datetime => the system should prevent campaign creation with a validation error
- Need creation linked to a campaign that is deleted or not accessible => the UI should not provide the option to link a need to such a campaign. Furthermore, the system should reject this linking operation with a 'unsuitable campaign' error
- Duplicate moderation notes submitted quickly by an administrator due to retries => the system accepts duplicate notes and stores them as separate entries
- Creator opens the moderation page for an approved campaign => the system shows the full existing moderation history in read-only form and never re-enables campaign editing.
- Administrator filters campaigns to find moderation work => the campaigns admin page supports filtering by at least `pending`, `awaiting adaptation`, and `approved`, with `awaiting adaptation` available explicitly to surface campaigns waiting on creator changes.
- Creator receives a moderation-related notification and opens it after the campaign is already approved => the system still routes to the campaign moderation page and opens the relevant campaign context, but the page remains read-only.
- Campaign creator attempts to triage need that is not joined to that creator campaign => The triage UI only shows needs that are joined to the currently looked at campaign. Furthermore, the 'accept' and 'reject' operations on needs joined to campaigns check the caller is the campaign's creator, and fails if not.
- Campaign creator attempts to triage resource that is not joined to that creator campaign => The triage UI only shows resources that are joined to the currently looked at campaign. Furthermore, the 'accept' and 'reject' operations on resources joined to campaigns check the caller is the campaign's creator, and fails if not.
- Need linked to an unapproved campaign and visibility behavior on public interfaces => Only approved and active (current time is within its lifetime) campaigns are shown in any UI allowing to join a need. Furthermore, the joining operation checks that the campaign is approved, and that the current time is within its lifetime, and fails if not.

## Requirements *(mandatory)*

### Security & Error Handling Requirements

- **SR-001**: All GraphQL mutations MUST enforce authentication via database Row Level Security policies. Unauthenticated requests MUST be rejected with code `UNAUTHENTICATED`.
- **SR-002**: GraphQL error messages returned to the client MUST NOT reveal technical database or schema details (e.g., "permission denied for schema app_private"). Instead, the system MUST return generic user-friendly messages (e.g., "You must sign in to continue" for authentication errors, "Something went wrong" for unexpected server errors).
- **SR-003**: The backend MUST log full technical error details (stack traces, original error messages) server-side for debugging and monitoring, while the client receives sanitized messages.
- **SR-004**: Validation errors (e.g., invalid multiplier range, datetime ordering) MAY be surfaced to the client as-is, as they reveal intent rather than system internals.

### Functional Requirements

- **FR-001**: System MUST allow any authenticated account to create a campaign. Unauthenticated requests MUST be rejected (see SR-001, SR-002).
- **FR-002**: Campaign creation MUST require theme, rewards multiplier, start datetime, airdrop datetime, airdrop amount, end datetime, and title.
- **FR-003**: Campaign creation MUST allow an optional textual note for Mutuity administrator.
- **FR-004**: Rewards multiplier MUST be validated as an integer from 5 to 10 inclusive.
- **FR-005**: Airdrop amount MUST be validated as an integer from 3000 to 8000 inclusive.
- **FR-006**: Campaign datetime validation MUST enforce start datetime earlier than end datetime.
- **FR-007**: Campaign datetime validation MUST enforce airdrop datetime between start and end datetimes inclusive.
- **FR-008**: Newly created campaigns MUST default to pending moderation status.
- **FR-009**: Pending campaigns MUST NOT be visible on public campaign interfaces.
- **FR-010**: System MUST allow only Mutuity administrator role to approve a campaign.
- **FR-011**: Approval MUST transition campaign status to approved.
- **FR-012**: Approved campaigns MUST become visible on public campaign interfaces.
- **FR-013**: System MUST allow only Mutuity administrator role to send moderation notes on campaigns.
- **FR-014**: Moderation notes MUST be visible to the campaign creator.
- **FR-015**: System MUST persist a creator-facing campaign moderation history ordered most recent first.
- **FR-016**: Campaign moderation history MUST include at least these event types: initial campaign creation, administrator moderation note received, and creator campaign modification.
- **FR-017**: Sending a moderation note MUST transition campaign moderation status from pending to awaiting adaptation.
- **FR-018**: Campaign moderation status MUST support at least pending, awaiting adaptation, and approved.
- **FR-019**: The campaign creator MUST be able to open a dedicated moderation page for the creator's own campaign.
- **FR-020**: The campaign moderation page MUST expose an `Edit campaign` action only when the campaign status is pending or awaiting adaptation.
- **FR-020a**: The `Edit campaign` action MUST reuse the same validation rules and form contract as campaign creation, including campaign date-order constraints and any current-time validity rules that apply at edit time.
- **FR-020b**: Once a campaign is approved, the moderation page MUST remain viewable but MUST stay read-only and MUST NOT append further moderation events.
- **FR-021**: When a creator modifies a campaign while it is in awaiting-adaptation status, the system MUST append a creator-modified moderation event.
- **FR-022**: When a creator modifies a campaign while it is in awaiting-adaptation status, the system MUST emit an in-app notification to administrator accounts.
- **FR-023**: When an administrator sends a moderation note or approves a campaign, the system MUST emit an in-app notification to the campaign creator.
- **FR-024**: Opening a creator moderation notification from the notifications page MUST mark it as read and navigate to the campaign moderation page with the corresponding campaign context already opened.
- **FR-025**: Opening an administrator notification for a creator adaptation from the notifications page MUST mark it as read and navigate to the admin campaigns page with the creator name prefilled in the search field and awaiting-adaptation preselected in the status filter.
- **FR-026**: The campaigns admin page MUST display the campaign moderation status as a dedicated column and MUST allow filtering by moderation status, including awaiting adaptation.
- **FR-027**: System MUST allow any authenticated account to create a need.
- **FR-028**: Need creation MUST require title, nature, intensity and location.
- **FR-029**: Need creation MUST support optional association to a campaign.
- **FR-030**: Need nature has one or more of these flags set: object required, competence required, tooling required, multiple people required.
- **FR-031**: Need intensity MUST be one of: leg up, sharing, commitment, rare contribution.
- **FR-031a**: When provided at need creation, Topes amount MUST follow the intensity range mapping: leg up (10 to 99), sharing (100 to 999), commitment (1000 to 4999), rare contribution (5000 or more).
- **FR-031b**: Public and user-facing copy MUST avoid fiat currency equivalence wording and instead describe Topes as meaningful social gratitude.
- **FR-032**: System MUST allow campaign creator to accept or reject needs joined to that creator campaign.
- **FR-033**: System MUST deny accept or reject actions by non-creator accounts.
- **FR-034**: Need-campaign relation status MUST support at least pending, accepted, and rejected states.
- **FR-035**: System MUST keep an audit trail of campaign status transitions and joined-need triage actions.
- **FR-036**: System MUST allow campaign creator to accept or reject resources joined to that creator campaign.
- **FR-037**: System MUST deny resource accept or reject actions by non-creator accounts.
- **FR-038**: Resource-campaign relation status MUST support at least pending, accepted, and rejected states.
- **FR-039**: System MUST keep an audit trail of joined-resource triage actions.

### Key Entities *(include if feature involves data)*

- **Campaign**: User-created campaign with title, theme, rewards multiplier, start datetime, airdrop datetime, airdrop amount, end datetime, optional administrator note from creator, creator account id, and moderation status (`pending`, `awaiting adaptation`, `approved`).
- **CampaignModerationNote**: Administrator-authored note attached to a campaign, with campaign id, admin account id, note body, and created datetime.
- **CampaignModerationEvent**: Creator-facing moderation timeline record or read-model item for a campaign, representing one of: initial creation, administrator note received, or creator modification; each event includes campaign id, event type, actor account id when applicable, human-readable body or change summary when applicable, and created datetime.
- **Need**: User-created need with title, description, nature, intensity, location, optional proposed Topes amount, creator account id, 'is active' flag, optional expiration datetime, optional number of people required, optional required tooling, optional required competence, and optional campaign association.

### Intensity To Topes Reference

| Appreciation Level | Typical Use Case | Reference (in Topes) |
| :--- | :--- | :--- |
| **The Quick Hand** | Lending a simple tool, sharing garden surplus, 5-min advice. | **10 to 50** |
| **The Sharing** | Lending valuable equipment, one hour of physical help. | **100 to 500** |
| **The Commitment** | Skill sharing, long-term vehicle loan, dedicated time. | **1,000 to 3,000** |
| **The Rare Resource** | Providing a workspace, rare expertise, valuable item. | **5,000 +** |

Safety Note: Avoid wording such as "100 Topes = EUR 1". Prefer wording such as "100 Topes represents a meaningful gesture of sharing." This preserves non-fiat social value framing.
- **CampaignNeedTriage**: Relation state for a need joined to a campaign, with campaign id, need id, triage status, actor account id, and action datetime.
- **CampaignResourceTriage**: Relation state for a resource joined to a campaign, with campaign id, resource id, triage status, actor account id, and action datetime.
- **AccountRole**: Role classification for permissions, including Mutuity administrator and standard account.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95 percent of valid campaign submissions are created successfully on first attempt during acceptance testing.
- **SC-002**: 100 percent of out-of-range rewards multiplier and airdrop amount submissions are blocked with explicit validation messages.
- **SC-003**: 100 percent of non-admin attempts to approve campaigns or send moderation notes are denied.
- **SC-004**: 100 percent of approved campaigns become visible on the public interface within one minute of approval.
- **SC-005**: 100 percent of non-owner attempts to accept or reject joined needs are denied.
- **SC-006**: 100 percent of moderation notes, creator adaptation events, need triage actions, and resource triage actions are present in history or audit verification during testing.
- **SC-007**: 100 percent of unauthenticated mutation attempts return sanitized user-facing messages and MUST NOT expose internal schema/database details.
- **SC-008**: 100 percent of backend-handled unexpected GraphQL errors are logged with full technical details server-side.
- **SC-009**: 100 percent of moderation-related notifications route to the intended destination state: creator notifications open the campaign moderation context, and administrator adaptation notifications prefill the admin campaigns search and awaiting-adaptation filter.
