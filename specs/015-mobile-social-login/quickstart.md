# Quickstart: Mobile Social Login

## Objective

Validate that Google and Apple social sign-in work end to end on the mobile app using backend-owned OAuth start/callback handling plus app deep-link return.

This quickstart covers:

- new-user registration completion
- returning-user direct sign-in
- register-required / link-required / password-reset-required branches
- cancellation and invalid callback handling
- session restore after relaunch

---

## Prerequisites

- Mobile app dependencies installed
- Backend social-login feature (`013-social-login`) available in the target environment
- Mobile app configured with the correct deep-link scheme and callback path
- Environment-specific backend base URL reachable from the mobile app
- Google and Apple provider credentials configured on the backend
- A Google test account and an Apple test account
- At least one existing Mutuity account that can be used to trigger link-required or password-reset-required scenarios

---

## Suggested Manual QA Scenarios

### Scenario 1: New User Google Mobile Sign-Up

1. Launch the app signed out.
2. Open the sign-in surface and tap "Continue with Google".
3. Complete the Google browser/provider flow.
4. Verify the app returns through a deep link and opens registration completion.
5. Submit the registration-completion form.
6. Verify:
   - the app enters an authenticated session
   - the user reaches the allowed post-auth destination
   - a relaunch restores the session

### Scenario 2: Returning User Google Mobile Sign-In

1. Sign out.
2. Start from a restricted destination.
3. Tap "Continue with Google" and complete the flow with the same linked account.
4. Verify:
   - no registration completion form is shown
   - the app signs in directly
   - the user returns to the requested destination

### Scenario 3: New User Apple Mobile Sign-Up

1. Launch the app signed out on iOS.
2. Tap "Continue with Apple".
3. Complete Apple Sign In.
4. Verify the app returns via deep link and opens registration completion.
5. Submit the registration-completion form.
6. Verify the session is persisted and restored on relaunch.

### Scenario 4: Returning User Apple Mobile Sign-In

1. Sign out.
2. Tap "Continue with Apple" using the same linked Apple identity.
3. Verify:
   - sign-in completes directly
   - no duplicate account is created
   - the app returns to the requested destination

### Scenario 5: Register-Required Branch

1. Trigger a social callback outcome where no existing account matches the provider subject.
2. Verify the app opens registration completion rather than showing a generic error.

### Scenario 6: Link-Required Branch

1. Trigger a callback where the backend requires explicit linking.
2. Verify the app opens a conflict guidance state and does not auto-sign the user in.

### Scenario 7: Password-Reset-Required Branch

1. Trigger a callback where the backend requires password reset.
2. Verify the app routes the user to the recovery flow rather than treating the attempt as success.

### Scenario 8: Cancellation Or Invalid Callback

1. Start Google or Apple sign-in.
2. Cancel before completion or replay an invalid callback.
3. Verify:
   - no authenticated session is created
   - the user sees a recoverable error or cancellation state

### Scenario 9: Invalid Persisted Token Recovery

1. Force an invalid or expired persisted social-auth token.
2. Relaunch the app.
3. Verify the app clears the session safely and returns to a signed-out state.

---

## Suggested Verification Commands

```bash
# Mobile typecheck
cd mobile-app && npm run typecheck

# Mobile tests
cd mobile-app && npm test

# Focused social-auth acceptance runs
cd mobile-app && npx jest --testPathPattern="us5-social|us5-apple|us5-google"

# Focused smoke runs
cd mobile-app && npx jest --testPathPattern="s7|s8|s9"

# Backend tests for social auth callback/start behavior
cd backend && npm test
```

---

## Notes

- Apple testing may require a real iOS device or a suitably configured test environment.
- Local testing of deep-link browser return may differ between simulator, device, and Expo dev client.
- If the backend still returns web-oriented callback semantics only, mobile callback support must be implemented before these scenarios are expected to pass.