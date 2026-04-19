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
| P2 | Core needs loop | 001, 002 | IN PROGRESS | 86% | 2026-04-18 to 2026-05-02 (proposed) |
| P3 | Resource loop MVP | 005 (Slices 1-4) | NOT STARTED | 0% | TBD |
| P4 | Settlement and ledger consistency | 007, 008 (+ token consistency) | NOT STARTED | 0% | TBD |
| P5 | Conversation layer | 006 | NOT STARTED | 0% | TBD |
| P6 | Engagement and delivery controls | 005 (Preferences/digest finalization) | NOT STARTED | 0% | TBD |
| P7 | Admin and ops hardening | 005 (Grants/admin/logging hardening) | NOT STARTED | 0% | TBD |

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

Status: IN PROGRESS
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

Checkpoints:

- [ ] Campaign + need creation and listing flows work.
- [ ] Needs discovery/filtering aligns with spec.
- [ ] Claim initiation and lifecycle baseline works.
- [ ] Permissions and SQL-owned business constraints enforced.

Definition of Done:

- [ ] User can post a need, discover needs, and claim with expected behavior.

### P3 - Resource Loop MVP (005 Slices 1-4)

Status: NOT STARTED
Goal: deliver resource discovery/publish/bid baseline and core notifications.

Checkpoints:

- [ ] Resource discovery (active filtering, sorting, tri-state filters).
- [ ] Resource edit page supports creation and update modes.
- [ ] Bid flow baseline and expired-resource protections.
- [ ] Notifications inbox foundations integrated.

Definition of Done:

- [ ] Resource loop is independently usable end-to-end.

### P4 - Settlement And Ledger Consistency (007, 008)

Status: NOT STARTED
Goal: ensure token movement correctness for claims and bids lifecycle.

Checkpoints:

- [ ] Bid workspace and settlement actions implemented.
- [ ] Claim workspace and settlement actions implemented.
- [ ] Ledger movements are auditable and idempotent.
- [ ] Concurrency safety validated for settlement-sensitive operations.

Definition of Done:

- [ ] Token-impacting operations are correct under retries/concurrency.

### P5 - Conversation Layer (006)

Status: NOT STARTED
Goal: connect accepted claim/bid outcomes to reliable conversation workflows.

Checkpoints:

- [ ] Conversation creation and access rules implemented.
- [ ] Chat UI supports ongoing thread usage.
- [ ] Bid/claim flows link to conversation surfaces correctly.

Definition of Done:

- [ ] Users can reliably transition from transaction flow to conversation.

### P6 - Engagement And Delivery Controls (005 extended)

Status: NOT STARTED
Goal: deploy preference-managed out-of-app delivery and digest behavior.

Checkpoints:

- [ ] Preferences page and backend persistence complete.
- [ ] Activity-gated push/email behavior enforced.
- [ ] 08:00 digest run implemented with idempotent marking.
- [ ] Frequency cadence and no-duplicate guarantees tested.

Definition of Done:

- [ ] Delivery behavior matches configured strategy per category.

### P7 - Admin And Ops Hardening (005 extended)

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

Current phase: P2
Current milestone: P2-M1 - Core needs loop implementation kickoff

This week priorities:

1. Complete feature 001 US3 campaign approval backend path (tests + SQL + PostGraphile exposure).
2. Complete feature 001 US4 need creation backend path (tests + migrations/functions + exposure).
3. Keep P1 auth tests as smoke checks while P2 progresses.

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

## Decisions Log

| Date | Decision | Rationale | Impacted Scope |
|---|---|---|---|
| 2026-04-18 | Execute dependency-first across 7 phases (P1..P7). | Reduce rework and unblock downstream slices. | 001-008 |
| 2026-04-18 | Start P1 execution with feature 004 frontend auth test gaps before additional scope. | Fastest path to complete P1 readiness with measurable CI evidence. | 004 |

## Blockers Log

| Date | Blocker | Owner | Mitigation | Status |
|---|---|---|---|---|
| - | - | - | - | - |

## Supervisor Snapshot

Use this section for quick day-level oversight.

- Overall progress: P1 complete, P2 in progress (86%)
- Current health: GREEN
- Main risk: P2 scope growth if campaign/need edge cases are not sliced tightly
- Requested supervisor input: none, proceed with T058 quickstart validation and T059 docs alignment.
