# Contract: Navigation Architecture

**Feature**: Mutuity Mobile Rewrite  
**Date**: 2026-07-03

## Overview

The mobile app uses React Navigation with a bottom-tab navigator as the main navigation pattern, inherited from Tope-là 1.0. Each tab hosts a nested stack navigator for screen hierarchies.

## Canonical Main Screens for UI-First Migration

The following main screens are the mandatory migration units for this rewrite:

- Search resources
- Search needs
- My resources
- My needs
- My bids
- My claims
- Chat
- Notifications
- My campaigns
- My profile
- My preferences
- My economics

Migration rule:
- For each main screen, UI rework and approval is required before any porting from Tope-là mobile begins.

UI contract checklist per main screen:
- Navigation placement is explicit (tab, stack, or profile section)
- Empty state is defined
- Loading state is defined
- Error state is defined
- Primary actions are defined
- French and English labels are defined

Note:
- This canonical list is the planning and tracking baseline even if tab layout evolves later.

Anonymous access rule:
- Search resources and Search needs are browse-accessible while anonymous.
- My resources, My needs, My bids, My claims, Chat, Notifications, and My campaigns are visible entry points but must render a login/create-account invitation when anonymous.
- My profile, My preferences, and My economics are not accessible through any UI action while anonymous.
- Deep links to restricted screens must be blocked for anonymous users and rerouted to an allowed surface.

---

## Navigation Structure

```
AppNavigator (RootNavigator)
├── BottomTabNavigator (always mounted)
│   ├── SearchStack
│   │   ├── SearchScreen (tab landing)
│   │   ├── ResourceDetailScreen
│   │   ├── SendBidScreen
│   │   └── AccountDetailScreen
│   │
│   ├── ResourcesStack
│   │   ├── ResourcesScreen (tab landing - my resources)
│   │   ├── CreateResourceScreen
│   │   ├── EditResourceScreen
│   │   ├── ResourceDetailScreen
│   │   └── ManageResourcesScreen
│   │
│   ├── NeedsStack
│   │   ├── NeedsScreen (tab landing - browse needs)
│   │   ├── CreateNeedScreen
│   │   ├── EditNeedScreen
│   │   ├── NeedDetailScreen
│   │   ├── ClaimNeedScreen
│   │   └── MyNeedsScreen (my needs)
│   │
│   ├── CampaignsStack
│   │   ├── CampaignsScreen (tab landing - browse campaigns)
│   │   ├── CreateCampaignScreen
│   │   ├── CampaignDetailScreen
│   │   ├── MyCampaignsScreen (my campaigns)
│   │   ├── CampaignModerationScreen
│   │   │   ├── PendingNeedsModeration
│   │   │   └── PendingResourcesModeration
│   │   └── CampaignModerationHistoryScreen
│   │
│   ├── BidsStack
│   │   ├── BidsScreen (tab landing - all bids)
│   │   ├── SentBidsScreen
│   │   ├── ReceivedBidsScreen
│   │   └── BidDetailScreen
│   │
│   ├── ChatStack
│   │   ├── ChatListScreen (tab landing - conversations)
│   │   ├── ChatDetailScreen
│   │   ├── UserProfileFromChatScreen
│   │   └── SendTokenFromChatScreen
│   │
│   ├── NotificationsStack
│   │   ├── NotificationsScreen (tab landing - activity feed)
│   │   └── NotificationDetailScreen
│   │
│   └── ProfileStack
│       ├── ProfileScreen (tab landing - my account)
│       ├── EditProfileScreen
│       ├── PreferencesScreen
│       ├── LanguageSettingScreen
│       ├── TokensScreen (balance and purchase)
│       ├── ChangePasswordScreen
│       ├── SocialLinksScreen
│       ├── DeleteAccountScreen
│       └── AboutScreen
│
└── AuthStack (presented on demand)
  ├── LoginScreen
  ├── SignUpScreen
  └── PasswordResetScreen
```

---

## Bottom Tab Navigation

### Tab Order (Left to Right)

1. **Search** (Icon: magnifying glass)
   - Purpose: Discover resources posted by other users
   - Landing Screen: SearchScreen
   - Independent Feature: P1 (Parity)

