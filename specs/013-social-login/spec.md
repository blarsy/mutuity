# Feature Specification: Social Login

**Feature Branch**: `013-social-login`
**Created**: 2026-06-03
**Status**: Draft
**Input**: Auth parity with Tope-là for Google and Apple sign-in/up, deferred from Feature 005 Slice 7.

## Scope Summary

Add Google and Apple social sign-in to the existing auth system. The backend owns the full OAuth/OIDC exchange; the frontend never handles provider tokens or secrets. Accounts created through a social provider are real Mutuity accounts with a local credential (so existing local login and password-reset flows still apply). Identity linking after first registration uses the existing explicit-link policy (migration 122) and re-auth gate (migration 123).

---

## User Stories

### User Story 1 — New User Signs Up With Google (Priority: P1)

As a new user without an existing Mutuity account, I can click "Continue with Google" on the login or register page, complete the Google OAuth flow in my browser, and land on the registration form pre-filled with my Google name and email so I can finish creating my account.

**Why this priority**: Google sign-up removes the email/password friction barrier for the most common social provider.

**Independent Test**: Click "Continue with Google", complete the provider flow in a Google test account, land on the register page with name and email pre-filled, submit, and verify a new account is created with the Google identity linked.

**Acceptance Scenarios**:

1. **Given** a visitor without a Mutuity account, **When** they complete the Google OAuth flow, **Then** they are redirected to `/register` with `name`, `email`, and `provider=google` pre-filled in the query string.
2. **Given** the register form is pre-filled from Google data, **When** the user submits valid registration data, **Then** a new Mutuity account is created, the Google identity is linked, and the user is signed in immediately.
3. **Given** the user edits the pre-filled name or email before submitting, **When** they submit, **Then** their edited values are used and the identity is still linked.
4. **Given** a Google account whose verified email matches an existing Mutuity account's verified identity, **When** the callback resolves, **Then** the user is redirected to a `link_confirmation_required` state and is not automatically signed in.
5. **Given** an error or rejection during the Google OAuth flow, **When** the callback returns, **Then** the frontend shows an explicit error message and a link back to sign-in.

**Examples**:

| Condition | Example | Expected Outcome |
|---|---|---|
| Fresh Google account with no Mutuity match | `alice@example.com` completes Google sign-in for the first time | Redirect to `/register` with `provider=google`, `providerSubject`, `name`, and `email` pre-filled |
| Google account email matches an existing verified Mutuity account | `alice@example.com` already belongs to a verified Mutuity identity | Redirect to a link-confirmation state instead of auto-sign-in or registration |
| Callback state is invalid or tampered | User edits the callback state before it reaches the backend | The callback is rejected and the frontend shows an error instead of starting registration |

---

### User Story 2 — Returning User Signs In With Google (Priority: P1)

As an existing user who previously registered with Google, I can click "Continue with Google" and be signed in directly without re-entering my credentials.

**Why this priority**: Sign-in via social provider is the primary return path for users who did not set a password.

**Independent Test**: Register via Google, sign out, click "Continue with Google" again, and verify the session is restored for the same account without any registration form.

**Acceptance Scenarios**:

1. **Given** an account with a linked Google identity, **When** the user completes the Google OAuth flow, **Then** they are signed in, a session cookie is issued, and they are redirected to the `next` destination.
2. **Given** a successful Google sign-in, **When** the session is active, **Then** `authSession` returns the authenticated session with correct account data.
3. **Given** a successful Google sign-in but the `next` parameter is an external URL or missing a leading slash, **When** the redirect happens, **Then** `next` falls back safely to `/`.

**Examples**:

| Condition | Example | Expected Outcome |
|---|---|---|
| Linked Google identity is found by provider subject | The same Google subject returns after sign-out | The user is signed in, a session cookie is issued, and they are redirected to `next` |
| `next` points off-site | `next=https://evil.example` | The redirect falls back to `/` |
| `next` is omitted | User starts from the login page without a destination | The redirect falls back to `/` |

---

### User Story 3 — New User Signs Up With Apple (Priority: P1)

As a new user without an existing Mutuity account, I can click "Continue with Apple", complete the Apple Sign In flow, and land on the registration form pre-filled with my Apple name (first sign-in only) and email (or the private relay address Apple provides).

**Why this priority**: Apple Sign In is mandatory for App Store compliance when Google sign-in is offered.

**Independent Test**: Click "Continue with Apple" with an Apple test account, complete the provider flow, land on the register page with pre-filled data, and verify a new account is created with the Apple identity linked.

**Acceptance Scenarios**:

1. **Given** a visitor without a Mutuity account, **When** they complete the Apple Sign In flow, **Then** they are redirected to `/register` with `name`, `email`, and `provider=apple` pre-filled where available.
2. **Given** Apple only sends the user's real name on the first sign-in, **When** the user signs in with Apple a second time, **Then** the name is not re-sent by Apple but the existing account is looked up by provider subject and the sign-in succeeds.
3. **Given** the user uses Apple's private relay email, **When** they register and later sign in, **Then** the relay address is stored and the account is resolvable by provider subject alone without depending on email matching.
4. **Given** registration data submitted via the Apple social path, **When** the account is created, **Then** the Apple identity is linked and the Apple provider subject is stored in `app_private.account_identity`.
5. **Given** an Apple callback with a missing or invalid `state` parameter, **When** the backend validates the callback, **Then** the request is rejected and the frontend is redirected with an error status.

**Examples**:

| Condition | Example | Expected Outcome |
|---|---|---|
| First Apple sign-in with name and relay email | Apple returns name plus `@privaterelay.appleid.com` email | Redirect to `/register` with the available name and email pre-filled |
| Second Apple sign-in for the same subject | Apple omits the name on later sign-ins | The account is matched by provider subject and sign-in succeeds without needing the name again |
| Apple callback state is missing or invalid | The callback arrives without a valid signed state | The request is rejected and the user sees an error redirect |

---

### User Story 4 — Returning User Signs In With Apple (Priority: P1)

As an existing user who previously registered with Apple, I can click "Continue with Apple" and be signed in directly.

**Why this priority**: Same as Google sign-in parity.

**Acceptance Scenarios**:

1. **Given** an account with a linked Apple identity, **When** the user completes the Apple Sign In flow, **Then** they are signed in with a fresh session cookie and redirected to `next`.
2. **Given** a signed-in Apple user with a relay email, **When** they sign in again and the relay address changes, **Then** the stored `provider_email` is updated but the account is still matched by provider subject.

**Examples**:

| Condition | Example | Expected Outcome |
|---|---|---|
| Linked Apple identity is found by provider subject | The same Apple subject returns after sign-out | The user is signed in directly and redirected to `next` |
| Relay email changes between sign-ins | Apple issues a different relay address later | The account still resolves by provider subject and remains signed in correctly |

---

### User Story 5 — Authenticated User Links A Social Identity To An Existing Account (Priority: P2)

As an existing local-account user, I can link a Google or Apple identity to my account from the Profile/Security settings page so that I can use social sign-in in future sessions.

**Why this priority**: Users who registered locally should be able to adopt a faster social sign-in path without creating a duplicate account.

**Independent Test**: Register locally, navigate to Profile settings, click "Link Google", complete the OAuth flow, and verify the identity appears in linked identities and can be used for sign-in.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they initiate a social link from the settings page and complete the provider flow, **Then** the identity is stored in `account_identity` for their account.
2. **Given** the linking flow, **When** the provider identity is already linked to a different Mutuity account, **Then** the link is rejected with an explicit error.
3. **Given** a long-running session (more than 15 minutes since creation), **When** the user tries to link a social identity, **Then** they are prompted to re-authenticate before the link can proceed (using `assert_recent_social_link_reauth`).
4. **Given** a recently authenticated user, **When** the link completes, **Then** the settings page refreshes and shows the newly linked provider.

**Examples**:

| Condition | Example | Expected Outcome |
|---|---|---|
| Recently authenticated user links Google | User is within the recent re-auth window and completes Google linking | The Google identity is attached to the current Mutuity account |
| Linking attempts to reuse an identity already attached elsewhere | The same provider subject is already linked to another account | The link is rejected with a clear error and no account changes are made |
| Session is too old for linking | The login session is older than the re-auth window | The user must re-authenticate before the link can proceed |

---

### User Story 6 — Authenticated User Unlinks A Social Identity (Priority: P2)

As an authenticated user with a linked social identity, I can unlink it from my account from the settings page, provided I still have a local password as a fallback.

**Why this priority**: Users need control over which providers are associated with their account.

**Acceptance Scenarios**:

1. **Given** an account with a linked social identity and a local password, **When** the user unlinks the identity, **Then** it is removed from `account_identity` and can no longer be used for sign-in.
2. **Given** an account with only a social identity and no local password, **When** the user attempts to unlink, **Then** the action is blocked and an error message explains they must set a local password first.
3. **Given** an account with multiple linked providers, **When** the user unlinks one, **Then** the remaining provider is unaffected.

**Examples**:

| Condition | Example | Expected Outcome |
|---|---|---|
| Account has a local password and one linked provider | User removes Google while keeping password login | The provider is removed and the account still has a sign-in path |
| Account has only a social provider and no password | User tries to unlink the only provider | The unlink is blocked until a local password exists |
| Account has multiple providers | User removes one provider from a multi-provider account | The remaining providers stay linked and usable |

---


## Security Rules

The following rules are non-negotiable and must be enforced by the backend, not the frontend:

| Rule | Enforcement point |
|---|---|
| OAuth `state` parameter is validated on every callback | Backend callback handler |
| `state` is signed server-side (not a plain random value) and has a short TTL | Backend `SOCIAL_AUTH_STATE_SECRET` |
| Google ID token is verified via Google's public keys (not just decoded) | Backend token verification |
| Apple ID token is verified using Apple's public keys | Backend token verification |
| No account is auto-linked by email alone — provider subject match is the only auto-login path | `resolve_account_for_external_identity` (migration 122) |
| Linking an identity to an existing account requires a recent session (max 15 min) | `assert_recent_social_link_reauth` (migration 123) |
| Apple callback accepts POST only; GET requests to the Apple callback URL are rejected | Backend route config |
| `next` parameter in start URLs is sanitized: must start with `/`, external URLs collapse to `/` | Backend start handler |
| Provider client secrets never reach the frontend or appear in logs | Backend env only |

---

## Token Reward Note

Social registration creates a new account through the existing `register_local_account` path or a new peer wrapper. The same profile-completion and first-resource milestone rewards that apply to local registration apply to social registration. No additional token events are introduced by this feature.

---

## Out Of Scope

- Mobile/native provider SDKs (Expo Google Auth, ASAuthorizationAppleIDRequest) — web-only in this feature
- Automatic account merging when a duplicate is detected
- Admin console identity management
- Storing and rendering provider avatar URLs as account avatars
