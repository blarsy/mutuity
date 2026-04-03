# Feature Specification: Authentication And Login Flow

**Feature Branch**: `004-login-flow`  
**Created**: 2026-04-01  
**Status**: Draft  
**Input**: User description: "Login flow for authenticated actions in Mutuity"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Account Signs In (Priority: P1)

As an account holder, I can sign in securely so I can create campaigns, create needs, and access my private moderation history.

**Why this priority**: The current product already requires authentication for core write actions, but there is no user-facing login flow yet.

**Independent Test**: Submit valid and invalid credentials and verify that successful sign-in creates an authenticated session while failed sign-in returns a generic error message.

**Acceptance Scenarios**:

1. **Given** a registered account, **When** the user submits valid credentials, **Then** the system creates an authenticated session and shows the authenticated experience.
2. **Given** an invalid email/password combination, **When** the user attempts to sign in, **Then** the system rejects the request with a generic user-friendly error message and does not reveal whether the account exists.
3. **Given** a manager account, **When** the manager signs in, **Then** the session reflects the manager role and manager-only actions remain available.
4. **Given** an already authenticated account, **When** the user visits the login page, **Then** the system redirects the user to the home page or intended destination.

---

### User Story 2 - Protected Actions Redirect To Login (Priority: P1)

As an unauthenticated visitor, I am redirected to sign in before protected actions so access control is clear and consistent.

**Why this priority**: Campaign creation, need creation, and moderation already require authentication and should have an obvious user path instead of a generic failure.

**Independent Test**: Open a protected page while signed out, verify redirect to login, then sign in and confirm return to the original destination.

**Acceptance Scenarios**:

1. **Given** a signed-out user, **When** the user opens campaign creation, **Then** the UI redirects the user to the login page.
2. **Given** a signed-out user redirected to login, **When** the user signs in successfully, **Then** the UI returns the user to the originally requested page.
3. **Given** a signed-out user attempting a protected GraphQL mutation directly, **When** the request reaches the backend, **Then** the backend returns a sanitized `UNAUTHENTICATED` error.

---

### User Story 3 - Session Persists And Expires Safely (Priority: P1)

As an authenticated account, I remain signed in across page refreshes until my session expires or I sign out.

**Why this priority**: A usable login flow requires persistence, while secure expiration prevents stale or stolen sessions from remaining active indefinitely.

**Independent Test**: Sign in, refresh the browser, verify the session remains active; then revoke or expire the session and confirm the next protected action requires re-authentication.

**Acceptance Scenarios**:

1. **Given** an authenticated account, **When** the user refreshes the browser, **Then** the session remains active until expiry or sign-out.
2. **Given** an expired or revoked session, **When** the user attempts a protected action, **Then** the system requests sign-in again and shows a generic authentication message.
3. **Given** an authenticated account, **When** the session is still valid, **Then** the frontend can load the current account and role without exposing secrets to client-side storage.

---

### User Story 4 - Account Signs Out (Priority: P1)

As an authenticated account, I can sign out so my device no longer has access to my protected actions.

**Why this priority**: Sign-out is the other half of a trustworthy login flow and is required for shared or public devices.

**Independent Test**: Sign in, sign out, then verify protected pages and mutations require login again.

**Acceptance Scenarios**:

1. **Given** an authenticated account, **When** the user clicks sign out, **Then** the current session is revoked and the authenticated UI state is cleared.
2. **Given** a signed-out user, **When** the user revisits a protected page, **Then** the system redirects the user to login.

## Edge Cases

- Invalid credentials repeatedly submitted => the system returns the same generic error copy and applies an MVP in-memory rate limit of 5 attempts per 5-minute window per identifier/IP pair.
- Signed-out user deep-links directly to `/campaigns/create` or `/needs/create` => the system redirects to login and then returns to the original route after successful sign-in.
- Session expires while a mutation is submitted => the user sees a sanitized authentication message such as "You must sign in to continue.", local auth state is cleared, and the browser redirects back to login with the original destination preserved.
- Non-manager account signs in and navigates to moderation or approval flows => the UI hides manager-only actions and the backend still denies protected manager mutations.
- Browser refresh after sign-in => the authenticated navigation state is restored from the server-managed session rather than client-managed role headers.
- Local development verification uses a seeded demo account (`demo@example.com` / `password123`) to exercise the browser login flow and curl-based auth route checks.

