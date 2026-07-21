# UI Contract: My preferences

## Status

- Contract status: Approved
- Reviewed by: Product + Mobile Rewrite (spec inference baseline)
- Review date: 2026-07-05

## Navigation Placement

- Tab/stack location: MainTabs -> MyHubDrawer -> MyPreferencesScreen.
- Entry points: Bottom tab My Hub then left drawer bottom item Preferences, deep link mutuity://account/preferences (auth required).
- Exit/back behavior: Close/back returns to My Hub drawer shell with selected tab state preserved.
- [x] Approved

## States

### Empty State

- Trigger: Not applicable for authenticated settings screen; when account/session is unavailable, route guard redirects to sign-in surface.
- Copy (en/fr):
	- en: Sign in to manage your preferences.
	- fr: Connectez-vous pour gerer vos preferences.
- CTA:
	- Primary: Sign in / Create account
- [x] Approved

### Loading State

- Trigger: Initial preferences query load and save mutation submission.
- Skeleton/spinner behavior: Full settings panel loading zone for initial fetch; Save button loading state during submit.
- Timeout/fallback: After 10 seconds, show delayed-state hint with retry while preserving current form values.
- [x] Approved

### Error State

- Error cases covered: Preferences query failure, mutation failure, validation errors on summary frequency values.
- User-facing copy (en/fr):
	- en: We could not save your preferences.
	- en supporting: Please check values and try again.
	- fr: Impossible d'enregistrer vos preferences.
	- fr supporting: Verifiez les valeurs puis reessayez.
- Recovery action:
	- Primary: Retry save
	- Secondary: Dismiss feedback and continue editing
- [x] Approved

## Primary Actions

- Action list and order:
	1. Select realtime vs summary mode per notification domain
	2. Select summary cadence (1/3/7/30 days) when summary mode is enabled
	3. Save preferences
- Permission/visibility rules: Preferences is hidden from anonymous users and accessible only from authenticated My Hub drawer navigation.
- Success feedback: Save displays operation feedback success message and persists the selected schedule values.
- [x] Approved

## Localization

- English labels verified: Preferences, Save, Realtime, Summary, day/days.
- French labels verified: Preferences, Enregistrer, Temps reel, Resume, jour/jours.
- Terminology alignment notes: Keep phrasing consistent with notification preference requirements (immediate versus summary delivery).
- [x] Approved

## Notes

- Accessibility/semantic selector notes: Toggle controls and cadence radio buttons must expose role and label for semantic selector tests; save feedback needs stable test ID hooks.
- Open questions: Confirm whether preference categories remain exactly three domains (chat, new resources, unread notifications) in v1 rewrite.
