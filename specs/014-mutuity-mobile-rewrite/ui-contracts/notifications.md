# UI Contract: Notifications

## Status

- Contract status: Approved
- Reviewed by: Product + Mobile Rewrite (spec inference baseline)
- Review date: 2026-07-05

## Navigation Placement

- Tab/stack location: MainTabs -> NotificationsStack -> NotificationsScreen (tab landing).
- Entry points: Bottom tab Notifications, push-notification tap routing, deep link mutuity://notification/{notificationId}.
- Exit/back behavior: Notification detail back returns to NotificationsScreen chronologic list; active tab remains Notifications.
- [x] Approved

## States

### Empty State

- Trigger: Authenticated user has zero notifications after successful fetch.
- Copy (en/fr):
	- en: No notifications yet.
	- en supporting: New activity will appear here.
	- fr: Aucune notification pour le moment.
	- fr supporting: Les nouvelles activites apparaitront ici.
- CTA:
	- Primary: Pull to refresh
	- Secondary: Back to Explore
- [x] Approved

### Loading State

- Trigger: Initial notifications fetch, refresh on focus, and pagination load-more actions.
- Skeleton/spinner behavior: List loading placeholder for initial load; inline load-more indicator for pagination.
- Timeout/fallback: After 10 seconds, show delayed-state hint and keep retry/refresh available.
- [x] Approved

### Error State

- Error cases covered: Network offline, notifications query failure, resource-enrichment query failure for notification payload.
- User-facing copy (en/fr):
	- en: We could not load notifications.
	- en supporting: Check your connection and try again.
	- fr: Impossible de charger les notifications.
	- fr supporting: Verifiez votre connexion puis reessayez.
- Recovery action:
	- Primary: Retry
	- Secondary: Pull to refresh
- [x] Approved

## Primary Actions

- Action list and order:
	1. Open notification item
	2. Mark notification as read (on open)
	3. Navigate to target surface (resource detail, bids, profile/tokens, campaign-related destination)
	4. Load earlier notifications (pagination)
- Permission/visibility rules: Notifications is restricted-when-anonymous and shows login/create-account invitation when not authenticated.
- Success feedback: Opening an unread item updates unread indicator and list styling immediately, then routes to destination.
- [x] Approved

## Localization

- English labels verified: Notifications, Retry, No notifications yet, Please connect.
- French labels verified: Notifications, Reessayer, Aucune notification pour le moment, Veuillez vous connecter.
- Terminology alignment notes: Use notification-specific wording and keep consistency with bids/profile token destinations.
- [x] Approved

## Notes

- Accessibility/semantic selector notes: Notification rows and unread indicators require explicit semantic labels/test IDs; headline and text fields should remain separately addressable for tests.
- Open questions: Confirm whether read-state mutation failure should revert optimistic UI update or remain eventual-consistency only.
