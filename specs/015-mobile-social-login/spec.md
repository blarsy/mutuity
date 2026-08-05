# Feature Specification: Mobile Social Login

**Feature Branch**: `015-mobile-social-login`
**Created**: 2026-08-02
**Status**: Draft
**Input**: Add production-grade Google and Apple social sign-in to the Mutuity mobile app, extending the existing backend-owned social auth model to mobile.

## Scope Summary

Add Google and Apple social sign-in to the mobile app. The backend remains the authority for OAuth/OIDC start, callback validation, provider token verification, and Mutuity session issuance. The mobile app opens the backend-owned provider start URL, receives a deep-link callback back into the app, resolves success vs registration/linking/reset branches, and persists a real authenticated mobile session token.

This feature is mobile-specific. It depends on the existing web social-login feature for backend/provider concepts and on the mobile rewrite for auth entry surfaces, session persistence, and post-auth return routing.

---

## User Stories

### User Story 1 - New User Signs Up With Google On Mobile (Priority: P1)

As a new mobile user without a Mutuity account, I can tap "Continue with Google", complete the provider flow, and land on a mobile registration completion surface with my Google profile data pre-filled so I can finish account creation without typing everything manually.

**Why this priority**: Google sign-up is the fastest path to reduce first-login friction on mobile.

**Independent Test**: From a signed-out mobile app, tap Google sign-in, complete the provider flow, land on registration completion, submit valid data, and verify the new account is created and signed in on mobile.

**Acceptance Scenarios**:

1. **Given** a signed-out mobile user with no existing Mutuity account, **When** they complete the Google social flow, **Then** the app opens a registration completion surface with provider `google`, the provider subject, and available name/email pre-filled.
2. **Given** the registration completion surface is pre-filled from Google data, **When** the user submits valid details, **Then** a Mutuity account is created, the Google identity is linked, and the app persists a valid mobile session token.
3. **Given** the user edits the suggested name or email before submitting, **When** they complete registration, **Then** the edited values are used and the provider identity remains linked.
4. **Given** the provider flow is cancelled or fails before callback completion, **When** the app regains focus, **Then** the user remains signed out and sees a recoverable error or cancellation state.

**Examples**:

| Condition | Example | Expected Outcome |
|---|---|---|
| Fresh Google account with no Mutuity match | `alice@example.com` signs in with Google from the mobile app | Registration completion screen opens with `provider=google`, `providerSubject`, `name`, and `email` available |
| User edits pre-filled values | Suggested display name is changed before submit | Registration uses edited values while preserving the linked identity |
| Provider flow cancelled | User closes the Google consent/browser flow | The app shows a non-fatal cancellation state and does not create a session |

---

### User Story 2 - Returning User Signs In With Google On Mobile (Priority: P1)

As a returning mobile user who already linked Google, I can tap "Continue with Google" and enter the app directly without typing my password.

**Why this priority**: This is the primary repeat-login convenience path for mobile users with linked Google identities.

**Independent Test**: Sign out, tap Google sign-in again with the same linked Google account, and verify the app restores an authenticated session and returns to the requested mobile destination.

**Acceptance Scenarios**:

1. **Given** a mobile user with an existing linked Google identity, **When** they complete the Google flow, **Then** the backend issues a mobile-consumable session token and the app signs them in directly.
2. **Given** the user started sign-in from a restricted destination, **When** the sign-in succeeds, **Then** the app returns them to the originally requested allowed destination.
3. **Given** the callback payload contains a missing or unsafe destination, **When** sign-in completes, **Then** the app falls back to a safe default destination.

**Examples**:

| Condition | Example | Expected Outcome |
|---|---|---|
| Linked Google identity found | Same Google subject returns after sign-out | App persists session token and navigates to requested destination |
| Unsafe return destination | Callback contains invalid route target | App falls back to a safe default surface |
| Relaunch after Google sign-in | User closes and reopens the app later | Persisted mobile session restores cleanly |

---

### User Story 3 - New User Signs Up With Apple On Mobile (Priority: P1)

As a new mobile user without a Mutuity account, I can tap "Continue with Apple", complete Apple Sign In, and finish creating my account in the mobile app with whatever Apple profile data is available.

**Why this priority**: Apple Sign In is required parity if Google sign-in is offered on iOS.

**Independent Test**: From a signed-out mobile app on iOS, complete Apple Sign In, verify registration completion opens, and finish account creation.

**Acceptance Scenarios**:

