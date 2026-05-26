# Feature Specification: Tope-la Surface Replatforming (Landing, /app Routes, Campaign Explainers, Legal, Social Auth)

**Feature Branch**: `012-topela-surface-replatforming`  
**Created**: 2026-05-26  
**Status**: Draft  
**Input**: Product direction to finalize Tope-la UI parity in Mutuity rewrite, including default landing migration, `/app` route re-rooting, campaign and token explain sliders, legal pages, social auth scope, and product-name configurability.

## Context

This feature converts Mutuity from an app-first shell into a Tope-la-shaped public surface while preserving existing backend/domain progress.

Product decisions already confirmed:

- Mutuity is a codename only; runtime product naming must be configurable for Tope-la branding.
- Token explainer is a dialog slider opened from the contribution page and includes all 3 legacy Tope-la slides.
- Campaign explainer is a dialog slider opened from a `What is this campaign?` button on campaign public page with 3 core slides plus a conditional unauthenticated slide.
- Campaign explainer content must align with current Mutuity realities: moderation states, join triage for resources/needs, airdrop rules, creator/admin actions.
- Campaign public SEO metadata contract: title from campaign title, description from campaign description, image from campaign image transformed to 600x600.
- Public landing page should match Tope-la content and become `/`.
- Existing Mutuity app pages move under `/app` (`/search` -> `/app/search`, etc.); old app home moves to `/app`.
- If user is already authenticated, landing page should client-side redirect to `/app`.
- Legal pages keep Tope-la text and same relative paths as Tope-la; product name is injected from configured product name.
- Social login scope is Google + Apple only (no Facebook).
- Token wording normalization is out of scope for this feature and handled in a separate product-wording workshop.
- E2E acceptance must verify first-render data placement and guard against production-facing query failure surfaces (query syntax drift, GraphQL schema drift, moved routes).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visitor Sees Tope-la Landing At Root (Priority: P1)

As a visitor, I land on a Tope-la-style marketing homepage at `/`, while authenticated users are routed client-side to `/app`.

**Why this priority**: Root routing and first impression are the most visible launch behaviors.

**Independent Test**: Open `/` as guest and authenticated user; verify landing rendering for guest and client-side redirect to `/app` for authenticated session.

**Acceptance Scenarios**:

1. **Given** guest session, **When** opening `/`, **Then** Tope-la landing content renders with latest accounts/resources data sections.
2. **Given** authenticated session, **When** opening `/`, **Then** client-side redirect to `/app` occurs.
3. **Given** old Mutuity page routes, **When** user opens old path, **Then** route resolves to new `/app/*` location per migration map.

---

### User Story 2 - Visitor Understands Campaign Through Explainer Slider (Priority: P1)

As a visitor, I can open a `What is this campaign?` dialog slider from campaign public page and understand campaign mechanics.

**Why this priority**: Campaign behavior in Mutuity is richer than legacy and needs explicit guidance.

**Independent Test**: Open campaign public page and explainer dialog as guest/auth user; verify slide content, conditional unauth slide, and CTA behavior.

**Acceptance Scenarios**:

1. **Given** campaign public page, **When** user clicks `What is this campaign?`, **Then** dialog slider opens.
2. **Given** any user, **When** browsing first 3 slides, **Then** slides explain campaign focus/network bootstrapping, reward mechanics, and creator moderation role.
3. **Given** unauthenticated user, **When** reaching final conditional slide, **Then** login/register link and Android/iOS install buttons are visible.
4. **Given** authenticated user, **When** opening slider, **Then** unauth-only slide is not shown.

---

### User Story 3 - User Sees Token Explainer On Contribution Page (Priority: P1)

As a user, I can open a token explainer dialog from contribution page and browse the 3 legacy Tope-la slides.

**Why this priority**: Token economy comprehension is required for participation.

**Independent Test**: Open contribution page and launch explainer; verify 3 slides and dialog interactions on desktop/mobile.

**Acceptance Scenarios**:

1. **Given** contribution page, **When** user triggers explainer, **Then** modal slider opens.
2. **Given** slider open, **When** user navigates, **Then** exactly the 3 legacy token slides are shown.

---

### User Story 4 - Visitor Reads Legal Pages With Configured Product Name (Priority: P1)

As a visitor, I can read CGU and privacy pages using Tope-la text with runtime product naming.

**Why this priority**: Legal compliance and naming consistency are launch blockers.

**Independent Test**: Open legal routes and verify text content and configured product name rendering.

