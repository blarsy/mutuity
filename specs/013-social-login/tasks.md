# Tasks: Social Login

**Feature**: 013-social-login
**Task IDs**: T097 – T139 (reserved range)
**Resolves**: T057b in `005-resource-discovery-and-publishing/tasks.md` (social auth parity E2E) when Phase 6 is complete.

---

## Phase 1 — Architecture & Spec Foundation

- [x] T097 — Write feature spec (`spec.md`, `plan.md`, `tasks.md`, `quickstart.md`) including Google and Apple flows, examples directly beneath each user story, security rules, and delivery slices
- [x] T098 — Add `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_CALLBACK_URL`, `GOOGLE_OAUTH_SCOPES`, and `SOCIAL_AUTH_STATE_SECRET` to `backend/.env.example`; include Apple OAuth env vars
- [x] T099 — Add `google-auth-library` and `apple-signin-auth` to `backend/package.json` and run `npm install`

---

## Phase 2 — Backend: Google OAuth

- [ ] T100 — Create `backend/src/auth/socialState.ts`: `signState({ next, link, nonce }, secret)` → compact JWT-style signed string; `verifyState(state, secret)` → payload or null; 10-minute TTL; unit-test the round-trip
- [x] T101 — Replace the Google 501 stub in `server.ts` `/auth/:provider/start` with a real OAuth redirect: load env vars, call `signState`, redirect to `accounts.google.com/o/oauth2/v2/auth` with correct params; sanitize `next` (must start with `/`)
- [x] T102 — Create `backend/src/auth/googleCallback.ts`: accept `code` + `state`, call `verifyState`, exchange code for tokens via `google-auth-library`, verify the ID token, extract `sub`/`email`/`name`, call DB `resolve_account_for_external_identity`
- [x] T103 — Add `GET /auth/google/callback` route in `server.ts`: call `googleCallback.ts`, handle `subject_match` → create session + redirect, `explicit_link_required` → redirect with `link_confirmation_required` status, `no_match` → redirect to `/register` with signed provider token
- [x] T104 — Extend `backend/tests/integration/social-auth-start-routes.spec.ts`: assert Google start returns 302 with `accounts.google.com` location when env vars are set; assert missing `GOOGLE_OAUTH_CLIENT_ID` returns 501; assert `next` with external URL is stripped

---

## Phase 3 — Database: Social Registration Wrapper

- [x] T105 — Create `database/migrations/126_social_registration.sql`: `app_public.register_account_with_social_identity(name, email, password, provider, provider_subject, provider_email)` security-definer function callable by `app_anonymous`; internally calls `register_local_account` logic then `app_private.upsert_account_identity`; entire body is one transaction
- [ ] T106 — Write an integration test for `register_account_with_social_identity`: verify account + identity are created; verify duplicate provider subject raises unique-violation; verify it does NOT bypass the email-uniqueness check on the account table
- [ ] T107 — Verify PostGraphile auto-exposes the new function as `registerAccountWithSocialIdentity` mutation and update the GraphQL schema snapshot if one exists

---

## Phase 4 — Frontend: Social Registration Completion

- [x] T108 — Wire social registration through `frontend/src/features/auth/auth.api.ts` and `frontend/src/features/auth/auth.queries.ts` using `registerLocalAccountWithSocialIdentity`
- [x] T109 — Modify `frontend/src/pages/register.tsx`: when `router.query.provider` is present, call `registerAccountWithSocialIdentity` mutation instead of the local registration path; on success, sign in and redirect; on error, surface a human-readable message
- [ ] T110 — Frontend type-check and build pass; add a Jest test for the register page branch that stubs the mutation and verifies it is called with correct variables when `provider` param is present

---

## Phase 5 — Backend: Apple Sign In

