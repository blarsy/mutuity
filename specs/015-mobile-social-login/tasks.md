# Tasks: Mobile Social Login

**Input**: Design documents from `/specs/015-mobile-social-login/`
**Prerequisites**: `spec.md`, `plan.md`, and the web/backend social-auth foundation from feature `013-social-login`

**Tests**: Acceptance coverage is REQUIRED for all P1 stories. At least one deep-link callback smoke path per provider is REQUIRED.

## Phase 1: Contract And Routing Foundation

**Purpose**: Build the callback contract and deep-link plumbing required by all mobile social-auth flows.

- [x] T001 Define mobile social callback payload contract and route semantics in backend/mobile shared documentation under `specs/015-mobile-social-login/spec.md`
- [x] T002 Implement mobile-aware callback outcome builder in backend social-auth handlers and supporting auth utilities under `backend/src/auth/`
- [x] T003 [P] Add mobile deep-link callback parsing service in `mobile-app/src/services/socialAuth/callback.ts`
- [x] T004 [P] Add mobile social-auth start URL builder in `mobile-app/src/services/socialAuth/start.ts`
- [x] T005 Wire deep-link bootstrap and callback handling into `mobile-app/src/navigation/AppNavigator.tsx`
- [x] T006 [P] Update Expo app scheme or callback path configuration if needed in `mobile-app/app.config.ts`

**Checkpoint**: The app can receive and parse a structured social-auth callback without yet completing sign-in.

---

## Phase 2: Google Mobile Social Auth (P1)

**Goal**: Deliver end-to-end Google sign-up/sign-in on mobile.

### Acceptance Tests

- [x] T007 [P] [US1] Add acceptance test for Google mobile sign-up success in `mobile-app/tests/integration/us5-google-social-signup.acceptance.test.ts`
- [x] T008 [P] [US2] Add acceptance test for Google returning social sign-in and return routing in `mobile-app/tests/integration/us5-google-social-signin.acceptance.test.ts`
- [x] T009 [P] [US1] Add exception-path acceptance test for Google cancellation or callback error in `mobile-app/tests/integration/us5-google-social-cancel.acceptance.test.ts`

### Implementation

- [x] T010 [US1] Implement Google social start action from mobile auth surfaces in `mobile-app/src/screens/auth/SocialAuthButtons.tsx` and `mobile-app/src/screens/auth/LoginScreen.tsx`
- [x] T011 [US1] Implement Google registration-completion handoff in `mobile-app/src/screens/auth/RegisterScreen.tsx` and `mobile-app/src/services/socialAuth/callback.ts`
- [x] T012 [US2] Persist real mobile session token after successful Google sign-in in `mobile-app/src/services/auth/AuthProvider.tsx` and `mobile-app/src/services/auth/session.ts`
- [x] T013 [US2] Replace local-only account-id sign-in shortcut for social success path in `mobile-app/src/navigation/AppNavigator.tsx` and `mobile-app/src/services/graphql/auth.ts`

**Checkpoint**: Google social auth works end to end on mobile.

---

## Phase 3: Apple Mobile Social Auth (P1)

**Goal**: Deliver end-to-end Apple sign-up/sign-in on mobile.

### Acceptance Tests

- [x] T014 [P] [US3] Add acceptance test for Apple mobile sign-up success in `mobile-app/tests/integration/us5-apple-social-signup.acceptance.test.ts`
- [x] T015 [P] [US4] Add acceptance test for Apple returning social sign-in in `mobile-app/tests/integration/us5-apple-social-signin.acceptance.test.ts`
- [x] T016 [P] [US3] Add exception-path acceptance test for invalid Apple callback state in `mobile-app/tests/integration/us5-apple-social-invalid-state.acceptance.test.ts`

### Implementation

