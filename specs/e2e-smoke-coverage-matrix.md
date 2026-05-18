# E2E Smoke Coverage Matrix

Created: 2026-05-18
Scope: business-critical user journeys that should have a fast Playwright smoke path

Status legend:
- `READY`: a smoke spec exists and exercises the main path
- `PARTIAL`: some related e2e coverage exists, but not a dedicated smoke path for the full business-critical story
- `MISSING`: no dedicated e2e smoke path found yet

## Coverage By Feature

| Feature | Business-critical scope | E2E smoke file(s) | Status | Notes |
|---|---|---|---|---|
| 002-needs-query-claiming | Discover active needs | [e2e/specs/002-needs-query-claiming/us1-needs-discovery.smoke.spec.ts](../e2e/specs/002-needs-query-claiming/us1-needs-discovery.smoke.spec.ts) | READY | Basic discovery of seeded need on `/needs` is covered. |
| 003-topela-migration-foundation | Platform/database baseline | None | MISSING | No user-facing e2e smoke path found. Coverage is primarily backend/migration validation. |
| 004-login-flow | Sign up, sign in, session bootstrap, sign out | None | MISSING | Auth is important business-critical flow, but there is no dedicated e2e smoke spec in `e2e/specs` yet. |
| 005-resource-discovery-and-publishing | Resource discovery, publish, bids, notifications, profile/setup-adjacent flows | None | MISSING | Related flows exist elsewhere, but no dedicated smoke suite was found under `e2e/specs`. |
| 006-chat-and-conversations | Conversation handoff and thread access | None | MISSING | No e2e smoke spec in the suite yet. |
| 007-bids-workspace-and-settlement | Bid lifecycle and decline/refund settlement | [e2e/specs/007-bids-workspace-and-settlement/us1-bid-lifecycle.smoke.spec.ts](../e2e/specs/007-bids-workspace-and-settlement/us1-bid-lifecycle.smoke.spec.ts), [e2e/specs/007-bids-workspace-and-settlement/us2-bid-decline-refund.smoke.spec.ts](../e2e/specs/007-bids-workspace-and-settlement/us2-bid-decline-refund.smoke.spec.ts) | READY | Main bid create/accept and decline/refund paths are smoke-tested. |
| 008-claims-workspace-and-settlement | Claims workspace, cancel/settle, auto-decline side effects | [e2e/specs/008-claims-workspace-and-settlement/us1-claims-workspace.smoke.spec.ts](../e2e/specs/008-claims-workspace-and-settlement/us1-claims-workspace.smoke.spec.ts), [e2e/specs/008-claims-workspace-and-settlement/us2-claims-actions.smoke.spec.ts](../e2e/specs/008-claims-workspace-and-settlement/us2-claims-actions.smoke.spec.ts), [e2e/specs/008-claims-workspace-and-settlement/us2-claim-settlement-side-effects.smoke.spec.ts](../e2e/specs/008-claims-workspace-and-settlement/us2-claim-settlement-side-effects.smoke.spec.ts) | READY | Workspace browse, cancel, and settlement side effects are covered. |
| 009-listing-visual-identity | Unified listing header visual identity | None | MISSING | Visual parity is important, but no smoke spec currently exercises it. |
| 010-public-pages-and-seo | Public need/campaign/account pages, CTA contracts, SSR metadata | [e2e/specs/010-public-pages-and-seo/us1-need-cta-flow.smoke.spec.ts](../e2e/specs/010-public-pages-and-seo/us1-need-cta-flow.smoke.spec.ts), [e2e/specs/010-public-pages-and-seo/us2-authenticated-cta.smoke.spec.ts](../e2e/specs/010-public-pages-and-seo/us3-public-route-and-metadata.smoke.spec.ts) | READY | Public route, metadata, and CTA smoke coverage is now present. |
| 011-account-deletion-anonymization | Delete-account guard, anonymization outcomes, post-delete controls | [e2e/specs/011-account-deletion-anonymization/us1-delete-guard.smoke.spec.ts](../e2e/specs/011-account-deletion-anonymization/us1-delete-guard.smoke.spec.ts) | READY | UI delete-confirmation guard is smoke-tested; deeper deletion effects live in backend integration tests. |

## Current Gaps

The following business-critical areas still do not have a dedicated smoke path in `e2e/specs`:

- Feature 003 platform baseline
- Feature 004 login flow
- Feature 005 resource discovery and publishing
- Feature 006 chat and conversations
- Feature 009 listing visual identity

## Suggested Short-Term Smoke Priorities

1. Feature 004 login flow: sign-up, sign-in, sign-out, and protected-route redirect.
2. Feature 005 resource discovery/publishing: resource discovery and a basic publish success path.
3. Feature 006 chat/conversation handoff: open existing thread and draft creation from a transaction context.
4. Feature 009 listing visual identity: verify no broken image UI and consistent header strip on needs/resources.
5. Feature 003 platform baseline: keep this at backend/integration level unless a user-facing critical path emerges.
