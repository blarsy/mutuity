# UI Contract: My resources

## Status

- Contract status: Approved
- Reviewed by: Product + Mobile Rewrite (spec inference baseline)
- Review date: 2026-07-05

## Navigation Placement

- Tab/stack location: MainTabs -> MyHubStack -> MyResourcesScreen (reachable from My Hub listings section).
- Entry points: Bottom tab My Hub then View all in My resources preview, post-create success path from Add Resource action.
- Exit/back behavior: Back returns to MyHubScreen listings section; active tab remains My Hub and dashboard state is preserved.
- [ ] Approved

## States

### Empty State

- Trigger: Authenticated account has zero owned resources.
- Copy (en/fr):
	- en: You have no resources yet.
	- en supporting: Add your first resource to start receiving bids.
	- fr: Vous n'avez pas encore de ressource.
	- fr supporting: Ajoutez votre premiere ressource pour commencer a recevoir des offres.
- CTA:
	- Primary: Add Resource
	- Secondary: Back to My Hub
- [x] Approved

### Loading State

- Trigger: Initial My resources list fetch, pull-to-refresh, and post-create/update list refresh.
- Skeleton/spinner behavior: List skeleton for initial load; pull-to-refresh spinner for incremental reload.
- Timeout/fallback: After 10 seconds, show delayed-state hint with retry while preserving current navigation state.
- [x] Approved

### Error State

- Error cases covered: Auth/session invalidation, network offline, GraphQL list failure.
- User-facing copy (en/fr):
	- en: We could not load your resources.
	- en supporting: Please try again.
	- fr: Impossible de charger vos ressources.
	- fr supporting: Veuillez reessayer.
- Recovery action:
	- Primary: Retry
	- Secondary: Back to My Hub
- [x] Approved

## Primary Actions

- Action list and order:
	1. Open resource detail (viewResource)
	2. Create new resource (newResource)
	3. Edit existing resource (editResource)
	4. Open owner profile/account context when needed (viewAccount)
- Permission/visibility rules: This surface is authenticated-only; anonymous users are routed to login/create-account invitation before entering My resources.
- Success feedback: Create/edit success returns to list with updated card data and success toast/snackbar.
- [x] Approved

## Localization

- English labels verified: My resources, Add Resource, Edit Resource, Retry, Back to My Hub.
- French labels verified: Mes ressources, Ajouter une ressource, Modifier la ressource, Reessayer, Retour a Mon Hub.
- Terminology alignment notes: "My resources" must stay ownership-specific and not be confused with Explore discovery labels.
- [x] Approved

## Notes

- Accessibility/semantic selector notes: Resource cards require semantic role/button behavior for open/edit actions; add-resource CTA must be reachable by role+label selectors for tests.
- Open questions: Confirm whether archived/inactive owned resources live in this screen or in a separate My Hub subsection.
