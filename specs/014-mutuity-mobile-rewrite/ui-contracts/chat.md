# UI Contract: Chat

## Status

- Contract status: Approved
- Reviewed by: Product + Mobile Rewrite (spec inference baseline)
- Review date: 2026-07-05

## Navigation Placement

- Tab/stack location: MainTabs -> ChatStack -> ChatListScreen (tab landing).
- Entry points: Bottom tab Chat, contextual Chat actions from My Hub drawer-led bids/claims workflows, deep link mutuity://chat/{accountId}.
- Exit/back behavior: Chat detail back returns to ChatListScreen conversation list; active tab remains Chat.
- [x] Approved

## States

### Empty State

- Trigger: User has no active/past conversations, or anonymous user accesses Chat.
- Copy (en/fr):
	- en: No conversation yet.
	- en supporting: Start from a bid or claim workflow to open a conversation.
	- fr: Aucune conversation pour le moment.
	- fr supporting: Demarrez depuis une action d'offre ou de claim pour ouvrir une conversation.
- CTA:
	- Primary (authenticated): Open My Hub drawer bids/claims entries
	- Primary (anonymous): Sign in / Create account
- [x] Approved

### Loading State

- Trigger: Initial conversation list load, opening a conversation thread, loading thread header context.
- Skeleton/spinner behavior: List skeleton in conversations list; header/body loading zone in conversation detail.
- Timeout/fallback: After 10 seconds, show delayed-state hint with retry while preserving current route.
- [x] Approved

### Error State

- Error cases covered: Conversation list query failure, thread fetch failure, network offline.
- User-facing copy (en/fr):
	- en: We could not load this conversation.
	- en supporting: Check your connection and try again.
	- fr: Impossible de charger cette conversation.
	- fr supporting: Verifiez votre connexion puis reessayez.
- Recovery action:
	- Primary: Retry
	- Secondary: Back to conversation list
- [x] Approved

## Primary Actions

- Action list and order:
	1. Open conversation from list
	2. Send message in conversation thread
	3. Open linked resource from thread header
	4. Open other account profile from thread header
	5. Optional token transfer action from thread header (authenticated)
- Permission/visibility rules: Chat is restricted-when-anonymous with login/create-account invitation; token transfer action is visible only when authenticated.
- Success feedback: Message send appends immediately in thread; navigation to linked resource/account keeps conversation return path intact.
- [x] Approved

## Localization

- English labels verified: Chat, No conversation yet, Retry, Back.
- French labels verified: Chat, Aucune conversation pour le moment, Reessayer, Retour.
- Terminology alignment notes: Keep conversational labels concise and action-oriented; avoid mixing claim workflow vocabulary with chat thread labels.
- [x] Approved

## Notes

- Accessibility/semantic selector notes: Conversation list rows, back button, linked resource button, and linked account button need explicit accessibility labels for semantic tests.
- Open questions: Confirm whether token transfer remains in-thread action for v1 of rewrite or moves to profile/contribution surfaces.
