# Tasks: Campaign And Need Management

**Input**: Design documents from `/specs/001-campaign-needs/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependency)
- **[Story]**: User story scope (`US1`, `US2`, `US3`, `US4`, `US5`)
- All task descriptions include concrete file paths

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Create initial folder skeleton for `backend/`, `frontend/`, and `database/`
- [x] T002 [P] Initialize backend TypeScript project in `backend/` with PostGraphile server foundation
- [x] T003 [P] Initialize frontend Next.js project in `frontend/` with MUI + i18n baseline
- [x] T004 [P] Configure shared linting/formatting and strict TypeScript settings in `backend/` and `frontend/`
- [x] T005 Configure environment variables and local dev bootstrap in `backend/.env.example` and `frontend/.env.example` including PostGraphile and Graphile Worker settings
- [x] T006 Create initial migration framework in `database/migrations/`
- [x] T007 [P] Initialize Graphile Worker runtime in `backend/src/worker/` with base worker bootstrap

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T008 Create base account role model, grants, and RLS scaffolding in `database/migrations/001_roles_grants_rls.sql`
- [x] T009 [P] Add DB enums and base tables for campaign and need domains in `database/migrations/002_base_campaign_need.sql`
- [x] T010 [P] Add audit logging utilities and audit table in `database/migrations/003_audit.sql`
- [x] T011 Configure PostGraphile schema exposure and plugin settings in `backend/src/postgraphile/server.ts`
- [x] T012 Add common SQL-level validation helpers for date and numeric rules in `database/functions/validation.sql`
- [x] T013 Add i18n key namespaces for campaigns and needs in `frontend/src/i18n/messages/fr.json` and `frontend/src/i18n/messages/en.json`

## Phase 3: User Story 1 - Account Creates Campaign (Priority: P1)

**Goal**: Authenticated accounts can create valid campaigns that start in pending moderation.

**Independent Test**: Submit valid and invalid campaign payloads and verify status/validation behavior.

### Tests (US1)

- [x] T014 [P] [US1] Add integration tests for campaign creation validation in `backend/tests/integration/campaign-create.spec.ts`
- [x] T015 [P] [US1] Add GraphQL contract tests for PostGraphile-exposed `createCampaign` mutation in `backend/tests/contract/campaign.contract.spec.ts`
- [x] T060 [P] [US1] Add integration tests for unauthenticated `createCampaign` mutation returning sanitized `UNAUTHENTICATED` error in `backend/tests/integration/campaign-create-auth.spec.ts`

### Implementation (US1)

- [x] T016 [US1] Implement campaign table constraints and indexes in `database/migrations/004_campaign_constraints.sql`
- [x] T017 [US1] Implement SQL function `create_campaign` in `database/functions/campaign/create_campaign.sql`
- [x] T018 [US1] Expose `create_campaign` through PostGraphile schema configuration in `backend/src/postgraphile/server.ts`
- [x] T019 [US1] Build campaign creation form page in `frontend/src/features/campaigns/CreateCampaignPage.tsx`
- [x] T020 [US1] Add frontend validation schema for campaign creation in `frontend/src/features/campaigns/createCampaign.validation.ts`
- [x] T021 [US1] Add pending-status handling in campaign list GraphQL queries from frontend in `frontend/src/features/campaigns/campaigns.queries.ts`

## Phase 4: User Story 2 - Administrator Moderates With Note (Priority: P1)

**Goal**: Administrator can add moderation notes that creators can view in history.

**Independent Test**: Administrator creates notes, non-admin denied, creator sees chronological notes.

### Tests (US2)

- [x] T022 [P] [US2] Add integration tests for moderation note authorization in `backend/tests/integration/campaign-moderation-note.spec.ts`
- [x] T023 [P] [US2] Add contract tests for PostGraphile-exposed `addCampaignModerationNote` in `backend/tests/contract/campaign-moderation.contract.spec.ts`

### Implementation (US2)

- [x] T024 [US2] Create moderation notes migration in `database/migrations/005_campaign_moderation_notes.sql`
- [x] T025 [US2] Implement SQL function `add_campaign_moderation_note` in `database/functions/campaign/add_campaign_moderation_note.sql`
- [x] T026 [US2] Expose moderation-note mutation through PostGraphile in `backend/src/postgraphile/server.ts`
- [x] T027 [US2] Add campaign moderation history GraphQL query in frontend data layer `frontend/src/features/campaigns/campaignModeration.queries.ts`
- [x] T028 [US2] Build administrator moderation notes panel UI in `frontend/src/features/campaigns/ModerationNotesPanel.tsx`
- [x] T029 [US2] Build creator-facing moderation history UI in `frontend/src/features/campaigns/CampaignModerationHistory.tsx`

## Phase 5: User Story 3 - Administrator Approves Campaign (Priority: P1)

**Goal**: Administrator can approve campaign and make it visible publicly.

**Independent Test**: Administrator approval updates status and public listing visibility.

### Tests (US3)

- [x] T030 [P] [US3] Add integration tests for campaign approval authorization and visibility in `backend/tests/integration/campaign-approval.spec.ts`
- [x] T031 [P] [US3] Add contract tests for PostGraphile-exposed `approveCampaign` mutation in `backend/tests/contract/campaign-approval.contract.spec.ts`

### Implementation (US3)

- [x] T032 [US3] Implement SQL function `approve_campaign` in `database/functions/campaign/approve_campaign.sql`
- [x] T033 [US3] Expose approval mutation through PostGraphile in `backend/src/postgraphile/server.ts`
- [x] T034 [US3] Update public campaign query for approved + active windows in `frontend/src/features/campaigns/campaigns.queries.ts`
- [x] T035 [US3] Build administrator approval action in `frontend/src/features/campaigns/PendingCampaignsPage.tsx`
- [x] T036 [US3] Add public campaigns page in `frontend/src/features/campaigns/PublicCampaignsPage.tsx`

## Phase 6: User Story 4 - Account Creates Need (Priority: P1)

**Goal**: Authenticated accounts can create standalone or campaign-linked needs with intensity and optional Topes.

**Independent Test**: Create standalone and linked needs with valid/invalid intensity and Topes combinations.

### Tests (US4)

- [x] T037 [P] [US4] Add integration tests for need creation and Topes-by-intensity validation in `backend/tests/integration/need-create.spec.ts`
- [x] T038 [P] [US4] Add contract tests for PostGraphile-exposed `createNeed` mutation in `backend/tests/contract/need.contract.spec.ts`
- [x] T061 [P] [US4] Add integration tests for unauthenticated `createNeed` mutation returning sanitized `UNAUTHENTICATED` error in `backend/tests/integration/need-create-auth.spec.ts`

### Implementation (US4)

- [x] T039 [US4] Create needs migration with optional Topes and nature flags in `database/migrations/007_needs.sql`
- [x] T040 [US4] Create campaign-need relation migration with pending status in `database/migrations/008_campaign_need.sql`
- [x] T041 [US4] Implement SQL function `create_need` in `database/functions/need/create_need.sql`
- [x] T042 [US4] Implement SQL helper `validate_campaign_linkability` in `database/functions/campaign/validate_campaign_linkability.sql`
- [x] T043 [US4] Expose need creation mutation through PostGraphile in `backend/src/postgraphile/server.ts`
- [x] T044 [US4] Build need creation page and form in `frontend/src/features/needs/CreateNeedPage.tsx`
- [x] T045 [US4] Add frontend Topes range validation by intensity in `frontend/src/features/needs/createNeed.validation.ts`

## Phase 7: User Story 5 - Campaign Creator Accepts Or Rejects Joined Needs (Priority: P2)

**Goal**: Campaign creator can triage linked needs (accept/reject) with authorization safeguards.

**Independent Test**: Creator triages linked needs; non-creator denied; transitions audited.

### Tests (US5)

- [x] T046 [P] [US5] Add integration tests for triage transitions and permissions in `backend/tests/integration/campaign-need-triage.spec.ts`
- [x] T047 [P] [US5] Add contract tests for PostGraphile-exposed `acceptCampaignNeed` and `rejectCampaignNeed` in `backend/tests/contract/campaign-need-triage.contract.spec.ts`

### Implementation (US5)

- [x] T048 [US5] Implement SQL functions `accept_campaign_need` and `reject_campaign_need` in `database/functions/campaign_need/`
- [x] T049 [US5] Expose triage functions through PostGraphile in `backend/src/postgraphile/server.ts`
- [x] T050 [US5] Add campaign creator joined-needs GraphQL query in `frontend/src/features/campaigns/campaignNeedTriage.queries.ts`
- [x] T051 [US5] Build campaign creator triage UI in `frontend/src/features/campaigns/CampaignNeedTriagePage.tsx`
- [x] T052 [US5] Add optimistic UI updates and rollback handling for triage actions in `frontend/src/features/campaigns/CampaignNeedTriagePage.tsx`

## Phase 8: Polish & Cross-Cutting

- [x] T053 [P] Add Storybook stories for new reusable campaign and need components in `frontend/src/components/**/*.stories.tsx`
- [x] T054 [P] Finalize i18n coverage for all new user-facing strings in `frontend/src/i18n/messages/fr.json` and `frontend/src/i18n/messages/en.json`
- [x] T055 Add audit trail verification tests for campaign status and need triage changes in `backend/tests/integration/audit-trail.spec.ts`
- [x] T056 Add Graphile Worker bootstrap smoke test in `backend/tests/integration/worker-bootstrap.spec.ts`
- [x] T057 Add recurring worker task skeleton for expiration routines in `backend/src/worker/tasks/expire-needs.ts`
- [x] T058 Run and document quickstart validation in `specs/001-campaign-needs/quickstart.md`
- [x] T059 Update feature documentation links and architecture notes in `specs/001-campaign-needs/research.md` if implementation diverges

## Dependencies & Execution Order

- Setup tasks (T001-T007) first.
- Foundational tasks (T008-T013) block all user stories.
- US1-US4 are P1 and can be developed incrementally after foundations.
- US5 depends on US4 relation model and campaign ownership checks.
- Polish phase follows completion of targeted user stories.

## Parallel Execution Examples

- T014 and T015 can run in parallel.
- T022 and T023 can run in parallel.
- T037 and T038 can run in parallel.
- T046 and T047 can run in parallel.
- T053 and T054 can run in parallel.

## Implementation Strategy

1. Deliver MVP by completing US1, US2, US3, and US4 first.
2. Validate full moderation and creation loops end-to-end.
3. Add US5 triage workflow.
4. Complete polish and compliance checks before release.
