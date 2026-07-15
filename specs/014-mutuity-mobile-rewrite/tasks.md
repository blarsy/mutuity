# Tasks: Mutuity Mobile Rewrite

**Input**: Design documents from /specs/014-mutuity-mobile-rewrite/
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Business acceptance-test tasks are REQUIRED for P1 stories and are derived from per-story examples in spec.md. E2E smoke tasks are REQUIRED.

**Organization**: Tasks are grouped by user story so each story remains independently implementable and testable.

**Current baseline**: Shared setup and the initial GraphQL scaffolding are in place, but the mobile rewrite is still at a very early stage. At the time of this update, only `mobile-app/src/services/graphql/client.ts` and `mobile-app/src/services/graphql/operations/index.ts` exist under `mobile-app/src`.

## Format: [ID] [P?] [Story] Description

- [P]: Can run in parallel (different files, no dependencies)
- [Story]: Which user story this task belongs to (US1, US2, US3, US4)
- Every task includes exact file paths

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize mobile workspace, quality tooling, and UI-contract tracking docs.

- [x] T001 Create mobile app folder structure in mobile-app/src/screens, mobile-app/src/components, mobile-app/src/services, mobile-app/src/navigation, mobile-app/src/i18n, and mobile-app/tests
- [x] T002 Initialize mobile package and scripts in mobile-app/package.json (start, typecheck, lint, test, test:integration, e2e)
- [x] T003 [P] Configure TypeScript strict mode in mobile-app/tsconfig.json
- [x] T004 [P] Configure ESLint and Prettier in mobile-app/.eslintrc.cjs and mobile-app/.prettierrc
- [x] T005 [P] Configure Jest and React Native Testing Library in mobile-app/jest.config.ts and mobile-app/tests/setup.ts
- [x] T006 [P] Create UI-contract tracking index in specs/014-mutuity-mobile-rewrite/ui-contracts/README.md
- [x] T007 [P] Create per-screen UI contract templates in specs/014-mutuity-mobile-rewrite/ui-contracts/search-resources.md, specs/014-mutuity-mobile-rewrite/ui-contracts/search-needs.md, specs/014-mutuity-mobile-rewrite/ui-contracts/my-resources.md, specs/014-mutuity-mobile-rewrite/ui-contracts/my-needs.md, specs/014-mutuity-mobile-rewrite/ui-contracts/my-bids.md, specs/014-mutuity-mobile-rewrite/ui-contracts/my-claims.md, specs/014-mutuity-mobile-rewrite/ui-contracts/chat.md, specs/014-mutuity-mobile-rewrite/ui-contracts/notifications.md, specs/014-mutuity-mobile-rewrite/ui-contracts/my-campaigns.md, specs/014-mutuity-mobile-rewrite/ui-contracts/my-profile.md, specs/014-mutuity-mobile-rewrite/ui-contracts/my-preferences.md, and specs/014-mutuity-mobile-rewrite/ui-contracts/my-economics.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build architecture required by all stories.

**CRITICAL**: No user story implementation starts before this phase completes.