- [x] T111 — Extend Apple state handling: generate a nonce in Apple start and embed it in signed state for callback verification
- [x] T112 — Replace the Apple 501 stub in `server.ts` `/auth/:provider/start`: generate Apple authorize redirect with signed state + nonce
- [x] T113 — Create `backend/src/auth/appleCallback.ts`: parse callback payload, verify state, exchange code, verify ID token, and resolve account with DB function
- [x] T114 — Add `POST /auth/apple/callback` route in `server.ts`; same redirect outcomes as Google callback (T103); ensure GET to the same path returns 405
- [ ] T115 — Add integration tests for Apple start route (similar to T104): assert redirect target is `appleid.apple.com`; assert POST callback with missing state returns a redirect with `error` status rather than a 500

---

## Phase 6 — Validation & E2E Parity

- [ ] T116 — Verify all existing backend auth tests still pass after adding the new routes (`npm test` in `backend/`)
- [ ] T117 — Verify frontend build and typecheck pass (`next build` in `frontend/`)
- [ ] T118 — Manual QA: run through all six quickstart scenarios in a local stack with real test credentials (see `quickstart.md`), matching each canonical per-story example outcome from `spec.md`
- [ ] T119 — Mark `T057b` in `005-resource-discovery-and-publishing/tasks.md` as complete; add a cross-reference note pointing to this feature
- [ ] T120 — Update `specs/implementation-progress-tracker.md` to show Feature 013 as complete

### Mandatory P1 Business Acceptance Test Coverage

- [x] T126 — Add Google sign-up acceptance test for US1 success path (`no_match` → prefilled register) in `backend/tests/integration/google-callback-handler.spec.ts`
- [x] T127 — Add Google sign-up acceptance test for US1 branch (`explicit_link_required` → `link_confirmation_required`) in `backend/tests/integration/google-callback-handler.spec.ts`
- [x] T128 — Add Google sign-in acceptance test for US2 success path (`subject_match` → session + redirect) in `backend/tests/integration/google-callback-handler.spec.ts`
- [x] T129 — Add Google sign-in acceptance test for US2 `next` sanitization (external/malformed `next` falls back to `/`) in `backend/tests/integration/social-auth-start-routes.spec.ts`
- [x] T130 — Add Apple sign-up acceptance test for US3 success/branch handling in `backend/tests/integration/apple-callback-handler.spec.ts`
- [x] T131 — Add Apple sign-in acceptance test for US4 returning-user subject match in `backend/tests/integration/apple-callback-handler.spec.ts`

### E2E Smoke Matrix (Mandatory)

- [x] T132 — Create a concise E2E smoke matrix in `specs/013-social-login/quickstart.md` mapping selected P1 examples to smoke coverage (US1 success, US2 success, US3 success, US4 success, one exception path)
- [x] T133 — Implement E2E smoke test for P1 success paths in `e2e/specs/auth/social-login-smoke.spec.ts` (Google and Apple happy paths)
- [x] T134 — Implement E2E smoke exception-path test in `e2e/specs/auth/social-login-smoke.spec.ts` (`link_confirmation_required` or tampered state error)

---

## Phase 7 — Identity Link/Unlink UI (P2, deferred)

- [ ] T135 — Create `database/migrations/<next>_unlink_account_external_identity.sql`: `app_public.unlink_account_external_identity(provider text)` security-definer function; deletes from `account_identity` for `current_account_id()`; raises exception if the account has no local credential and would be left with no sign-in path
- [ ] T136 — Extend `/auth/:provider/start` to accept `?link=1`; embed `link: true` in the signed state so the Google/Apple callbacks can branch into the link flow rather than the login flow
- [ ] T137 — Update `googleCallback.ts` and `appleCallback.ts`: when state contains `link: true`, call `app_public.link_account_external_identity` (which already enforces the recent-auth gate) instead of creating a new session
- [ ] T138 — Create `frontend/src/features/auth/IdentityLinkSection.tsx`: list linked providers from `authSession`; "Link" button triggers start URL with `link=1`; "Unlink" button calls `unlinkAccountExternalIdentity` mutation with confirmation dialog
- [ ] T139 — Integrate `IdentityLinkSection` into the profile/security settings page; add a frontend test for both the link and unlink paths
