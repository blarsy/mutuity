# UI Contract: My profile

## Status

- Contract status: Approved
- Reviewed by: Product + Mobile Rewrite (spec inference baseline)
- Review date: 2026-07-05

## Navigation Placement

- Tab/stack location: MainShellStack -> AccountMenuOverlay -> MyProfileScreen (account menu section, not a bottom tab).
- Entry points: Top-right account icon -> Account Menu -> Profile, deep link mutuity://account/profile (auth required).
- Exit/back behavior: Close/back returns to previously active tab screen with tab stack state preserved.
- [x] Approved

## States

### Empty State

- Trigger: Not applicable for authenticated profile surface; if account context is unavailable, route guard redirects to sign-in surface.
- Copy (en/fr):
	- en: Sign in to access your profile.
	- fr: Connectez-vous pour acceder a votre profil.
- CTA:
	- Primary: Sign in / Create account
- [x] Approved

### Loading State

- Trigger: Initial profile payload load, profile save operation, password change, account deletion operation.
- Skeleton/spinner behavior: Form-level loading indicator and inline operation spinner in destructive confirmation dialog.
- Timeout/fallback: After 10 seconds during mutation flows, show delayed-state hint with dismiss/retry path.
- [x] Approved

### Error State

- Error cases covered: Profile update mutation failure, password change failure, account deletion failure, auth/session invalidation.
- User-facing copy (en/fr):
	- en: We could not save your profile changes.
	- en supporting: Please try again.
	- fr: Impossible d'enregistrer les modifications du profil.
	- fr supporting: Veuillez reessayer.
- Recovery action:
	- Primary: Retry
	- Secondary: Cancel and return to profile overview
- [x] Approved

## Primary Actions

- Action list and order:
	1. Edit profile fields and save
	2. Open change password flow
	3. Open preferences subsection
	4. Open contribution/tokens subsection
	5. Logout
	6. Delete account (two-step confirmation)
- Permission/visibility rules: My profile is hidden from anonymous navigation; all actions require authenticated account context.
- Success feedback: Save/password success surfaces confirmation toast/snackbar; logout and delete account reset navigation to allowed signed-out surface.
- [x] Approved

## Localization

- English labels verified: Profile, Edit profile, Change password, Preferences, Logout, Delete account.
- French labels verified: Profil, Modifier le profil, Changer le mot de passe, Preferences, Deconnexion, Supprimer le compte.
- Terminology alignment notes: Keep account-menu naming aligned with Profile/Preferences/Contribution sections defined in navigation contract.
- [x] Approved

## Notes

- Accessibility/semantic selector notes: Back, logout, and delete-account actions require clear accessibility labels and stable test IDs; destructive confirmation switch must be keyboard/screen-reader operable.
- Open questions: Confirm whether tokens remain nested under profile in rewrite implementation or move fully under Contribution naming while preserving legacy token history entry points.
