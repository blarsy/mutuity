# UI Contracts Index

This folder tracks UI-first approval status per canonical main screen.

## Workflow

1. Draft the contract for the target screen.
2. Review against current Mutuity behavior and product expectations.
3. Mark all checklist sections complete.
4. Set status to `Approved` and record reviewer/date.
5. Only then start corresponding porting tasks.

## Required Checklist Areas (FR-015)

- Navigation placement is explicit.
- Empty state is defined.
- Loading state is defined.
- Error state is defined.
- Primary actions are defined.
- French and English labels are defined.

## Navigation Baseline (Feature 14)

- Main shell uses exactly 5 bottom tabs in this order: Explore, My Hub, Campaigns, Chat, Notifications.
- My Hub exposes a left drawer that is the canonical workspace/account navigation surface.
- Drawer top items (order): My resources, Received bids, Sent bids, My needs, Received claims, Sent claims.
- Drawer bottom items (order): Profile, Preferences, Contribution.
- Logged out account icon: generic silhouette that opens sign-in/registration sheet.
- Logged in account icon: user avatar that opens a menu with a single Log out item.
- Explore must contract for segmented Search resources/Search needs plus campaign filter chips.
- My Hub must contract for drawer-based navigation and remove redundant in-page navigation buttons for resources, bids, needs, and claims.

## Canonical Main Screens

- [Search resources](./search-resources.md)
- [Search needs](./search-needs.md)
- [My resources](./my-resources.md)
- [My needs](./my-needs.md)
- [My bids](./my-bids.md)
- [My claims](./my-claims.md)
- [Chat](./chat.md)
- [Notifications](./notifications.md)
- [My campaigns](./my-campaigns.md)
- [My profile](./my-profile.md)
- [My preferences](./my-preferences.md)
- [Contribution](./my-economics.md)

## Supporting Auth Surfaces (Non-Canonical)

These contracts support manual validation and route-guard behavior but are not part of the FR-014 canonical main-screen list and are not blocked by FR-013 main-screen gating.

- [Auth entry (sign-in/create-account/reset)](./auth-entry.md)
