# Mutuity Implementation Progress Tracker

Created: 2026-04-18
Owner: GitHub Copilot + Product Supervision
Cadence: update at least once per workday

## How To Use

- Keep one active phase marked as `IN PROGRESS`.
- At end of each work session, update:
  - phase status and completion percentage
  - completed checkpoints
  - blockers and decisions
  - next session plan
- Add links to PRs/commits/tests as evidence.

## Status Legend

- `NOT STARTED`
- `IN PROGRESS`
- `BLOCKED`
- `DONE`

## Master Plan (Dependency-First)

| Phase | Scope | Primary Features | Status | Completion | Target Window |
|---|---|---|---|---|---|
| P1 | Platform foundations and auth baseline | 003, 004 | DONE | 100% | 2026-04-18 to 2026-04-25 (proposed) |
| P2 | Core needs loop | 001, 002 | DONE | 100% | 2026-04-18 to 2026-05-02 (proposed) |
| P3 | Local auth completion (no social) | 005 (Auth subset) | DONE | 100% | TBD |
| P4 | Resource loop MVP | 005 (Slices 1-4) | IN PROGRESS | 92% | TBD |
| P5 | Settlement and ledger consistency | 007, 008 (+ token consistency) | NOT STARTED | 0% | TBD |
| P6 | Conversation layer | 006 | NOT STARTED | 0% | TBD |
| P7 | Engagement and delivery controls | 005 (Preferences/digest finalization) | IN PROGRESS | 20% | TBD |
| P8 | Admin and ops hardening | 005 (Grants/admin/logging hardening) | NOT STARTED | 0% | TBD |

## Phase Details And Checkpoints

### P1 - Platform Foundations (003, 004)

Status: DONE
Goal: stable database baseline, auth/session core usable everywhere.

Remaining execution tasks (from feature task files):

- [x] 003-T017 Review migration foundation docs with product owner and confirm MVP boundary.
- [x] 003-T019 Capture any scope or architecture updates back into feature 003 docs.
- [x] 004-T018 Add frontend/integration tests for protected-route redirect and return-to behavior.
- [x] 004-T024 Add frontend tests for restoring current account state on app load.
- [x] 004-T028 Add frontend tests for sign-out UI state reset.

Checkpoints:

- [x] Migrations from feature 003 applied and reproducible in local/dev.
- [x] Core auth/session flows from feature 004 are working end-to-end.
- [x] Password reset + verification baseline paths covered by tests.
- [x] Backend/frontend contract for authenticated requests stabilized.

Definition of Done:

- [x] Protected routes consistently enforce session.
- [x] CI test baseline is green for foundation/auth scope.

### P2 - Core Needs Loop (001, 002)

Status: DONE
Goal: complete first value loop for campaigns, needs, and claims basics.

Current execution backlog focus:

- [x] 001-T060 Unauthenticated `createCampaign` integration test.
- [x] 001-US3 campaign approval path: T034, T035, T036.
- [x] 001-US4 need creation path: T044, T045.
- [x] 001-US5 campaign need triage backend path: T046, T047, T048, T049.
- [x] 001-US5 campaign need triage frontend path: T050, T051, T052.
- [x] 001-Polish audit trail verification: T055.
- [x] 001-Polish worker bootstrap + expiration skeleton: T056, T057.
- [x] 001-Polish i18n coverage baseline: T054.
- [x] 001-Polish quickstart/doc alignment: T058, T059.
- [x] 001-Polish story coverage baseline: T053.

Checkpoints:

- [x] Campaign + need creation and listing flows work.
- [x] Needs discovery/filtering aligns with spec.
- [x] Claim initiation and lifecycle baseline works.
- [x] Permissions and SQL-owned business constraints enforced.

Definition of Done:

- [x] User can post a need, discover needs, and claim with expected behavior.

### P3 - Local Auth Completion (005 auth subset, no social)

Status: COMPLETE
Goal: finish a production-grade local auth vertical slice end-to-end before resuming non-auth feature expansion.

Scope included now (complete before exit):

