# UI Contract: My claims

## Status

- Contract status: Approved
- Reviewed by: Product + Mobile Rewrite (phase-4 implementation)
- Review date: 2026-07-25

## Navigation Placement

- Tab/stack location: MainTabs -> MyHubDrawer -> MyClaimsScreen.
- Entry points: Bottom tab My Hub then left drawer top item Received claims or Sent claims.
- Exit/back behavior: Back returns to My Hub drawer shell and preserves the previously selected claim segment.
- [ ] Approved

## States

### Empty State

- Trigger: No sent or received claims for current account and selected direction.
- Copy (en/fr):
	- en: No claims found.
	- fr: Aucun claim trouve.
- CTA:
	- Primary: Refresh
	- Secondary: Switch drawer section
- [x] Approved

### Loading State

- Trigger: Initial load and refresh for sent/received claim lists.
- Skeleton/spinner behavior: Full loading state while fetching claims.
- Timeout/fallback: Fail to error state and expose retry action.
- [x] Approved

### Error State

- Error cases covered: Missing account context, network error, GraphQL query failure.
- User-facing copy (en/fr):
	- en: We could not load claims.
	- fr: Impossible de charger les claims.
- Recovery action:
	- Primary: Retry
	- Secondary: Return to My Hub drawer
- [x] Approved

## Primary Actions

- Action list and order:
	1. Open My Hub drawer
	2. Choose Received claims or Sent claims
	3. Review claim rows and statuses
	4. Refresh list
- Permission/visibility rules: Authenticated-only surface.
- Success feedback: Refresh returns updated claim rows and latest statuses.
- [x] Approved

## Localization

- English labels verified: Received claims, Sent claims, Status, No claims found.
- French labels verified: Claims recus, Claims envoyes, Statut, Aucun claim trouve.
- Terminology alignment notes: Keep claim wording consistent with drawer labels until broader terminology pass.
- [x] Approved

## Notes

- Accessibility/semantic selector notes: Claim cards expose deterministic list rendering and status text for assertions.
- Open questions: Confirm long-term translation strategy for claim-specific terminology.