**Acceptance Scenarios**:

1. **Given** legal routes, **When** pages render, **Then** they preserve Tope-la legal text body.
2. **Given** product name config changes, **When** legal pages render, **Then** injected product name updates consistently.

---

### User Story 5 - User Signs In With Google or Apple (Priority: P1)

As a user, I can authenticate using Google or Apple and be linked safely to an existing or new account.

**Why this priority**: Social auth parity is required and currently partially wired.

**Independent Test**: Validate Google and Apple auth start/callback/linking paths for new user and existing user cases.

**Acceptance Scenarios**:

1. **Given** login/register pages, **When** social buttons are shown, **Then** only Google and Apple are available.
2. **Given** valid provider callback with an already linked provider identity, **When** callback resolves, **Then** sign-in completes on the linked account.
3. **Given** provider callback where no provider identity link exists yet, **When** callback resolves, **Then** system must not silently link by email only.
4. **Given** provider identity cannot be auto-linked safely, **When** callback resolves, **Then** user is routed through explicit completion/confirmation flow.

## Assumptions Register (Needs Product/Tech Sign-Off)

- **ASSUMPTION-012-01 Route matrix freeze**: actually, only root level pages of Tope-là should be ported in this feature, and they will stay in the root. All the existing Mutuity pages hierarchy should be moved to "/app". Their folders and subfolders structure should move with them
- **ASSUMPTION-012-02 Product name source of truth**: backend DB setting
- **ASSUMPTION-012-03 Campaign SEO image fallback**: fallback image for campaigns without image is to be imported from /Users/bertrandlarsy/code/symmetrical-broccoli/app/assets/img/campaign.svg
- **ASSUMPTION-012-04 Social account linking policy**: MVP baseline is accepted for this feature. Advanced collision/recovery UX can be iterated in a follow-up feature.
- **ASSUMPTION-012-05 Mobile store URLs**: canonical Android/iOS install URLs for all environments: see /Users/bertrandlarsy/code/symmetrical-broccoli/backoffice/src/components/misc.tsx
- **ASSUMPTION-012-06 Redirect UX tolerance**: acceptance of a short landing flash before client-side redirect: yes

## Route Structure Contract

Target route policy:

- Public landing at `/`.
- Application area rooted at `/app`.
- Existing authenticated app pages move from top-level routes to `/app/*`.
- Legal page relative paths must match Tope-la legal route shape.

> Full route migration table is required during implementation and tracked by `ASSUMPTION-012-01`.

### Root-Level Tope-la Pages In Scope (This Feature)

| Scope | Tope-la Root Route | Mutuity Target Route | Guest/Auth Behavior | QA Minimum Check |
|---|---|---|---|---|
| In scope | `/` | `/` | Guest sees landing; authenticated user is client-redirected to `/app` | Verify landing sections for guest and redirect behavior for authenticated session |
| In scope | `/privacy` | `/privacy` | Public for guest and authenticated users | Verify Tope-la privacy text renders with configured product name substitutions |
| In scope | `/terms` | `/terms` | Public for guest and authenticated users | Verify Tope-la CGU/terms text renders with configured product name substitutions |

### Explicitly Not In Scope As Root-Level Routes

Any route belonging to existing Mutuity app hierarchy is not kept at root level and must be moved under `/app/*` (for example `search`, `needs`, `resources`, `campaigns`, `notifications`, `account`, `admin`, and related nested paths).

### Route Precedence Rule

When a route could be interpreted as both public and app-internal, the public root-level list above wins for root routing, and all remaining app pages must resolve under `/app/*`.

## Campaign Explainer Content Model

The campaign explainer slider content must be driven by a model that can represent:

- Campaign narrative and purpose (network bootstrapping over a themed period).
- Airdrop and multiplier mechanics that generalize to all campaigns.
- Campaign governance and moderation roles:
  - Creator role for triaging incoming resources/needs.
  - Admin moderation state constraints and visibility rules.
- Unauthenticated onboarding CTA slide:
  - Login/registration link.
  - Android and iOS install buttons.

## SEO Contract

For campaign public pages:

- `title`: campaign title.
- `description`: campaign description field.
- `image`: campaign image transformed to 600x600.

## Social Auth Policy Direction