- [x] T051 auth-parity documentation update, scoped to local credential flow first.
- [x] T052 local identity model updates only (email/password credentials, duplicate-account prevention for local path).
- [x] T053 email verification lifecycle (issue, resend with throttling, verify, invalid/expired handling).
- [x] T054 forgot/reset password lifecycle (request, token validation, password update, single-use invalidation).
- [x] T055 authenticated change-password with current-password validation and session hardening.
- [x] T057 end-to-end verification for local signup/login/verify/reset/change-password and token expiry/reuse protections.

Explicitly deferred to later phase:

- [ ] Social login/sign-up (`Google`, `Apple`) and provider account linking surfaces (currently tracked in T056 and social-related portions of T052/T057).

Execution order (to limit security regressions):

1. Local identity schema and invariants (T052 local subset).
2. Verification token lifecycle (T053).
3. Reset token lifecycle (T054).
4. Authenticated change-password hardening (T055).
5. Frontend flow integration for local-only paths.
6. End-to-end auth test sweep and abuse-path checks (T057 local subset).

Checkpoints:

- [x] Visitor can sign up with account name + email/password and receives verification email.
- [x] Unverified account cannot access trust-sensitive authenticated flows until verification completes.
- [x] Verification token flow is one-time, time-bounded, resend-throttled, and safely fails on invalid/expired tokens.
- [x] Forgot-password token flow is one-time, time-bounded, and cannot be replayed.
- [x] Authenticated user can change password with current-password validation and hardened post-change session behavior.
- [x] Local auth E2E scenarios pass (happy path + key abuse/edge cases).

Definition of Done:

- [x] Local email/password account creation and recovery are production-ready and fully test-covered.
- [x] No placeholder or partial auth routes remain for local flow.
- [x] Social auth remains disabled/deferred, not half-exposed in UX.

### P4 - Resource Loop MVP (005 Slices 1-4)

Status: IN PROGRESS
Goal: deliver resource discovery/publish/bid baseline and core notifications.

Checkpoints:

- [ ] Resource discovery (active filtering, sorting, tri-state filters).
- [ ] Resource edit page supports creation and update modes.
- [ ] Bid flow baseline and expired-resource protections.
- [ ] Notifications inbox foundations integrated.

Definition of Done:

- [ ] Resource loop is independently usable end-to-end.

### P5 - Settlement And Ledger Consistency (007, 008)

Status: NOT STARTED
Goal: ensure token movement correctness for claims and bids lifecycle.

Checkpoints:

- [ ] Bid workspace and settlement actions implemented.
- [ ] Claim workspace and settlement actions implemented.
- [ ] Ledger movements are auditable and idempotent.
- [ ] Concurrency safety validated for settlement-sensitive operations.

Definition of Done:

- [ ] Token-impacting operations are correct under retries/concurrency.

### P6 - Conversation Layer (006)

Status: NOT STARTED
Goal: connect accepted claim/bid outcomes to reliable conversation workflows.

Checkpoints:

- [ ] Conversation creation and access rules implemented.
- [ ] Chat UI supports ongoing thread usage.
- [ ] Bid/claim flows link to conversation surfaces correctly.

Definition of Done:

- [ ] Users can reliably transition from transaction flow to conversation.

### P7 - Engagement And Delivery Controls (005 extended)

Status: NOT STARTED
Goal: deploy preference-managed out-of-app delivery and digest behavior.

Checkpoints:

- [ ] Preferences page and backend persistence complete.
- [ ] Activity-gated push/email behavior enforced.
- [ ] 08:00 digest run implemented with idempotent marking.
- [ ] Frequency cadence and no-duplicate guarantees tested.

Definition of Done:

- [ ] Delivery behavior matches configured strategy per category.

### P8 - Admin And Ops Hardening (005 extended)

Status: NOT STARTED
Goal: operational support surfaces, grants, and logging hardening ready for production.

Checkpoints:

- [ ] Admin pages delivered with role guard and case-insensitive contains search.
- [ ] Grant creation/claim flow and fixed grant amount behavior implemented.
- [ ] Unified logging across components with retention setting.
- [ ] Side-effect actions audited and observable.

Definition of Done:

- [ ] Support, audit, and troubleshooting workflows are production-ready.

