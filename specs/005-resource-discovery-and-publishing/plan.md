# Implementation Plan: Resource Discovery And Publishing

**Branch**: `005-resource-discovery-and-publishing` | **Date**: 2026-04-05 | **Spec**: `/specs/005-resource-discovery-and-publishing/spec.md`
**Input**: Feature specification from `/specs/005-resource-discovery-and-publishing/spec.md`

## Summary

Implement the first concrete Tope-là-native slice in the unified platform: browsing active resources, publishing new offers, capturing the separate resource-response (`bid`) flow, and establishing the first unified notifications inbox foundation. The implementation should reuse the proven search/auth/conversation patterns from Mutuity where they fit, while respecting the fact that `resource` and `bid` are not identical to `need` and `claim`.

## Technical Context

**Language/Version**: TypeScript (strict mode), SQL/PL-pgSQL  
**Primary Dependencies**: Next.js, React, MUI, Apollo Client, Express, PostGraphile, PostgreSQL, Graphile Worker  
**Storage**: PostgreSQL 16  
**Testing**: Jest/Vitest frontend tests, backend integration and contract tests  
**Target Platform**: Web first, with mobile parity to follow from the same domain API  
**Project Type**: Monorepo feature slice building on the existing `frontend/`, `backend/`, and `database/` structure  
**Constraints**: Preserve Tope-là-style UX, keep `resource` and `bid` distinct from `need` and `claim`, and maintain the repository rule of no business SQL in TypeScript  
**Scale/Scope**: MVP resource discovery, publication, and response foundation

## Constitution Check

- Pass: PostgreSQL remains the source of truth for resource visibility, bid permissions, and lifecycle state.
- Pass: Sensitive rules stay in SQL functions/RLS rather than frontend-only checks.
- Pass: UX work is end-to-end: discovery, publish form, and response handling.
- Pass: Existing auth/session work from Feature 004 can be reused as the foundation.
- Pass: This slice intentionally complements Feature 002 rather than merging away the distinct resource domain too early.

## Delivery Slices

### Slice 1 — Public resource discovery (P1)
- Search active resources
- sort solely by geographical closeness, with most-recently-created as the deterministic tie-breaker
- respect expiration behavior: dated resources disappear once expired, undated resources remain permanent
- location/category/text filters
- six tri-state modality filters (`neutral` / `yes` / `no`)
- resource cards and detail surface

### Slice 2 — Resource publishing (P1)
- publish/edit form
- subtype-aware validation
- mandatory shared `intensity` field
- optional negotiated Topes reference amount with the same range mapping used for needs
- optional rich-text description (max 8000 chars) on the detail view
- optional image/media support

### Slice 3 — Resource responses (P2)
- bid creation
- reject bids on expired resources
- publisher review state
- conversation handoff and notification wiring

### Slice 4 — Notifications inbox foundation (P2)
- aggregate persisted claim and bid notifications into a unified authenticated inbox
- map supported event types to stable user-facing copy and destination routes
- support per-item read, open-to-read navigation, and `Set all as read` with confirmation
- enforce notification-retention cleanup rules in SQL-owned backend functions
- leave timed/system-generated emitters (`resource_bid_expiring_soon`, campaign airdrop milestones, welcome/profile reward, gifted Topes, and future grant notifications) as explicit follow-up work driven by background processing

### Slice 5 — Contribution and token movement rules (P2)
- represent token movements as auditable ledger events rather than inferred UI counters
- grant one-time rewards for profile-completion and resource-completion milestones only once per eligible entity lifetime
- apply paired debit/credit behavior for gifting, bid reservation/refund, and claim settlement flows
- support delayed milestone rewards such as `resource created 24 hours ago` and `claim created 24 hours ago` through scheduled/background processing
- connect campaign airdrop payout logic with per-account, per-campaign idempotency guarantees

### Slice 6 — Preferences and out-of-app delivery control (P1)
- implement an authenticated `Preferences` page to configure out-of-app event delivery by category
- support strategy choice per category: `realtime push` (mobile only) or `email summary`
- support email-summary frequencies `1`, `3`, `7`, `30` days with `1 day` default
- keep in-app alerts unaffected by preference edits
- gate out-of-app sends on account activity (no active web/mobile session)
- for `new resources added` and `new needs added`, reuse ranked account-targeting behavior based on proximity, campaign participation, and search-intent
- persist non-broadcasted summary-eligible events and process them via a daily 08:00 digest job
- emit at most one digest email per account per run with per-category sections and idempotent mark-as-broadcasted updates

