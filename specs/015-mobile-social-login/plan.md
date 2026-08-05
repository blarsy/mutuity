# Implementation Plan: Mobile Social Login

**Feature Branch**: `015-mobile-social-login`
**Depends on**: `013-social-login`, `014-mutuity-mobile-rewrite`
**Status**: Ready to plan

---

## Technical Context

| Layer | Technology |
|---|---|
| Mobile app | Expo / React Native / TypeScript strict mode |
| Auth storage | Expo Secure Store via existing session helpers |
| Auth transport | Bearer token on GraphQL requests |
| Backend social auth | Existing backend-owned OAuth/OIDC start + callback model from feature 013 |
| App return mechanism | Deep link via Expo scheme (`topela://...`) |
| GraphQL client | Apollo Client in mobile app |

---

## Architectural Decision

This feature assumes browser OAuth plus backend deep-link return to the app.

Why this route:

- It preserves the existing backend-owned provider verification model from feature 013.
- It avoids duplicating provider token verification logic inside the app.
- It keeps Google and Apple trust boundaries aligned across web and mobile.

This feature does **not** assume native Google or Apple SDK auth as the primary implementation path.

---

## Example-Driven Scope

The examples listed under each user story in `spec.md` are the source of truth for branching callback outcomes. Delivery slices and QA must preserve those exact distinctions, especially:

- success vs register-required
- success vs link-confirmation-required
- provider cancellation vs provider error
- valid persisted session vs invalid persisted session

---

## Constitution Check

| Principle | How this feature satisfies it |
|---|---|
| Backend is source of truth | Provider token verification and state validation remain backend-only |
| Minimal mobile trust surface | App consumes structured callback outcomes instead of decoding provider artifacts |
| Small reversible steps | Callback parsing, session issuance, registration completion, and session continuity can ship in slices |
| No silent auth failure | Invalid callbacks, expired tokens, and branch outcomes become explicit mobile UI states |

---

## Missing Infrastructure To Add

### Backend / contract additions

- Mobile-safe provider start URLs that include app deep-link callback targets
- A callback result shape suitable for mobile deep links
- Real mobile session token issuance on successful provider resolution
- Optional pending-registration / pending-link tokens that the app can use safely

### Mobile additions

- Deep-link registration and callback listener wiring
- Social callback outcome parser for mobile
- A social registration completion surface or extension of the existing register screen
- Auth bootstrap updates for real bearer tokens produced by social auth
- Safe resume/cancel/error handling when app returns from provider flow

---

## Required Environment And Config

### Mobile app config

| Key | Purpose |
|---|---|
| App scheme | Deep-link return target for social callbacks |
| Environment-specific backend base URL | Compute social auth start URLs |
| Optional callback path configuration | Stable deep-link route for auth return |

### Backend env

Reuse the provider secrets already defined by feature 013, plus any mobile-specific callback URL configuration needed for deep-link return.

If the backend currently only knows about web callback URLs, this feature must introduce distinct mobile callback targets or a mobile-aware `next` contract.

---

## Delivery Slices

### Slice 1 - Mobile/Backend Contract For Social Callback Outcomes

**Scope**: Define and implement the callback payload shape the mobile app will consume.

**Minimum output fields**:

- `provider`
- `status`
- `next`
- `sessionToken` for success
- `pendingRegistrationToken` for registration-required
- `pendingLinkToken` for link-required
- provider-derived `email`, `name`, `providerSubject` when appropriate
- explicit `error` code/message when needed

**Acceptance gate**: A test callback can be represented without ambiguity as success, registration-required, link-required, password-reset-required, cancelled, or error.

---

### Slice 2 - Mobile Deep-Link Wiring And Callback Parsing

**Scope**: Register deep-link handling in the mobile app, parse callback payloads, and route to the correct mobile auth continuation.

**Files likely touched**:

- `mobile-app/app.config.ts`
- `mobile-app/src/navigation/AppNavigator.tsx`
- `mobile-app/src/services/auth/*`
- `mobile-app/src/services/socialAuth/*` (new)

**Acceptance gate**: Opening a valid callback deep link from a killed or foregrounded app routes to the correct auth continuation.

---

### Slice 3 - Successful Social Sign-In Session Issuance

**Scope**: Persist a real bearer token from successful social sign-in and ensure Apollo requests use it.

**Acceptance gate**: After a successful social callback, the app can call authenticated GraphQL queries without local-only impersonation shortcuts.

---

### Slice 4 - Registration Completion Flow For Social Auth

**Scope**: Extend registration to consume social pending-registration data and complete account creation inside the mobile app.

**Acceptance gate**: A no-match provider callback can be completed entirely on mobile, ending with a valid authenticated session.

---

### Slice 5 - Link-Required / Password-Reset-Required Handling

**Scope**: Add mobile UX for explicit conflict states rather than treating them as generic errors.

**Acceptance gate**: Both branch outcomes route to understandable, recoverable mobile screens.

---

### Slice 6 - Session Continuity, Relauch, And Invalid-Token Recovery

**Scope**: Verify that socially authenticated sessions behave like first-class mobile sessions during bootstrap, relaunch, and logout.

**Acceptance gate**: Valid tokens restore; invalid ones clear safely.

---

## Verification Strategy

### Acceptance coverage classes

| Story | Scenario focus | Coverage type |
|---|---|---|
| US1 | Google sign-up success and cancellation | Acceptance + smoke |
| US2 | Google returning sign-in and safe return routing | Acceptance + smoke |
| US3 | Apple sign-up success and invalid-state failure | Acceptance + smoke |
| US4 | Apple returning sign-in and relay-email continuity | Acceptance + smoke |
| US5 | Register-required / link-required / password-reset-required | Acceptance |
| US6 | Valid restore / invalid token recovery | Acceptance + smoke |

### Minimum smoke selection

- One successful Google mobile sign-up/sign-in path
- One successful Apple mobile sign-up/sign-in path
- One exception path covering invalid callback state or link-required branch
- One relaunch continuity check after social sign-in

---

## Risks

- The current mobile auth model still treats account id as a stand-in token in some flows; this must not leak into production social auth.
- Apple may require stricter HTTPS and redirect configuration than local mobile development easily supports.
- Deep-link handling can fail differently on killed, backgrounded, and foregrounded app states.
- Backend/mobile contract drift could produce ambiguous callback outcomes unless structured fields are enforced early.