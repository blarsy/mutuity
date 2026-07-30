# Implementation Validation Checklist

**Feature**: Mutuity Mobile Rewrite  
**Last Validated**: 2026-07-29  
**Phases Complete**: 1–6 (Setup, Foundation, US1, US2, US3, US4)  
**Phase In Progress**: 7 (E2E Smoke Matrix & Cross-Cutting Concerns)

## Phase 1: Setup

- [x] Mobile app folder structure created
- [x] Package scripts configured (start, typecheck, lint, test, test:integration, e2e)
- [x] TypeScript strict mode enabled
- [x] ESLint and Prettier configured
- [x] Jest and React Native Testing Library configured
- [x] UI-contract tracking index created
- [x] Per-screen UI contract templates created (12 screens)

## Phase 2: Foundational

- [x] Apollo Client and links configured
- [x] GraphQL operation documents and exports configured
- [x] GraphQL schema snapshot and code generation configured
- [x] Schema/codegen/typecheck script chain added
- [x] CI enforcement for GraphQL codegen drift added
- [x] Auth token persistence and session bootstrap configured
- [x] i18n base setup and namespaces configured
- [x] Root navigation shell and auth gate implemented
- [x] Shared UI state patterns implemented (Loading, Empty, Error)
- [x] Network/offline status service added
- [x] Canonical main-screen registry with UI-approved gate created
- [x] CI check for UI-contract gate added
- [x] Semantic selector testing standard created
- [x] Mobile activity correlation and monitoring service added
- [x] GraphQL/client error reporting and invalid-session handling added
- [x] Push permission bootstrap, token sync, and notification response service added
- [x] Minimum supported app version bootstrap added
- [x] Support diagnostics snapshot and report-issue service added
- [x] Notification preference data service added
- [x] Realtime session subscriptions added

## Phase 3: US1 - Daily Mobile Use Parity

- [x] Acceptance tests: main navigation, search resources, manage resources, offline save, anonymous access matrix, restricted routes
- [x] Contract test: resource query filters
- [x] UI contracts approved: Search resources, My resources, My bids, Chat, Notifications, My profile, My preferences, Contribution
- [x] Search resources screen ported and wired to backend
- [x] My resources list and CRUD entry points ported
- [x] My bids workspace ported
- [x] Chat list and detail ported
- [x] Notifications feed ported
- [x] My profile screen ported
- [x] My preferences screen ported
- [x] Contribution screen ported
- [x] GraphQL data adapters implemented: resources, bids, chat, notifications, profile, economics
- [x] US1 navigation routes wired
- [x] fr/en labels for My Hub drawer items
- [x] Anonymous browse-only route policy implemented
- [x] Auth entry surfaces implemented (login, register, forgot password)

## Phase 4: US2 - Needs Workflow

- [x] Acceptance tests: create need, search needs, claim need
- [x] Contract test: need claim mutation
- [x] UI contracts approved: Search needs, My needs, My claims
- [x] Search needs screen ported
- [x] My needs screen and edit flow ported
- [x] My claims workspace ported
- [x] Need create/update/claim data adapters implemented
- [x] US2 navigation routes wired
- [x] fr/en labels for US2 screens

## Phase 5: US3 - Campaign Participation and Moderation

- [x] Acceptance tests: create campaign pending, campaign moderation
- [x] Contract test: campaign creation and moderation status transitions
- [x] UI contract approved: My campaigns
- [x] My campaigns screen ported
- [x] Campaign create and moderation adapters implemented
- [x] Campaign pending/approved/rejected status UI added
- [x] US3 navigation routes wired
- [x] fr/en labels for US3 screens

## Phase 6: US4 - Mobile Trust, Continuity, and Operational Safeguards

- [x] Acceptance tests: language switch (3 tests), notifications continuity (5 tests), session continuity (4 tests), update-required gate (6 tests), support diagnostics (7 tests)
- [x] End-to-end language propagation implemented (session.ts, i18n/index.ts, AuthProvider.tsx)
- [x] Profile and notification continuity UI validated
- [x] Session bootstrap, invalid-token logout, and authenticated relaunch flow implemented
- [x] Notification deep-link continuity and unread-state refresh implemented
- [x] Support/report-issue diagnostics flow implemented (SupportScreen created)
- [x] Minimum-version gate and update-required screen wiring implemented
- [x] Notification preference controls and persistence validated
- [x] fr/en US4 locale keys added (40+ keys)

## Phase 7: E2E Smoke Matrix & Cross-Cutting Concerns

- [x] E2E smoke S1: Main navigation (2 tests)
- [x] E2E smoke S2: Search resources (2 tests)
- [x] E2E smoke S3: Edit resource (2 tests)
- [x] E2E smoke S4: Offline resource save exception (2 tests)
- [x] E2E smoke S5: Needs create and claim (2 tests)
- [x] E2E smoke S6: Campaign pending (3 tests)
- [x] CI job for smoke matrix created (mobile-smoke.yml)
- [x] Quickstart updated with current status and test commands
- [x] Storybook CI build verification created (mobile-storybook.yml)
- [x] Full quickstart validation run

## Test Coverage Summary

| Category | Suites | Tests | Status |
|---|---|---|---|
| US1 Integration | 6 | ~15 | PASS |
| US2 Integration | 3 | ~6 | PASS |
| US3 Integration | 2 | ~4 | PASS |
| US4 Integration | 5 | 25 | PASS |
| E2E Smoke | 6 | 13 | PASS |
| **Total** | **22** | **~63** | **ALL PASS** |

## TypeScript Status

7 pre-existing type errors remain (none from Phase 6 or 7 changes):
- `DateTimePickerField.tsx` (saveLabel prop)
- `ImagePickerField.tsx` (possibly undefined)
- `US3Navigator.tsx` (missing imageUrl)
- `profile.ts` (exactOptionalPropertyTypes)
- `us3-campaign-moderation.acceptance.test.ts` (missing imageUrl)
- `us3-create-campaign-pending.acceptance.test.ts` (missing imageUrl)

## Gate Status

- [x] P1 acceptance-test coverage: PASS
- [x] P1 contract coverage: PASS
- [x] Required E2E smoke coverage: PASS (S1-S6)
- [x] Auth/session continuity check included: PASS (S1)
- [x] UI contract gate: PASS
- [x] GraphQL codegen drift: PASS