# UI Contract: Search resources

## Status

- Contract status: Approved
- Reviewed by: Product + Mobile Rewrite (spec inference baseline)
- Review date: 2026-07-05

## Navigation Placement

- Tab/stack location: MainTabs -> ExploreStack -> ExploreScreen (resources segment in segmented control).
- Entry points: Bottom tab Explore (default landing), segmented control switch from Search needs, deep link mutuity://explore/resources.
- Exit/back behavior: Navigating to a resource detail pushes on ExploreStack; back returns to Explore resources list with previous query/filter state preserved.
- [ ] Approved

## States

### Empty State

- Trigger: Resources query resolves successfully with zero results for current search/filter context.
- Copy (en/fr):
	- en: No resources found.
	- en supporting: Try changing category, distance, or campaign filters.
	- fr: Aucune ressource trouvee.
	- fr supporting: Essayez de modifier la categorie, la distance ou les filtres de campagne.
- CTA:
	- Primary: Clear filters
	- Secondary: Switch to Search needs
- [x] Approved

### Loading State

- Trigger: Initial query load, pull-to-refresh, or filter/search parameter change.
- Skeleton/spinner behavior: Full-list skeleton on first load; top inline spinner for refresh or incremental updates.
- Timeout/fallback: After 10 seconds without response, show non-blocking delayed-state hint and keep retry path available.
- [x] Approved

### Error State

- Error cases covered: Network offline, GraphQL query error, timeout exceeding fallback threshold.
- User-facing copy (en/fr):
	- en: We could not load resources.
	- en supporting: Check your connection and try again.
	- fr: Impossible de charger les ressources.
	- fr supporting: Verifiez votre connexion puis reessayez.
- Recovery action:
	- Primary: Retry
	- Secondary: Open Search needs segment
- [x] Approved

## Primary Actions

- Action list and order:
	1. Enter search text
	2. Adjust category and distance filters
	3. Apply or remove campaign chips
	4. Open resource detail
	5. Start bid flow from detail
- Permission/visibility rules: Search and detail browsing are visible for anonymous and authenticated users; bid initiation requires authentication and routes anonymous users to auth sheet.
- Success feedback: Applied filters update result count/list immediately; successful bid submission returns confirmation toast/snackbar in detail context.
- [x] Approved

## Localization

- English labels verified: Explore, Search resources, Search needs, Clear filters, Retry, No resources found.
- French labels verified: Explorer, Rechercher des ressources, Rechercher des besoins, Effacer les filtres, Reessayer, Aucune ressource trouvee.
- Terminology alignment notes: Keep "resources"/"ressources" for offer-side listings; keep "needs"/"besoins" for request-side listings; avoid mixing with My Hub ownership labels.
- [x] Approved

## Notes

- Accessibility/semantic selector notes: Search input must expose placeholder label; segmented control and campaign chips require explicit accessibility labels; resource cards should expose title and status for screen readers.
- Open questions: Confirm final French microcopy accents policy for snapshot tests if ASCII fallback is maintained in specs.