### Slice 7 — Authentication parity with Tope-la (P1)
- support local email/password account creation with verification-before-trust flow
- support login/account creation through Google and Apple providers
- implement forgot-password request and reset-token completion flow
- implement authenticated change-password flow
- add safe identity-linking and duplicate-account prevention rules between local/social identities
- keep auth/security-sensitive rules SQL-owned where applicable and backend-owned for provider callbacks and token validation

## Web IA And Componentization Plan

### Shared navigation shell
- The initial web shell should use a single top bar with route shortcuts on the left and account access on the right.
- **Signed-in state**: `Search`, `Contribute`, `Resources`, `Bids`, `Needs`, `Claims`, `Chat`, `Notifications`, a visible token counter linking to `Contribution`, and an avatar menu exposing `Profile`, `Preferences`, `Contribution`, and `Log out`.
- **Signed-out state**: `Search` plus a compact sign-in trigger that opens the authentication UI as a dialog.
- The page map should stay stable even while some destinations remain behind placeholder or MVP-only implementations.

### Immediate reusable components

| Component | Responsibility | Near-term reuse |
|-----------|----------------|-----------------|
| `AvatarIconButton` | Show a round account avatar or account-name abbreviation and act as the account entry trigger | top bar, resource creator links, need creator links, account pages, chat |
| `ResourceCard` | Show resource summary content in wrapping browse lists with separate click affordances for creator, image, and main body | search results, account pages, campaign pages, resource management lists |
| `NeedCard` | Show need summary content in wrapping browse lists with separate click affordances for creator and main body | contribute page, account pages, campaign pages, need management lists |
| `Login` | Capture email/password sign-in with secondary actions for password reset and registration | dialog entry from top bar and contextual action gates |
| `Register` | Capture local sign-up plus Google and Apple providers | standalone auth page or dialog follow-up |
| `ResetPassword` | Confirm that a password-reset link has been sent for the entered email address | password-reset flow |
| `ChangePassword` | Let authenticated users update password with current-password confirmation | profile/preferences security section |

Implementation detail such as exact dimensions, MUI primitives, spacing, or prop signatures can be refined later; what is fixed now is the role each surface plays in the route and interaction model.

### Page and route inventory

#### Top-level pages
- **`Search`**: default landing page backed by resource discovery; clicking a `ResourceCard` opens the corresponding resource detail page.
- **`Contribute`**: needs discovery page; clicking a `NeedCard` opens the corresponding need detail page.
- **`Resources`**: authenticated list of resources created by the current account.
- **`Bids`**: authenticated workspace combining bids sent by the current account and bids received on the current account’s resources.
- **`Needs`**: authenticated list of needs created by the current account.
- **`Claims`**: authenticated workspace combining claims sent by the current account and claims received on the current account’s needs.
- **`Chat`**: authenticated list of ongoing conversations about resources and needs.
- **`Notifications`**: authenticated inbox for system events.
- **`Profile`**: authenticated account profile and edit surface, including avatar, bio, location, and a zero-or-more collection of typed profile links with captions.
- **`Preferences`**: authenticated notification and preference settings.
- **`Contribution`**: token-oriented guidance, balance, and transaction history.
- **`RestoreAccess`**: reset-token completion page for choosing a new password.

#### Supporting pages
- **Edit resource page**: create a new resource or edit an existing one, with optional campaign prefill for creation mode.
- **Create need page**: create a new need and optionally prefill a linked campaign.
- **Resource detail page**: show the full public resource, fullscreen image preview when relevant, chat entry, bid entry, and creator navigation.
- **Need detail page**: show the full public need, chat entry, claim entry, and creator navigation.
- **Account detail page**: show public account information plus active resources and needs.
- **Campaign detail page**: show campaign details, approved linked resources and needs, and create-resource/create-need shortcuts.

