# UI Contract: My needs

## Status

- Contract status: Approved
- Reviewed by: Product + Mobile Rewrite (phase-4 implementation)
- Review date: 2026-07-25

## Navigation Placement

- Tab/stack location: MainTabs -> MyHubDrawer -> MyNeedsScreen.
- Entry points: Bottom tab My Hub then left drawer top item My needs.
- Exit/back behavior: Back returns to My Hub drawer shell; active tab remains My Hub.
- [ ] Approved

## States

### Empty State

- Trigger: Authenticated account has zero created needs.
- Copy (en/fr):
	- en: You have no needs yet.
	- fr: Vous n'avez pas encore de besoins.
- CTA:
	- Primary: Add need
	- Secondary: Back to My Hub
- [x] Approved

### Loading State

- Trigger: Initial load and refresh after create/update flow returns.
- Skeleton/spinner behavior: Full list loading state while fetching.
- Timeout/fallback: Fallback to error state with retry action.
- [x] Approved

### Error State

- Error cases covered: Missing account context, network error, GraphQL query failure.
- User-facing copy (en/fr):
	- en: We could not load your needs.
	- fr: Impossible de charger vos besoins.
- Recovery action:
	- Primary: Retry
	- Secondary: Back to My Hub
- [x] Approved

## Primary Actions

- Action list and order:
	1. Create need
	2. Open need card
	3. Edit need fields
	4. Save and return to refreshed list
- Permission/visibility rules: Authenticated-only surface, shown from My Hub drawer.
- Success feedback: Save returns to list view and refreshed need card appears with latest values.
- [x] Approved

## Localization

- English labels verified: My needs, Add need, Edit need, Save need.
- French labels verified: Mes besoins, Ajouter un besoin, Modifier le besoin, Enregistrer le besoin.
- Terminology alignment notes: Keep ownership vocabulary distinct from Explore search wording.
- [x] Approved

## Notes

- Accessibility/semantic selector notes: Need cards expose button role and deterministic `my-need-card-<id>` test IDs.
- Open questions: Confirm whether deletion/archival belongs in this flow or a dedicated moderation surface.