## Requirements *(mandatory)*

### Security & Session Handling Requirements

- **SR-001**: Authentication for browser-based login MUST use a server-managed session, not browser-supplied `x-role` or `x-account-id` headers.
- **SR-002**: Session state MUST be stored in a secure, `HttpOnly` cookie; production deployments MUST mark the cookie `Secure` and use an appropriate `SameSite` policy.
- **SR-003**: Passwords or equivalent credential secrets MUST be stored only as strong salted hashes.
- **SR-004**: Failed login attempts MUST return generic user-facing copy and MUST NOT reveal whether an email or account identifier exists.
- **SR-005**: Authentication and session errors returned to the client MUST remain sanitized, while the backend logs technical details for investigation.
- **SR-006**: Login attempts SHOULD be rate-limited per identifier and/or IP to reduce brute-force risk. For the MVP implementation, the backend applies an in-memory rate limit of 5 attempts per 5-minute window; future hosted deployments may replace this with a shared store–backed limiter.

### Functional Requirements

- **FR-001**: The system MUST provide a login page reachable from public navigation and protected-flow redirects.
- **FR-002**: The login flow MUST accept an account identifier and password for MVP sign-in.
- **FR-003**: Successful login MUST create a server-managed authenticated session associated with the account and role.
- **FR-004**: The frontend MUST expose current authentication state to components through a shared auth/session layer.
- **FR-005**: Campaign creation, need creation, moderation history, and other protected pages MUST redirect unauthenticated users to the login page.
- **FR-006**: After successful login, the system MUST return the user to the originally requested protected route when available.
- **FR-007**: The system MUST provide a logout action that revokes the current session and clears authenticated UI state.
- **FR-008**: The frontend MUST support loading the current signed-in account and role on initial page load.
- **FR-009**: Manager and admin sessions MUST continue to map to the existing PostgreSQL role model (`manager`, `admin`) for authorization-sensitive actions.
- **FR-010**: The existing sanitized `UNAUTHENTICATED` error behavior MUST remain the backend fallback for unauthenticated GraphQL access.
- **FR-011**: User-facing strings for login, logout, redirects, and error states MUST go through i18n.
- **FR-012**: Development-only header-based role/account simulation MAY remain available for local manual testing, but MUST be bypassed by the browser login flow in production-like usage.
- **FR-013**: When a protected GraphQL request returns `UNAUTHENTICATED`, the frontend MUST clear local auth state and redirect the user back to the login page while preserving the intended destination.
- **FR-014**: The local development workflow MUST support seeding a demo account for manual browser and curl-based login validation.

### Key Entities *(include if feature involves data)*

- **AccountIdentity**: Existing account plus the unique login identifier used to authenticate the user.
- **AccountCredential**: Server-side credential record containing hashed secret material and account linkage.
- **AccountSession**: Server-managed session with session id, account id, role, created datetime, expiry datetime, and revocation state.
- **CurrentAccountView**: Read model returned to the frontend so navigation and protected pages can render the authenticated experience.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100 percent of valid login attempts create an authenticated session and allow access to protected pages without manual dev headers.
- **SC-002**: 100 percent of invalid login attempts return a generic user-facing error without exposing whether the account exists.
- **SC-003**: 100 percent of direct visits to protected pages while signed out redirect to login and successfully return to the intended page after sign-in.
- **SC-004**: 100 percent of sign-out actions revoke the current session and cause the next protected request to return `UNAUTHENTICATED`.
- **SC-005**: 100 percent of manager-only actions remain unavailable to non-manager accounts even after successful sign-in.