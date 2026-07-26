# UI Contract: Search needs

## Status

- Contract status: Approved
- Reviewed by: Product + Mobile Rewrite (phase-4 implementation)
- Review date: 2026-07-25

## Navigation Placement

- Tab/stack location: MainTabs -> ExploreStack -> ExploreScreen (needs segment in segmented control).
- Entry points: Bottom tab Explore then segmented control to Search needs, deep link mutuity://explore/needs.
- Exit/back behavior: Navigating to a need detail pushes on ExploreStack; back returns to Explore needs list with previous query/filter state preserved.
- [ ] Approved

## States

### Empty State

- Trigger: Needs query resolves with zero results for the active search/filter criteria.
- Copy (en/fr):
	- en: No needs found. Try changing your filters.
	- fr: Aucun besoin trouve. Essayez de changer vos filtres.
- CTA:
	- Primary: Clear filters
	- Secondary: Switch to Search resources
- [x] Approved

### Loading State

- Trigger: Initial list load, explicit retry, and claim mutation in-flight on an individual row.
- Skeleton/spinner behavior: Full loading state for initial load; row-level loading state on claim action.
- Timeout/fallback: Show error state with retry action if query fails.
- [x] Approved

### Error State

- Error cases covered: Network failure, GraphQL query error, claim mutation failure.
- User-facing copy (en/fr):
	- en: We could not load needs.
	- fr: Impossible de charger les besoins.
- Recovery action:
	- Primary: Retry
	- Secondary: Adjust filters
- [x] Approved

## Primary Actions

- Action list and order:
	1. Enter search text
	2. Set max token amount
	3. Toggle intensity chips
	4. Claim a need
- Permission/visibility rules: Listing is visible to anonymous users; claim action requires authenticated account context.
- Success feedback: Claim action flips row CTA to "Claimed" and blocks duplicate claim attempts.
- [x] Approved

## Localization

- English labels verified: Search needs, Max token amount, Claim need, Claimed, Hide claimed needs.
- French labels verified: Rechercher des besoins, Montant max en jetons, Claim le besoin, Claimed.
- Terminology alignment notes: Use "token" wording in code/labels; backend field names may still expose legacy tope naming.
- [x] Approved

## Notes

- Accessibility/semantic selector notes: Search field exposes placeholder/label; cards and claim buttons expose deterministic data-testid values.
- Open questions: Validate whether claim status labels should be translated from enum values in a follow-up polish task.
