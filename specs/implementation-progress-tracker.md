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
| P4 | Resource loop MVP | 005 (Slices 1-4) | DONE | 100% | TBD |
| P5 | Settlement and ledger consistency | 007, 008 (+ token consistency) | DONE | 100% | TBD |
| P6 | Conversation layer | 006 | DONE | 100% | 2026-05-09 |
| P7 | Engagement and delivery controls | 005 (Preferences/digest finalization) | DONE | 100% | TBD |
| P8 | Admin and ops hardening | 005 (Grants/admin/logging hardening) | DONE | 100% | TBD |
| P9 | Listing visual identity | 009 | DONE | 100% | TBD |

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

- [ ] Social login/sign-up (`Google`, `Apple`) and provider account linking surfaces (currently tracked in T056 and T057b).

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

Status: DONE
Goal: deliver resource discovery/publish/bid baseline and core notifications.

Checkpoints:

- [x] Resource discovery (active filtering, sorting, tri-state filters).
- [x] Resource edit page supports creation and update modes.
- [x] Bid flow baseline and expired-resource protections.
- [x] Notifications inbox foundations integrated.

Definition of Done:

- [x] Resource loop is independently usable end-to-end.

### P5 - Settlement And Ledger Consistency (007, 008)

Status: DONE
Goal: ensure token movement correctness for claims and bids lifecycle.

Checkpoints:

- [x] Bid workspace and settlement actions implemented.
- [x] Claim workspace and settlement actions implemented.
- [x] Ledger movements are auditable and idempotent.
- [x] Concurrency safety validated for settlement-sensitive operations.

Definition of Done:

- [x] Token-impacting operations are correct under retries/concurrency.

### P6 - Conversation Layer (006)

Status: DONE
Goal: connect accepted claim/bid outcomes to reliable conversation workflows.

Checkpoints:

- [x] Conversation creation and access rules implemented via backend integration tests.
- [x] Chat UI supports ongoing thread usage with text-required messages and up to 5 image attachments.
- [x] Bid/claim flows link to conversation surfaces correctly with shared messenger.

Definition of Done:

- [x] Users can reliably transition from transaction flow to conversation with navigable headers.

### P7 - Engagement And Delivery Controls (005 extended)

Status: DONE
Goal: deploy preference-managed out-of-app delivery and digest behavior.

Checkpoints:

- [x] Preferences page and backend persistence complete.
- [x] Activity-gated push/email behavior enforced.
- [x] 08:00 digest run implemented with idempotent marking.
- [x] Frequency cadence and no-duplicate guarantees tested.

Definition of Done:

- [x] Delivery behavior matches configured strategy per category.

### P8 - Admin And Ops Hardening (005 extended)

Status: DONE
Goal: operational support surfaces, grants, and logging hardening ready for production.

Checkpoints:

- [x] Admin pages delivered with role guard and case-insensitive contains search.
- [x] Grant creation/claim flow and fixed grant amount behavior implemented.
- [x] Unified logging across components with retention setting.
- [x] Side-effect actions audited and observable.

Definition of Done:

- [x] Support, audit, and troubleshooting workflows are production-ready.

### P9 - Listing Visual Identity (009)

Status: DONE
Goal: give needs visual parity with resources (image upload + storage), then unify all card and thread header surfaces under a single `ListingHeader` component.

Checkpoints:

- [x] Need `image_urls` column added, mutations updated, GraphQL type exposes `imageUrls`.
- [x] Need creation and editing forms include image upload control.
- [x] `ListingHeader` component created and tested.
- [x] `ResourceCard` and `NeedCard` delegate header row to `ListingHeader`.
- [x] Bids workspace `BidCard` and claims workspace claim card use `ListingHeader`.
- [x] `ConversationThread` header enriched with counterparty avatar and listing thumbnail.

Definition of Done:

- [x] All card and thread header surfaces display a consistent listing identity strip for both resources and needs.
- [x] No surface shows a broken image element when a listing has no images.

## Active Work Queue

Current phase: Completed through P9
Current milestone: Awaiting definition of next roadmap phase

This week priorities:

1. Define and implement conversation creation/access rules for accepted claim and bid flows.
2. Add backend integration coverage for conversation ownership/participant visibility and routing.
3. Deliver first end-to-end chat workflow handoff from claims and bids to conversation threads.

## E2E Smoke Coverage

Status legend:

- `READY`: a smoke spec exists and exercises the main path
- `PARTIAL`: some smoke coverage exists, but not yet for the full business-critical feature surface
- `MISSING`: no dedicated e2e smoke path is present yet

| Feature | Business-critical scope | E2E smoke file(s) | Status | Notes |
|---|---|---|---|---|
| 002-needs-query-claiming | Discover active needs | e2e/specs/002-needs-query-claiming/us1-needs-discovery.smoke.spec.ts | READY | Basic discovery of a seeded need on `/needs` is covered. |
| 003-topela-migration-foundation | Platform/database baseline | None | MISSING | This remains backend/migration validation territory; no user-facing smoke path is tracked. |
| 004-login-flow | Sign in, protected redirect, session persistence, sign out | e2e/specs/004-login-flow/us1-auth-lifecycle.smoke.spec.ts | READY | Covers sign-in, invalid-login rejection, protected-route redirect/return, refresh persistence, and sign-out protection reset. |
| 005-resource-discovery-and-publishing | Resource discovery, publish, and broader resource-loop UX | e2e/specs/005-resource-discovery-and-publishing/us1-resource-discovery-and-publish.smoke.spec.ts; e2e/specs/005-resource-discovery-and-publishing/us5-resource-workspace-actions.smoke.spec.ts; e2e/specs/005-resource-discovery-and-publishing/us6-contribution-opportunities.smoke.spec.ts; e2e/specs/005-resource-discovery-and-publishing/us7-delivery-preferences.smoke.spec.ts; e2e/specs/005-resource-discovery-and-publishing/us8-grant-claim-flow.smoke.spec.ts; e2e/specs/005-resource-discovery-and-publishing/us9-admin-routes-access.smoke.spec.ts | PARTIAL | Resource discovery, basic publish, workspace-route guard behavior, contribution opportunities, delivery preferences, grant claim page access, and admin route access control are covered; auth-parity paths remain outside smoke coverage. |
| 006-chat-and-conversations | Conversation handoff and thread access | e2e/specs/006-chat-and-conversations/us1-conversation-thread-access.smoke.spec.ts; e2e/specs/006-chat-and-conversations/us2-message-composition.smoke.spec.ts | READY | Chat page auth guard, conversation list and thread rendering, message composer visibility, and basic interaction flow are covered. |
| 007-bids-workspace-and-settlement | Bid lifecycle and decline/refund settlement | e2e/specs/007-bids-workspace-and-settlement/us1-bid-lifecycle.smoke.spec.ts; e2e/specs/007-bids-workspace-and-settlement/us2-bid-decline-refund.smoke.spec.ts | READY | Main bid create/accept and decline/refund paths are smoke-tested. |
| 008-claims-workspace-and-settlement | Claims workspace, cancel/settle, side effects | e2e/specs/008-claims-workspace-and-settlement/us1-claims-workspace.smoke.spec.ts; e2e/specs/008-claims-workspace-and-settlement/us2-claims-actions.smoke.spec.ts; e2e/specs/008-claims-workspace-and-settlement/us2-claim-settlement-side-effects.smoke.spec.ts | READY | Workspace browse, cancel, and settlement side effects are covered. |
| 009-listing-visual-identity | Unified listing header visual identity | None | MISSING | No dedicated smoke spec currently exercises this surface. |
| 010-public-pages-and-seo | Public pages, CTA contracts, SSR metadata | e2e/specs/010-public-pages-and-seo/us1-need-cta-flow.smoke.spec.ts; e2e/specs/010-public-pages-and-seo/us2-authenticated-cta.smoke.spec.ts; e2e/specs/010-public-pages-and-seo/us3-public-route-and-metadata.smoke.spec.ts | READY | Public route availability, metadata, and need CTA behavior are covered. |
| 011-account-deletion-anonymization | Delete-account guard and post-delete public UX | e2e/specs/011-account-deletion-anonymization/us1-delete-guard.smoke.spec.ts | READY | The UI delete-confirmation guard is smoke-tested; deeper deletion outcomes live in backend integration tests. |

