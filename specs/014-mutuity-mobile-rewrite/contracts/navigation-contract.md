# Contract: Navigation Architecture

**Feature**: Mutuity Mobile Rewrite
**Date**: 2026-07-05

## Overview

The mobile app uses React Navigation with a fixed 5-tab bottom navigator for core workflows, a My Hub left drawer for workspace/account surfaces, and a top-right avatar anchor for authentication entry/logout.

This contract supersedes the previous multi-tab profile/settings model.

## Top-Level Navigation Paradigm

- Bottom navigation has exactly 5 tabs in this order: Explore, My Hub, Campaigns, Chat, Notifications.
- Account surfaces are not exposed as a bottom tab.
- The top-right account anchor appears globally on main-shell screens.
- My Hub exposes the canonical left drawer navigation for workspace and account destinations.

Authentication-sensitive account anchor behavior:
- Logged out: icon is a generic silhouette; tap opens Sign In / Registration sheet.
- Logged in: icon is the user avatar; tap opens a single-item menu with Log out.

## Canonical Main Screens for UI-First Migration

The canonical screen set remains the migration baseline:

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
- Contribution

Migration rule:
- For each canonical screen, UI rework and approval is required before any porting from Tope-la mobile begins.

UI contract checklist per canonical screen:
- Navigation placement is explicit (tab, nested stack, or My Hub drawer section)
- Empty state is defined
- Loading state is defined
- Error state is defined
- Primary actions are defined
- French and English labels are defined

## Surface Mapping (Canonical Screen -> Navigation Placement)

| Canonical screen | Placement |
|---|---|
| Search resources | Explore tab -> segmented mode: resources |
| Search needs | Explore tab -> segmented mode: needs |
| My resources | My Hub tab -> left drawer top item: My resources |
| My needs | My Hub tab -> left drawer top item: My needs |
| My bids | My Hub tab -> left drawer top item: Received bids or Sent bids |
| My claims | My Hub tab -> left drawer top item: Received claims or Sent claims |
| Chat | Chat tab landing |
| Notifications | Notifications tab landing |
| My campaigns | Campaigns tab landing |
| My profile | My Hub tab -> left drawer bottom item: Profile |
| My preferences | My Hub tab -> left drawer bottom item: Preferences |
| Contribution | My Hub tab -> left drawer bottom item: Contribution |

## Anonymous Access Rules

- Browse-accessible while anonymous:
  - Search resources
  - Search needs
- Visible entry points with inline auth prompt when anonymous:
  - My resources
  - My needs
  - My bids
  - My claims
  - Chat
  - Notifications
  - My campaigns
- Hidden from anonymous UI entry points:
  - My profile
  - My preferences
  - Contribution
- Deep links to hidden/restricted destinations must be blocked for anonymous users and rerouted to an allowed surface.

## Navigation Structure

```text
AppNavigator (RootNavigator)
├── MainShellStack
│   ├── MainTabs (BottomTabNavigator, always mounted)
│   │   ├── ExploreStack (Tab 1)
│   │   │   ├── ExploreScreen (landing: segmented Search resources/Search needs)
│   │   │   ├── ResourceDetailScreen
│   │   │   ├── NeedDetailScreen
│   │   │   ├── SendBidScreen (modal)
│   │   │   └── ClaimNeedScreen (modal)
│   │   │
│   │   ├── MyHubStack (Tab 2)
│   │   │   ├── MyHubScreen (landing shell with left drawer)
│   │   │   ├── MyHubDrawer
│   │   │   │   ├── Top group: My resources, Received bids, Sent bids, My needs, Received claims, Sent claims
│   │   │   │   └── Bottom group: Profile, Preferences, Contribution
│   │   │   ├── MyResourcesScreen
│   │   │   ├── MyNeedsScreen
│   │   │   ├── MyBidsScreen
│   │   │   ├── MyClaimsScreen
│   │   │   ├── CreateResourceScreen (modal)
│   │   │   └── CreateNeedScreen (modal)
│   │   │
│   │   ├── CampaignsStack (Tab 3)
│   │   │   ├── MyCampaignsScreen (landing)
│   │   │   ├── CampaignDetailScreen
│   │   │   ├── CreateCampaignScreen
│   │   │   └── CampaignModerationScreen
│   │   │
│   │   ├── ChatStack (Tab 4)
│   │   │   ├── ChatListScreen (landing)
│   │   │   └── ChatDetailScreen
│   │   │
│   │   └── NotificationsStack (Tab 5)
│   │       ├── NotificationsScreen (landing)
│   │       └── NotificationDetailScreen
│   │
│   └── HeaderAvatarMenu (anchored from header right)
│       └── LogoutAction (authenticated)
│
└── AuthStack (presented on demand)
    ├── LoginScreen
    ├── SignUpScreen
    └── PasswordResetScreen
```

## Tab Definitions