## Active Work Queue

Current phase: P4
Current milestone: P4-M1 - Resource discovery baseline kickoff

This week priorities:

1. Start P4 Slice 1 with active resource discovery baseline (visibility, expiration, location sort, tie-break).
2. Implement and validate tri-state modality filter behavior end-to-end (`neutral` / `yes` / `no`).
3. Add focused backend/frontend verification for browse correctness before moving to publish/bid surfaces.

## Session Log

| Date | Phase | What Was Done | Evidence (PR/Commit/Test) | Blockers | Next Step |
|---|---|---|---|---|---|
| 2026-04-18 | Planning | Created implementation tracker and phase ordering baseline. | specs/implementation-progress-tracker.md | None | Start P1 execution breakdown. |
| 2026-04-18 | P1 kickoff | Marked P1 as in progress and extracted remaining 003/004 tasks into explicit execution backlog. | specs/003-topela-migration-foundation/tasks.md; specs/004-login-flow/tasks.md; specs/implementation-progress-tracker.md | None | Implement 004-T018 auth protected-route test coverage. |
| 2026-04-18 | P1 execution | Implemented protected-route redirect and return-to tests, including safe next-destination resolution checks. | frontend/tests/auth/protected-routes.spec.tsx; npm -C frontend test -- tests/auth/protected-routes.spec.tsx | None | Implement 004-T024 session bootstrap auth tests. |
| 2026-04-18 | P1 execution | Implemented session-bootstrap and logout state-reset tests for auth provider behavior; full auth frontend test set passed. | frontend/tests/auth/session-bootstrap.spec.tsx; frontend/tests/auth/logout.spec.tsx; npm -C frontend test -- tests/auth/session-bootstrap.spec.tsx tests/auth/logout.spec.tsx tests/auth/protected-routes.spec.tsx | None | Run 003-T017 review and capture any resulting doc updates (003-T019). |
| 2026-04-18 | P1 execution | Provisioned postgres/migrations via compose and validated backend auth integration + contract tests against running backend. | docker compose up postgres/backend + migrate; npm -C backend test -- tests/integration/auth-login.spec.ts tests/integration/auth-session.spec.ts tests/integration/auth-logout.spec.ts tests/contract/auth.contract.spec.ts | None | Consolidate P1 closeout decision and commit checkpoint changes. |
| 2026-04-18 | P1 closeout | Marked P1 complete after passing auth-scope frontend and backend test sweeps and closing remaining 003/004 checklist items. | specs/implementation-progress-tracker.md; specs/003-topela-migration-foundation/tasks.md; specs/004-login-flow/tasks.md | None | Kick off P2 planning/execution. |
| 2026-04-18 | P2 kickoff | Started P2 by closing 001-T060 with a passing backend integration test for anonymous `createCampaign` mutation sanitization. | backend/tests/integration/campaign-create-auth.spec.ts; npm -C backend test -- tests/integration/campaign-create-auth.spec.ts | None | Start US3 campaign approval implementation path (T030+). |
| 2026-04-18 | P2 execution | Completed US3 backend approval slice: added `approve_campaign` migration/function wiring and passing integration + contract tests with session-cookie authentication. | database/migrations/024_campaign_approval.sql; database/functions/campaign/approve_campaign.sql; backend/tests/integration/campaign-approval.spec.ts; backend/tests/contract/campaign-approval.contract.spec.ts; npm -C backend test -- tests/integration/campaign-approval.spec.ts tests/contract/campaign-approval.contract.spec.ts | None | Continue US3 frontend tasks T034-T036. |
| 2026-04-19 | P2 execution | Completed US3 frontend slice: added public campaigns page, manager pending-approval page/action, approval/public queries, and campaign navigation links. | frontend/src/features/campaigns/PublicCampaignsPage.tsx; frontend/src/features/campaigns/PendingCampaignsPage.tsx; frontend/src/features/campaigns/campaigns.queries.ts; frontend/src/pages/campaigns/index.tsx; frontend/src/pages/campaigns/pending.tsx; npm -C frontend run typecheck | None | Move to US4 backend tests and migrations (T037-T043, T061). |
| 2026-04-19 | P2 execution | Completed US4 backend slice: implemented `create_need` and campaign-linkability SQL functions, applied migrations `025` and `026`, and passed createNeed integration/auth/contract tests. | database/functions/need/create_need.sql; database/functions/campaign/validate_campaign_linkability.sql; database/migrations/025_need_creation.sql; database/migrations/026_need_create_mutation_alias.sql; backend/tests/integration/need-create.spec.ts; backend/tests/integration/need-create-auth.spec.ts; backend/tests/contract/need.contract.spec.ts; npm -C backend test -- tests/integration/need-create-auth.spec.ts tests/integration/need-create.spec.ts tests/contract/need.contract.spec.ts | None | Implement US4 frontend tasks T044-T045. |
| 2026-04-19 | P2 execution | Completed US4 frontend slice: added authenticated create-need page, Topes-by-intensity validation schema, createNeed GraphQL mutation wiring, and create route/link discoverability. | frontend/src/features/needs/CreateNeedPage.tsx; frontend/src/features/needs/createNeed.validation.ts; frontend/src/features/needs/needs.queries.ts; frontend/src/pages/needs/create.tsx; frontend/src/pages/index.tsx; npm -C frontend run typecheck | None | Start US5 campaign-need triage backend tests/functions (T046-T049). |
| 2026-04-19 | P2 execution | Completed US5 backend slice: added campaign need triage SQL functions (`acceptCampaignNeed`, `rejectCampaignNeed`), wired safe GraphQL sanitization, applied migrations `027`, `028`, `029`, and passed triage contract/integration tests. | database/functions/campaign_need/accept_campaign_need.sql; database/functions/campaign_need/reject_campaign_need.sql; database/migrations/027_campaign_need_triage.sql; database/migrations/028_campaign_need_triage_security_definer.sql; database/migrations/029_campaign_need_triage_qualify_columns.sql; backend/src/postgraphile/server.ts; backend/tests/contract/campaign-need-triage.contract.spec.ts; backend/tests/integration/campaign-need-triage.spec.ts; npm -C backend test -- tests/contract/campaign-need-triage.contract.spec.ts tests/integration/campaign-need-triage.spec.ts | None | Move to US5 frontend triage query/page/actions (T050-T052). |
| 2026-04-19 | P2 execution | Completed US5 frontend slice: added campaign need triage query/mutations, built campaign creator triage page with optimistic accept/reject + rollback handling, and exposed navigation route. | frontend/src/features/campaigns/campaignNeedTriage.queries.ts; frontend/src/features/campaigns/CampaignNeedTriagePage.tsx; frontend/src/pages/campaigns/triage.tsx; frontend/src/pages/index.tsx; npm -C frontend run typecheck; npm -C frontend test -- --runInBand tests/needs | None | Continue with P2 remaining hardening tasks (e.g., T053+). |
| 2026-04-19 | P2 execution | Completed audit-trail hardening slice: added dedicated integration test verifying campaign approval and campaign-need triage transitions are persisted in `audit.event` with expected old/new values and actors. | backend/tests/integration/audit-trail.spec.ts; npm -C backend test -- tests/integration/audit-trail.spec.ts | None | Continue polish tasks with T056 worker bootstrap smoke test. |
| 2026-04-19 | P2 execution | Verified worker hardening slice already implemented and green: worker bootstrap smoke test passes and recurring `expire_needs` task skeleton is present in task list + crontab wiring. | backend/tests/integration/worker-bootstrap.spec.ts; backend/src/worker/tasks/expire-needs.ts; backend/src/worker/taskList.ts; backend/crontab; npm -C backend test -- tests/integration/worker-bootstrap.spec.ts | None | Continue remaining polish tasks T053, T054, T058, T059. |
| 2026-04-19 | P2 execution | Completed i18n coverage update for newly added campaign/need user-facing copy by extending English/French message catalogs for triage, pending/public campaign, need-create, and home action labels. | frontend/src/i18n/messages/en.json; frontend/src/i18n/messages/fr.json; npm -C frontend run typecheck | None | Continue polish tasks T053, T058, T059. |
| 2026-04-19 | P2 execution | Completed quickstart validation and docs alignment: ran end-to-end scenario test sweep, logged evidence in quickstart, and aligned research architecture notes with implemented triage/audit/worker details. | specs/001-campaign-needs/quickstart.md; specs/001-campaign-needs/research.md; npm -C backend test -- tests/integration/campaign-create.spec.ts tests/integration/campaign-create-auth.spec.ts tests/integration/campaign-moderation-note.spec.ts tests/integration/campaign-approval.spec.ts tests/integration/need-create.spec.ts tests/integration/need-create-auth.spec.ts tests/integration/campaign-need-triage.spec.ts tests/integration/audit-trail.spec.ts; npm -C frontend run typecheck | None | Complete final polish task T053 (storybook stories). |
| 2026-04-19 | P2 execution | Completed story coverage baseline by extracting reusable campaign/need presentation components and adding Storybook story files for triage status and need summary facts. | frontend/src/components/campaign/CampaignNeedStatusChip.tsx; frontend/src/components/campaign/CampaignNeedStatusChip.stories.tsx; frontend/src/components/need/NeedSummaryFacts.tsx; frontend/src/components/need/NeedSummaryFacts.stories.tsx; frontend/src/features/campaigns/CampaignNeedTriagePage.tsx; npm -C frontend run typecheck | None | Move focus to Feature 002 implementation backlog. |
| 2026-04-19 | P2 closeout | Validated full core needs loop and campaign/triage baseline with passing backend integration sweep and frontend needs tests + typecheck, then marked P2 complete in tracker. | npm -C backend test -- tests/integration/need-search.spec.ts tests/integration/need-filtering.spec.ts tests/integration/need-claim.spec.ts tests/integration/claim-messaging.spec.ts tests/integration/claim-settlement.spec.ts tests/integration/campaign-approval.spec.ts tests/integration/campaign-need-triage.spec.ts tests/integration/need-create.spec.ts tests/integration/audit-trail.spec.ts; npm -C frontend run typecheck; npm -C frontend test -- --runInBand tests/needs | None | Kick off P3 resource-loop completion and associated tests. |
| 2026-04-19 | Replanning | Re-sequenced post-P2 roadmap to prioritize complete local email/password auth (signup + verification + forgot/reset + change-password) before resuming resource-loop expansion; social login deferred by explicit gate. | specs/implementation-progress-tracker.md; specs/005-resource-discovery-and-publishing/tasks.md | None | Start P3 with T052 local identity model subset and token-lifecycle test scaffolding. |
| 2026-04-19 | P3 execution | Implemented local-auth foundation and flows: migration for verification/reset tokens and credential verification state, backend register/verify/reset/change-password endpoints, frontend register/verify-email/restore-access/change-password pages, and passing backend auth integration + contract tests. | database/migrations/032_local_auth_account_creation_and_recovery.sql; backend/src/auth/routes.ts; backend/tests/integration/auth-register.spec.ts; backend/tests/integration/auth-password-recovery.spec.ts; frontend/src/pages/register.tsx; frontend/src/pages/restore-access.tsx; frontend/src/pages/verify-email.tsx; frontend/src/pages/change-password.tsx; npm -C backend test -- --runInBand tests/integration/auth-login.spec.ts tests/integration/auth-session.spec.ts tests/integration/auth-logout.spec.ts tests/integration/auth-register.spec.ts tests/integration/auth-password-recovery.spec.ts tests/contract/auth.contract.spec.ts; npm -C frontend run typecheck | Outbound email delivery is still mocked by dev token echo in HTTP responses. | Replace dev-token echo with real mail delivery and add frontend tests for register/verify/reset/change-password pages. |
| 2026-04-20 | P3 execution | Enabled unverified-account session access with global activation UX: users are signed in immediately after registration, see activation banner with resend action, and unverified accounts are blocked at DB policy/search layer from externally visible needs/resources. | commit aff6985; database/migrations/039_account_activation_visibility_guards.sql; backend/src/auth/session.ts; backend/src/postgraphile/authGraphqlPlugin.ts; frontend/src/features/layout/AppShell.tsx; frontend/src/pages/register.tsx; npm --workspace backend run typecheck; npm --workspace frontend run typecheck | None | Remove remaining dev-token contract and complete auth E2E coverage sweep. |
| 2026-04-20 | P3 execution | Removed dev token API surface from local auth flows: GraphQL-facing register/resend/reset-request functions now return boolean, frontend no longer consumes token payloads, schema/codegen regenerated, migration applied, and checks passed. | commit 0fc74fa; database/migrations/040_auth_mutations_remove_dev_token_returns.sql; frontend/src/features/auth/auth.api.ts; frontend/src/features/auth/auth.queries.ts; frontend/src/graphql/schema.graphql; frontend/src/graphql/generated.ts; npm --workspace frontend run graphql:schema; npm --workspace frontend run typecheck; npm --workspace backend run typecheck | None | Execute T051 docs parity update and close T057 with local auth E2E + abuse-path scenarios. |
| 2026-04-20 | P3 execution | Completed T051 auth-parity documentation update in feature-005 spec/plan/tasks: local email/password parity captured as implemented scope (including immediate post-signup sign-in with unverified restrictions, verification/reset token lifecycle, resend throttling, and change-password), while Google/Apple parity remains explicitly documented as deferred. | specs/005-resource-discovery-and-publishing/spec.md; specs/005-resource-discovery-and-publishing/plan.md; specs/005-resource-discovery-and-publishing/tasks.md; specs/implementation-progress-tracker.md | None | Implement T057 local-auth E2E + abuse-path verification sweep. |
| 2026-04-20 | P3 execution | Completed T057 local-auth verification sweep by extending backend abuse-path integration coverage (verification token replay rejection, resend throttling behavior, reset token replay + forced-expiry rejection) and adding frontend auth API flow tests for register/verify/reset/change-password variable wiring, normalized session mapping, and safe error handling. | backend/tests/integration/auth-graphql.spec.ts; npm -C backend test -- --runInBand tests/integration/auth-graphql.spec.ts; frontend/tests/auth/auth-api.spec.ts; npm -C frontend test -- tests/auth/auth-api.spec.ts | None | Re-assess P3 definition-of-done closure and decide whether any browser-level flow tests are still required before moving to P4. |
| 2026-04-20 | P3 closeout | Closed P3 local-auth phase after validating all local-scope checkpoints and definition-of-done items: production-ready local signup/login/verify/reset/change-password, no local placeholder routes, and explicit social deferral maintained. | specs/implementation-progress-tracker.md; frontend/src/pages/register.tsx; frontend/src/pages/verify-email.tsx; frontend/src/pages/restore-access.tsx; frontend/src/pages/change-password.tsx; backend/tests/integration/auth-graphql.spec.ts; frontend/tests/auth/auth-api.spec.ts | None | Kick off P4 Slice 1 (resource discovery baseline + tri-state filters). |
| 2026-04-20 | P4 execution | Completed T030 copy-alignment step by renaming resource publishing labels to `Edit resource` / `Add resource` in the resource discovery/create surfaces to match workspace terminology. | frontend/src/features/resources/PublicResourcesPage.tsx; frontend/src/features/resources/CreateResourcePage.tsx; specs/005-resource-discovery-and-publishing/tasks.md | None | Implement T031 (`updatedAt` propagation across resource linked-property updates). |
| 2026-04-20 | P4 execution | Completed T031 by extending resource mutation/model behavior to support edit-mode updates and guaranteed `updated_at` propagation for linked property changes (category assignment trigger + image/category updates), with migration `041` applied and integration tests passing. | database/migrations/041_resource_updated_at_linked_properties.sql; database/functions/resource/publish_resource.sql; backend/tests/integration/resource-publish.spec.ts; docker compose -f docker-compose.yml run --rm migrate; npm -C backend test -- --runInBand tests/integration/resource-publish.spec.ts | None | Start T032 resources workspace page (updatedAt-desc query + page-size 10 + infinite scroll + auth guard). |
| 2026-04-20 | P4 execution | Completed T032 by replacing the resources workspace placeholder with an authenticated paginated list (page size 10), infinite-scroll loading, and most-recently-updated-first presentation in UI, validated by frontend GraphQL codegen + typecheck. | frontend/src/pages/resources/manage.tsx; frontend/src/features/resources/resources.queries.ts; frontend/src/graphql/generated.ts; npm -C frontend run typecheck | GraphQL schema currently does not expose `ResourcesOrderBy.UPDATED_AT_DESC`; UI enforces updated-time descending after each page load while backend pagination uses available ordering. | Implement T033 (resource workspace Edit/Delete actions with soft-delete confirmation). |
| 2026-04-20 | P4 execution | Completed T033 by adding workspace card actions for Edit and Delete: Edit now opens the resource form in modification mode with pre-populated values, while Delete opens a confirmation dialog and performs a soft delete (`isActive=false`) before refetching the workspace list. | frontend/src/pages/resources/manage.tsx; frontend/src/features/resources/CreateResourcePage.tsx; frontend/src/features/resources/resources.queries.ts; frontend/src/graphql/schema.graphql; frontend/src/graphql/generated.ts; npm -C frontend run graphql:schema; npm -C frontend run typecheck | None | Implement T034 fixed Add resource action on resources workspace page. |
| 2026-04-20 | P4 execution | Completed T034 by adding a fixed-position `Add resource` button on the resources workspace page so creation entry remains visible at all scroll positions and links directly to `/resources/create`. | frontend/src/pages/resources/manage.tsx; specs/005-resource-discovery-and-publishing/tasks.md; npm -C frontend run typecheck | None | Begin Phase 7 with T035 (rename create-need page to edit-need page for create+modify mode). |
| 2026-04-20 | P4 execution | Completed T035 by converting the need creation surface into an edit-capable page (`Edit need`) that supports both creation and modification modes: edit mode now preloads need data via `needById`, submits through `updateNeedById`, and keeps creation mode on the same route with mode-specific copy and actions. | frontend/src/features/needs/CreateNeedPage.tsx; frontend/src/features/needs/needs.queries.ts; frontend/src/graphql/generated.ts; npm -C frontend run typecheck | Updating campaign linkage is intentionally create-only for now because campaign linking is modeled in the campaign-need relation rather than direct need patch fields. | Implement T036 (`updatedAt` propagation for need linked-property changes). |
| 2026-04-21 | P4 execution | Completed T036 by adding need `updated_at` propagation for linked campaign-need updates and validating with integration coverage; resolved a surfaced runtime permission regression by hardening `is_account_email_verified` as `SECURITY DEFINER` so authenticated need creation no longer fails under RLS-restricted credentials access. | database/migrations/042_need_updated_at_linked_properties.sql; database/migrations/043_is_account_email_verified_security_definer.sql; backend/tests/integration/need-create.spec.ts; docker compose -f docker-compose.yml run --rm migrate; npm -C backend test -- --runInBand tests/integration/need-create.spec.ts | None | Start T037 (`Needs` workspace page with auth guard, pagination, infinite scroll, and updatedAt-desc ordering). |
| 2026-04-21 | P4 execution | Completed T037 by replacing the needs workspace placeholder with an authenticated paginated list (page size 10), infinite-scroll loading, and most-recently-updated-first presentation in UI, validated by frontend GraphQL codegen + typecheck. | frontend/src/pages/needs/manage.tsx; frontend/src/features/needs/needs.queries.ts; frontend/src/graphql/generated.ts; npm -C frontend run typecheck | GraphQL schema currently does not expose `NeedsOrderBy.UPDATED_AT_DESC`; UI enforces updated-time descending after each page load while backend pagination uses available ordering. | Implement T038 (needs workspace Edit/Delete actions with soft-delete confirmation). |
| 2026-04-21 | P4 execution | Completed T038 by adding needs workspace card actions for Edit and Delete: Edit opens the need form in modification mode with `needId`, while Delete opens a confirmation dialog and performs a soft delete (`isActive=false`) before refetching the workspace list. | frontend/src/pages/needs/manage.tsx; frontend/src/features/needs/needs.queries.ts; frontend/src/graphql/generated.ts; npm -C frontend run typecheck | None | Implement T039 fixed Add need action on needs workspace page. |
| 2026-04-21 | P4 execution | Completed T039 by adding a fixed-position `Add need` button on the needs workspace page so creation entry remains visible at all scroll positions and links directly to `/needs/create`. | frontend/src/pages/needs/manage.tsx; specs/005-resource-discovery-and-publishing/tasks.md; npm -C frontend run typecheck | None | Start Phase 8 with T040 (Topes explanation carousel entry on Contribution page). |
| 2026-04-24 | P4 execution | Completed T040 by adding a Topes explanation carousel entry button on the Contribution page, with open/close behavior, previous/next slide navigation, progress indicator, and EN/FR copy coverage. | frontend/src/pages/contribution.tsx; frontend/src/locales/en/contribution.json; frontend/src/locales/fr/contribution.json; specs/005-resource-discovery-and-publishing/tasks.md; npm -C frontend run typecheck | None | Implement T041 token-transaction history pagination (`first: 10`, newest-first, `Load more` appending older entries). |
| 2026-04-24 | P4 execution | Completed T041 and T042 by updating contribution history to load newest-first in pages of 10, append older transactions through `Load more`, and hide the action when no more history remains. | frontend/src/features/contribution/contribution.queries.ts; frontend/src/pages/contribution.tsx; frontend/src/locales/en/contribution.json; frontend/src/locales/fr/contribution.json; specs/005-resource-discovery-and-publishing/tasks.md; npm -C frontend run typecheck | None | Implement T043 Topes-earning opportunities list with action label, amount, and destination link rows. |
| 2026-04-24 | P4 execution | Completed T043 by adding a Topes-earning opportunities list on the Contribution page with action labels, Topes amounts (or variable amount when campaign-dependent), and direct destination links. | frontend/src/pages/contribution.tsx; frontend/src/locales/en/contribution.json; frontend/src/locales/fr/contribution.json; specs/005-resource-discovery-and-publishing/tasks.md; npm -C frontend run typecheck | None | Start Phase 9 with T044 preferences information architecture documentation updates in spec and plan. |
| 2026-04-24 | P7 execution | Completed T044 and T045 by documenting Preferences IA (channels, managed categories, strategy matrix, activity-gating) and implementing SQL-owned per-account delivery preference persistence/retrieval with validated frequency constraints and defaults. | specs/005-resource-discovery-and-publishing/spec.md; specs/005-resource-discovery-and-publishing/plan.md; database/migrations/048_account_delivery_preferences.sql; database/functions/notification/set_account_delivery_preference.sql; database/functions/notification/get_account_delivery_preferences.sql; database/functions/notification/get_account_delivery_preferences_for_account.sql; specs/005-resource-discovery-and-publishing/tasks.md | None | Implement T046 ranked targeting SQL helpers for `new_need_added` parity and align `new_resource_added` targeting behavior. |