1. **Given** a new mobile user without a Mutuity account, **When** they complete Apple Sign In, **Then** the app opens a registration completion surface with provider `apple` and any available name/email values.
2. **Given** Apple only returns the user's name on first sign-in, **When** a later sign-in occurs, **Then** the identity still resolves by provider subject and does not depend on the name being present again.
3. **Given** Apple returns a relay email, **When** registration completes, **Then** the relay email is stored as provider email while identity resolution remains based on provider subject.
4. **Given** the Apple flow returns an invalid or expired state, **When** the callback is processed, **Then** the app shows an explicit error state and does not create a mobile session.

**Examples**:

| Condition | Example | Expected Outcome |
|---|---|---|
| First Apple sign-in with name and relay email | Apple returns `Jane Doe` and relay email | Registration completion opens with available values |
| Later Apple sign-in without name | Apple omits name on second sign-in | Existing linked account resolves by provider subject |
| Invalid callback state | State tampering or expiry occurs | App shows explicit error and no session is created |

---

### User Story 4 - Returning User Signs In With Apple On Mobile (Priority: P1)

As a returning mobile user who already linked Apple, I can tap "Continue with Apple" and be signed in directly.

**Why this priority**: Apple needs the same day-to-day sign-in parity as Google for returning users.

**Independent Test**: Sign out, tap Apple sign-in again with the same Apple identity, and verify the app signs in and returns to the requested destination.

**Acceptance Scenarios**:

1. **Given** an account with a linked Apple identity, **When** the user completes Apple Sign In, **Then** the backend returns a valid mobile session token and the app signs the user in directly.
2. **Given** the user starts from a restricted mobile surface, **When** sign-in succeeds, **Then** the app returns them to the original allowed destination.
3. **Given** Apple's relay email differs from a prior sign-in, **When** identity resolution occurs, **Then** the account still resolves by provider subject and does not create a duplicate account.

**Examples**:

| Condition | Example | Expected Outcome |
|---|---|---|
| Linked Apple identity found | Same Apple subject returns after sign-out | App signs user in directly |
| Relay email changes | Apple provides a different relay address later | Existing account still resolves correctly |
| Restricted origin flow | User opened My Hub while signed out | App returns to that destination after sign-in |

---

### User Story 5 - Mobile User Completes Registration-Required Or Link-Required Branches (Priority: P2)

As a mobile user whose provider identity cannot be auto-signed in, I can be guided through the correct next step inside the app, whether that is registration completion, explicit link confirmation, or password reset.

**Why this priority**: Real social auth flows produce non-happy-path outcomes, and the mobile app must handle them intentionally rather than dropping the user into a dead end.

**Independent Test**: Simulate social callback outcomes for register-required, link-required, and password-reset-required and verify the app routes to the correct mobile surface with the right pre-filled or explanatory state.

**Acceptance Scenarios**:

1. **Given** the backend indicates `register_required`, **When** the app receives the callback, **Then** it opens the social registration completion surface.
2. **Given** the backend indicates `link_confirmation_required`, **When** the app receives the callback, **Then** it opens a mobile flow that explains the conflict and routes the user to a supported confirmation path.
3. **Given** the backend indicates `password_reset_required`, **When** the app receives the callback, **Then** it routes the user to a recovery flow rather than signing them in automatically.
4. **Given** the callback contains an explicit provider error, **When** the app processes it, **Then** the user sees a localized, recoverable error message.

**Examples**:

| Condition | Example | Expected Outcome |
|---|---|---|
| Registration required | No Mutuity account matches provider subject | Registration completion surface opens |
| Explicit link required | Verified email already belongs to another account | Conflict guidance surface opens; no session created |
| Password reset required | Backend blocks auto-link without reset | Recovery surface opens |

---

### User Story 6 - Mobile Session Continuity After Social Sign-In (Priority: P2)

As a mobile user who signed in via Google or Apple, I can relaunch the app into a valid authenticated session and recover cleanly from expired or invalid social-auth sessions.

**Why this priority**: Social login is incomplete on mobile if it only works once but breaks continuity afterward.

**Independent Test**: Sign in via Google or Apple, relaunch the app, verify session restoration, then simulate an invalid/expired token and verify safe logout.

**Acceptance Scenarios**:

1. **Given** a user signed in via social auth, **When** they relaunch the app with a still-valid token, **Then** the authenticated session is restored.
2. **Given** the persisted social-auth token is invalid or expired, **When** the app bootstraps, **Then** it clears the session safely and returns to a signed-out state.
3. **Given** a social-auth user signs out, **When** they reopen the app, **Then** no stale authenticated session remains.