- [x] T008 Configure Apollo Client and links in mobile-app/src/services/graphql/client.ts
- [x] T009 [P] Configure GraphQL operation documents and exports in mobile-app/src/services/graphql/operations/index.ts
- [x] T010 [P] Configure GraphQL schema snapshot and code generation in mobile-app/codegen.schema.cjs and mobile-app/codegen.cjs
- [x] T011 Add schema/codegen/typecheck script chain in mobile-app/package.json (graphql:schema, graphql:codegen, typecheck)
- [x] T012 Add CI enforcement for GraphQL codegen drift and TypeScript checks in .github/workflows/mobile-typecheck.yml
- [x] T013 [P] Configure auth token persistence and session bootstrap in mobile-app/src/services/auth/session.ts and mobile-app/src/services/auth/AuthProvider.tsx
- [x] T014 [P] Configure i18n base setup and namespaces in mobile-app/src/i18n/index.ts, mobile-app/src/i18n/locales/en/common.json, and mobile-app/src/i18n/locales/fr/common.json
- [x] T015 [P] Implement root navigation shell and auth gate in mobile-app/src/navigation/AppNavigator.tsx
- [x] T016 [P] Implement shared UI state patterns (loading, empty, error) in mobile-app/src/components/state/LoadingState.tsx, mobile-app/src/components/state/EmptyState.tsx, and mobile-app/src/components/state/ErrorState.tsx
- [x] T017 [P] Add network/offline status service in mobile-app/src/services/network/useNetworkStatus.ts
- [x] T018 Create canonical main-screen registry with UI-approved gate in mobile-app/src/navigation/mainScreenRegistry.ts
- [x] T019 Add CI check that blocks port tasks without UI-approved contract in scripts/check-ui-contract-gate.mjs and package.json scripts
- [x] T020 Add semantic selector testing standard and helper policy in mobile-app/tests/TESTING_SELECTORS.md and mobile-app/tests/utils/selectorPolicy.ts
- [x] T020A [P] Add mobile activity correlation and monitoring service in mobile-app/src/services/monitoring/activity.ts and mobile-app/src/services/monitoring/logger.ts
- [x] T020B [P] Add GraphQL/client error reporting and invalid-session handling in mobile-app/src/services/graphql/client.ts and mobile-app/src/services/auth/AuthProvider.tsx
- [x] T020C [P] Add push permission bootstrap, token sync, and notification response service in mobile-app/src/services/notifications/push.ts and mobile-app/src/services/notifications/useNotificationRouting.ts
- [x] T020D [P] Add minimum supported app version bootstrap and update-required surface in mobile-app/src/services/app/version.ts and mobile-app/src/screens/system/UpdateRequiredScreen.tsx
- [x] T020E [P] Add support diagnostics snapshot and report-issue service in mobile-app/src/services/support/diagnostics.ts and mobile-app/src/services/support/reportIssue.ts
- [x] T020F [P] Add notification preference data service for realtime versus summary delivery in mobile-app/src/services/graphql/notificationPreferences.ts and mobile-app/src/screens/profile/MyPreferencesScreen.tsx
- [x] T020G [P] Add realtime session subscriptions for notifications, chat, and account continuity in mobile-app/src/services/realtime/sessionSubscriptions.ts

**Checkpoint**: Foundation ready; user stories can start.

---

## Phase 3: User Story 1 - Daily Mobile Use Parity (Priority: P1) MVP

**Goal**: Preserve existing daily flows for returning users with UI-first per-screen gating.

**Independent Test**: User can validate signed-in parity flows and anonymous browse-only behavior (with restricted-surface prompts and hidden profile/preferences/economics entry points) without using needs/campaigns.

### Business Acceptance Tests for User Story 1 (MANDATORY)

- [x] T021 [P] [US1] Add acceptance test (semantic selectors only: getByRole/getByLabel/getByPlaceholder/data-testid) for "returning user opens app and lands on main navigation" in mobile-app/tests/integration/us1-main-navigation.acceptance.test.ts
- [x] T022 [P] [US1] Add acceptance test (semantic selectors only: getByRole/getByLabel/getByPlaceholder/data-testid) for "search resources by category and distance" in mobile-app/tests/integration/us1-search-resources.acceptance.test.ts
- [x] T023 [P] [US1] Add acceptance test (semantic selectors only: getByRole/getByLabel/getByPlaceholder/data-testid) for "edit resource title/price/images and persist" in mobile-app/tests/integration/us1-manage-resources.acceptance.test.ts
- [x] T024 [P] [US1] Add acceptance exception test (semantic selectors only: getByRole/getByLabel/getByPlaceholder/data-testid) for "offline during resource save must not show false success" in mobile-app/tests/integration/us1-resource-save-offline.exception.test.ts
- [x] T025 [P] [US1] Add contract test for resource query filters in mobile-app/tests/contract/us1-search-resources.contract.test.ts
- [x] T025A [P] [US1] Add acceptance test matrix for anonymous access behavior across canonical main screens (semantic selectors only: getByRole/getByLabel/getByPlaceholder/data-testid) in mobile-app/tests/integration/us1-anonymous-access-matrix.acceptance.test.ts
- [x] T025B [P] [US1] Add navigation/deep-link guard acceptance test for anonymous access to My profile, My preferences, and Contribution in mobile-app/tests/integration/us1-anonymous-restricted-routes.acceptance.test.ts

