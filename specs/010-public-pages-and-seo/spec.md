# Feature Specification: Public Need, Campaign, and Account Pages (SSR SEO + State + Contextual Actions)

**Feature Branch**: `010-public-pages-and-seo`  
**Created**: 2026-05-12  
**Status**: Draft  
**Input**: Product clarification after Tope-la benchmark analysis: Mutuity is multi-campaign by design, deleted public items must remain displayable with explicit visual flag, rich HTML must always be sanitized before rendering, and account public pages must not expose a direct chat CTA.

## Context

Current detail routes for need and account are placeholders, and a public campaign detail route does not yet exist. This feature defines complete public detail surfaces for:

1. Need detail page (`/needs/[needId]`)
2. Campaign detail page (`/campaigns/[campaignId]`)
3. Account public profile page (`/accounts/[accountId]`)

Mutuity is **multi-campaign by design**. Public campaign pages and metadata must always be resolved by route campaign id, never by a global "active campaign" singleton assumption.

Account deletion workflow and anonymization policy are specified separately in feature `011-account-deletion-anonymization`. This feature consumes resulting visibility states (`VISIBLE_DELETED`) but does not define profile deletion mechanics.

## Product Decisions Incorporated

- Multi-campaign is first-class and mandatory for all data and metadata resolution.
- Deleted public entities (need/resource/campaign/account where policy allows) remain readable with an explicit deletion state flag.
- Rich HTML rendering is allowed for selected fields but must be sanitized with a strict allowlist before display.
- Public account pages must not include a direct chat/contact CTA; conversations remain listing-contextual (need/resource only).
- Profile-level deletion UX and anonymization rules are delegated to feature `011-account-deletion-anonymization`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visitor Opens a Public Need Page (Priority: P1)

As a visitor, I can open a public need page and understand the need, its owner, and its current lifecycle state.

**Why this priority**: Need pages are a core discovery and conversion surface.

**Independent Test**: Open a known need URL as guest and signed-in account; verify full rendering, state indication, SSR metadata, and contextual action behavior.

**Acceptance Scenarios**:

1. **Given** a visible active need, **When** a visitor opens `/needs/[needId]`, **Then** the page renders polished content with title, description, listing identity, owner context, and lifecycle chip/banner.
2. **Given** the need is visible but deleted, **When** the page is opened, **Then** existing public data remains readable and a clear deleted visual flag is shown.
3. **Given** the visitor is authenticated and action is permitted, **When** they click the primary CTA, **Then** the app opens the existing conversation if one exists, or opens the chat UI in draft mode (conversation is not persisted until a first message is sent).
4. **Given** the visitor is not authenticated, **When** they click the primary CTA, **Then** the app redirects to auth with `next` pointing back to the same need URL.
5. **Given** crawlers request the page, **When** HTML is served, **Then** metadata tags are present and derived from safe plain-text content.

---

### User Story 2 - Visitor Opens a Public Campaign Page (Priority: P1)

As a visitor, I can open a campaign page and understand campaign narrative, schedule, current state, and contextual actions.

**Why this priority**: Campaign detail route is missing and campaign description metadata must be consumed on SSR output.

**Independent Test**: Open multiple campaign ids (approved, ended, deleted-visible) and verify per-id content, state, and metadata correctness.

**Acceptance Scenarios**:

1. **Given** a visible campaign, **When** a visitor opens `/campaigns/[campaignId]`, **Then** page content is fetched by this campaign id and renders title, theme content, plain description summary, schedule timeline, and owner context.
2. **Given** the campaign has `description` (mandatory field), **When** metadata is generated, **Then** `description` is used as the sole source for `meta description` and Open Graph description.
3. **Given** the campaign is visible but deleted, **When** page is opened, **Then** previously public campaign data remains readable with explicit deleted visual flag and non-permitted actions disabled/hidden.
4. **Given** the campaign is hidden/non-public by policy, **When** page is requested, **Then** server returns policy-consistent not-found/unavailable outcome without leaking restricted fields.

---

### User Story 3 - Visitor Opens a Public Account Page (Priority: P1)

As a visitor, I can open a public account page and understand account identity and public activity.

**Why this priority**: Account pages are trust anchors for listings, but conversations are listing-contextual.

**Independent Test**: Open account pages across visible, deleted-visible, and restricted outcomes; verify SSR metadata and absence of account-level chat CTA.

**Acceptance Scenarios**:

1. **Given** a visible account, **When** visitor opens `/accounts/[accountId]`, **Then** page shows profile identity and policy-safe public listing references.
2. **Given** the account is visible but deleted, **When** page is opened, **Then** page shows explicit deleted visual flag while preserving allowed public data.
3. **Given** account is restricted/non-public, **When** page is opened, **Then** page returns policy-consistent unavailable/not-found behavior with no private data leakage.
4. **Given** account page is rendered, **When** action zone is displayed, **Then** no direct chat/contact CTA is present on account page.
5. **Given** crawlers request account page, **When** HTML is served, **Then** title and description metadata are generated server-side from safe public fields only.

## UX Scope

Public detail pages must be production-grade, not placeholders. Each page must include:

- Strong visual header with listing image or avatar fallback.
- Structured content sections (overview, owner context, state/timeline, details).
- Explicit lifecycle presentation (active/upcoming/ended/deleted/unavailable).
- Mobile and desktop quality parity.
- Accessibility baseline (semantic headings, clear labels, contrast).

## Publication and Visibility Rules

- Public pages must expose only fields that are explicitly approved by the visibility rules below.
- Hidden entities must not leak restricted fields in SSR HTML, JSON payloads, metadata tags, or structured data.
- Data retention durations, backup windows, and purge mechanics are defined in feature `011-account-deletion-anonymization`; this feature only defines what may be shown on public pages at render time.
- Visibility outcomes are standardized per entity:
  - `VISIBLE_ACTIVE`
  - `VISIBLE_ENDED`
  - `VISIBLE_DELETED`
  - `VISIBLE_UNAVAILABLE_CONTEXTUAL` (optional policy-specific minimal shell)
  - `NOT_FOUND_OR_HIDDEN`
- Team must choose one consistent hidden-entity response strategy (`404` or controlled unavailable page) and apply it uniformly.

### Visibility Policy per Entity Type

This section defines the authoritative rules for which data fields may be surfaced for each visibility outcome. It is a required part of this specification and MUST be completed before implementation begins.

> **TODO (spec activity):** Fill in the table below. For each entity type and visibility state, list (a) which fields are publicly readable, (b) which fields must be omitted or anonymized, and (c) which actions are permitted. An initial draft is provided; the product owner must validate and sign off.

#### Need

| State | Visible fields | Restricted fields | Permitted actions |
|---|---|---|---|
| `VISIBLE_ACTIVE` | title, description, listing identity, owner public profile ref, lifecycle dates | private contact details | View, start conversation (if authenticated) |
| `VISIBLE_ENDED` | title, description, listing identity, owner public profile ref, lifecycle dates | private contact details | View only |
| `VISIBLE_DELETED` | title, description (as of deletion), listing identity, deletion flag | owner identity (anonymized per feature 011 rules) | View only |
| `NOT_FOUND_OR_HIDDEN` | none | all | none |

#### Campaign

| State | Visible fields | Restricted fields | Permitted actions |
|---|---|---|---|
| `VISIBLE_ACTIVE` | title, description, theme content (sanitized), schedule, owner public profile ref | internal moderation notes | View |
| `VISIBLE_ENDED` | title, description, theme content (sanitized), schedule, owner public profile ref | internal moderation notes | View only |
| `VISIBLE_DELETED` | title, description (as of deletion), deletion flag | owner identity (per feature 011), moderation notes | View only |
| `NOT_FOUND_OR_HIDDEN` | none | all | none |

#### Account

| State | Visible fields | Restricted fields | Permitted actions |
|---|---|---|---|
| `VISIBLE_ACTIVE` | display name, avatar, public listing references | email, private contact details | View |
| `VISIBLE_DELETED` | anonymized placeholder (per feature 011) | all identity fields | View tombstone only |
| `NOT_FOUND_OR_HIDDEN` | none | all | none |

## Contextual Actions Contract

- Need detail pages may expose a primary conversation CTA if business rules allow. Campaign and account pages do NOT include a conversation CTA — conversations are between two accounts and are always contextual to a specific need or resource.
- Authenticated behavior: if an existing conversation exists for the context, open it; otherwise open the chat UI in draft mode (conversation is not persisted until the first message is sent), then route to thread.
- Guest behavior: redirect to auth route with stable `next` back to the originating detail page.
- Disabled behavior: when state disallows interaction, hide/disable CTA and show explicit reason.

## SEO and Metadata Requirements

- Metadata must be generated server-side per route id.
- At minimum include: `title`, `description`, `og:title`, `og:description`, canonical URL.
- Metadata fields must be plain text only.
- Campaign metadata: `campaign.description` is the sole source (it is a mandatory field). No fallback to theme or template is needed.
- Need/account metadata follows plain-text fallback chains (their description fields are optional).
- Metadata generation must not issue redundant fetches beyond primary detail query.