### Interaction boundaries to preserve
- Clicking a creator should navigate to the creator’s account details.
- Clicking a resource or need card body should navigate to its corresponding detail page.
- Anonymous users may browse public content, but chat, bid, claim, and create actions should open a contextual sign-in experience.
- Accepted bids and accepted claims should converge into a conversation-oriented follow-up flow rather than staying trapped inside list-only management screens.

### Notifications model and operational rules
- The first inbox implementation may aggregate multiple persisted notification sources (currently claim notifications and resource-bid notifications) into a single UI feed while keeping the underlying domain tables distinct.
- Each notification carries an event type, structured payload, `createdAt`, and `readAt`, and the inbox is responsible for mapping these into the approved user-facing message copy and destination route.
- Opening a notification should mark it as read before navigation; the inbox should also allow single-item checkbox reading and bulk `Set all as read` with a confirmation dialog.
- Retention behavior stays SQL-owned: notifications are eligible for deletion only once they are at least 7 days old and have been marked read for at least 24 hours.
- Timed/system-generated notifications such as bid-expiry warnings, automatic stale-bid expiry/cancellation notifications, and campaign-airdrop countdowns should run from Graphile Worker or another scheduled backend process rather than being inferred in the browser.
- Campaign-airdrop countdown notifications should use a broader reminder rule than payouts: the account should be notified when it has at least one linked campaign need or one linked campaign resource for that campaign, whether that link is approved or not.
- Preference-managed out-of-app delivery should remain distinct from in-app notifications: in-app remains immediate and visible in the inbox, while push/email depends on per-category strategy and activity gating.
- Digest execution should run once daily at 08:00 server time, choose eligible accounts/items by configured frequency, and build one email per account containing sections only for categories with pending items.
- Digest state transitions should be SQL-owned and idempotent so retries do not duplicate outbound mail content.

### Authentication model and operational rules
- Local signup should create an unverified account identity and trigger an email verification token delivery.
- Verification and reset tokens should be one-time-use, time-bounded, and validated server-side.
- Social-provider callback handling should support both first-time account creation and login to an existing linked identity.
- When social identity claims an email that matches an existing verified account, mapping should be explicit and safe to prevent account takeover and duplicate rows.
- Change-password should require the current password and should trigger appropriate session hardening behavior after update.

### Token movement model and operational rules
- Token changes should be captured in a proper ledger so the `Contribution` page can explain not just balance, but why each positive or negative movement occurred.
- One-time rewards for avatar upload, first bio, first address, first added profile link, first resource image, first default Topes amount, `resource age >= 24h`, and `claim age >= 24h` must be idempotent and guarded against duplicate issuance.
- Gifting, accepted bids, bid cancellation/refund, and settled claims should produce paired debit/credit effects that are traceable to the originating business event.
- Campaign airdrops must remain per-campaign configurable and pay each eligible account at most once per campaign.
- For the current rule set, an account is eligible for a campaign airdrop only when, at airdrop time, the same account owns at least two approved campaign-linked items for that campaign across these categories: creator-approved need(s) and creator-approved resource(s). This means `2 needs + 0 resources`, `0 needs + 2 resources`, `1 need + 1 resource`, or any larger combination is eligible.
- Because several of these rules are time-based, Graphile Worker or equivalent scheduled processing is part of the intended implementation shape.

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Resource subtypes have divergent field rules | Validation/UI confusion | Model subtype-specific validation explicitly and keep the first MVP field set focused |
| Commercial wording around the legacy `price` field could misframe the product | UX and regulatory confusion | Use non-commercial, gratitude-driven copy such as suggested/reference Topes amount and keep the field negotiable |
| Six tri-state flag filters add query and UI complexity | Discovery bugs or confusing filter behavior | Reuse the proven tri-state filter pattern from needs and test each `neutral` / `yes` / `no` branch explicitly |
| Legacy Tope-là media/location formats vary | Broken migrated cards | Normalize legacy data during import and keep UI tolerant of partial metadata |
| Bid lifecycle differs from claim lifecycle | Incorrect unification assumptions | Keep `bid` distinct and document the lifecycle rules before implementation |
| Scope expands into campaigns too early | Delays the first merge slice | Treat campaign coupling as optional unless needed for basic publishing/discovery |

## Structure Decision

Start with the web slice and database shape first, then add mobile parity after the domain rules and UX patterns are validated on the shared API.