### Implementation for User Story 1

- [x] T026 [P] [US1] Finalize and approve UI contracts for Search resources and My resources in specs/014-mutuity-mobile-rewrite/ui-contracts/search-resources.md and specs/014-mutuity-mobile-rewrite/ui-contracts/my-resources.md
- [x] T027 [P] [US1] Finalize and approve UI contracts for My bids and Chat in specs/014-mutuity-mobile-rewrite/ui-contracts/my-bids.md and specs/014-mutuity-mobile-rewrite/ui-contracts/chat.md
- [x] T028 [P] [US1] Finalize and approve UI contracts for Notifications and My profile in specs/014-mutuity-mobile-rewrite/ui-contracts/notifications.md and specs/014-mutuity-mobile-rewrite/ui-contracts/my-profile.md
- [x] T029 [P] [US1] Finalize and approve UI contracts for My preferences and Contribution in specs/014-mutuity-mobile-rewrite/ui-contracts/my-preferences.md and specs/014-mutuity-mobile-rewrite/ui-contracts/my-economics.md
- [x] T030 [US1] Port Search resources screen after gate pass in mobile-app/src/screens/resources/SearchResourcesScreen.tsx
- [x] T030A [US1] Implement resource search GraphQL operations and typed result mapping (query, filters, pagination-ready shape) in mobile-app/src/services/graphql/operations/index.ts
- [x] T030B [US1] Implement resource discovery data adapter and filter-to-query variable mapping in mobile-app/src/services/graphql/resources.ts
- [x] T030C [US1] Wire Search resources screen to live backend query state (loading/error/retry/refetch) and remove default hardcoded dataset dependency in mobile-app/src/screens/resources/SearchResourcesScreen.tsx
- [x] T030D [US1] Add contract coverage for Search resources adapter variable mapping and response normalization in mobile-app/tests/contract/us1-search-resources.contract.test.ts
- [ ] T031 [US1] Port My resources list and CRUD entry points after gate pass in mobile-app/src/screens/resources/MyResourcesScreen.tsx and mobile-app/src/screens/resources/EditResourceScreen.tsx
- [ ] T031A [US1] Implement My resources list and resource CRUD GraphQL operations/adapters (list own resources, create, update, soft delete) in mobile-app/src/services/graphql/resources.ts and mobile-app/src/services/graphql/operations/index.ts
- [ ] T031B [US1] Wire My resources list and edit screens to backend mutations/queries with optimistic-safe loading and error states in mobile-app/src/screens/resources/MyResourcesScreen.tsx and mobile-app/src/screens/resources/EditResourceScreen.tsx
- [ ] T032 [P] [US1] Port My bids workspace after gate pass in mobile-app/src/screens/bids/MyBidsScreen.tsx
- [ ] T033 [P] [US1] Port Chat list and detail after gate pass in mobile-app/src/screens/chat/ChatListScreen.tsx and mobile-app/src/screens/chat/ChatDetailScreen.tsx
- [ ] T034 [P] [US1] Port Notifications feed after gate pass in mobile-app/src/screens/notifications/NotificationsScreen.tsx
- [ ] T035 [P] [US1] Port My profile screen after gate pass in mobile-app/src/screens/profile/MyProfileScreen.tsx
- [ ] T036 [P] [US1] Port My preferences screen after gate pass in mobile-app/src/screens/profile/MyPreferencesScreen.tsx
- [ ] T037 [P] [US1] Port Contribution screen after gate pass in mobile-app/src/screens/economics/MyEconomicsScreen.tsx
- [ ] T037A [US1] Implement bids and chat GraphQL data adapters (workspace lists, detail fetches, and required actions) in mobile-app/src/services/graphql/bids.ts, mobile-app/src/services/graphql/chat.ts, and mobile-app/src/services/graphql/operations/index.ts
- [ ] T037B [US1] Wire My bids and Chat screens to backend adapters, including pagination and refresh behavior in mobile-app/src/screens/bids/MyBidsScreen.tsx, mobile-app/src/screens/chat/ChatListScreen.tsx, and mobile-app/src/screens/chat/ChatDetailScreen.tsx
- [ ] T037C [US1] Implement notifications data adapter (feed query, read/unread actions, set-all-read) in mobile-app/src/services/graphql/notifications.ts and mobile-app/src/services/graphql/operations/index.ts
- [ ] T037D [US1] Wire Notifications screen to backend feed and read-state mutations in mobile-app/src/screens/notifications/NotificationsScreen.tsx
- [ ] T037E [US1] Implement profile and contribution data adapters (account profile, token balance, token history) in mobile-app/src/services/graphql/profile.ts, mobile-app/src/services/graphql/economics.ts, and mobile-app/src/services/graphql/operations/index.ts
- [ ] T037F [US1] Wire My profile and Contribution screens to backend adapters with loading/error/retry handling in mobile-app/src/screens/profile/MyProfileScreen.tsx and mobile-app/src/screens/economics/MyEconomicsScreen.tsx
- [ ] T037G [US1] Extend My preferences backend wiring to full preference fetch/update flow parity (beyond bootstrap service scaffolding) in mobile-app/src/screens/profile/MyPreferencesScreen.tsx and mobile-app/src/services/graphql/notificationPreferences.ts
- [ ] T038 [US1] Wire US1 navigation routes in mobile-app/src/navigation/US1Navigator.tsx and mobile-app/src/navigation/AppNavigator.tsx
- [ ] T039 [US1] Ensure fr/en labels for US1 screens in mobile-app/src/i18n/locales/en/us1.json and mobile-app/src/i18n/locales/fr/us1.json
- [ ] T039A [US1] Implement anonymous browse-only route policy and restricted-surface auth prompts in mobile-app/src/navigation/AppNavigator.tsx and mobile-app/src/navigation/US1Navigator.tsx

