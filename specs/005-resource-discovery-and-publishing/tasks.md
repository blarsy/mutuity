# Tasks: Resource Discovery And Publishing

**Input**: Design documents from `/specs/005-resource-discovery-and-publishing/`

## Phase 1: Spec Foundation

- [x] T001 Confirm the feature scope for resource discovery, publishing, and bid handling in `specs/005-resource-discovery-and-publishing/spec.md`
- [x] T002 Draft the implementation plan in `specs/005-resource-discovery-and-publishing/plan.md`
- [x] T003 Audit the relevant Tope-là resource screens and flows before coding begins

## Phase 1b: UI Architecture Foundations

- [x] T015 Document the shared navigation shell, route inventory, and reusable UI building blocks in `specs/005-resource-discovery-and-publishing/spec.md` and `plan.md`
- [x] T016 Create shared `AvatarIconButton`, `ResourceCard`, and `NeedCard` components for reuse across discovery, detail, account, and campaign pages
- [x] T017 Add reusable auth entry surfaces for `Login`, `Register`, `ResetPassword`, and `RestoreAccess`, including dialog-based entry points for gated actions
- [x] T018 Add dedicated workspace pages for `Bids`, `Claims`, `Chat`, `Notifications`, `Profile`, `Preferences`, and `Contribution` as the route map fills out

## Phase 1c: Notifications Foundation

- [x] T019 Document the notification event catalog, default message copy, route mapping, and retention rules in `specs/005-resource-discovery-and-publishing/spec.md` and `plan.md`
- [x] T020 Build the initial `/notifications` inbox by aggregating claim and resource-bid notifications with per-item read and open-to-read behavior
- [x] T021 Add SQL-owned notification actions for single-item read, bulk `Set all as read`, and retention cleanup
- [x] T022 Implement scheduled/background emitters for bid-expiring-soon, campaign-airdrop-soon, campaign-airdrop-done, welcome/profile reward, gifted-Topes, and future grant notifications *(all currently specified emitters are implemented and verified; future grant notifications remain intentionally deferred until their payload/destination rules are specified)*
- [x] T023 Run end-to-end verification for notifications rendering, routing, checkbox/bulk-read behavior, and cleanup eligibility

## Phase 1d: Contribution And Token Movements

- [x] T024 Document the token-movement catalog, one-time reward constraints, gifting rules, bid debit/refund rules, and claim-settlement token flows in `specs/005-resource-discovery-and-publishing/spec.md` and `plan.md`
- [x] T025 Design or extend the SQL-owned token ledger so every positive/negative Topes movement is auditable and linked to its originating business event
- [x] T026 Implement one-time profile and resource milestone rewards with duplicate-protection over account/resource lifetime
- [x] T027 Implement scheduled/background issuance for `resource age >= 24h` and `claim age >= 24h` rewards
- [x] T028 Implement campaign-airdrop payouts with per-account/per-campaign idempotency, the "at least two approved linked items across needs/resources" eligibility rule, and contribution-page visibility
- [x] T029 Implement gifting, bid reserve/refund, and claim-settlement ledger movements with end-to-end verification

## Phase 2: Resource Discovery (P1)

- [x] T004 Add backend tests for active-resource filtering, closeness-only sorting with recent-created tie-breaking, expiration-versus-permanent behavior, ranking, and the six tri-state flag filters
- [x] T005 Implement PostgreSQL search/query helpers for resources, including closeness-based ordering, deterministic recent-created tie-breaking, expiration handling, and `neutral` / `yes` / `no` semantics for each modality flag
- [x] T006 Build the public resource discovery page and tri-state filters

## Phase 3: Resource Publishing (P1)

- [x] T007 Add publish-form validation tests and contract coverage for mandatory intensity, optional negotiated Topes reference amount range mapping, and rich-text description length/validation
- [x] T008 Implement the resource publish/edit mutation and SQL-owned validation rules, including shared intensity/Topes-range checks and safe rich-text description handling
- [x] T009 Build the resource publish/edit UI with media handling, a rich-text description field, and non-commercial wording for the optional Topes reference amount field

## Phase 4: Resource Responses (P2)

- [x] T010 Add backend tests for resource bid creation, expired-resource rejection, and lifecycle rules
- [x] T011 Implement resource response queries/mutations and notification hooks, including expired-resource guards
- [x] T012 Build the publisher review and response-management UI

