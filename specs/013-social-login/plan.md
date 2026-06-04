# Implementation Plan: Social Login

**Feature Branch**: `013-social-login`
**Depends on**: migrations 053, 122, 123 (all in place)
**Status**: Ready to start

---

## Technical Context

| Layer | Technology |
|---|---|
| Backend | Express + TypeScript strict mode, PostGraphile |
| Auth transport | Session cookie (existing `createAuthSessionMiddleware`) |
| Frontend | Next.js 14, MUI, Apollo Client |
| Database | PostgreSQL with PL/pgSQL; business logic lives in DB functions |
| Token verification | `google-auth-library` (Google), `apple-signin-auth` (Apple) |
| OAuth state | HMAC-signed value using `SOCIAL_AUTH_STATE_SECRET` |

---

## Example-Driven Scope

The examples listed directly under each user story in the spec are the source of truth for branching auth outcomes. Delivery slices, implementation checks, and manual QA should preserve those story-local example outcomes exactly, especially for sign-up vs link-confirmation vs returning-user sign-in.

---

## Business Acceptance-Test Inventory

The inventory below converts per-story examples into mandatory acceptance coverage classes for implementation and smoke selection.

| Story | Example focus | Scenario class | Required coverage type |
|---|---|---|---|
| US1 (Google sign-up) | `no_match` redirects to pre-filled register | Success | Acceptance + E2E smoke |
| US1 (Google sign-up) | `explicit_link_required` redirect | Alternate/Exception | Acceptance + E2E smoke |
| US2 (Google sign-in) | `subject_match` creates session and redirects to `next` | Success | Acceptance + E2E smoke |
| US2 (Google sign-in) | External/malformed `next` falls back to `/` | Exception/Recovery | Acceptance |
| US3 (Apple sign-up) | First sign-in registration path with available profile data | Success | Acceptance + E2E smoke |
| US3 (Apple sign-up) | Invalid/missing callback `state` is rejected | Exception | Acceptance |
| US4 (Apple sign-in) | Returning user resolves by provider subject | Success | Acceptance + E2E smoke |
| US4 (Apple sign-in) | Relay email variation does not break identity resolution | Alternate/Recovery | Acceptance |

### Minimum E2E Smoke Selection

- One success-path smoke test for each P1 story (US1-US4).
- At least one exception-path smoke test across P1 (state tampering or link-confirmation branch).
- End-to-end auth/session continuity check after provider callback and redirect.

---

## Constitution Check

| Principle | How this feature satisfies it |
|---|---|
| Security first | Provider tokens never leave the backend; state is signed; auto-linking by email is blocked by existing policy |
| Business logic in DB | Social registration wrapper is a PL/pgSQL function; identity resolution is already in DB |
| Small reversible steps | Six independent delivery slices; each slice can be deployed without the next |
| No silent data loss | DB-level errors on duplicate identity links surface explicitly to the UI |

---

## Required Environment Variables

### Backend (`backend/.env`)

| Variable | Purpose | When needed |
|---|---|---|
| `GOOGLE_OAUTH_CLIENT_ID` | Verify Google ID token audience | Slice 1 |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Exchange auth code for tokens | Slice 1 |
| `GOOGLE_OAUTH_CALLBACK_URL` | Registered redirect URI in Google Console | Slice 1 |
| `GOOGLE_OAUTH_SCOPES` | `openid email profile` | Slice 1 |
| `SOCIAL_AUTH_STATE_SECRET` | HMAC key for signing `state` parameter | Slice 1 |
| `APPLE_OAUTH_CLIENT_ID` | Apple Service ID (web) | Slice 4 |
| `APPLE_OAUTH_TEAM_ID` | Apple Developer team identifier | Slice 4 |
| `APPLE_OAUTH_KEY_ID` | Key ID of the Apple private key | Slice 4 |
| `APPLE_OAUTH_PRIVATE_KEY` | PEM-encoded ES256 private key (or base64) | Slice 4 |
| `APPLE_OAUTH_CALLBACK_URL` | Registered redirect URI in Apple console (must be HTTPS) | Slice 4 |

All others (`SESSION_SECRET`, `FRONTEND_URL`, `DATABASE_URL`) already exist.

---

## Existing Infrastructure Notes

- `/auth/:provider/start` already exists in `server.ts` as a 501/302 stub. Slice 1 replaces the Google branch with real OAuth redirect logic.
- `createSessionForAccount` in `session.ts` is unchanged and usable as-is for both Google and Apple callbacks.
- `account_identity`, `resolve_account_for_external_identity`, `upsert_account_identity`, and `link_account_external_identity` are all in place from migration 053.
- Social callback frontend pages (`/pages/auth/google/callback.tsx`, `/pages/auth/apple/callback.tsx`) and `SocialCallbackPage.tsx` are already wired up.
- `T057b` in feature 005 tasks tracks E2E social auth parity; this feature is its resolution.

---

## Delivery Slices

### Slice 1 — Backend: Google Start Route (commit: `feat(auth): google oauth start route with state signing`)

**Scope**: Replace the `google` branch of `/auth/:provider/start` with a real OAuth redirect.

**Files changed**:
- `backend/src/postgraphile/server.ts` — remove 501 stub for Google; add state-signing helper; sanitize and embed `next`; redirect to Google authorize URL
- `backend/src/auth/socialState.ts` (new file) — `signState(next, secret)` and `verifyState(state, secret)` using HMAC-SHA256; 10-minute TTL baked into the signed payload
- `backend/.env.example` — add new env var documentation