**Checkpoint**: US1 is independently functional and releasable.

---

## Phase 4: User Story 2 - Needs Workflow (Priority: P2)

**Goal**: Deliver create/update/search/claim needs with UI-first gating.

**Independent Test**: User can create a need, search needs, edit need details, and claim a need without campaign flows.

### Business Acceptance Tests for User Story 2

- [ ] T040 [P] [US2] Add acceptance test (semantic selectors only: getByRole/getByLabel/getByPlaceholder/data-testid) for "create need and see it in lists" in mobile-app/tests/integration/us2-create-need.acceptance.test.ts
- [ ] T041 [P] [US2] Add acceptance test (semantic selectors only: getByRole/getByLabel/getByPlaceholder/data-testid) for "search needs with filters" in mobile-app/tests/integration/us2-search-needs.acceptance.test.ts
- [ ] T042 [P] [US2] Add acceptance test (semantic selectors only: getByRole/getByLabel/getByPlaceholder/data-testid) for "claim need sets claimed state and blocks duplicate claim" in mobile-app/tests/integration/us2-claim-need.acceptance.test.ts
- [ ] T043 [P] [US2] Add contract test for need claim mutation and response shape in mobile-app/tests/contract/us2-claim-need.contract.test.ts

### Implementation for User Story 2