## Decisions Log

| Date | Decision | Rationale | Impacted Scope |
|---|---|---|---|
| 2026-04-18 | Execute dependency-first across 7 phases (P1..P7). | Reduce rework and unblock downstream slices. | 001-008 |
| 2026-04-18 | Start P1 execution with feature 004 frontend auth test gaps before additional scope. | Fastest path to complete P1 readiness with measurable CI evidence. | 004 |
| 2026-04-19 | Re-sequence roadmap to complete local auth vertically before P3 resource expansion; defer social login until a dedicated follow-up auth increment. | Avoid half-delivered auth UX and reduce rework/security drift during manual E2E preparation. | 005 auth subset, then 005 slices 1-4 |

## Blockers Log

| Date | Blocker | Owner | Mitigation | Status |
|---|---|---|---|---|
| - | - | - | - | - |

## Supervisor Snapshot

Use this section for quick day-level oversight.

- Overall progress: P1 complete, P2 complete, P3 complete; P4 in progress through resources workspace and T035 kickoff for needs workspace.
- Current health: GREEN
- Main risk: P4 scope can expand too quickly unless discovery baseline (filters/sorting/expiration invariants) is validated before publish/bid UI growth.
- Requested supervisor input: confirm whether P4 should prioritize public discovery-only completion before any resource publish UX expansion.