- Provider scope: Google and Apple only.
- No Facebook login.
- Implementation may reuse Tope-la configuration patterns (`NEXT_PUBLIC_APPLE_SERVICE_ID`, `NEXT_PUBLIC_APPLE_AUTH_REDIRECT_URI`, provider start URLs), but must not copy secrets.
- Linking social identities to existing accounts is allowed only under an anti-account-takeover policy.

### MVP Anti-Account-Takeover Policy (Implementation Baseline)

- Do not auto-link accounts by email match only during Google/Apple callback.
- Treat provider identity (`provider`, provider `subject`) as the primary account-link key.
- If provider identity is already linked, sign in that account.
- If provider identity is not linked:
  - If user is not authenticated, create a new social account or send user through explicit completion flow.
  - If user is authenticated and explicitly linking, require recent re-authentication before link is persisted.
- Enforce one provider identity mapped to exactly one account (DB unique constraint).
- Record link/unlink events in audit logs.

### MVP Test Scope (Low Overhead)

- Happy path: existing linked provider identity signs in successfully.
- Safety path: same-email callback without existing provider link does not silently attach to existing account.
- Linking path: logged-in user can link provider only after explicit confirmation/re-authentication.
- Integrity path: DB constraint prevents same provider identity from linking to multiple accounts.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-012-001**: Introduce configurable runtime product identity with default codename-safe fallback.
- **FR-012-002**: Landing page at `/` must render Tope-la content structure and sections.
- **FR-012-003**: Landing page must load latest resources and latest accounts via GraphQL queries.
- **FR-012-004**: Authenticated visit to `/` must trigger client-side redirect to `/app`.
- **FR-012-005**: Existing Mutuity app pages must move under `/app/*` according to approved route matrix.
- **FR-012-006**: Campaign public page must expose `What is this campaign?` button opening dialog slider.
- **FR-012-007**: Campaign explainer slider must include 3 base slides plus one unauthenticated-only slide.
- **FR-012-008**: Contribution page must expose token explainer dialog slider with 3 legacy slides.
- **FR-012-009**: Campaign public SEO metadata must follow title/description/600x600-image contract.
- **FR-012-010**: CGU and privacy pages must preserve Tope-la legal text and inject configured product name.
- **FR-012-011**: Social auth UI and flows must expose Google and Apple only.
- **FR-012-012**: Social account linking behavior must enforce MVP anti-account-takeover policy and must never auto-link by email match only.
- **FR-012-013**: E2E coverage must assert first-render data appears where expected on landing/campaign/legal routes.
- **FR-012-014**: E2E coverage must assert production UI does not expose raw query failure messages for route/query/schema drift scenarios.
- **FR-012-015**: This feature must not include token wording normalization implementation.

### Non-Functional Requirements

- **NFR-012-001**: Landing and explainer dialogs must be responsive on mobile and desktop.
- **NFR-012-002**: Client redirect from `/` to `/app` should complete without full-page reload.
- **NFR-012-003**: Public SEO metadata generation must avoid leaking internal errors or unresolved GraphQL details.

## Key Entities *(include if feature involves data)*

- **ProductIdentityConfig**: canonical runtime product naming and legal-text interpolation input.
- **AppRouteMap**: source-to-target route migration matrix for `/` and `/app/*` structure.
- **CampaignExplainContentModel**: structured content/state model for campaign explainer slides.
- **TokenExplainContentModel**: fixed 3-slide content model ported from Tope-la.
- **SocialIdentityLinkPolicy**: explicit rules for matching/linking provider identities to accounts.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-012-001**: Root route serves Tope-la landing to guests and redirects authenticated users to `/app` client-side.
- **SC-012-002**: Campaign explainer dialog and token explainer dialog are available and fully navigable on desktop/mobile.
- **SC-012-003**: Campaign SEO tags render per specified contract for title/description/image.
- **SC-012-004**: Legal pages render Tope-la text with configured product name substitutions.
- **SC-012-005**: Google and Apple social login flows pass happy-path and collision-path tests with explicit linking policy enforcement.
- **SC-012-006**: E2E tests prevent regression where query syntax/schema/route drift exposes raw production query-failure messaging.

## Dependencies

- `003-topela-migration-foundation` for product/UX direction.
- `010-public-pages-and-seo` for campaign public page baseline and SEO plumbing.
- `004-login-flow` and auth backend capabilities for social auth completion.
- `011-account-deletion-anonymization` for public-state safety assumptions.

## Out of Scope (for this spec)

- Token wording normalization workshop and rule application.
- Full design-system overhaul beyond Tope-la parity migration.
- New social providers beyond Google and Apple.