2. **Resources** (Icon: briefcase)
   - Purpose: Manage your own resources (products/services)
   - Landing Screen: ResourcesScreen (displays "My Resources")
   - Independent Feature: P1 (Parity)

3. **Needs** (Icon: hands)
   - Purpose: Create, search, claim needs
   - Landing Screen: NeedsScreen (displays "Browse Needs")
   - Independent Feature: P2 (New Mutuity)

4. **Campaigns** (Icon: flag)
   - Purpose: Create campaigns, participate, moderate
   - Landing Screen: CampaignsScreen (displays "Browse Campaigns")
   - Independent Feature: P3 (New Mutuity)

5. **Bids** (Icon: handshake)
   - Purpose: View sent and received offers
   - Landing Screen: BidsScreen (displays all bids)
   - Independent Feature: P1 (Parity)

6. **Chat** (Icon: message)
   - Purpose: 1:1 conversations
   - Landing Screen: ChatListScreen (displays conversation list)
   - Independent Feature: P1 (Parity)

7. **Notifications** (Icon: bell)
   - Purpose: Activity feed
   - Landing Screen: NotificationsScreen (displays notification list)
   - Independent Feature: P1 (Parity)

8. **Profile** (Icon: person)
   - Purpose: Account settings, preferences, profile
   - Landing Screen: ProfileScreen
   - Independent Feature: P1 (Parity)

---

## Screen Patterns

### Landing Screen (Tab)

Each tab lands on a "listing" or "summary" screen:
- **Anonymous Behavior**: Search resources and Search needs remain browsable while anonymous.
- **Restricted-When-Anonymous Behavior**: My resources, My needs, My bids, My claims, Chat, Notifications, and My campaigns must show a login/create-account invitation when anonymous.
- **Hidden-When-Anonymous Behavior**: My profile, My preferences, and My economics must not be reachable through any UI action while anonymous.
- **Empty State**: Shows helpful message if no data (e.g., "No resources yet").
- **Loading State**: Shows spinner while fetching data.
- **Error State**: Shows error message with retry button.
- **Pull-to-Refresh**: Implemented via FlatList refreshing.
- **Pagination**: Infinite scroll with "Load More" indicator.

### Detail Screens

Accessed by tapping an item in the listing. Common patterns:
- **Header**: Item title, creator info, status badge.
- **Content**: Description, location, images, timestamps.
- **Actions**: Buttons appropriate to user role (edit, claim, send bid, moderate, etc.).
- **Error Handling**: Shows error alert if fetch fails; allows back navigation.

### Modals/Overlays

Non-critical flows (e.g., sending a bid, changing language) use modals:
- **Presentation**: Modal stacks on top of current screen.
- **Dismissal**: Cancel button or swipe-down (iOS convention).
- **Confirmation**: Submit button with loading state feedback.

### Edit Screens

Used for creating or updating resources, needs, campaigns:
- **Form Fields**: Text inputs, pickers, date/time selectors, image uploads.
- **Validation**: Real-time field validation (show error under field).
- **Submission**: Submit button disabled until form valid; shows loading spinner.
- **Success**: Navigation back with success message (via toast or snackbar).
- **Error**: Inline error alerts with retry option.

---

## Deep Linking

### Deep Link Scheme

The app supports deep linking for push notifications and external URLs:

```
mutuity://resource/{resourceId}           → ResourceDetailScreen
mutuity://need/{needId}                   → NeedDetailScreen
mutuity://campaign/{campaignId}           → CampaignDetailScreen
mutuity://bid/{bidId}                     → BidDetailScreen
mutuity://chat/{accountId}                → ChatDetailScreen
mutuity://profile/{accountId}             → UserProfileScreen
mutuity://notification/{notificationId}   → NotificationDetailScreen + mark read
```

### Implementation

React Navigation's `linking` configuration maps URLs to screens. On notification tap, the deep link is passed to the navigation container, which routes appropriately.

---

## Navigation State Management

### Auth State

- **AuthContext**: Provides `session` object with:
  - `authenticated` (boolean)
  - `account` (Account or null)
  - `token` (JWT token or null)
  - `loading` (boolean, true during initial auth check)

