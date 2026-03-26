# Feature Specification: Campaign And Need Management

**Feature Branch**: `001-campaign-needs`  
**Created**: 2026-03-24  
**Status**: Draft  
**Input**: User description: "Campaign creation, moderation, approval, need creation, and campaign need triage"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Account Creates Campaign (Priority: P1)

As any authenticated account, I can create a campaign with required scheduling and reward parameters so I can propose a contribution campaign for moderation.

**Why this priority**: This is the entry point for all campaign-related value and moderation workflow.

**Independent Test**: Create a campaign with valid values and verify it is stored as pending moderation and not publicly visible.

**Acceptance Scenarios**:

1. **Given** an authenticated account, **When** the user submits a campaign with valid required fields, **Then** the system creates the campaign in pending status.
2. **Given** an authenticated account, **When** the user sets rewards multiplier outside 5 to 10, **Then** the system rejects the submission with a validation error.
3. **Given** an authenticated account, **When** the user sets airdrop amount outside 3000 to 8000, **Then** the system rejects the submission with a validation error.
4. **Given** an authenticated account, **When** start datetime is not before end datetime or airdrop datetime is outside campaign time bounds, **Then** the system rejects the submission with a validation error.

---

### User Story 2 - Manager Moderates With Note (Priority: P1)

As the Mutuity manager, I can send a moderation note to the campaign creator so the creator knows what is missing before approval.

**Why this priority**: Moderation feedback is required to make approval actionable and transparent.

**Independent Test**: Manager submits a moderation note for a pending campaign and creator can view it in campaign moderation history.

**Acceptance Scenarios**:

1. **Given** a pending campaign, **When** the manager sends a moderation note, **Then** the note is attached to the campaign and visible to the campaign creator.
2. **Given** a pending campaign, **When** a non-manager tries to send a moderation note, **Then** the system denies the action.
3. **Given** a pending campaign with existing notes, **When** the manager sends a new note, **Then** previous notes remain accessible in chronological order.

---

### User Story 3 - Manager Approves Campaign (Priority: P1)

As the Mutuity manager, I can approve a campaign so it becomes visible on the platform public interface.

**Why this priority**: Approval is the publication gate that protects trust and public quality.

**Independent Test**: Manager approves a pending campaign and it appears in the public campaign listing.

**Acceptance Scenarios**:

1. **Given** a pending campaign, **When** the manager approves it, **Then** campaign status becomes approved and it becomes publicly viewable.
2. **Given** a pending campaign, **When** a non-manager attempts approval, **Then** the system denies the action.
3. **Given** a campaign already approved, **When** public users browse campaigns, **Then** they can view approved campaign summary fields.

---

### User Story 4 - Account Creates Need (Priority: P1)

As any authenticated account, I can create a need either attached to a campaign or standalone, with type and intensity classification.

**Why this priority**: Needs are core product data and can exist independently from campaigns.

**Independent Test**: Create one standalone need and one campaign-linked need with valid classification values.

**Acceptance Scenarios**:

1. **Given** an authenticated account, **When** the user creates a need without campaign reference, **Then** the system stores it as a standalone need.
2. **Given** an authenticated account and an existing campaign, **When** the user creates a need linked to that campaign, **Then** the system stores it as a standalone need **And** the system stores the need's association to the campaign in a 'pending approval' state.
3. **Given** an authenticated account, **When** the user sets intensity outside leg up, sharing, commitment, rare contribution, **Then** the system rejects the submission with a validation error.

---

### User Story 5 - Campaign Creator Accepts Or Rejects Joined Needs (Priority: P2)

As a campaign creator, I can accept or reject needs joined to my campaign so campaign scope is curated intentionally.

**Why this priority**: This controls campaign relevance after needs are submitted.

**Independent Test**: Campaign creator accepts one joined need and rejects another; statuses update and are auditable.

**Acceptance Scenarios**:

1. **Given** a need joined to a campaign, **When** the campaign creator accepts it, **Then** need-campaign relation status becomes accepted.
2. **Given** a need joined to a campaign, **When** the campaign creator rejects it, **Then** need-campaign relation status becomes rejected.
3. **Given** a need joined to a campaign, **When** a user who is not the campaign creator attempts accept or reject, **Then** the system denies the action.

