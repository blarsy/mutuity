# Contract: Navigation Architecture

**Feature**: Mutuity Mobile Rewrite
**Date**: 2026-07-05

## Overview

The mobile app uses React Navigation with a fixed 5-tab bottom navigator for core workflows and a top-right account menu anchor (drawer or modal sheet) for account and settings surfaces.

This contract supersedes the previous multi-tab profile/settings model.

## Top-Level Navigation Paradigm

- Bottom navigation has exactly 5 tabs in this order: Explore, My Hub, Campaigns, Chat, Notifications.
- Account surfaces are not exposed as a bottom tab.
- The top-right account anchor appears globally on main-shell screens.

Authentication-sensitive account anchor behavior:
- Logged out: icon is a generic silhouette; tap opens Sign In / Registration sheet.
- Logged in: icon is the user avatar; tap opens Account Menu drawer/sheet.

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
- Navigation placement is explicit (tab, nested stack, or account menu section)
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
| My resources | My Hub tab -> My listings section -> View all |
| My needs | My Hub tab -> My listings section -> View all |
| My bids | My Hub tab -> Active bids section |
| My claims | My Hub tab -> Active claims section |
| Chat | Chat tab landing |
| Notifications | Notifications tab landing |
| My campaigns | Campaigns tab landing |
| My profile | Account menu -> Profile |
| My preferences | Account menu -> Preferences |
| Contribution | Account menu -> Contribution |

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
│   │   │   ├── MyHubScreen (landing dashboard)
│   │   │   ├── MyResourcesScreen
│   │   │   ├── MyNeedsScreen
│   │   │   ├── MyBidsScreen
│   │   │   ├── MyClaimsScreen
│   │   │   ├── ArchivedBidsScreen
│   │   │   ├── ArchivedClaimsScreen
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
│   └── AccountMenuOverlay (anchored from header right)
│       ├── AccountMenuSheet
│       ├── MyProfileScreen
│       ├── MyPreferencesScreen
│       └── MyEconomicsScreen
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
- Purpose: Personal operations dashboard.
- Landing: MyHubScreen with fixed section order:
  - Global actions: Add Resource, Add Need
  - My listings: My resources and My needs previews with View all links
  - Active bids list with item actions (View item, Chat, Cancel)
  - Active claims list with item actions (View item, Chat, Cancel)
  - Archive links for inactive bids and claims

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

## Account Menu Contract

Account menu sections:
- Profile (view/edit profile and verification state)
- Contribution (impact, statistics, reward history)
- Preferences (localization, privacy, app settings)

Required behavior:
- Account menu opens from top-right icon only.
- Account menu is available from all main-shell tabs.
- Opening account menu must not reset active tab state.

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
- authenticated=true: full tab and account menu behavior.
- authenticated=false: browse-only with guarded routes and prompts.

State continuity:
- Each tab retains its own stack history.
- Re-tapping active tab returns to that tab landing screen.
- Account menu open/close preserves tab stack state.

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
    "accountMenu": {
      "profile": "Profile",
      "contribution": "Contribution",
      "preferences": "Preferences",
      "signIn": "Sign in",
      "register": "Create account"
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
  - My Hub actions and section rendering.
  - Anonymous prompts on restricted visible surfaces.
- E2E tests:
  - Logged-out account icon opens auth sheet.
  - Logged-in avatar opens account menu.
  - Deep-link guard reroutes anonymous users from account screens.

## Summary

| Area | Required pattern | Implementation |
|---|---|---|
| Primary navigation | 5 bottom tabs | React Navigation BottomTabNavigator |
| Secondary account navigation | Top-right account menu overlay | Drawer or modal sheet anchored from header right |
| Screen hierarchy | Nested stacks per tab | React Navigation NativeStack |
| Auth routing | Browse-only + guards | AuthContext + root route guards |
| Deep links | URL mapping + anonymous reroute | React Navigation linking config |
| Localization | fr/en nav labels | react-i18next + locale JSON |

## Next Steps

See state-management.md for cache, session continuity, and route-intent handling across app relaunch and notification entry points.