## Content Safety Rules

- Any rich HTML displayed on public pages must pass through the shared sanitization layer before rendering.
- Sanitizer policy must be allowlist-based for tags and attributes.
- Raw `dangerouslySetInnerHTML` without prior sanitization is forbidden on public pages.

## Edge Cases

- Missing images must fall back to avatar/initials without broken image UI.
- Deleted-visible entities must show deletion flag and disable non-applicable actions.
- Ended/expired entities remain readable when policy allows but must be clearly non-actionable where required.
- Invalid ids and malformed routes must resolve to consistent not-found behavior.
- Deep links from notifications/shares must land on state-aware UI.
- Multi-campaign checks: campaign page/metadata for id A must never render data from campaign id B.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Implement production public need detail at `frontend/src/pages/needs/[needId].tsx` replacing placeholder behavior.
- **FR-002**: Implement production public campaign detail at `frontend/src/pages/campaigns/[campaignId].tsx`.
- **FR-003**: Implement production public account detail at `frontend/src/pages/accounts/[accountId].tsx` replacing placeholder behavior.
- **FR-004**: All three pages MUST load initial entity payload server-side for first HTML render.
- **FR-005**: Metadata MUST be generated server-side per entity id and not from global singleton campaign assumptions.
- **FR-006**: Campaign metadata description MUST use `campaign.description` as its sole source. Since `description` is a mandatory plain-text field, no fallback to theme or template is needed.
- **FR-007**: Need/campaign/account pages MUST show explicit lifecycle-state UI including deleted-visible where policy allows.
- **FR-008**: Deleted-visible entities MUST continue to display policy-allowed data with a clear deleted visual flag.
- **FR-009**: Need detail pages MUST implement an auth-aware conversation CTA with guest redirect + return URL. Campaign and account pages MUST NOT include any conversation CTA.
- **FR-010**: Conversation CTA MUST reuse existing conversation if one exists; if none exists, the chat UI MUST open in draft mode and the conversation MUST NOT be persisted until the first message is sent.
- **FR-011**: Account public page MUST NOT include a direct chat/contact CTA.
- **FR-012**: Hidden/non-public entities MUST not leak restricted fields in HTML payload, metadata, or API response fragments consumed by the page.
- **FR-013**: Public rich content rendering MUST use shared sanitization utilities only.
- **FR-014**: New UI copy and state labels MUST be localized in EN and FR.
- **FR-015**: Public pages MUST pass responsive checks on mobile and desktop breakpoints.
- **FR-016**: Automated tests MUST cover SSR metadata, state rendering (including deleted-visible), and action contracts for guest/authenticated users.
- **FR-017**: This feature MUST consume deletion/anonymization outcomes from feature `011-account-deletion-anonymization` and MUST NOT introduce independent account-deletion behavior.

### Non-Functional Requirements

- **NFR-001**: Cache-miss SSR response time should remain within acceptable production limits.
- **NFR-002**: Metadata generation must avoid duplicate fetch round-trips.
- **NFR-003**: Public routes must degrade safely on partial upstream failures.

## Key Entities *(include if feature involves data)*

- **PublicNeedPageModel**: Sanitized, policy-filtered need detail model used by SSR render and hydrated client.
- **PublicCampaignPageModel**: Sanitized, policy-filtered campaign model with metadata-ready plain description.
- **PublicAccountPageModel**: Sanitized, policy-filtered account profile model.
- **PageAvailabilityState**: Shared enum/model for active, ended, deleted-visible, unavailable, hidden/not-found outcomes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Need, campaign, and account detail routes render production public UI (no placeholders).
- **SC-002**: Metadata is entity-id-correct across multi-campaign datasets.
- **SC-003**: Deleted-visible entities display flag + readable content without leaking restricted fields.
- **SC-004**: Guest users can authenticate and return to originating need/campaign CTA context.
- **SC-005**: Authenticated users reach correct thread context in one action from need detail pages (via existing or draft conversation).
- **SC-006**: Account page exposes no direct chat/contact CTA.

## Dependencies

- Conversation creation/access rules from feature `006-chat-and-conversations`.
- Shared listing visual primitives from feature `009-listing-visual-identity`.
- Campaign `description` field persistence already delivered.
- Shared rich text sanitization component/utilities.
- Account deletion and anonymization lifecycle from feature `011-account-deletion-anonymization`.

## Out of Scope (for this spec)

- Public index/search redesign beyond detail pages.
- New non-contextual conversation model at account level.
- Reactions/comments/follow systems.
- Profile deletion UX and mutation implementation.