## Phase 5: Validation

- [x] T013 Run end-to-end verification for discovery, publishing, and bid handling
- [x] T014 Capture any differences between legacy Tope-là behavior and the rebuilt MVP back into the spec

## Phase 6: Resources Workspace Page

- [x] T030 Rename "Publish resource" / "Publish Resource" label to "Edit resource" / "Add resource" in all frontend files (`pages/index.tsx`, `features/resources/PublicResourcesPage.tsx`, `features/resources/CreateResourcePage.tsx`)
- [x] T031 Extend the resource data model and mutation to update `updatedAt` (last modification time) whenever any linked property changes, including images and categories
- [x] T032 Implement the `Resources` workspace page: query with `updatedAt`-descending sort, page size 10, infinite scroll loading 10 more, and authentication guard
- [x] T033 Add Edit and Delete card actions to the resources workspace page: Edit navigates to the edit-resource page in modification mode; Delete shows a confirmation dialog and performs a soft delete on confirmation
- [x] T034 Add a fixed "Add resource" button to the resources workspace page that remains visible at all scroll positions and navigates to the edit-resource page in creation mode

## Phase 7: Needs Workspace Page

- [x] T035 Rename the create-need page to edit-need page to support both creation and modification modes
- [x] T036 Extend the need data model and mutation to update `updatedAt` (last modification time) whenever any linked property changes, including images and categories
- [ ] T037 Implement the `Needs` workspace page: query with `updatedAt`-descending sort, page size 10, infinite scroll loading 10 more, and authentication guard
- [ ] T038 Add Edit and Delete card actions to the needs workspace page: Edit navigates to the edit-need page in modification mode; Delete shows a confirmation dialog and performs a soft delete on confirmation
- [ ] T039 Add a fixed "Add need" button to the needs workspace page that remains visible at all scroll positions and navigates to the edit-need page in creation mode

## Phase 8: Contribution Page Informative UX

- [ ] T040 Add a Topes explanation carousel entry button on the `Contribution` page and implement carousel open/close/slide navigation behavior
- [ ] T041 Implement token-transaction history on the `Contribution` page with newest-first ordering, initial page size 10, and `Load more` appending 10 older transactions until exhausted
- [ ] T042 Hide or disable the `Load more` action once the first transaction has been reached and all available history is displayed
- [ ] T043 Add a Topes-earning opportunities list on the `Contribution` page where each row includes earning-action label, token amount, and destination link to the corresponding page

## Phase 9: Preferences Page And Out-Of-App Delivery Controls

- [ ] T044 Document the preferences information architecture: channels (`in-app`, `email summary`, `push`), four managed event categories, strategy matrix, and activity-gating rules in `spec.md` and `plan.md`
- [ ] T045 Implement SQL-owned preference persistence and retrieval for per-account/per-category strategy and summary frequency (`1`/`3`/`7`/`30` days, default `1`)
- [ ] T046 Implement SQL-owned ranked targeting helper(s) for `new need added` equivalent to Tope-la `get_accounts_to_notify_of_new_resource`, and align `new resource added` targeting behavior with the reverse-engineered rules
- [ ] T047 Implement out-of-app dispatch gating so push/email for preference-managed categories is emitted only when the target account has no active web/mobile session
- [ ] T048 Implement event-pending persistence and a daily `08:00` digest worker that sends at most one email per account with one section per pending category and idempotent mark-as-broadcasted updates
- [ ] T049 Implement backend API + frontend `Preferences` page UI for editing per-category delivery strategy and email summary frequency, including safe defaults and validation
- [ ] T050 Add end-to-end verification for realtime push vs digest behavior across all four categories, including digest frequency cadence and no-duplicate-send guarantees

## Phase 10: Authentication Parity With Tope-la