1. **Explore**
- Purpose: Unified discovery for resources and needs.
- Landing: ExploreScreen with segmented control.
- Required controls:
  - Segment toggle: Search resources / Search needs
  - Campaign multi-select chips below search bar

2. **My Hub**
- Purpose: Personal operations navigation hub.
- Landing: MyHubScreen with a left drawer and fixed item order.
- Drawer top group (order): My resources, Received bids, Sent bids, My needs, Received claims, Sent claims.
- Drawer bottom group (order): Profile, Preferences, Contribution.
- Redundant in-page navigation buttons for resources, bids, needs, and claims are removed.

3. **Campaigns**
- Purpose: Simultaneous campaign ecosystem hub.
- Landing: MyCampaignsScreen (ongoing, upcoming, joined campaigns).
- Drill-in: CampaignDetailScreen (rules, rewards, shortcuts).

4. **Chat**
- Purpose: Peer-to-peer conversations tied to active transactions.
- Landing: ChatListScreen.

5. **Notifications**
- Purpose: Chronological transactional alerts.
- Landing: NotificationsScreen.

## Top-Right Avatar Menu Contract

Authenticated avatar menu item set:
- Log out

Required behavior:
- Avatar menu opens from top-right icon only.
- When authenticated, avatar menu contains exactly one item (Log out).
- Opening avatar menu must not reset active tab state.

## Deep Linking

### Supported deep links

```text
mutuity://explore/resources                -> ExploreScreen (resources segment)
mutuity://explore/needs                    -> ExploreScreen (needs segment)
mutuity://resource/{resourceId}            -> ResourceDetailScreen
mutuity://need/{needId}                    -> NeedDetailScreen
mutuity://campaign/{campaignId}            -> CampaignDetailScreen
mutuity://chat/{accountId}                 -> ChatDetailScreen
mutuity://notification/{notificationId}    -> NotificationDetailScreen
mutuity://account/profile                  -> MyProfileScreen (auth required)
mutuity://account/preferences              -> MyPreferencesScreen (auth required)
mutuity://account/contribution             -> MyEconomicsScreen (auth required)
```

### Anonymous deep-link guard

- If anonymous user targets an auth-required destination, route to the nearest allowed surface:
  - Prefer ExploreScreen (resources segment).
  - Show non-blocking invitation to sign in.

## Navigation State Management

Auth state contract:
- AuthContext provides:
  - authenticated (boolean)
  - account (Account or null)
  - token (string or null)
  - loading (boolean)

Root behavior:
- loading=true: show splash/loading shell.
- authenticated=true: full tab and My Hub drawer behavior plus logout-only avatar menu.
- authenticated=false: browse-only with guarded routes and prompts.

State continuity:
- Each tab retains its own stack history.
- Re-tapping active tab returns to that tab landing screen.
- Drawer open/close and avatar menu open/close preserve tab stack state.

## Localization and Labels

Navigation label keys:

```json
{
  "navigation": {
    "tabs": {
      "explore": "Explore",
      "myHub": "My Hub",
      "campaigns": "Campaigns",
      "chat": "Chat",
      "notifications": "Notifications"
    },
    "myHubDrawer": {
      "myResources": "My resources",
      "receivedBids": "Received bids",
      "sentBids": "Sent bids",
      "myNeeds": "My needs",
      "receivedClaims": "Received claims",
      "sentClaims": "Sent claims",
      "profile": "Profile",
      "preferences": "Preferences",
      "contribution": "Contribution"
    },
    "accountEntry": {
      "signIn": "Sign in",
      "register": "Create account",
      "logout": "Log out"
    }
  }
}
```

French labels must exist with equivalent meaning in fr locale files.

## Testing Strategy

- Unit tests:
  - Tab configuration and order are fixed to 5 entries.
  - Account icon mode switches by auth state.
- Integration tests:
  - Explore segmented switching and campaign chip filtering.
  - My Hub drawer item rendering and route mapping.
  - Anonymous prompts on restricted visible surfaces.
- E2E tests:
  - Logged-out account icon opens auth sheet.
  - Logged-in avatar opens logout-only menu.
  - Deep-link guard reroutes anonymous users from account screens.

## Summary

| Area | Required pattern | Implementation |
|---|---|---|
| Primary navigation | 5 bottom tabs | React Navigation BottomTabNavigator |
| Secondary navigation | My Hub left drawer | Drawer with fixed top/bottom item groups |
| Top-right avatar menu | Authentication entry/logout | Generic icon for auth entry (anonymous), logout-only menu (authenticated) |
| Screen hierarchy | Nested stacks per tab | React Navigation NativeStack |
| Auth routing | Browse-only + guards | AuthContext + root route guards |
| Deep links | URL mapping + anonymous reroute | React Navigation linking config |
| Localization | fr/en nav labels | react-i18next + locale JSON |

## Next Steps

See state-management.md for cache, session continuity, and route-intent handling across app relaunch and notification entry points.