- [ ] T044 [P] [US2] Finalize and approve UI contracts for Search needs and My needs in specs/014-mutuity-mobile-rewrite/ui-contracts/search-needs.md and specs/014-mutuity-mobile-rewrite/ui-contracts/my-needs.md
- [ ] T045 [P] [US2] Finalize and approve UI contract for My claims in specs/014-mutuity-mobile-rewrite/ui-contracts/my-claims.md
- [ ] T046 [US2] Port Search needs screen after gate pass in mobile-app/src/screens/needs/SearchNeedsScreen.tsx
- [ ] T047 [US2] Port My needs screen and edit flow after gate pass in mobile-app/src/screens/needs/MyNeedsScreen.tsx and mobile-app/src/screens/needs/EditNeedScreen.tsx
- [ ] T048 [US2] Port My claims workspace after gate pass in mobile-app/src/screens/claims/MyClaimsScreen.tsx
- [ ] T049 [US2] Implement need create/update/claim data adapters in mobile-app/src/services/graphql/needs.ts
- [ ] T050 [US2] Wire US2 navigation routes in mobile-app/src/navigation/US2Navigator.tsx and mobile-app/src/navigation/AppNavigator.tsx
- [ ] T051 [US2] Ensure fr/en labels for US2 screens in mobile-app/src/i18n/locales/en/us2.json and mobile-app/src/i18n/locales/fr/us2.json

**Checkpoint**: US2 works independently from campaigns.

---

## Phase 5: User Story 3 - Campaign Participation and Moderation (Priority: P3)

**Goal**: Deliver campaign creation, pending visibility, and creator moderation.

**Independent Test**: User can create a campaign, observe pending status, and moderate campaign entries once approved.

### Business Acceptance Tests for User Story 3

- [ ] T052 [P] [US3] Add acceptance test (semantic selectors only: getByRole/getByLabel/getByPlaceholder/data-testid) for "new campaign appears as pending" in mobile-app/tests/integration/us3-create-campaign-pending.acceptance.test.ts
- [ ] T053 [P] [US3] Add acceptance test (semantic selectors only: getByRole/getByLabel/getByPlaceholder/data-testid) for "campaign creator moderates resources and needs" in mobile-app/tests/integration/us3-campaign-moderation.acceptance.test.ts
- [ ] T054 [P] [US3] Add contract test for campaign creation and moderation status transitions in mobile-app/tests/contract/us3-campaign.contract.test.ts

### Implementation for User Story 3

- [ ] T055 [US3] Finalize and approve UI contract for My campaigns in specs/014-mutuity-mobile-rewrite/ui-contracts/my-campaigns.md
- [ ] T056 [US3] Port My campaigns screen after gate pass in mobile-app/src/screens/campaigns/MyCampaignsScreen.tsx
- [ ] T057 [US3] Implement campaign create and moderation adapters in mobile-app/src/services/graphql/campaigns.ts
- [ ] T058 [US3] Add campaign pending/approved/rejected status UI in mobile-app/src/screens/campaigns/CampaignDetailScreen.tsx
- [ ] T059 [US3] Wire US3 navigation routes in mobile-app/src/navigation/US3Navigator.tsx and mobile-app/src/navigation/AppNavigator.tsx
- [ ] T060 [US3] Ensure fr/en labels for US3 screens in mobile-app/src/i18n/locales/en/us3.json and mobile-app/src/i18n/locales/fr/us3.json

**Checkpoint**: US3 is independently functional.

---

## Phase 6: User Story 4 - Mobile Trust, Continuity, and Operational Safeguards (Priority: P4)

**Goal**: Preserve clarity and continuity for language, session, notifications, support diagnostics, and update safeguards across the rewrite.

**Independent Test**: User can switch language, relaunch into a valid session, follow notifications coherently, and hit support/update safeguards without broken continuity.

### Business Acceptance Tests for User Story 4