- [x] T051 Document Tope-la auth parity in `spec.md` and `plan.md`: profile-minimal account creation (`account name` mandatory), local email/password signup with verification, forgot/reset password, change password, and Google/Apple sign-in/up with suggested-name prefill *(local-parity docs completed; social sign-in remains explicitly documented as deferred)*
- [ ] T052 Implement SQL-owned/auth-backed identity model updates for local credentials, external identities (`google`, `apple`), account-link safety, and duplicate-account prevention
- [ ] T053 Implement backend endpoints/handlers for email verification lifecycle (issue, resend with throttling, verify, invalid/expired handling)
- [ ] T054 Implement forgot-password lifecycle (request reset email, token validation, password update, single-use token invalidation)
- [ ] T055 Implement authenticated change-password flow with current-password validation and post-change session hardening behavior
- [ ] T056 Implement frontend auth surfaces and routing updates for social sign-in buttons (`Google`, `Apple`) including editable suggested-name prefill from provider profile data, verification completion, forgot/reset password, and change-password UI
- [ ] T057 Add end-to-end verification for all auth entry/recovery paths, including signup/login parity across local+social identities and token expiry/reuse protections

## Phase 11: Unified Cross-Component Logging

- [ ] T058 Document the unified logging contract in `spec.md` and `plan.md`: one table, mandatory `component`, optional `context`, and message rules for `info`/`warn`/`error`
- [ ] T059 Implement database schema and SQL-owned write/search helpers for unified operational logs, replacing split-write usage patterns equivalent to client/server table separation
- [ ] T060 Implement backend logging adapter updates in `web_api` and worker paths to write unified log entries with required `component` and error stack formatting
- [ ] T061 Implement frontend/mobile logging adapter updates so backoffice and mobile emit to the unified log write API with optional account id and activity context
- [ ] T062 Add mandatory exception instrumentation for PostgreSQL interaction failures (GraphQL and direct client usage) and external-provider failures (Google auth, Apple auth, Cloudinary, Expo push, other third-party APIs)
- [ ] T063 Add fallback logging behavior so unified-log persistence failures degrade to console/file diagnostics without interrupting primary user flows
- [ ] T064 Add end-to-end verification and operational checks for unified logging coverage, including cross-component filtering by `component`, correlation by `context`, and duplicate-free migration from old write paths
- [ ] T065 Add SQL-owned system setting for log retention days (default `7`) and scheduled cleanup that deletes unified logs older than the configured retention window

## Phase 12: Grants Seeding And Claim Flow

- [ ] T066 Document grants behavior in `spec.md` and `plan.md`: admin-only creation, criteria conjunction, claim route UX, and denial reason categories
- [ ] T067 Implement SQL-owned grant schema and helpers for grant definitions, targeted accounts/emails, campaign-link criterion, max-claim count, expiration datetime, and per-account claim records
- [ ] T068 Implement admin-only API/mutations for creating and managing grants and their criteria
- [ ] T069 Implement SQL-owned atomic claim function that evaluates all criteria, enforces max-claims/per-account idempotency, issues token award on success, and returns a safe claim outcome code
- [ ] T070 Implement authenticated grant claim page (`/grants/[id]`) that loads grant title/description and executes claim with success/error messaging
- [ ] T071 Integrate successful grant claims into token movement ledger with grant linkage for auditability
- [ ] T072 Add backend tests for eligibility combinations (accounts, emails, future users, campaign criterion, max-claim cap, expiration, already-claimed) and concurrency safety
- [ ] T073 Add end-to-end verification for grant route behavior and claim outcomes, including user-safe denial messages

## Phase 13: Admin Support And Troubleshooting Pages

- [ ] T074 Document the admin support page matrix in `spec.md` and `plan.md`, including field projections, search fields, ordering, and action buttons per data item
- [ ] T075 Implement admin-only backend list/search endpoints or SQL helpers for accounts, bids, resources, notifications, mails, campaigns, grants, and logs with most-recent-first ordering and pagination
- [ ] T076 Implement admin access guard and role enforcement for all admin support routes and side-effect actions
- [ ] T077 Build admin pages for accounts, bids, resources, notifications, mails, campaigns, grants, and logs with shared table/search scaffolding
- [ ] T078 Implement mail actions: fullscreen HTML content viewer and `send again` action using the same routine as mailing jobs
- [ ] T079 Implement campaign actions: fullscreen description viewer and moderation handoff that exposes feature `001-campaign-needs` admin moderation-note flow
- [ ] T080 Implement grant/log actions: create-grant dialog from admin grants page and fullscreen wrapping message viewer from admin logs page
- [ ] T081 Add end-to-end verification for admin search/filter behavior, action outcomes, authorization restrictions, and audit-log emission for side-effect actions