**Examples**:

| Condition | Example | Expected Outcome |
|---|---|---|
| Valid persisted token | User reopens the app the next day | Session restores cleanly |
| Invalid persisted token | Token revoked or malformed | App clears session and returns to signed-out state |
| Explicit sign-out | User logs out after Apple sign-in | Relaunch does not resurrect the session |

---

## Requirements

### Functional Requirements

- **FR-001**: The mobile app MUST expose Google and Apple social sign-in entry points from the sign-in surface.
- **FR-001a**: The backend MUST return a structured mobile social callback URL contract for every social-auth outcome, including provider, status, next destination, provider identity data, and any signed pending-token metadata.
- **FR-002**: The mobile app MUST use backend-owned social auth start URLs rather than embedding provider secrets or verifying provider tokens locally.
- **FR-003**: The mobile app MUST support app deep-link return from social auth callbacks.
- **FR-004**: The mobile app MUST process callback outcomes for at least `success`, `register_required`, `link_confirmation_required`, `password_reset_required`, `cancelled`, and `error`.
- **FR-005**: Successful social sign-in on mobile MUST persist a real authenticated session token suitable for subsequent GraphQL requests.
- **FR-006**: The app MUST NOT treat a bare account id as a production social-auth session token.
- **FR-007**: The mobile app MUST support registration completion after Google or Apple social callback when the backend indicates registration is required.
- **FR-008**: The mobile app MUST preserve the post-auth return-to-destination behavior already defined by the mobile rewrite, including fallback to a safe default route.
- **FR-009**: The mobile app MUST expose localized loading, cancel, validation, and error states for the social auth flow in French and English.
- **FR-010**: The mobile app MUST clear invalid or expired persisted social-auth sessions safely during bootstrap.
- **FR-011**: The mobile app MUST support browser-to-app handoff on both iOS and Android for the chosen backend-owned OAuth flow.
- **FR-012**: The backend/mobile contract MUST carry enough structured callback information to distinguish registration-required, link-required, password-reset-required, and success outcomes without relying on ambiguous free-text parsing.

### Security Requirements

- **SR-001**: Provider client secrets and provider token verification MUST remain backend-only.
- **SR-002**: Social callback state MUST be validated by the backend before the mobile app acts on the callback payload.
- **SR-003**: The app MUST NOT auto-link accounts by email alone.
- **SR-004**: The app MUST reject or safely ignore malformed, incomplete, or duplicated deep-link callback payloads.
- **SR-005**: Persisted mobile session tokens MUST use the existing secure storage path.

## Key Entities

- **Mobile Social Auth Attempt**: The in-progress sign-in attempt started from the app and completed through browser/provider return.
- **Mobile Social Callback Outcome**: The structured callback payload returned to the app, including provider, next destination, success or branch status, and any signed backend token or pending registration metadata.
- **Mobile Social Callback Builder**: A shared backend helper that normalizes the next destination to a safe absolute path and builds the mobile callback URL with provider-specific status, profile fields, and pending-token query parameters.
- **Mobile Session Token**: The bearer token persisted by the app and used for authenticated GraphQL requests after social sign-in.
- **Social Registration Completion Payload**: The provider-derived identity information plus any pending token or provider subject needed to complete account creation on mobile.

## Success Criteria

- **SC-001**: A new user can complete Google sign-up on mobile without visiting the web app.
- **SC-002**: A returning linked user can sign in with Google on mobile and reach their requested destination.
- **SC-003**: A new user can complete Apple sign-up on mobile without visiting the web app.
- **SC-004**: A returning linked user can sign in with Apple on mobile and reach their requested destination.
- **SC-005**: Registration-required, link-required, password-reset-required, and error callback outcomes all lead to explicit, recoverable mobile states rather than dead ends.
- **SC-006**: A valid social-auth mobile session restores on relaunch, while an invalid one clears safely.

## Assumptions

- The backend will remain the owner of provider token verification and Mutuity session issuance.
- The mobile implementation will use browser OAuth plus deep-link return rather than native provider SDK token verification inside the app.
- The existing web social-login feature remains the source of truth for provider-specific backend behavior, while this feature adds the mobile contract and UX.

## Out Of Scope

- Native Google SDK sign-in that bypasses backend-owned provider start URLs
- Native Apple credential verification performed entirely on-device
- Social identity linking and unlinking from mobile profile/settings after sign-in
- Importing provider avatars or other provider profile enrichment beyond registration completion basics