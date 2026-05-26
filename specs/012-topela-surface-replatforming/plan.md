# Implementation Plan: Tope-la Surface Replatforming

## Goal

Deliver a Tope-la-parity public surface and routing topology for Mutuity rewrite, including root landing migration, `/app` route re-rooting, campaign and token explainers, legal pages with configurable product naming, and production-ready Google/Apple social auth.

## Phase 0 - Decision Lock And Residual Assumption Gate

- Record locked decisions already accepted in spec (`ASSUMPTION-012-01/02/03/05/06`) as implementation inputs.
- Publish route migration matrix and redirect policy from the locked route decision.
- Keep only advanced social collision/recovery UX as follow-up scope beyond MVP baseline.
- Materialize product-name source of truth and mobile-store URLs in repo configuration.

Exit criteria:

- Locked decisions are reflected in implementation inputs and only residual follow-up scope remains open.

## Phase 1 - Product Identity Configuration

- Introduce shared product identity contract usable by frontend pages and legal copy interpolation.
- Wire default value to codename-safe fallback and target Tope-la runtime value.
- Ensure legal and SEO-facing surfaces consume the same product identity contract.

Exit criteria:

- Product name appears from configuration across all migrated surfaces.

## Phase 2 - Route Topology Migration (`/` and `/app`)

- Promote Tope-la landing page to `/`.
- Move existing app pages to `/app/*` route family.
- Add compatibility redirects/aliases from legacy routes to `/app/*` per approved route map.
- Add client-side authenticated redirect from landing to `/app`.

Exit criteria:

- Route map behaves consistently for guest and authenticated sessions.

## Phase 3 - Landing Data Integration

- Port Tope-la landing sections and assets.
- Add GraphQL queries for latest resources and latest accounts.
- Ensure empty/error states keep production-safe UX (no raw query stack/error details).

Exit criteria:

- Landing renders complete content with live data and safe fallback behavior.

## Phase 4 - Campaign Public Page Enhancements

- Add `What is this campaign?` trigger on campaign public page.
- Implement campaign explainer dialog slider with:
  - Theme/network-bootstrapping slide.
  - Airdrop/multiplier generalized mechanics slide.
  - Creator moderation and campaign governance slide.
  - Conditional unauth onboarding slide with login + app install CTAs.
- Add/verify SEO metadata contract including 600x600 campaign image transform.

Exit criteria:

- Campaign page includes explainer dialog and metadata contract is satisfied.

## Phase 5 - Contribution Token Explainer

- Port legacy 3-slide token explainer to contribution page modal.
- Ensure mobile/desktop usability and localization compatibility.

Exit criteria:

- Token explainer is accessible and stable from contribution route.

## Phase 6 - Legal Pages Migration

- Port Tope-la privacy and CGU text.
- Preserve Tope-la legal relative paths.
- Replace hardcoded product mentions with configured product identity interpolation.

Exit criteria:

- Legal pages are complete, route-correct, and naming-configurable.

## Phase 7 - Social Auth Completion (Google + Apple)

- Ensure frontend buttons and provider routing expose Google/Apple only.
- Implement backend contract for start/callback/session issuance as required.
- Implement MVP anti-account-takeover baseline:
  - Never auto-link by email only.
  - Use provider identity as primary link key.
  - Require explicit confirmation and recent re-auth for authenticated linking.
  - Enforce one provider identity per account via DB uniqueness.
- Add audit/security checks for social linking outcomes.

Exit criteria:

- Google/Apple auth and MVP linking behavior are production-safe and covered by low-overhead safety tests.

## Phase 8 - E2E Hardening And Production Safety

- Add E2E for first-render data placement on landing, campaign, and legal pages.
- Add E2E checks that query/schema/route drift does not expose raw query-failure UI in production flows.
- Validate route migration regressions and metadata correctness.

Exit criteria:

- Critical surface migration has stable E2E coverage and production-safe error presentation.

## Risk Register

- Route migration regressions may break deep links and notification routing.
- Client-side redirect timing may create transient flash behavior if hydration is delayed.
- Social-linking misconfiguration can create account-takeover risk.
- SEO image transform fallback gaps may produce broken metadata previews.
- Legal text interpolation defects can produce inconsistent branding on compliance pages.

## Complexity Notes

- This feature intentionally combines multiple user-visible migrations to avoid duplicate route churn.
- Token wording normalization stays out of scope to avoid mixing UX migration and language-governance workstreams.