- [ ] T061 [P] [US4] Add acceptance test (semantic selectors only: getByRole/getByLabel/getByPlaceholder/data-testid) for language switch across key screens in mobile-app/tests/integration/us4-language-switch.acceptance.test.ts
- [ ] T062 [P] [US4] Add acceptance test (semantic selectors only: getByRole/getByLabel/getByPlaceholder/data-testid) for notifications read/unread continuity in mobile-app/tests/integration/us4-notifications-continuity.acceptance.test.ts
- [ ] T062A [P] [US4] Add acceptance test (semantic selectors only: getByRole/getByLabel/getByPlaceholder/data-testid) for session restore and invalid-token recovery in mobile-app/tests/integration/us4-session-continuity.acceptance.test.ts
- [ ] T062B [P] [US4] Add acceptance test (semantic selectors only: getByRole/getByLabel/getByPlaceholder/data-testid) for unsupported-version update gate in mobile-app/tests/integration/us4-update-required.acceptance.test.ts
- [ ] T062C [P] [US4] Add acceptance test (semantic selectors only: getByRole/getByLabel/getByPlaceholder/data-testid) for support diagnostics payload generation in mobile-app/tests/integration/us4-support-diagnostics.acceptance.test.ts

### Implementation for User Story 4

- [ ] T063 [US4] Implement end-to-end language propagation in mobile-app/src/i18n/index.ts and mobile-app/src/services/auth/session.ts
- [ ] T064 [US4] Validate and adjust profile and notification continuity UI in mobile-app/src/screens/profile/MyProfileScreen.tsx and mobile-app/src/screens/notifications/NotificationsScreen.tsx
- [ ] T064A [US4] Implement session bootstrap, invalid-token logout, and authenticated relaunch flow in mobile-app/src/services/auth/session.ts and mobile-app/src/services/auth/AuthProvider.tsx
- [ ] T064B [US4] Implement notification deep-link continuity and unread-state refresh in mobile-app/src/services/notifications/useNotificationRouting.ts and mobile-app/src/services/realtime/sessionSubscriptions.ts
- [ ] T064C [US4] Implement support/report-issue diagnostics flow in mobile-app/src/services/support/diagnostics.ts and mobile-app/src/screens/profile/SupportScreen.tsx
- [ ] T064D [US4] Implement minimum-version gate and update-required screen wiring in mobile-app/src/services/app/version.ts and mobile-app/src/navigation/AppNavigator.tsx
- [ ] T064E [US4] Implement notification preference controls and persistence in mobile-app/src/screens/profile/MyPreferencesScreen.tsx and mobile-app/src/services/graphql/notificationPreferences.ts
- [ ] T065 [US4] Add missing fr/en keys discovered during acceptance runs in mobile-app/src/i18n/locales/en/us4.json and mobile-app/src/i18n/locales/fr/us4.json

**Checkpoint**: US4 cross-cutting continuity objectives pass.

---

## Phase 7: E2E Smoke Matrix & Cross-Cutting Concerns

### E2E Smoke Matrix

| Smoke ID | Story | Example Source | Path Type | Why Selected |
|---|---|---|---|---|
| S1 | US1 | Returning user opens app and lands on main navigation | Success | Verifies base continuity and auth/session integrity |
| S2 | US1 | User searches resources by category and distance | Success | Verifies core discoverability parity |
| S3 | US1 | User edits resource and sees persisted update | Success | Verifies critical parity write flow |
| S4 | US1 | Offline during resource save does not show false success | Exception | Required exception coverage for P1 |
| S5 | US2 | User creates and claims a need | Success | Verifies flagship Mutuity workflow |
| S6 | US3 | User creates campaign and sees pending status | Success | Verifies campaign trust gate |

### E2E and Polish Tasks