- [x] T017 [US3] Implement Apple social start action from mobile auth surfaces in `mobile-app/src/screens/auth/SocialAuthButtons.tsx` and `mobile-app/src/screens/auth/LoginScreen.tsx`
- [x] T018 [US3] Implement Apple registration-completion handoff in `mobile-app/src/screens/auth/RegisterScreen.tsx` and `mobile-app/src/services/socialAuth/callback.ts`
- [x] T019 [US4] Persist and restore session token after successful Apple sign-in in `mobile-app/src/services/auth/AuthProvider.tsx` and `mobile-app/src/services/auth/session.ts`

**Checkpoint**: Apple social auth works end to end on mobile.

---

## Phase 4: Non-Happy-Path Mobile Auth Branches (P2)

**Goal**: Handle mobile-specific conflict and recovery outcomes explicitly.

### Acceptance Tests

- [x] T020 [P] [US5] Add acceptance test for `register_required` callback routing in `mobile-app/tests/integration/us5-social-register-required.acceptance.test.ts`
- [x] T021 [P] [US5] Add acceptance test for `link_confirmation_required` callback routing in `mobile-app/tests/integration/us5-social-link-required.acceptance.test.ts`
- [x] T022 [P] [US5] Add acceptance test for `password_reset_required` callback routing in `mobile-app/tests/integration/us5-social-password-reset-required.acceptance.test.ts`

### Implementation

- [x] T023 [US5] Add callback outcome state machine and reducer in `mobile-app/src/services/socialAuth/callback.ts`
- [x] T024 [US5] Extend login/register/forgot-password mobile surfaces to consume social branch outcomes in `mobile-app/src/screens/auth/LoginScreen.tsx`, `mobile-app/src/screens/auth/RegisterScreen.tsx`, and `mobile-app/src/screens/auth/ForgotPasswordScreen.tsx`
- [x] T025 [US5] Add localized error and conflict copy in `mobile-app/src/i18n/locales/en/us1.json` and `mobile-app/src/i18n/locales/fr/us1.json`

**Checkpoint**: Mobile users are not stranded when social auth does not go straight to success.

---

## Phase 5: Session Continuity And Relaunch (P2)

**Goal**: Treat social-auth sessions as first-class mobile sessions.

### Acceptance Tests

- [x] T026 [P] [US6] Add acceptance test for social-auth session restore on relaunch in `mobile-app/tests/integration/us5-social-session-restore.acceptance.test.ts`
- [x] T027 [P] [US6] Add acceptance test for invalid persisted social-auth token recovery in `mobile-app/tests/integration/us5-social-invalid-token.acceptance.test.ts`

### Implementation

- [x] T028 [US6] Harden bootstrap validation for social-auth bearer tokens in `mobile-app/src/services/auth/AuthProvider.tsx` and `mobile-app/src/services/graphql/client.ts`
- [x] T029 [US6] Ensure sign-out clears social-auth session state in `mobile-app/src/services/auth/session.ts` and `mobile-app/src/navigation/AppNavigator.tsx`

**Checkpoint**: Social-auth sessions survive relaunch and fail safely when invalid.

---

## Phase 6: Smoke, QA, And Documentation

- [x] T030 [P] Add deep-link smoke test for Google mobile social auth in `mobile-app/tests/e2e/s7-google-social-auth.smoke.spec.ts`
- [x] T031 [P] Add deep-link smoke test for Apple mobile social auth in `mobile-app/tests/e2e/s8-apple-social-auth.smoke.spec.ts`
- [x] T032 [P] Add exception smoke test for invalid callback or link-required branch in `mobile-app/tests/e2e/s9-social-auth-exception.smoke.spec.ts`
- [x] T033 Update mobile social-auth validation steps in `specs/015-mobile-social-login/quickstart.md`

---

## Dependencies And Execution Order

- Phase 1 must complete before provider-specific implementation starts.
- Google and Apple phases can progress in parallel after the callback contract is stable.
- Phase 4 depends on the callback contract plus at least one provider implementation.
- Phase 5 depends on successful token issuance and persistence.
- Phase 6 depends on all P1 flows.