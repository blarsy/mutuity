# UI Contract: My bids

## Status

- Contract status: Approved
- Reviewed by: Product + Mobile Rewrite (spec inference baseline)
- Review date: 2026-07-05

## Navigation Placement

- Tab/stack location: MainTabs -> MyHubStack -> MyBidsScreen (Active bids section surface).
- Entry points: Bottom tab My Hub then Active bids section entry, contextual links from related resource/need flows.
- Exit/back behavior: Back returns to MyHubScreen Active bids section; active tab remains My Hub.
- [x] Approved

## States

### Empty State

- Trigger: Authenticated user has no bids in selected segment (sent or received) for active filter scope.
- Copy (en/fr):
	- en: No bids found.
	- en supporting: Switch segment or include inactive bids to see older activity.
	- fr: Aucune offre trouvee.
	- fr supporting: Changez d'onglet ou incluez les offres inactives pour voir l'historique.
- CTA:
	- Primary: Switch Sent/Received segment
	- Secondary: Include inactive bids
- [x] Approved

### Loading State

- Trigger: Initial bids load, segment change between sent and received, toggle include-inactive, pull-to-refresh.
- Skeleton/spinner behavior: Segment-level list skeleton on first load; inline top spinner for subsequent refresh.
- Timeout/fallback: After 10 seconds, show delayed-state hint while keeping retry action visible.
- [x] Approved

### Error State

- Error cases covered: Network offline, GraphQL failure for sent/received queries, invalid session state.
- User-facing copy (en/fr):
	- en: We could not load your bids.
	- en supporting: Check your connection and try again.
	- fr: Impossible de charger vos offres.
	- fr supporting: Verifiez votre connexion puis reessayez.
- Recovery action:
	- Primary: Retry
	- Secondary: Back to My Hub
- [x] Approved

## Primary Actions

- Action list and order:
	1. Switch between Sent and Received segments
	2. Open bid-linked item detail (resource/need context)
	3. Open related account context
	4. Toggle include inactive bids
- Permission/visibility rules: My bids is restricted-when-anonymous; anonymous users see login/create-account invitation instead of bid list data.
- Success feedback: Segment/filter changes update list immediately; opening bid-linked detail preserves return path to the same segment and filter state.
- [x] Approved

## Localization

- English labels verified: My bids, Sent, Received, Include inactive, Retry.
- French labels verified: Mes offres, Envoyees, Recues, Inclure les inactives, Reessayer.
- Terminology alignment notes: Keep "bids"/"offres" distinct from "claims"/"engagements" across My Hub surfaces.
- [x] Approved

## Notes

- Accessibility/semantic selector notes: Sent/Received segmented control must expose role and label for semantic selector tests; bid row actions should be individually labeled.
- Open questions: Confirm if inactive bids are exposed as toggle in-place or as dedicated archived route in final My Hub implementation.