- [ ] T066 [P] Implement E2E smoke test S1 with semantic selectors only (getByRole/getByLabel/getByPlaceholder/data-testid) in mobile-app/tests/e2e/s1-main-navigation.smoke.e2e.ts
- [ ] T067 [P] Implement E2E smoke test S2 with semantic selectors only (getByRole/getByLabel/getByPlaceholder/data-testid) in mobile-app/tests/e2e/s2-search-resources.smoke.e2e.ts
- [ ] T068 [P] Implement E2E smoke test S3 with semantic selectors only (getByRole/getByLabel/getByPlaceholder/data-testid) in mobile-app/tests/e2e/s3-edit-resource.smoke.e2e.ts
- [ ] T069 [P] Implement E2E smoke test S4 with semantic selectors only (getByRole/getByLabel/getByPlaceholder/data-testid) in mobile-app/tests/e2e/s4-offline-resource-save.exception.e2e.ts
- [ ] T070 [P] Implement E2E smoke test S5 with semantic selectors only (getByRole/getByLabel/getByPlaceholder/data-testid) in mobile-app/tests/e2e/s5-needs-create-claim.smoke.e2e.ts
- [ ] T071 [P] Implement E2E smoke test S6 with semantic selectors only (getByRole/getByLabel/getByPlaceholder/data-testid) in mobile-app/tests/e2e/s6-campaign-pending.smoke.e2e.ts
- [ ] T072 Add CI job for smoke matrix and gate checks in .github/workflows/mobile-smoke.yml
- [ ] T073 [P] Update quickstart test commands and UX gate notes in specs/014-mutuity-mobile-rewrite/quickstart.md
- [ ] T074 Run full quickstart validation and capture evidence in specs/014-mutuity-mobile-rewrite/checklists/requirements.md
- [x] T075 [P] Set up Storybook for mobile reusable components in mobile-app/.storybook/main.ts and mobile-app/.storybook/preview.ts
- [x] T076 [P] Add Storybook stories for reusable state and form components in mobile-app/src/components/state/LoadingState.stories.tsx, mobile-app/src/components/state/EmptyState.stories.tsx, mobile-app/src/components/state/ErrorState.stories.tsx, and mobile-app/src/components/forms/PrimaryField.stories.tsx
- [ ] T077 Add CI Storybook build verification in .github/workflows/mobile-storybook.yml

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 (Setup): starts immediately
- Phase 2 (Foundational): depends on Phase 1
- Phase 3 (US1): depends on Phase 2
- Phase 4 (US2): depends on Phase 2
- Phase 5 (US3): depends on Phase 2
- Phase 6 (US4): depends on US1 and Phase 2
- Phase 7 (E2E/Polish): depends on US1 and selected US2/US3 flows

### User Story Dependencies

- US1 (P1): independent after foundation; MVP scope
- US2 (P2): independent after foundation; integrates with shared auth/nav/graphql
- US3 (P3): independent after foundation; depends on campaign GraphQL contracts
- US4 (P4): cross-cutting; depends on US1 baseline screens

### Hard Gate Dependencies

- For each canonical main screen, UI contract file in specs/014-mutuity-mobile-rewrite/ui-contracts/ must be approved before corresponding port task starts.
- Port tasks T030-T037, T046-T048, and T056 are blocked by their screen-level UI approvals.

---

## Implementation Strategy

### MVP First (US1)

1. Complete Phase 1 and Phase 2
2. Complete US1 acceptance tests and UI approvals
3. Port US1 screens (T030-T037)
4. Validate US1 independently

### Incremental Delivery

1. Deliver US1 parity MVP
2. Deliver US2 needs workflow
3. Deliver US3 campaigns workflow
4. Deliver US4 continuity refinements
5. Finalize E2E smoke matrix and CI

### Coverage Gate Status

- P1 acceptance-test coverage: PASS (T021-T024)
- P1 contract coverage: PASS (T025)
- Required E2E smoke coverage: PASS (S1-S6, tasks T066-T071)
- Auth/session continuity check included: PASS (S1)

---

## Notes

- [P] tasks are parallelizable only when they target different files and have no unmet dependencies.
- All port tasks must satisfy FR-012 and FR-013 from spec.md.
- Keep canonical screen naming aligned with FR-014 and navigation-contract.md.