- **Effect in RootNavigator**: 
  - If `loading`, show splash screen.
  - If `authenticated`, full tab behaviors are enabled.
  - If not authenticated, browse-only tabs remain available and restricted surfaces use inline auth prompts or hidden routes per the anonymous access rule.

### Tab History

- React Navigation tracks tab history automatically.
- Each tab maintains its own stack history (e.g., navigating back from ResourceDetail returns to SearchScreen).
- **Bottom tab bar persists** across navigation; tapping the same tab returns to that tab's landing screen.

### Modal Navigation

- Modals use React Navigation's `presentation: 'modal'` option.
- Modals are declared separately from the main stacks to float above tabs.
- Dismissing a modal returns to the underlying stack.

---

## Accessibility & Localization

### Tab Labels & Icons

All tab labels and action buttons are localized (i18n):

```json
{
  "navigation": {
    "tabs": {
      "search": "Search",
      "resources": "Resources",
      "needs": "Needs",
      "campaigns": "Campaigns",
      "bids": "Bids",
      "chat": "Chat",
      "notifications": "Notifications",
      "profile": "Profile"
    }
  }
}
```

French translations in `src/i18n/locales/fr/navigation.json`.

### Screen Headers

Each screen declares a header (via React Navigation's `screenOptions`):

```typescript
function ResourceDetailScreen() {
  const { t } = useTranslation();
  return (
    <Stack.Screen
      options={{
        title: t('resourceDetail.title'),
        headerBackTitle: t('common.back')
      }}
    />
  );
}
```

### Semantic Accessibility

All interactive elements use `accessibilityLabel` and `accessibilityRole`:

```typescript
<TouchableOpacity accessibilityLabel="Send bid" accessibilityRole="button">
  <Text>Send Offer</Text>
</TouchableOpacity>
```

---

## Navigation Flow Examples

### User Story 2: Create and Claim a Need (P2)

```
Needs Tab (landing)
  ↓
User taps "Create Need" button
  ↓
CreateNeedScreen (form modal)
  ↓
User fills form and submits
  ↓
Success toast, modal dismissed
  ↓
NeedDetailScreen (newly created need)
  ↓
User taps "Back"
  ↓
NeedsScreen (returns to browsing)

---

Later, user finds a need to claim:

NeedsScreen
  ↓
User taps a need item
  ↓
NeedDetailScreen
  ↓
User taps "Claim This Need" button
  ↓
ClaimNeedScreen (confirmation modal)
  ↓
User confirms
  ↓
Success, modal dismissed
  ↓
NeedDetailScreen (updated with "Claimed" status)
```

### User Story 3: Campaign Moderation (P3)

```
Campaigns Tab (landing)
  ↓
User taps "My Campaigns" link
  ↓
MyCampaignsScreen (lists campaigns created by user)
  ↓
User taps an APPROVED campaign
  ↓
CampaignDetailScreen
  ↓
User taps "Moderate" button
  ↓
CampaignModerationScreen (shows pending needs/resources)
  ↓
User taps "Accept" on a pending need
  ↓
Confirmation dialog, mutation sent
  ↓
CampaignModerationScreen (list updated)
```

---

## Navigation Testing Strategy

- **Unit Tests**: Navigation actions (push, pop, replace) tested in isolation.
- **Integration Tests**: Screen flows (e.g., create need → see it in list) tested end-to-end.
- **E2E Tests** (Detox): User journeys tested on simulator (e.g., tap tab, navigate to detail, go back).

---

## Summary

| Feature | Pattern | Implementation |
|---------|---------|-----------------|
| Tab Navigation | Bottom tabs | React Navigation BottomTabNavigator |
| Stack Navigation | Nested stacks per tab | React Navigation NativeStack |
| Deep Linking | URL scheme | React Navigation linking config |
| Auth Flow | Conditional rendering | AuthContext + RootNavigator logic |
| Modals | Non-blocking overlays | React Navigation modal presentation |
| Localization | i18n keys for labels | react-i18next + JSON files |
| State Persistence | Apollo Client cache | Automatic across navigation |
| Back Navigation | Stack-based history | React Navigation default behavior |

---

## Next Steps

See `state-management.md` for Apollo Client cache strategy and offline mutation queueing.
