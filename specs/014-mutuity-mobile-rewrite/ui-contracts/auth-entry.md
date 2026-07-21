# UI Contract: Auth entry (sign-in/create-account/reset)

## Status

- Contract status: Approved
- Reviewed by: Mobile Rewrite
- Review date: 2026-07-16

## Navigation Placement

- Tab/stack location: MainShellStack -> AuthEntrySheet (modal/sheet anchored from top-right account icon and restricted-surface prompts).
- Entry points:
	- Top-right anonymous account icon.
	- Restricted-surface prompts from My resources, My needs, My bids, My claims, Chat, Notifications, and My campaigns.
	- Anonymous deep-link interception for restricted destinations.
- Exit/back behavior:
	- Close returns to previous allowed anonymous surface.
	- Successful authentication returns to originally requested destination when route policy allows it.
- [x] Approved

Authenticated top-right avatar behavior note:
- The authenticated top-right avatar menu does not route to account surfaces; it contains only one item, Log out.

## States

### Empty State

- Trigger: Not applicable for auth forms.
- Fallback behavior: If auth providers are unavailable, show service-unavailable message with retry action.
- [x] Approved

### Loading State

- Trigger: Sign-in submit, create-account submit, password-reset submit, session bootstrap after success.
- Indicator behavior: Disable primary submit, show inline spinner, keep secondary navigation links available unless unsafe.
- Timeout/fallback: After 10 seconds, show delayed-state hint and keep retry/cancel path visible.
- [x] Approved

### Error State

- Error cases covered: Invalid credentials, duplicate email/identity conflict, weak password, password-reset request failure, network failure, rate limit.
- User-facing copy (en/fr):
	- en: We could not complete authentication.
	- en supporting: Check your information and try again.
	- fr: Impossible de terminer l'authentification.
	- fr supporting: Verifiez vos informations puis reessayez.
- Recovery action:
	- Primary: Retry
	- Secondary: Switch flow (Sign in <-> Create account) or cancel
- [x] Approved

## Primary Actions

- Action list and order:
	1. Sign in with email/password.
	2. Open create-account form from sign-in surface.
	3. Open sign-in form from create-account surface.
	4. Open password-reset request from sign-in surface.
	5. Submit password-reset request and return to sign-in.
- Permission/visibility rules: Auth entry is available only for anonymous or expired-session contexts.
- Success feedback: Success returns user to requested destination when allowed; otherwise route to default authenticated home surface.
- [x] Approved

## Localization

- English labels required: Sign in, Create account, Forgot password, Email, Password, Confirm password, Continue, Cancel, Back to sign in.
- French labels required: Se connecter, Creer un compte, Mot de passe oublie, E-mail, Mot de passe, Confirmer le mot de passe, Continuer, Annuler, Retour a la connexion.
- Terminology alignment notes: Keep account-entry naming aligned with FR-029 sign-in/registration wording.
- [x] Approved

## Notes

- Accessibility/semantic selector notes: Form fields and CTA buttons require stable semantic selectors (role, label, placeholder, data-testid) to support acceptance tests.
- Open questions: Confirm whether social login entry points are in scope for Feature 14 or remain deferred to Feature 13 integration tasks.
