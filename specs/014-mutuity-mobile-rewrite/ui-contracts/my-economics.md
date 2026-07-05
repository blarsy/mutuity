# UI Contract: Contribution

## Status

- Contract status: Approved
- Reviewed by: Product + Mobile Rewrite (spec inference baseline)
- Review date: 2026-07-05

## Navigation Placement

- Tab/stack location: MainShellStack -> AccountMenuOverlay -> MyEconomicsScreen (Contribution section in account menu, not a bottom tab).
- Entry points: Top-right account icon -> Account Menu -> Contribution, deep link mutuity://account/contribution (auth required).
- Exit/back behavior: Close/back returns to previously active tab screen with tab stack state preserved.
- [x] Approved

## States

### Empty State

- Trigger: User has no token history yet while total balance is available.
- Copy (en/fr):
	- en: No contribution history yet.
	- en supporting: Your token activity will appear here.
	- fr: Aucun historique de contribution pour le moment.
	- fr supporting: Votre activite de tokens apparaitra ici.
- CTA:
	- Primary: Learn how contribution works
- [x] Approved

### Loading State

- Trigger: Initial balance/history load and expansion of history section when data is not hydrated.
- Skeleton/spinner behavior: Header balance remains visible while lower informational/history blocks load progressively.
- Timeout/fallback: After 10 seconds, show delayed-state hint with retry action for history fetch.
- [x] Approved

### Error State

- Error cases covered: Token history fetch failure, contribution informational content fetch failure, network offline.
- User-facing copy (en/fr):
	- en: We could not load contribution details.
	- en supporting: Check your connection and try again.
	- fr: Impossible de charger les details de contribution.
	- fr supporting: Verifiez votre connexion puis reessayez.
- Recovery action:
	- Primary: Retry
	- Secondary: Collapse and reopen history section
- [x] Approved

## Primary Actions

- Action list and order:
	1. View current token balance
	2. Expand/collapse contribution history accordion
	3. Review informational panels (how it works / how to get)
- Permission/visibility rules: Contribution is hidden from anonymous users and only available from authenticated account menu.
- Success feedback: Expanding history shows entries immediately when available and preserves expanded state when reopened from notification routes.
- [x] Approved

## Localization

- English labels verified: Contribution, You have, Token, History, How it works.
- French labels verified: Contribution, Vous avez, Token, Historique, Comment ca marche.
- Terminology alignment notes: User-facing label is Contribution; legacy "economics" terminology is deprecated in UX copy.
- [x] Approved

## Notes

- Accessibility/semantic selector notes: Balance value and history accordion need explicit semantic labels and stable test IDs for integration coverage.
- Open questions: Confirm whether contribution surface later includes campaign impact metrics beyond token history in v1 scope.