Current smoke gaps:

- Feature 003 platform baseline
- Feature 009 listing visual identity

Current smoke priorities:

1. Feature 009 listing visual identity: verify no broken-image fallback and consistent listing header strip on needs/resources.
2. Feature 003 platform baseline: keep this at backend/integration level unless a user-facing critical path emerges.

Manual trigger commands:

- `npm run test:e2e:sanity`
- `npx playwright test e2e/specs/004-login-flow/us1-auth-lifecycle.smoke.spec.ts`
- `npx playwright test e2e/specs/005-resource-discovery-and-publishing/us1-resource-discovery-and-publish.smoke.spec.ts`

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
| 2026-04-19 | P2 execution | Completed US3 frontend slice: added public campaigns page, administrator pending-approval page/action, approval/public queries, and campaign navigation links. | frontend/src/features/campaigns/PublicCampaignsPage.tsx; frontend/src/features/campaigns/PendingCampaignsPage.tsx; frontend/src/features/campaigns/campaigns.queries.ts; frontend/src/pages/campaigns/index.tsx; frontend/src/pages/campaigns/pending.tsx; npm -C frontend run typecheck | None | Move to US4 backend tests and migrations (T037-T043, T061). |
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
| 2026-05-07 | P5 execution | Completed T030 by wiring claim notification-driven auto-closure reasons into `/claims` so need-driven closures now show explicit inactive reasons, with refreshed query coverage and passing frontend tests. | frontend/src/pages/claims.tsx; frontend/src/features/needs/needClaims.queries.ts; frontend/src/locales/en/claims.json; frontend/src/locales/fr/claims.json; frontend/tests/claims/claim-auto-decline.spec.tsx; npm --workspace frontend run typecheck; npm --workspace frontend test -- --runInBand tests/claims/claim-auto-decline.spec.tsx | None | Execute T033 end-to-end verification sweep for claim browsing/actions/auto-declines/conversation links, then close T034 spec delta capture. |
| 2026-05-09 | P6 kickoff | Marked P6 as in progress and added phase scope T014-T019. | specs/006-chat-and-conversations/tasks.md; specs/implementation-progress-tracker.md | None | Execute T014 resource-side composer integration test coverage. |
| 2026-05-09 | P6 execution | Completed T014 resource-side composer coverage by extending chat-message-composer.spec.ts with 3 resource-side invariant tests (blank body rejection, non-participant block, one-conversation-per-bid) and fixed pre-existing mutations to use correct GraphQL payload shape. | backend/tests/integration/chat-message-composer.spec.ts; backend/tests/integration/chat-conversations.spec.ts; commit c7d1a70 | sendResourceMessage GraphQL mutation payload was documented as { resourceMessage { id } } not { uuid } in existing code; aligned across both files. | Execute T015 frontend conversation-thread tests and T016 ConversationHeader component extraction. |
| 2026-05-09 | P6 execution | Completed T015/T016 by extracting ConversationHeader component with context/kind labels and back-button, adding 9 frontend tests for header rendering, and exporting isComposerBodyReady helper for composer validation. | frontend/src/features/chat/ConversationHeader.tsx; frontend/tests/chat/conversation-thread.spec.tsx; commit 5323793 | None | Execute T017 MessageComposer image attachment support (collapsible URL input, up-to-5 cap). |
| 2026-05-09 | P6 execution | Completed T017 by adding collapsible image URL input field to MessageComposer with parseImageUrls and MAX_IMAGE_ATTACHMENTS=5 helpers, validation errors, and extended tests for all code paths (5 test cases). | frontend/src/features/chat/ConversationThread.tsx; frontend/tests/chat/conversation-thread.spec.tsx; commit d35482e | None | Execute T018 ClaimConversationPanel alignment to use shared helpers. |
| 2026-05-09 | P6 execution | Completed T018/T019 by aligning ClaimConversationPanel to use shared parseImageUrls and MAX_IMAGE_ATTACHMENTS, adding conversationParticipantUrl routing helper, extending GraphQL queries to include account displayNames/externalSubjects, computing otherAccountDisplayName in ConversationThread, and rendering participant links in ConversationHeader. | frontend/src/features/chat/chatRouting.ts; frontend/src/features/chat/chat.queries.ts; frontend/src/features/chat/ConversationThread.tsx; frontend/src/features/chat/ConversationHeader.tsx; frontend/src/features/needs/ClaimConversationPanel.tsx; frontend/tests/chat/conversation-thread.spec.tsx; commit e2fc306 | None | Mark P6 complete and update tracker. |
| 2026-05-09 | P6 closeout | Closed P6 conversation-layer phase after validating all checkpoints and definition-of-done items: message validation with mandatory text and up-to-5 images, participant-access guards, one-conversation-per-context semantics, shared ConversationHeader with navigable context/participant links, and aligned ClaimConversationPanel with shared messenger. | specs/implementation-progress-tracker.md; npm -C backend test -- tests/integration/chat-message-composer.spec.ts tests/integration/chat-conversations.spec.ts; npm -C frontend test 2>&1 | All 81+ frontend tests pass, all backend integration tests pass, clean commit sweep. | Kick off P7 (or next priority phase based on roadmap). |
| 2026-04-20 | P4 execution | Completed T035 by converting the need creation surface into an edit-capable page (`Edit need`) that supports both creation and modification modes: edit mode now preloads need data via `needById`, submits through `updateNeedById`, and keeps creation mode on the same route with mode-specific copy and actions. | frontend/src/features/needs/CreateNeedPage.tsx; frontend/src/features/needs/needs.queries.ts; frontend/src/graphql/generated.ts; npm -C frontend run typecheck | Updating campaign linkage is intentionally create-only for now because campaign linking is modeled in the campaign-need relation rather than direct need patch fields. | Implement T036 (`updatedAt` propagation for need linked-property changes). |
| 2026-04-21 | P4 execution | Completed T036 by adding need `updated_at` propagation for linked campaign-need updates and validating with integration coverage; resolved a surfaced runtime permission regression by hardening `is_account_email_verified` as `SECURITY DEFINER` so authenticated need creation no longer fails under RLS-restricted credentials access. | database/migrations/042_need_updated_at_linked_properties.sql; database/migrations/043_is_account_email_verified_security_definer.sql; backend/tests/integration/need-create.spec.ts; docker compose -f docker-compose.yml run --rm migrate; npm -C backend test -- --runInBand tests/integration/need-create.spec.ts | None | Start T037 (`Needs` workspace page with auth guard, pagination, infinite scroll, and updatedAt-desc ordering). |
| 2026-04-21 | P4 execution | Completed T037 by replacing the needs workspace placeholder with an authenticated paginated list (page size 10), infinite-scroll loading, and most-recently-updated-first presentation in UI, validated by frontend GraphQL codegen + typecheck. | frontend/src/pages/needs/manage.tsx; frontend/src/features/needs/needs.queries.ts; frontend/src/graphql/generated.ts; npm -C frontend run typecheck | GraphQL schema currently does not expose `NeedsOrderBy.UPDATED_AT_DESC`; UI enforces updated-time descending after each page load while backend pagination uses available ordering. | Implement T038 (needs workspace Edit/Delete actions with soft-delete confirmation). |
| 2026-04-21 | P4 execution | Completed T038 by adding needs workspace card actions for Edit and Delete: Edit opens the need form in modification mode with `needId`, while Delete opens a confirmation dialog and performs a soft delete (`isActive=false`) before refetching the workspace list. | frontend/src/pages/needs/manage.tsx; frontend/src/features/needs/needs.queries.ts; frontend/src/graphql/generated.ts; npm -C frontend run typecheck | None | Implement T039 fixed Add need action on needs workspace page. |
| 2026-04-21 | P4 execution | Completed T039 by adding a fixed-position `Add need` button on the needs workspace page so creation entry remains visible at all scroll positions and links directly to `/needs/create`. | frontend/src/pages/needs/manage.tsx; specs/005-resource-discovery-and-publishing/tasks.md; npm -C frontend run typecheck | None | Start Phase 8 with T040 (Topes explanation carousel entry on Contribution page). |
| 2026-04-24 | P4 execution | Completed T040 by adding a Topes explanation carousel entry button on the Contribution page, with open/close behavior, previous/next slide navigation, progress indicator, and EN/FR copy coverage. | frontend/src/pages/contribution.tsx; frontend/src/locales/en/contribution.json; frontend/src/locales/fr/contribution.json; specs/005-resource-discovery-and-publishing/tasks.md; npm -C frontend run typecheck | None | Implement T041 token-transaction history pagination (`first: 10`, newest-first, `Load more` appending older entries). |
| 2026-04-24 | P4 execution | Completed T041 and T042 by updating contribution history to load newest-first in pages of 10, append older transactions through `Load more`, and hide the action when no more history remains. | frontend/src/features/contribution/contribution.queries.ts; frontend/src/pages/contribution.tsx; frontend/src/locales/en/contribution.json; frontend/src/locales/fr/contribution.json; specs/005-resource-discovery-and-publishing/tasks.md; npm -C frontend run typecheck | None | Implement T043 Topes-earning opportunities list with action label, amount, and destination link rows. |
| 2026-04-24 | P4 execution | Completed T043 by adding a Topes-earning opportunities list on the Contribution page with action labels, Topes amounts (or variable amount when campaign-dependent), and direct destination links. | frontend/src/pages/contribution.tsx; frontend/src/locales/en/contribution.json; frontend/src/locales/fr/contribution.json; specs/005-resource-discovery-and-publishing/tasks.md; npm -C frontend run typecheck | None | Start Phase 9 with T044 preferences information architecture documentation updates in spec and plan. |
| 2026-04-24 | P7 execution | Completed T044 and T045 by documenting Preferences IA (channels, managed categories, strategy matrix, activity-gating) and implementing SQL-owned per-account delivery preference persistence/retrieval with validated frequency constraints and defaults. | specs/005-resource-discovery-and-publishing/spec.md; specs/005-resource-discovery-and-publishing/plan.md; database/migrations/048_account_delivery_preferences.sql; database/functions/notification/set_account_delivery_preference.sql; database/functions/notification/get_account_delivery_preferences.sql; database/functions/notification/get_account_delivery_preferences_for_account.sql; specs/005-resource-discovery-and-publishing/tasks.md | None | Implement T046 ranked targeting SQL helpers for `new_need_added` parity and align `new_resource_added` targeting behavior. |
| 2026-04-24 | P7 execution | Completed T046 by adding SQL-owned ranked targeting helpers for both `new_resource_added` and `new_need_added`, combining proximity, campaign-overlap, and inferred intent scoring with threshold + capped recipient selection. | database/migrations/049_notification_targeting_helpers.sql; database/functions/notification/get_accounts_to_notify_of_new_resource.sql; database/functions/notification/get_accounts_to_notify_of_new_need.sql; specs/005-resource-discovery-and-publishing/tasks.md; docker compose -f docker-compose.yml run --rm migrate | None | Implement T047 out-of-app dispatch gating based on active web/mobile session presence. |
| 2026-04-24 | P7 execution | Completed T047 by adding SQL-owned activity-gate helpers (`account_has_active_session`, `can_emit_out_of_app_delivery`) and strategy-aware out-of-app decision helpers for push/email dispatch in preference-managed categories. | database/migrations/050_out_of_app_delivery_activity_gate.sql; database/functions/notification/out_of_app_delivery_gate.sql; specs/005-resource-discovery-and-publishing/tasks.md; docker compose -f docker-compose.yml run --rm migrate | None | Implement T048 pending-event persistence and daily 08:00 digest worker with idempotent mark-as-broadcasted semantics. |
| 2026-04-25 | P7 execution | Completed T048 by adding SQL-owned digest-item persistence, push notification outbox persistence, new-resource out-of-app dispatch wiring, daily 08:00 digest queueing, push/digest worker tasks, and focused integration coverage for 3-day summary cadence, realtime push on resource creation, and mixed-category digest content. | database/migrations/051_preference_managed_delivery_outbox.sql; database/functions/notification/preference_managed_delivery.sql; backend/src/push/index.ts; backend/src/worker/tasks/issue-notification-digests.ts; backend/src/worker/tasks/deliver-push-notifications.ts; backend/src/worker/tasks/deliver-auth-emails.ts; backend/src/worker/taskList.ts; backend/crontab; backend/tests/integration/out-of-app-delivery.spec.ts; docker compose -f docker-compose.yml run --rm migrate; npm -C backend test -- --runInBand tests/integration/out-of-app-delivery.spec.ts; npm -C backend run typecheck | T050 remains open because the broader no-duplicate/full-category matrix is not yet fully covered end-to-end. | Implement T049 preferences backend API and frontend editing UI. |
| 2026-04-25 | P7 execution | Completed T050 by extending end-to-end out-of-app delivery verification to cover 1/3/7/30-day digest cadence windows, single-path routing across all four managed categories, active-session activity gating, and no-duplicate-send guarantees for realtime push versus digest dispatch. | backend/tests/integration/out-of-app-delivery.spec.ts; specs/005-resource-discovery-and-publishing/tasks.md; npm -C backend test -- --runInBand tests/integration/out-of-app-delivery.spec.ts | None | Implement T049 preferences backend API and frontend editing UI. |
| 2026-04-25 | P7 execution | Completed T049 by replacing the preferences page placeholder with a full authenticated delivery-preferences UI: per-category strategy select (realtime_push / email_summary) and conditional frequency select (1/3/7/30 days), auto-saved on change via setAccountDeliveryPreference mutation, loaded on mount via getAccountDeliveryPreferences mutation, with EN/FR i18n and MUI. | frontend/src/pages/preferences.tsx; frontend/src/features/preferences/preferences.queries.ts; frontend/src/locales/en/preferences.json; frontend/src/locales/fr/preferences.json; frontend/src/i18n.ts; frontend/src/graphql/schema.graphql; frontend/src/graphql/generated.ts; npx tsc --noEmit -p tsconfig.json | None | Continue master plan — next task per tracker. |
| 2026-04-25 | P10 execution | Completed T052 by introducing SQL-owned identity modeling with provider-scoped links (`local`, `google`, `apple`), verified-email collision guards for duplicate-account prevention, account-safe external identity linking, local-credential to identity synchronization trigger, and local-auth registration guard updates; validated via migrations and auth integration test suite. | database/migrations/053_auth_identity_model.sql; specs/005-resource-discovery-and-publishing/tasks.md; docker compose -f docker-compose.yml run --rm migrate; npm -C backend test -- --runInBand tests/integration/auth-graphql.spec.ts; npm -C backend run typecheck | Social provider sign-in UX and callback endpoints remain deferred to T056/T057 scope. | Implement T053 email verification lifecycle handlers and validation paths. |
| 2026-04-25 | P10 execution | Completed T053-T056 by confirming email verification and password reset lifecycle handlers (issue/resend throttling/verify + invalid-expired handling) and change-password hardening paths via auth integration tests, and adding frontend social-entry surfaces (`Google`, `Apple`) with provider-URL routing plus editable suggested-name/email prefill plumbing on registration while preserving existing verify-email, restore-access, and change-password routes. | frontend/src/features/auth/LoginForm.tsx; frontend/src/features/auth/SocialAuthButtons.tsx; frontend/src/features/auth/socialAuth.ts; frontend/src/pages/register.tsx; frontend/src/locales/en/auth.json; frontend/src/locales/fr/auth.json; frontend/src/graphql/schema.graphql; frontend/src/graphql/generated.ts; backend/tests/integration/auth-graphql.spec.ts; specs/005-resource-discovery-and-publishing/tasks.md; npm -C backend test -- --runInBand tests/integration/auth-graphql.spec.ts; npm -C frontend run typecheck | End-to-end parity for social callback token exchange and duplicate-account-safe social/local crossover still requires dedicated T057 verification scenarios. | Implement T057 comprehensive auth E2E coverage (local + social-entry paths, token expiry/reuse protections). |
| 2026-04-25 | P10 execution | Advanced T057 coverage by adding backend integration verification for external identity link safety and duplicate-account prevention on verified provider email, plus frontend unit tests for social-auth start URL routing and provider-prefill parsing helpers. | backend/tests/integration/auth-graphql.spec.ts; frontend/tests/auth/social-auth.spec.ts; frontend/src/pages/register.tsx; npm -C backend test -- --runInBand tests/integration/auth-graphql.spec.ts; npm -C frontend test -- --runInBand tests/auth/auth-api.spec.ts tests/auth/protected-routes.spec.tsx tests/auth/logout.spec.tsx tests/auth/social-auth.spec.ts; npm -C backend run typecheck; npm -C frontend run -s typecheck | T057 remains open until full social sign-in callback/login parity flows are test-covered end-to-end. | Implement remaining T057 social callback/login parity tests once backend callback handlers are available. |
| 2026-04-25 | P11 execution | Completed T058 by documenting a concrete unified logging contract in both spec and plan: one-table write target, mandatory `component` with required fields, optional `context`/`metadata`, and explicit `info`/`warn`/`error` message rules plus writer/query expectations. | specs/005-resource-discovery-and-publishing/spec.md; specs/005-resource-discovery-and-publishing/plan.md; specs/005-resource-discovery-and-publishing/tasks.md | None | Implement T059 unified logging schema and SQL-owned write/search helpers. |
| 2026-04-25 | P11 execution | Completed T059 by introducing a unified SQL-owned operational log table and helper functions: `writeOperationalLog` for normalized writes and `searchOperationalLogs` for component/level/context/account filters with newest-first pagination, plus indexes and administrator read policy. | database/migrations/054_unified_operational_logs.sql; specs/005-resource-discovery-and-publishing/tasks.md; docker compose -f docker-compose.yml run --rm migrate | None | Implement T060 backend logging adapter updates for web API and worker paths. |
| 2026-04-25 | P11 execution | Completed T060 by adding a backend operational logging adapter and wiring web API + worker execution paths to `writeOperationalLog`, including stack-aware error message formatting and non-blocking fallback behavior when log persistence fails. | backend/src/logging/operationalLogger.ts; backend/src/postgraphile/server.ts; backend/src/worker/index.ts; backend/src/worker/tasks/deliver-auth-emails.ts; backend/src/worker/tasks/deliver-push-notifications.ts; backend/src/worker/tasks/expire-needs.ts; backend/src/worker/tasks/issue-campaign-airdrop-coming-soon.ts; backend/src/worker/tasks/issue-campaign-airdrop-payouts.ts; backend/src/worker/tasks/issue-delayed-token-rewards.ts; backend/src/worker/tasks/issue-notification-digests.ts; backend/src/worker/tasks/process-resource-bid-notifications.ts; specs/005-resource-discovery-and-publishing/tasks.md; npm -C backend run typecheck | `scripts/check-sql-boundary.mjs` still reports pre-existing multiline SQL-template violations in worker files unrelated to this logging adapter slice. | Implement T061 frontend/mobile logging adapter updates to unified write API. |
| 2026-04-25 | P11 execution | Completed T061 by adding a frontend operational logging adapter that writes `backoffice_web` entries through `writeOperationalLog` with optional `accountId` and `context`, then integrating it into auth-session recovery/signout failure handling and claim-conversation mark-read failure handling. | frontend/src/features/logging/logging.queries.ts; frontend/src/features/logging/operationalLogger.ts; frontend/src/features/auth/AuthProvider.tsx; frontend/src/features/needs/ClaimConversationPanel.tsx; frontend/src/graphql/schema.graphql; frontend/src/graphql/generated.ts; specs/005-resource-discovery-and-publishing/tasks.md; npm -C frontend run -s typecheck; npm -C backend run typecheck | No dedicated mobile client package is present in this repository; adapter implementation is applied to current backoffice/web frontend scope. | Implement T062 mandatory exception instrumentation for PostgreSQL and external-provider failures. |
| 2026-04-25 | P11 execution | Completed T062 by adding mandatory operational error logging for key PostgreSQL failure paths in auth/session and worker direct-client tasks, plus provider-level failure instrumentation for Expo push and Mailgun requests so external delivery exceptions are recorded before bubbling to task handlers. | backend/src/auth/session.ts; backend/src/postgraphile/authGraphqlPlugin.ts; backend/src/push/index.ts; backend/src/mailing/index.ts; backend/src/worker/tasks/deliver-auth-emails.ts; backend/src/worker/tasks/deliver-push-notifications.ts; backend/src/worker/tasks/expire-needs.ts; backend/src/worker/tasks/issue-campaign-airdrop-coming-soon.ts; backend/src/worker/tasks/issue-campaign-airdrop-payouts.ts; backend/src/worker/tasks/issue-delayed-token-rewards.ts; backend/src/worker/tasks/issue-notification-digests.ts; backend/src/worker/tasks/process-resource-bid-notifications.ts; specs/005-resource-discovery-and-publishing/tasks.md; npm -C backend run typecheck | Google auth, Apple auth, and Cloudinary runtime integrations are not implemented in this repository yet, so no additional provider call sites were available for this slice. | Implement T063 fallback logging behavior for unified-log persistence failures. |
| 2026-04-25 | P11 execution | Completed T063 by hardening unified-log fallback behavior so backend persistence failures now emit structured console diagnostics and optionally append JSONL records to `OPERATIONAL_LOG_FALLBACK_FILE`, while frontend write failures emit console diagnostics instead of failing silently. Existing logger helpers also now normalize explicit `context`/`accountId`/`task` fields without breaking prior metadata-style call sites. | backend/src/logging/operationalLogger.ts; frontend/src/features/logging/operationalLogger.ts; specs/005-resource-discovery-and-publishing/tasks.md; npm -C backend run typecheck; npm -C frontend run -s typecheck | Backend fallback file output is opt-in via `OPERATIONAL_LOG_FALLBACK_FILE`; without it, diagnostics still go to console as required. | Implement T064 end-to-end verification and operational checks for unified logging coverage. |
| 2026-04-25 | P11 execution | Completed T064 by adding backend and frontend verification coverage for unified operational logging: integration coverage now proves cross-component correlation and `component` filtering through `searchOperationalLogs`, frontend tests verify `backoffice_web` writes and fallback diagnostics, and a source-scan operational check guards against legacy duplicate write paths such as `createOperationalLog` or direct table inserts in application code. | backend/tests/integration/operational-logging.spec.ts; frontend/tests/logging/operational-logger.spec.ts; backend/src/logging/operationalLogger.ts; specs/005-resource-discovery-and-publishing/tasks.md; npm -C backend test -- operational-logging.spec.ts; npm -C frontend test -- operational-logger.spec.ts; npm -C backend run typecheck; npm -C frontend run -s typecheck | Duplicate-writer scan intentionally excludes generated GraphQL artifacts because PostGraphile still exposes generic CRUD types in schema output even though app code now uses the unified write path. | Implement T065 SQL-owned log retention setting and scheduled cleanup. |
| 2026-04-25 | P11 execution | Completed T065 by adding a SQL-owned `system_setting` table with default `operational_log_retention_days=7`, a `cleanupOperationalLogs` SQL function, a scheduled `cleanup_operational_logs` worker task wired into crontab, and integration coverage proving default and overridden retention windows delete only logs older than the configured cutoff. | database/migrations/055_operational_log_retention.sql; backend/src/worker/tasks/cleanup-operational-logs.ts; backend/src/worker/taskList.ts; backend/crontab; backend/tests/integration/operational-logging.spec.ts; docker compose -f docker-compose.yml run --rm migrate; npm -C backend test -- operational-logging.spec.ts; npm -C backend run typecheck; npm -C frontend run -s typecheck | `system_setting` is introduced here as the SQL-owned configuration source for operational controls; no prior shared settings table existed in this schema. | Implement T066 grants-behavior documentation for admin-only creation, criteria conjunction, claim UX, and denial reasons. |
| 2026-04-25 | P10 clarification | Split T057 into explicit local-vs-social verification tasks to avoid ambiguous auth readiness: marked local auth E2E protections complete (`T057a`) and left social callback/login parity verification explicitly pending (`T057b`) until backend callback handlers are implemented. | specs/005-resource-discovery-and-publishing/tasks.md; specs/implementation-progress-tracker.md; npm -C backend test -- auth-graphql.spec.ts auth-graphql-fallback.spec.ts auth.contract.spec.ts campaign-create-auth.spec.ts need-create-auth.spec.ts; npm -C frontend test -- auth-api.spec.ts social-auth.spec.ts | Social callback endpoint handlers still not present, so true social end-to-end parity tests remain blocked by implementation scope. | Keep advancing roadmap tasks while preserving `T057b` as an auth gate before production parity sign-off. |
| 2026-04-26 | P12 execution | Completed T066 by tightening grants documentation contract in both spec and plan: explicit admin-only grant-definition operations, criteria conjunction semantics, claim-route UX continuation after login, and fixed user-safe denial reason categories for API/UI alignment. | specs/005-resource-discovery-and-publishing/spec.md; specs/005-resource-discovery-and-publishing/plan.md; specs/005-resource-discovery-and-publishing/tasks.md | None | Implement T067 SQL-owned grant schema and helper functions. |
| 2026-04-26 | P12 execution | Completed T067 by implementing the full SQL-owned grant schema (grant_definition, grant_target_account, grant_target_email, grant_claim) with RLS policies, 6 helper functions (upsert_grant_definition, replace_grant_target_accounts, replace_grant_target_emails, is_grant_campaign_criterion_satisfied, record_grant_claim_award, get_grant_for_claim), indexes, grants, and comments; migration 056 applied successfully and backend typecheck passed. | database/migrations/056_grants_schema_and_helpers.sql; docker compose -f docker-compose.yml run --rm migrate; npm -C backend run typecheck | None | Implement T068 admin-only API/mutations for creating and managing grants and their criteria. |
| 2026-04-26 | P12 execution | Completed T068 by creating app_public wrapper mutations (upsertGrant, setGrantTargetAccounts, setGrantTargetEmails, archiveGrant) that delegate to the security-definer private helpers, exposing them as PostGraphile GraphQL mutations with admin-only grants and PostGraphile @name smart comments; registered grant-related error messages in server.ts and applied migration 057. | database/migrations/057_grant_admin_mutations.sql; backend/src/postgraphile/server.ts; docker compose -f docker-compose.yml run --rm migrate; npm -C backend run typecheck | None | Implement T069 SQL-owned atomic claim function with criteria evaluation, idempotency, and outcome codes. |
| 2026-04-26 | P12 execution | Completed T069 and T071 by creating the app_public.claim_grant security-definer function that atomically evaluates all criteria (auth, availability, expiry, already-claimed, cap, account/email targeting, campaign criterion), issues a token movement on success, records grant_claim with token_movement linkage, and returns a safe grant_claim_result composite with outcome_code + claimed_amount + grant_claim_id; migration 058 applied and typecheck passed. | database/migrations/058_grant_atomic_claim.sql; docker compose -f docker-compose.yml run --rm migrate; npm -C backend run typecheck | None | Implement T070 authenticated grant claim page (/grants/[id]). |
| 2026-04-26 | P12 execution | Completed T070 by implementing the authenticated `/grants/[id]` claim page with login gating, grant detail fetch, claim mutation trigger, and localized success/denial outcome rendering using the grants namespace. | frontend/src/pages/grants/[id].tsx; frontend/src/features/grants/grants.queries.ts; frontend/src/locales/en/grants.json; frontend/src/locales/fr/grants.json; frontend/src/i18n.ts; npm -C frontend run typecheck | None | Implement T072 backend eligibility and concurrency coverage for grants. |
| 2026-04-26 | P12 execution | Completed T072 by adding grant integration coverage for eligibility combinations and concurrency safety, including account targeting, email targeting, campaign criterion, expiration, cap, already-claimed, archived/unavailable, anonymous, and race behavior under capped claims. | backend/tests/integration/grants.spec.ts; npm -C backend run typecheck | None | Implement T073 end-to-end verification for grant route outcomes and user-safe denial categories. |
| 2026-04-26 | P12 execution | Completed T073 by adding contract-level end-to-end verification for `getGrantForClaim` and `claimGrant`, including success payload shape and user-safe denial outcome codes (`not_authenticated`, `grant_unavailable`, `expired`, `already_claimed`, `cap_reached`). | backend/tests/contract/grant-claim.contract.spec.ts; npm -C backend run typecheck | None | Start Phase 13 with T074 admin support matrix documentation. |
| 2026-04-26 | P8 execution | Completed T074 by documenting an explicit admin support page matrix in both feature spec and implementation plan, including per-page field projection, search fields, newest-first ordering, and action buttons/dialog expectations. | specs/005-resource-discovery-and-publishing/spec.md; specs/005-resource-discovery-and-publishing/plan.md; specs/005-resource-discovery-and-publishing/tasks.md | None | Implement T075 admin-only backend list/search helpers with pagination for all admin support pages. |
| 2026-04-26 | P8 execution | Completed T075 by adding SQL-owned, admin-only paginated list/search helpers for accounts, bids, resources, notifications, mails, campaigns, grants, and logs, each with newest-first ordering and scoped case-insensitive search fields, plus supporting timestamp indexes. Migration `059` applied successfully and backend typecheck passed. | database/migrations/059_admin_support_list_search_helpers.sql; docker compose run --rm migrate; npm -C backend run typecheck; specs/005-resource-discovery-and-publishing/tasks.md | None | Implement T076 admin access guard and role enforcement for admin routes and side-effect actions. |
| 2026-04-26 | P8 execution | Completed T076 by adding a reusable frontend admin-route guard hook (`useRequireAdmin`) and extending backend safe GraphQL error mapping for admin-support access denials, keeping role enforcement user-safe and consistent for admin-only operations. Frontend GraphQL schema/codegen artifacts were refreshed after the new admin helper functions became available. | frontend/src/features/auth/requireAdmin.ts; backend/src/postgraphile/server.ts; frontend/src/graphql/schema.graphql; frontend/src/graphql/generated.ts; npm -C backend run typecheck; npm -C frontend run typecheck; specs/005-resource-discovery-and-publishing/tasks.md | None | Implement T077 admin pages with shared table/search scaffolding for all admin support entities. |
| 2026-04-26 | P8 execution | Completed T077 by building a shared admin support table/search scaffold and wiring all eight admin routes (`accounts`, `bids`, `resources`, `notifications`, `mails`, `campaigns`, `grants`, `logs`) behind `useRequireAdmin`, with paginated newest-first query views and placeholder action buttons for the next action-oriented tasks. Also finalized migration `060` so admin list helpers are exposed as stable GraphQL query fields. | frontend/src/features/admin/AdminSupportPage.tsx; frontend/src/features/admin/adminSupport.queries.ts; frontend/src/pages/admin/[section].tsx; frontend/src/pages/admin/index.tsx; database/migrations/060_admin_support_helpers_stable.sql; frontend/src/graphql/schema.graphql; frontend/src/graphql/generated.ts; npm -C frontend run typecheck; npm -C backend run typecheck; specs/005-resource-discovery-and-publishing/tasks.md | None | Implement T078 mail actions (fullscreen HTML viewer and send-again action wiring). |
| 2026-04-27 | P8 execution | Completed T078-T081 by implementing fullscreen HTML mail viewer and send-again action for admin mails page, campaign description viewer and moderation-handoff action for admin campaigns page, create-grant dialog from admin grants page, fullscreen log message viewer from admin logs page, and end-to-end verification for admin search/filter behavior, action outcomes, authorization restrictions, and audit-log emission. | frontend/src/features/admin/AdminSupportPage.tsx; backend/tests/integration/admin-support.spec.ts; npm -C frontend run typecheck; npm -C backend run typecheck; specs/005-resource-discovery-and-publishing/tasks.md | None | Start T082 role-model consolidation (manager → admin). |
| 2026-04-27 | P8 execution | Completed T082-T086 by consolidating the role model from manager/admin split to single administrator role: updated SQL grants/policies (migration 065), refactored backend PostGraphile auth helpers, refactored all frontend role-gated surfaces, aligned all spec/task docs, and added E2E auth verification for consolidated admin-only behavior. | database/migrations/065_role_model_admin_only.sql; backend/src/postgraphile/server.ts; frontend/src/features/auth/requireAdmin.ts; specs/005-resource-discovery-and-publishing/tasks.md; npm -C backend run typecheck; npm -C frontend run typecheck | None | Implement T087 campaign moderation notification catalog extension. |
| 2026-04-28 | P8 execution | Completed T087-T089 by extending the notification catalog for campaign moderation note received, campaign approved, and creator adaptation submitted; adding moderation-status filtering (including `awaiting_adaptation`) to the admin campaigns page with notification-driven prefill; and adding E2E verification for campaign moderation notification routing. | database/migrations/069_campaign_moderation_workflow_refinement.sql; database/migrations/070_campaign_moderation_event_graphql_rename.sql; frontend/src/features/admin/AdminSupportPage.tsx; backend/tests/integration/campaign-moderation-notifications.spec.ts; specs/005-resource-discovery-and-publishing/tasks.md; npm -C backend run typecheck; npm -C frontend run typecheck | None | Implement T090 rich-text authoring extension. |
| 2026-04-29 | P4 execution | Completed T090 by extending the constrained rich-text editor and sanitized renderer to campaign, need, and resource description authoring/display surfaces; marked P4, P7, and P8 as DONE (100%). | frontend/src/components/richText/; frontend/src/features/needs/; frontend/src/features/resources/; specs/005-resource-discovery-and-publishing/tasks.md; npm -C frontend run typecheck | None | Kick off P5 bids workspace (007 T004+). |
| 2026-05-03 | P5 kickoff | UI polish pass committed (full-height chat, resource detail minimap, primary chips, profile location/avatar, search cleanup). Started P5 with migrations 084-085: added valid_until bid validity window (12-48h, default 24h), accepted-bid token settlement path, cancel_resource_bid function, sent/received workspace helpers with updated_at-desc ordering and active-only filter, resource_bid_is_active computed field, and updated process_resource_bid_notifications to expire bids on valid_until. | database/migrations/084_bid_validity_settlement_and_workspace_helpers.sql; database/migrations/085_drop_old_create_resource_bid_overload.sql; npm -C frontend run graphql:schema; npm -C frontend run graphql:codegen | None | Complete bids page rebuild (pagination, filters, cancel/accept/decline actions). |
| 2026-05-03 | P5 execution | Completed bids workspace page rebuild (sent/received sections, active-only toggles, page-size-5 load-more, cancel/accept/decline, accept-confirm dialog, inactive explanations) and added US1 test coverage for ordering/filtering: backend integration spec for sent/received ordering + active-only and frontend BidsPage rendering/filter/order assertions. | frontend/src/pages/bids.tsx; backend/tests/integration/bids-workspace.spec.ts; frontend/tests/bids/bids-page.spec.tsx; npm -C backend test -- --runInBand tests/integration/bids-workspace.spec.ts; npm -C frontend test -- --runInBand tests/bids/bids-page.spec.tsx | None | Implement US2 settlement-action test coverage and contribution-page settlement/refund reflection (T014-T015, T019). |
| 2026-05-03 | P5 execution | Fixed runtime regression in `respondToResourceBid` (`app_private.is_administrator()` missing) by adding migration 086 compatibility alias to `app_private.is_admin()`, then completed US2 test coverage: backend settlement integration scenarios (reservation, bidder-cancel refund, decline refund, acceptance settlement, validity-expiry refund) and frontend bid-action coverage (cancel/accept/decline controls, inactive-state messaging, acceptance-confirmation copy presence). | database/migrations/086_admin_helper_compat_alias.sql; backend/tests/integration/bids-settlement.spec.ts; frontend/tests/bids/bid-actions.spec.tsx; docker compose run --rm migrate; npm -C backend test -- --runInBand tests/integration/resource-bids.spec.ts tests/integration/bids-settlement.spec.ts; npm -C frontend test -- --runInBand tests/bids/bid-actions.spec.tsx | None | Implement T019 contribution-page settlement/refund reflection and then US3 navigation/deep-link tasks. |
| 2026-05-03 | P5 execution | Completed T019 by improving contribution-ledger clarity for bid settlement and refund outcomes: added explicit `resource_bid_settled` movement label and reason-specific refund detail copy (bidder cancel, decline, validity expiry, resource expiry/deactivation) in EN/FR, and surfaced those details in contribution movement cards. | frontend/src/pages/contribution.tsx; frontend/src/locales/en/contribution.json; frontend/src/locales/fr/contribution.json; npm -C frontend run typecheck; npm -C frontend test -- --runInBand tests/bids/bids-page.spec.tsx tests/bids/bid-actions.spec.tsx | None | Start US3 navigation/deep-link implementation tasks T020-T024. |
| 2026-05-03 | P5 execution | Completed US3 navigation/deep-link (T020-T024): added `resourceConversationByConversationId { id }` to BID_WORKSPACE_FIELDS fragment, added Chat/View-resource/View-creator/View-bidder action buttons in sent and received bid cards with EN/FR i18n keys, added `next/router` and `accountEvents` mocks to existing bid test files, created `bid-navigation.spec.tsx` with 4 tests covering chat presence/absence for sent and received bids. T021 covered by existing PostGraphile schema relation. | frontend/src/pages/bids.tsx; frontend/src/features/resources/resources.queries.ts; frontend/src/locales/en/bids.json; frontend/src/locales/fr/bids.json; frontend/tests/bids/bid-navigation.spec.tsx; frontend/tests/bids/bid-actions.spec.tsx; frontend/tests/bids/bids-page.spec.tsx | None | Continue with T025-T029 (i18n polish, responsive layout, resource-deactivation flow, e2e sweep). |
| 2026-05-05 | P5 execution | Completed Phase 6 Polish & Validation (T025-T029): T025 — changed `chips.tokens` from "tokens"/"jetons" to "Topes" in bids.json EN/FR and updated `resource_bid_reserved`/`resource_bid_settled` movement labels in contribution.json EN/FR; T026 — replaced single-column Stack with responsive two-column CSS grid (`gridTemplateColumns: {xs:"1fr", md:"1fr 1fr"}`) and widened container from "md" to "lg"; T027 — added `RESOURCE_OPEN_BID_COUNT_QUERY`, wired it into manage.tsx with `skip:!resourcePendingDelete`, and added warning Alert in delete dialog plus `openBidsWarning` i18n key in resources.json EN/FR; T028 — typecheck clean, 8 bid tests pass; T029 — added "Differences from Legacy Tope-là Behavior" section to spec.md with 7 documented intentional divergences. | frontend/src/locales/en/bids.json; frontend/src/locales/fr/bids.json; frontend/src/locales/en/contribution.json; frontend/src/locales/fr/contribution.json; frontend/src/pages/bids.tsx; frontend/src/pages/resources/manage.tsx; frontend/src/features/resources/resources.queries.ts; frontend/src/locales/en/resources.json; frontend/src/locales/fr/resources.json; specs/007-bids-workspace-and-settlement/spec.md; specs/007-bids-workspace-and-settlement/tasks.md | None | P5 Feature 007 fully complete. Proceed to next P5 feature or P6. |
| 2026-05-05 | P5 execution | Started Feature 008 US3 navigation/deep-link (T021-T025): added claim conversation relation (`claimConversationsByNeedClaimId(first: 1) { nodes { id } }`) to viewer claims overview query; added explicit need/account/chat navigation affordances to sent and received claim cards on `/claims`; added EN/FR i18n action keys for need-owner and chat; created frontend navigation coverage with 4 tests (sent/received chat present/absent and need/account deep links). T022 required no new API because claim conversation relation already exists in schema. | frontend/src/features/needs/needClaims.queries.ts; frontend/src/pages/claims.tsx; frontend/src/locales/en/claims.json; frontend/src/locales/fr/claims.json; frontend/tests/claims/claim-navigation.spec.tsx; specs/008-claims-workspace-and-settlement/tasks.md; npm -C frontend test -- --runInBand frontend/tests/claims/claim-navigation.spec.tsx | Existing `frontend/tests/needs/claim-thread.spec.tsx` has a locale-sensitive expectation (`"read"`) that currently fails independently of this slice. | Continue Feature 008 US2 workspace-action parity (T017-T020: cancel/decline/settle controls + inactive explanations). |
| 2026-05-09 | P5 execution | Added explicit claim-settlement race coverage for Phase 5: two concurrent `settleNeedClaim` attempts on sibling open claims now validated to produce exactly one settled claim, one declined claim, one settlement event, and exactly one debit/credit ledger pair for the settled claim reference (no duplicate token side-effects). | backend/tests/integration/claim-settlement.spec.ts; npm -C backend test -- tests/integration/claim-settlement.spec.ts | None | Add equivalent concurrency/ledger safety validation for bids settlement path, then reassess P5 closeout readiness. |
| 2026-05-09 | P5 execution | Added bids-side concurrent idempotency coverage: concurrent duplicate `respondToResourceBid(status: ACCEPTED)` retries now validate single accepted state, no bidder refund emission, and exactly one `resource_bid_settled` movement for the bid reference across retries. | backend/tests/integration/bids-settlement.spec.ts; npm -C backend test -- tests/integration/bids-settlement.spec.ts | None | Execute consolidated P5 verification sweep (claims + bids + smoke sanity) and prepare closeout decision. |
| 2026-05-09 | P5 execution | Ran consolidated P5 verification sweep: claim settlement integration and bid settlement integration suites both green (7 tests), and smoke E2E matrix green (5 tests including new claims-action and bid-lifecycle scenarios). | npm -C backend test -- tests/integration/claim-settlement.spec.ts tests/integration/bids-settlement.spec.ts; npm run test:e2e:smoke | Backend Jest reported a forced worker exit/open-handle hint after settlement integration run (non-failing). | Triage open-handle warning (`--detectOpenHandles`) and decide if P5 can be marked DONE immediately after leak hardening check. |
| 2026-05-09 | P5 execution | Expanded Phase 5 smoke coverage with two new end-to-end scenarios: bids decline branch (`@spec-007-us2`) and claims settlement side-effects (`@spec-008-us2-settle`) using isolated seeded fixtures; full smoke matrix now passes 7/7 in parallel mode. | e2e/scripts/seed-smoke-users.mjs; e2e/helpers/testUsers.ts; e2e/specs/007-bids-workspace-and-settlement/us2-bid-decline-refund.smoke.spec.ts; e2e/specs/008-claims-workspace-and-settlement/us2-claim-settlement-side-effects.smoke.spec.ts; npm run test:e2e:smoke | None | Keep this expanded smoke set as baseline while starting P6 conversation-layer implementation. |
| 2026-05-09 | P5 closeout | Completed P5 closeout verification by re-running settlement suites with `--detectOpenHandles --runInBand`; no persistent handle leak reproduced, and all settlement + smoke evidence remains green. Marked Phase 5 as DONE. | npm -C backend test -- --detectOpenHandles --runInBand tests/integration/claim-settlement.spec.ts tests/integration/bids-settlement.spec.ts; specs/implementation-progress-tracker.md | None | Kick off P6 conversation-layer implementation (006). |
| 2026-05-09 | P6 kickoff | Started Phase 6 conversation-layer implementation with backend message-composer guard coverage: added integration tests for mandatory text validation, participant-only message posting, and single-conversation-per-claim-context behavior. | backend/tests/integration/chat-message-composer.spec.ts; npm -C backend test -- tests/integration/chat-message-composer.spec.ts | Resource-side composer coverage is still pending in this new suite and will be added in the next P6 slice. | Continue P6 US2 by extending composer integration coverage to resource conversations and then begin frontend `ConversationThread`/`MessageComposer` normalization tests (T015). |

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

- Overall progress: P1–P5 complete, P7 complete, P8 complete; P6 (conversation layer) is now the active phase.
- Current health: GREEN
- Main risk: Conversation-layer access rules and handoff consistency between accepted claim/bid states and chat thread entry points (P6 kickoff risk).
- Requested supervisor input: none.