### Edge Cases

- Campaign submission where start datetime equals end datetime.
- Campaign submission where airdrop datetime is earlier than start datetime.
- Campaign submission where airdrop datetime is later than end datetime.
- Need creation linked to a campaign that is deleted or not accessible.
- Duplicate moderation notes submitted quickly by manager due to retries.
- Campaign creator attempts to triage need that is not joined to that creator campaign.
- Need linked to an unapproved campaign and visibility behavior on public interfaces.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow any authenticated account to create a campaign.
- **FR-002**: Campaign creation MUST require theme, rewards multiplier, start datetime, airdrop datetime, airdrop amount, end datetime, and title.
- **FR-003**: Campaign creation MUST allow an optional textual note for Mutuity manager.
- **FR-004**: Rewards multiplier MUST be validated as an integer from 5 to 10 inclusive.
- **FR-005**: Airdrop amount MUST be validated as an integer from 3000 to 8000 inclusive.
- **FR-006**: Campaign datetime validation MUST enforce start datetime earlier than end datetime.
- **FR-007**: Campaign datetime validation MUST enforce airdrop datetime between start and end datetimes inclusive.
- **FR-008**: Newly created campaigns MUST default to pending moderation status.
- **FR-009**: Pending campaigns MUST NOT be visible on public campaign interfaces.
- **FR-010**: System MUST allow only Mutuity manager role to approve a campaign.
- **FR-011**: Approval MUST transition campaign status to approved.
- **FR-012**: Approved campaigns MUST become visible on public campaign interfaces.
- **FR-013**: System MUST allow only Mutuity manager role to send moderation notes on campaigns.
- **FR-014**: Moderation notes MUST be visible to the campaign creator.
- **FR-015**: System MUST persist moderation notes as a history attached to the campaign.
- **FR-016**: System MUST allow any authenticated account to create a need.
- **FR-017**: Need creation MUST require title, nature, intensity and location.
- **FR-018**: Need creation MUST support optional association to a campaign.
- **FR-019**: Need nature has one or more of these flags set: object required, competence required, tooling required, multiple people required.
- **FR-020**: Need intensity MUST be one of: leg up, sharing, commitment, rare contribution.
- **FR-021**: System MUST allow campaign creator to accept or reject needs joined to that creator campaign.
- **FR-022**: System MUST deny accept or reject actions by non-creator accounts.
- **FR-023**: Need-campaign relation status MUST support at least pending, accepted, and rejected states.
- **FR-024**: System MUST keep an audit trail of campaign status transitions and joined-need triage actions.

### Key Entities *(include if feature involves data)*

- **Campaign**: User-created campaign with title, theme, rewards multiplier, start datetime, airdrop datetime, airdrop amount, end datetime, optional manager note from creator, creator account id, and moderation status.
- **CampaignModerationNote**: Manager-authored note attached to a campaign, with campaign id, manager account id, note body, and created datetime.
- **Need**: User-created need with title, description, nature, intensity, location, creator account id, 'is active' flag, optional expiration datetime, optional number of people required, optional required tooling, optional required competence, and optional campaign association.
- **CampaignNeedTriage**: Relation state for a need joined to a campaign, with campaign id, need id, triage status, actor account id, and action datetime.
- **AccountRole**: Role classification for permissions, including Mutuity manager and standard account.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95 percent of valid campaign submissions are created successfully on first attempt during acceptance testing.
- **SC-002**: 100 percent of out-of-range rewards multiplier and airdrop amount submissions are blocked with explicit validation messages.
- **SC-003**: 100 percent of non-manager attempts to approve campaigns or send moderation notes are denied.
- **SC-004**: 100 percent of approved campaigns become visible on the public interface within one minute of approval.
- **SC-005**: 100 percent of non-owner attempts to accept or reject joined needs are denied.
- **SC-006**: 100 percent of moderation notes and need triage actions are present in audit history during verification.
