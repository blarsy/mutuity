# Quickstart: Social Login

## Objective

Validate that Google and Apple sign-in work end-to-end in a local or staging environment: new-user registration, returning-user sign-in, email-conflict handling, and state-tampering rejection.

The scenarios below correspond to the examples listed directly under each user story in `spec.md` and should be read as the canonical manual QA set for the feature.

## E2E Smoke Matrix (Mandatory)

| Smoke ID | Story/example mapping | Scenario class | Included in smoke |
|---|---|---|---|
| SMK-US1-SUCCESS | US1 `no_match` -> register prefill and complete sign-up | Success | Yes |
| SMK-US2-SUCCESS | US2 `subject_match` -> session creation and safe redirect | Success | Yes |
| SMK-US3-SUCCESS | US3 first Apple sign-up path | Success | Yes |
| SMK-US4-SUCCESS | US4 returning Apple sign-in by subject | Success | Yes |
| SMK-P1-EXCEPTION | US1 `explicit_link_required` or state-tampering rejection | Exception | Yes |

Smoke coverage must include all rows above before the feature is considered ready.

## Prerequisites

- Local stack running (`docker compose up`)
- Database migrated through migration 124 (social registration wrapper)
- Backend env vars set: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_CALLBACK_URL`, `SOCIAL_AUTH_STATE_SECRET`
- A Google test account (a real personal Google account or a Google Workspace test account)
- For Apple scenarios: Apple developer credentials configured and the app registered; use a real Apple ID in sandbox or the Apple test environment
- Two Mutuity test accounts available (one with a known email matching the Google account, one fresh)
- `FRONTEND_URL` and `APPLE_OAUTH_CALLBACK_URL` must be HTTPS if testing Apple (use `ngrok` or a staging environment for Apple, since Apple requires HTTPS)

---

## Suggested Manual QA Scenarios

### Scenario 1: New User Google Sign-Up

1. Open the login page and click "Continue with Google".
2. Complete the Google OAuth consent in the browser.
3. Verify you land on `/register` with `name`, `email`, and `provider=google` in the query string.
4. Confirm the name and email fields are pre-filled.
5. Submit the form.
6. Verify:
   - You are signed in immediately after registration.
   - `authSession` returns the correct account data.
   - `app_private.account_identity` has one row with `provider = 'google'` and the correct `provider_subject`.

### Scenario 2: Returning User Google Sign-In

1. Using the account created in Scenario 1, sign out.
2. Click "Continue with Google" and complete the OAuth flow with the same Google account.
3. Verify:
   - You are redirected directly to the `next` destination (no registration form).
   - The session cookie is set and `authSession` returns the correct account.
   - No new account has been created (account count for this email is still 1).

### Scenario 3: Email-Conflict Link Confirmation Required

1. Create a Mutuity account locally using the same email address as your Google account (to simulate a pre-existing account).
2. Sign out.
3. Click "Continue with Google" with the matching Google account.
4. Verify:
   - You are redirected to a page or message indicating `link_confirmation_required`.
   - You are NOT signed in automatically.
   - No new account is created.
   - No identity row is added to `account_identity`.

### Scenario 4: State Tampering Rejection

1. In a browser DevTools network tab, intercept the redirect from `/auth/google/start` and copy the `state` parameter.
2. Modify one character of the `state` value.
3. Manually navigate to `/auth/google/callback?state=<tampered>&code=<any>` (or replay with the modified state).
4. Verify:
   - The backend rejects the request.
   - You are redirected to the frontend with `?status=error`.
   - No session is created.

### Scenario 5: New User Apple Sign-Up

_Requires Apple credentials; skip in environments without Apple setup._

1. Open the login page and click "Continue with Apple".
2. Complete the Apple Sign In flow (includes Face ID or password on real device, or sandbox on Apple Developer portal).
3. Verify you land on `/register` with `provider=apple` and (on first sign-in) `name` and `email` pre-filled.
4. Submit the form.
5. Verify:
   - You are signed in immediately.
   - `app_private.account_identity` has one row with `provider = 'apple'`.

### Scenario 6: Apple Callback GET Rejected (405)

1. Open a browser and navigate directly to `GET /auth/apple/callback` (the backend URL).
2. Verify the response is `405 Method Not Allowed`.
3. Verify the server logs do not show any token exchange attempt.

### Scenario 7: Returning User Apple Sign-In

_Requires Apple credentials._

1. Sign out of the account created in Scenario 5.
2. Click "Continue with Apple" and complete the flow using the same Apple ID.
3. Verify:
   - You are signed in directly without the registration form.
   - No new account is created.

---

## Suggested Verification Commands

```bash
# Run backend integration and unit tests
cd backend && npm test

# Run only the social auth tests
cd backend && npx jest --testPathPattern="social-auth"

# Frontend typecheck
cd frontend && npx tsc --noEmit

# Frontend production build (catch any missing env or type issues)
cd frontend && npm run build

# Verify account identity table after manual QA
# (run inside psql or a DB client connected to local stack)
SELECT ai.provider, ai.provider_subject, ai.provider_email, a.email
FROM app_private.account_identity ai
JOIN app_public.account a ON a.id = ai.account_id
ORDER BY ai.created_at DESC
LIMIT 10;
```
