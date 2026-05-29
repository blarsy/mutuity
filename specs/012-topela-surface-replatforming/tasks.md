# Tasks: Tope-la Surface Replatforming

## Milestone A - Assumption Closure

- [x] T012-001 Publish complete route migration matrix from locked route decision (`old -> new`, redirect type, alias window).
- [ ] T012-002 Implement product-name source of truth contract using backend DB setting.
- [ ] T012-003 Implement campaign SEO fallback image behavior for campaigns without image.
- [ ] T012-004 Document follow-up backlog for advanced social collision/recovery UX beyond MVP policy.
- [ ] T012-005 Materialize Android/iOS store URLs in frontend/runtime config from approved source.
- [x] T012-006 Apply accepted landing redirect UX behavior (short client-side flash tolerated).

## Milestone B - Product Identity Config

- [ ] T012-007 Implement shared product identity config module (frontend-consumable).
- [ ] T012-008 Add legal text interpolation helpers for configured product name.
- [ ] T012-009 Add tests for product-name interpolation and fallback behavior.

## Milestone C - Route Replatforming

- [x] T012-010 Implement landing page as root route `/`.
- [x] T012-011 Move current app home to `/app`.
- [x] T012-012 Migrate existing top-level app routes to `/app/*` equivalents.
- [x] T012-013 Implement backward-compatible redirects from legacy routes.
- [x] T012-014 Update notification and in-app routing helpers to new `/app/*` structure.
- [x] T012-015 Add route-level tests for migrated and legacy route behavior.

## Milestone D - Landing Page Data and UX

- [x] T012-016 Port Tope-la landing content and assets to root page.
- [x] T012-017 Add GraphQL query for latest resources section.
- [x] T012-018 Add GraphQL query for latest accounts section.
- [x] T012-019 Implement client-side authenticated redirect from `/` to `/app`.
- [x] T012-020 Add tests for guest render vs authenticated redirect behavior.

## Milestone E - Campaign Public Explainers and SEO

- [x] T012-021 Add `What is this campaign?` button on campaign public page.
- [x] T012-022 Implement campaign explainer dialog slider base slides (1-3).
- [x] T012-023 Implement unauthenticated-only slide with login/register + Android/iOS CTAs.
- [x] T012-024 Implement campaign explainer content model mapped to moderation states and triage rules.
- [x] T012-025 Enforce campaign SEO metadata contract (title, description, 600x600 image).
- [x] T012-026 Add tests for slider visibility rules and campaign metadata generation.

## Milestone F - Contribution Token Explainer

- [x] T012-027 Add trigger on contribution page for token explainer modal.
- [x] T012-028 Port and render all 3 legacy token explainer slides.
- [x] T012-029 Add responsive tests for token explainer dialog behavior.

## Milestone G - Legal Pages

- [x] T012-030 Port Tope-la privacy content to Mutuity legal route path.
- [x] T012-031 Port Tope-la CGU content to Mutuity legal route path.
- [x] T012-032 Replace hardcoded product mentions with configured product name interpolation.
- [x] T012-033 Add tests ensuring legal copy includes configured product name.

## Milestone H - Social Auth Completion

- [x] T012-034 Confirm Google and Apple auth start URLs and callback wiring in all environments.
- [x] T012-035 Remove/disable any non-scoped social provider entry points (including Facebook).
- [x] T012-036 Implement/complete provider callback handling for Google and Apple.
- [ ] T012-037 Implement MVP anti-account-takeover policy for provider identities (no email-only auto-link, provider-id key, explicit link confirmation, re-auth for linking).
- [x] T012-038 Add low-overhead safety tests for MVP policy (linked sign-in, no silent same-email attach, explicit link confirmation, DB uniqueness integrity).
- [x] T012-039 Add end-to-end tests for Google and Apple sign-in and registration completion paths using MVP policy outcomes.

## Milestone I - Production Safety and E2E

- [ ] T012-040 Add E2E assertions that first-render data appears in expected UI zones on landing/campaign/legal pages.
- [ ] T012-041 Add E2E assertions that route migration does not break deep links.
- [ ] T012-042 Add E2E guardrails that production UI never exposes raw query failure details on query/schema/route drift.
- [ ] T012-043 Run full regression pass and update implementation-progress tracker with completion evidence.

## Explicitly Deferred

- [ ] T012-044 Track token wording normalization in separate dedicated wording workshop feature (no implementation in this feature).

## Progress Sync Notes

- Completed in `8f3d891`: spec lock for scope, route contract, and MVP social-linking policy (supports T012-001).
- Completed in `8296c57`: `/app` home move, `/app/*` aliases, legacy redirects, and in-app link updates (T012-010 through T012-014).
- Completed in `395c32d`: root legal pages `/privacy` and `/terms` with product-name interpolation fallback (T012-030 through T012-032).
- Completed in `1c9d440`: root landing redesign for multi-campaign context and preserved client redirect behavior from `/` to `/app` (T012-006, T012-016, T012-019).
- Completed in `f0c8149`: root landing live feed integration for latest resources and latest accounts (T012-017, T012-018).
- Completed in `048f548`: root auth-behavior helper tests for guest stay vs authenticated redirect (`tests/public/home-route-auth-behavior.spec.ts`, supports T012-020).
- Completed in `ae09c7c`: legacy route migration contract tests and shared redirect source (`frontend/legacyAppRedirects.cjs`, `tests/public/route-migration-redirects.spec.ts`, supports T012-015).
- Completed in `ad2ac9d`: localized legal pages (FR+EN) and legal interpolation guard tests (`tests/public/legal-copy-localization.spec.ts`, supports T012-033).
- Completed in `7687e36`: campaign public explainer trigger and 3 base slides (`public.explainer.*`, `tests/campaigns/campaign-explainer.spec.ts`, supports T012-021 and T012-022).
- Completed in `e405b4a`: unauthenticated explainer slide with login/register and Android/iOS CTAs (`public.explainer.slides.onboarding`, supports T012-023).
- Completed in `035076e` and `81c3a82`: Google/Apple auth callback + backend start routes (`frontend/src/pages/auth/*/callback.tsx`, `backend/src/postgraphile/server.ts`, supports T012-034 through T012-036).
- Completed in `5d8a8b3` and `a35f73c`: social start env compatibility and explicit-link-required identity resolution policy (`backend/src/postgraphile/server.ts`, `database/migrations/122_social_identity_explicit_link_policy.sql`, supports T012-037 baseline hardening).
- Completed in current branch head: low-overhead social-auth safety coverage (`backend/tests/integration/auth-graphql.spec.ts`, `backend/tests/integration/social-auth-start-routes.spec.ts`, supports T012-038).
- Completed in current branch head: social callback E2E outcomes for Google/Apple (`e2e/specs/004-login-flow/us5-social-auth-callback.smoke.spec.ts`, supports T012-039).
- Scope clarification: the former single-campaign `OngoingCampaignAnnouncement` zone is intentionally not ported.
