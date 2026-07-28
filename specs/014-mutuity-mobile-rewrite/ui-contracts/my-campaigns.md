# UI Contract: My campaigns

## Status

- Contract status: Approved
- Reviewed by: Product + Mobile Rewrite (phase-5 implementation)
- Review date: 2026-07-26

## Navigation Placement

- Tab/stack location: MainTabs -> CampaignsStack -> MyCampaignsScreen (tab landing).
- Entry points: Bottom tab Campaigns, deep link mutuity://campaign/{campaignId} resolves through campaigns surface.
- Exit/back behavior: Campaign detail back returns to MyCampaignsScreen list; active tab remains Campaigns.
- [ ] Approved

## States

### Empty State

- Trigger: Authenticated account has zero created campaigns.
- Copy (en/fr):
  - en: You have no campaigns yet.
  - fr: Vous n'avez pas encore de campagnes.
- CTA:
  - Primary: Create campaign
  - Secondary: Back to My Hub
- [x] Approved

### Loading State

- Trigger: Initial load and refresh after create/update flow returns.
- Skeleton/spinner behavior: Full list loading state while fetching campaigns.
- Timeout/fallback: Fallback to error state with retry action.
- [x] Approved

### Error State

- Error cases covered: Missing account context, network error, GraphQL query failure.
- User-facing copy (en/fr):
  - en: We could not load your campaigns.
  - fr: Impossible de charger vos campagnes.
- Recovery action:
  - Primary: Retry
  - Secondary: Back to My Hub
- [x] Approved

## Primary Actions

- Action list and order:
  1. Create campaign
  2. Open campaign detail
  3. View campaign status (pending/approved/rejected)
  4. Moderate campaign entries (if approved)
  5. View resource/need counts
- Permission/visibility rules: Creator-only surfaces shown from My Hub drawer; authenticated only.
- Success feedback: Save returns to list view and refreshed campaign card appears with latest status.
- [x] Approved

## Localization

- English labels verified: My campaigns, Create campaign, Campaign status, Pending, Approved, Rejected.
- French labels verified: Mes campagnes, Créer une campagne, Statut de la campagne, En attente, Approuvé, Rejeté.
- Terminology alignment notes: Keep campaign status wording consistent with backend moderation enums.
- [x] Approved

## Notes

- Accessibility/semantic selector notes: Campaign cards expose button role and deterministic `campaign-card-<id>` test IDs; status badges expose aria-label for status text.
- Open questions: Confirm whether campaign editing/deletion belongs in this flow or a dedicated moderation surface.
