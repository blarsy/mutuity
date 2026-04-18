# Tasks: Authentication And Login Flow

**Input**: Design documents from `/specs/004-login-flow/`
**Prerequisites**: spec.md, plan.md

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependency)
- **[Story]**: User story scope (`US1`, `US2`, `US3`, `US4`)
- All task descriptions include concrete file paths

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Create auth feature folders in `backend/src/auth/` and `frontend/src/features/auth/`
- [x] T002 [P] Add backend auth/session dependencies and env placeholders in `backend/package.json` and `backend/.env.example`
- [x] T003 [P] Add frontend auth route placeholders and shared auth types in `frontend/src/features/auth/` and `frontend/src/services/`

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T004 Create database migration for account credentials and sessions in `database/migrations/007_auth_sessions.sql`
- [x] T005 [P] Add SQL helpers for session lookup and revocation in `database/functions/auth/`
- [x] T006 [P] Add password hashing and credential verification service in `backend/src/auth/credentials.ts`
- [x] T007 Wire secure cookie/session middleware into `backend/src/postgraphile/server.ts`
- [x] T008 Add backend endpoint or handler for `POST /auth/login`, `POST /auth/logout`, and `GET /auth/session` in `backend/src/auth/`
- [x] T009 Add frontend auth service wrappers for login/logout/current-session in `frontend/src/features/auth/auth.api.ts`
- [x] T010 Add auth context/provider for current account state in `frontend/src/features/auth/AuthProvider.tsx`
- [x] T011 Add i18n strings for login, logout, and auth errors in `frontend/src/i18n/messages/fr.json` and `frontend/src/i18n/messages/en.json`

## Phase 3: User Story 1 - Account Signs In (Priority: P1)

**Goal**: Registered accounts can sign in securely and see authenticated UI state.

**Independent Test**: Valid credentials create a session; invalid credentials show generic error copy.

### Tests (US1)

- [x] T012 [P] [US1] Add backend integration tests for valid and invalid login attempts in `backend/tests/integration/auth-login.spec.ts`
- [x] T013 [P] [US1] Add contract tests for login/session HTTP behavior in `backend/tests/contract/auth.contract.spec.ts`

### Implementation (US1)

- [x] T014 [US1] Build `LoginPage` UI in `frontend/src/pages/login.tsx`
- [x] T015 [US1] Add login form validation in `frontend/src/features/auth/login.validation.ts`
- [x] T016 [US1] Connect login form to auth API and shared auth context in `frontend/src/features/auth/`
- [x] T017 [US1] Add authenticated navigation state on the home page or shared layout in `frontend/src/pages/_app.tsx` and/or `frontend/src/pages/index.tsx`

## Phase 4: User Story 2 - Protected Actions Redirect To Login (Priority: P1)

**Goal**: Signed-out users are redirected to login before protected actions and returned afterward.

**Independent Test**: Access protected routes while signed out, sign in, and confirm redirect-back behavior.

### Tests (US2)

- [x] T018 [P] [US2] Add frontend/integration tests for protected route redirects and return-to behavior in `frontend/tests/auth/protected-routes.spec.tsx`
- [x] T019 [P] [US2] Add backend integration test verifying unauthenticated GraphQL mutations still return sanitized `UNAUTHENTICATED` errors in `backend/tests/integration/auth-graphql-fallback.spec.ts`

### Implementation (US2)

- [x] T020 [US2] Add route guard utility for protected pages in `frontend/src/features/auth/requireAuth.ts`
- [x] T021 [US2] Apply auth guard to campaign creation and future protected pages in `frontend/src/features/campaigns/CreateCampaignPage.tsx` and related pages
- [x] T022 [US2] Preserve and restore intended destination via query param or router state in `frontend/src/pages/login.tsx`

## Phase 5: User Story 3 - Session Persists And Expires Safely (Priority: P1)

**Goal**: Session survives refresh while valid and expires cleanly when no longer valid.

**Independent Test**: Refresh keeps valid session; expired session requires re-authentication.

### Tests (US3)

- [x] T023 [P] [US3] Add backend integration tests for session lookup, expiry, and revocation in `backend/tests/integration/auth-session.spec.ts`
- [x] T024 [P] [US3] Add frontend tests for restoring current account state on app load in `frontend/tests/auth/session-bootstrap.spec.tsx`

### Implementation (US3)

- [x] T025 [US3] Load current session during app bootstrap in `frontend/src/pages/_app.tsx` or `frontend/src/features/auth/AuthProvider.tsx`
- [x] T026 [US3] Add expired-session handling that clears auth state and redirects on protected action failure in `frontend/src/services/graphql/` and `frontend/src/features/auth/`

## Phase 6: User Story 4 - Account Signs Out (Priority: P1)

**Goal**: Authenticated users can sign out and lose access immediately.

**Independent Test**: Sign in, sign out, then verify protected actions require login again.

### Tests (US4)

- [x] T027 [P] [US4] Add backend integration tests for logout/session revocation in `backend/tests/integration/auth-logout.spec.ts`
- [x] T028 [P] [US4] Add frontend tests for sign-out UI state reset in `frontend/tests/auth/logout.spec.tsx`

### Implementation (US4)

- [x] T029 [US4] Add logout action/button to shared authenticated UI in `frontend/src/features/auth/LogoutButton.tsx`
- [x] T030 [US4] Clear auth context and redirect after logout in `frontend/src/features/auth/`

## Phase 7: Polish & Cross-Cutting

- [x] T031 [P] Add rate-limit and audit logging coverage for failed login attempts in `backend/src/auth/` and `backend/tests/integration/`
- [x] T032 [P] Ensure all login/logout/auth strings are translated and user-friendly in `frontend/src/i18n/messages/`
- [x] T033 Document local auth test flow in `README.md` and/or feature quickstart notes
- [x] T034 Run end-to-end auth validation and capture any spec divergences back into `specs/004-login-flow/spec.md`

## Dependencies & Execution Order

- Setup tasks (T001-T003) first.
- Foundational tasks (T004-T011) block all user stories.
- US1 should land before protected-route UX.
- US2 depends on shared auth state from US1.
- US3 depends on session persistence infrastructure.
- US4 depends on live session creation and shared auth state.

## Parallel Execution Examples

- T002 and T003 can run in parallel.
- T005 and T006 can run in parallel.
- T012 and T013 can run in parallel.
- T018 and T019 can run in parallel.
- T023 and T024 can run in parallel.
- T027 and T028 can run in parallel.

## Implementation Strategy

1. Add secure backend session primitives first.
2. Build the login page and current-account bootstrap.
3. Protect campaign/need creation routes and preserve redirect-back behavior.
4. Add logout, expiry handling, and polish around rate limiting and translations.