**Acceptance gate**: `GET /auth/google/start?next=/dashboard` returns 302 with a `Location` pointing to `accounts.google.com/o/oauth2/v2/auth` with correct `client_id`, `scope`, `state`, and `redirect_uri`.

---

### Slice 2 — Backend: Google Callback Route (commit: `feat(auth): google oauth callback handler`)

**Scope**: Add `GET /auth/google/callback` to exchange the auth code, verify the ID token, and either create a session or redirect with a status.

**Files changed**:
- `backend/src/postgraphile/server.ts` — add `/auth/google/callback` GET route
- `backend/src/auth/googleCallback.ts` (new file) — code exchange with `google-auth-library`, ID token verification, call `resolve_account_for_external_identity`, session creation or redirect builder
- `backend/package.json` — add `google-auth-library` dependency

**Redirect outcomes**:

| DB resolution | Frontend redirect |
|---|---|
| `subject_match` | `{next}?status=success&sessionToken=…` |
| `explicit_link_required` | `/auth/callback?status=link_confirmation_required&provider=google&email=…` |
| `no_match` | `/register?provider=google&name=…&email=…&providerSubject=…&token=…` |

The `token` on `no_match` is a short-lived signed payload (using `SOCIAL_AUTH_STATE_SECRET`) containing `{provider, providerSubject, email, name}` so the registration endpoint can trust the data without relying on unvalidated query params.

**Acceptance gate**: A valid Google ID token exchanged in a test environment results in either a session cookie or a properly typed redirect.

---

### Slice 3 — Database: Social Registration Wrapper (commit: `feat(db): register_account_with_social_identity migration`)

**Scope**: New PL/pgSQL function for atomic social registration (account + optional password + linked identity).

**Files changed**:
- `database/migrations/124_social_registration.sql` (new migration)

**Function signature** (security definer, callable by `app_anonymous`):
```sql
app_public.register_account_with_social_identity(
  name            text,
  email           text,
  password        text,          -- may be NULL for passwordless social accounts
  provider        text,
  provider_subject text,
  provider_email  text
) RETURNS app_public.account
```

**Implementation notes**:
- Calls the internal logic of `register_local_account` (or reuses it via a shared sub-function) to create the account
- Calls `app_private.upsert_account_identity` directly (bypasses the re-auth gate; it is not applicable to fresh registration)
- Wrapped in a transaction with `RAISE EXCEPTION` on duplicate provider subject

**Acceptance gate**: Calling the function with valid inputs creates one row in `app_public.account` and one row in `app_private.account_identity`; calling it again with the same provider subject raises a unique-violation error.

---

### Slice 4 — Frontend: Social Registration Completion (commit: `feat(frontend): complete registration for social auth path`)

**Scope**: Modify the registration page to call `registerAccountWithSocialIdentity` when a `provider` query param is present, instead of the local-account registration path.

**Files changed**:
- `frontend/src/pages/register.tsx` — branch on `router.query.provider`; decode and validate the signed provider token; call the new mutation
- `frontend/src/features/auth/socialRegistration.ts` (new file) — GraphQL mutation wrapper for `registerAccountWithSocialIdentity`

**GraphQL**: PostGraphile auto-exposes the new function as a mutation. No custom plugin needed.

**Acceptance gate**: Submitting the register form with `?provider=google&token=…` in the URL creates an account with a linked Google identity; the user is signed in on completion.

---

### Slice 5 — Backend: Apple Start + Callback Routes (commit: `feat(auth): apple sign in start and callback routes`)

**Scope**: Real Apple OAuth start and POST callback, including client_secret_jwt generation.

**Files changed**:
- `backend/src/postgraphile/server.ts` — replace Apple branch of `/auth/:provider/start`; add `POST /auth/apple/callback`
- `backend/src/auth/appleCallback.ts` (new file) — client_secret_jwt generation (ES256, 6-month max TTL), code exchange with Apple token endpoint, ID token verification via `apple-signin-auth`, account resolution, session or redirect
- `backend/package.json` — add `apple-signin-auth` dependency

**Key Apple differences from Google**:
- The callback is a `POST` request with `application/x-www-form-urlencoded` body, not a GET
- Apple only sends the user's name in a `user` JSON field on the very first sign-in; the handler must read it from the POST body and store it in the provider token
- The `client_secret` is a short-lived JWT signed with the Apple private key using ES256; it is generated per-request (not a stored secret)
- Apple sign-in requires a `nonce` in addition to `state`; the nonce is embedded in the signed state payload and verified against the ID token's `nonce` claim

**Acceptance gate**: In a local test with a test Apple Service ID, `POST /auth/apple/callback` with valid code and state results in either a session cookie or a properly typed redirect.

---

### Slice 6 — Frontend: Identity Link/Unlink Settings UI (commit: `feat(frontend): social identity link unlink in profile settings`, Priority: P2)

**Scope**: Add a "Connected accounts" section to the Profile/Security settings page.

**Files changed**:
- `frontend/src/features/auth/IdentityLinkSection.tsx` (new component) — shows linked providers; "Link" triggers `/auth/{provider}/start?link=1&next=/settings`; "Unlink" calls a new `unlinkAccountExternalIdentity` mutation
- `database/migrations/125_unlink_account_external_identity.sql` (new migration) — `app_public.unlink_account_external_identity(provider text)` function: deletes from `account_identity` for current user; blocks unlink if no local credential exists

**Backend change**: The `/auth/:provider/start` route reads a `link=1` param; if present, it embeds `link:true` in the signed state so the callback can route to a link flow instead of a login flow.

**Acceptance gate**: Linking and unlinking a Google identity from the settings page modifies `account_identity` rows; an account with no local credential cannot unlink its only provider.
