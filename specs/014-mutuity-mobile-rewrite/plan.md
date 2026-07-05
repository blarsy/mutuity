# Implementation Plan: Mutuity Mobile Rewrite

**Branch**: `014-mutuity-mobile-rewrite` | **Date**: 2026-07-03 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/014-mutuity-mobile-rewrite/spec.md`

## Summary

Rewrite the Tope-là mobile app (React Native + Expo) as Mutuity Mobile by preserving all existing mobile functionality (resources, bids, chat, notifications, tokens, profile) and integrating the new needs and campaign workflows from the Mutuity backend. The rewrite must also preserve the operational continuity behaviors already present in Tope-là mobile, especially session bootstrap, push token synchronization, notification deep linking, minimum-version gating, support diagnostics, and client-side error logging.

## Current Implementation Snapshot

- The mobile workspace is still near-greenfield.
- Shared setup exists, and the only application code currently present under `mobile-app/src` is the initial GraphQL client scaffold and the GraphQL operations index.
- Planning and task sequencing must therefore assume that auth, navigation, monitoring, notifications, and screen parity work are still to be implemented.

## UI-First Delivery Strategy

This feature uses a two-step per-screen workflow.

Step A: UI rework and approval
- Rework the target main screen UI based on current Mutuity frontend behavior.
- Validate navigation placement, states, core actions, and fr/en labels.
- Mark the screen as UI Approved.

Step B: Porting from Tope-là mobile
- Port and integrate the screen only after UI Approved status.
- Validate acceptance scenarios from the feature spec.

Hard Gate
- No implementation or porting starts for a main screen without UI Approved status for that screen.

### Canonical Main Screen Tracker

| Main Screen | UI Rework Drafted | UI Approved | Porting Started | Porting Completed | Acceptance Tested |
|---|---|---|---|---|---|
| Search resources | No | No | No | No | No |
| Search needs | No | No | No | No | No |
| My resources | No | No | No | No | No |
| My needs | No | No | No | No | No |
| My bids | No | No | No | No | No |
| My claims | No | No | No | No | No |
| Chat | No | No | No | No | No |
| Notifications | No | No | No | No | No |
| My campaigns | No | No | No | No | No |
| My profile | No | No | No | No | No |
| My preferences | No | No | No | No | No |
| My economics | No | No | No | No | No |

### Anonymous Access Behavior Matrix

| Main Screen | Anonymous behavior |
|---|---|
| Search resources | Allowed |
| Search needs | Allowed |
| My resources | Displays a message inviting to log in or create an account |
| My needs | Displays a message inviting to log in or create an account |
| My bids | Displays a message inviting to log in or create an account |
| My claims | Displays a message inviting to log in or create an account |
| Chat | Displays a message inviting to log in or create an account |
| Notifications | Displays a message inviting to log in or create an account |
| My campaigns | Displays a message inviting to log in or create an account |
| My profile | Not accessible through any UI action when no user is logged in |
| My preferences | Not accessible through any UI action when no user is logged in |
| My economics | Not accessible through any UI action when no user is logged in |

Rule:
- Every canonical main screen except My profile, My preferences, and My economics must define explicit anonymous behavior in its UI contract.

## Technical Context

**Language/Version**: TypeScript 5.x, React Native (Expo managed workflow)  
**Primary Dependencies**: React Native, Expo, Apollo Client, React Navigation, react-native-paper, i18next, Expo SecureStore, Expo Notifications  
**Storage**: PostgreSQL (via Mutuity backend GraphQL API); Apollo Client cache on-device  
**Testing**: Jest (unit), React Native Testing Library, Detox or Maestro (E2E)  
**Target Platform**: iOS 13+, Android 11+  
**Project Type**: Mobile app (React Native + Expo)  
**Performance Goals**: App startup <2s, smooth 60 fps UI on mid-range devices, GraphQL queries <500ms p95  
**Constraints**: Offline-capable (caching), <150 MB bundle size, support French/English from day one, preserve Tope-là operational behaviors that users and support depend on  
**Scale/Scope**: Tabs are migration containers with 12 canonical screens, 25+ total screens, operational foundation services for logging/session/push/support/update control, and 40+ GraphQL operations reused from the web backend over an estimated 8 weeks.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

✅ **Multi-platform by design**: Rewrite adds mobile to the Mutuity platform, using the same backend API and data model as the web frontend.  
✅ **API-first**: Mobile consumes the GraphQL API built for web; no mobile-specific business logic.  
✅ **Separation of concerns**: Apollo Client caches GraphQL responses; business logic remains in PostgreSQL and GraphQL resolvers.  
✅ **Security defaults**: Mobile uses the same authentication token and role-based access control as web.  
✅ **French-speaking community first**: i18n support (fr/en) built in from component creation.  

**Result**: No constitution violations. Proceed to Phase 0.

### Planned Mobile Workspace Structure

```text
mobile-app/
├── src/
│   ├── screens/                  # Feature screens organized by domain
│   │   ├── resources/            # Resource discovery and management
│   │   ├── needs/                # Need creation, search, claiming
│   │   ├── campaigns/            # Campaign creation and participation
│   │   ├── bids/                 # Bidding
│   │   ├── chat/                 # Conversations
│   │   ├── notifications/        # Activity feed
│   │   ├── profile/              # Account and settings
│   │   └── auth/                 # Login, signup, password reset
│   ├── components/               # Reusable UI components
│   ├── services/
│   │   ├── graphql/              # Apollo client setup, hooks
│   │   ├── auth/                 # Session and token management
│   │   └── navigation/           # Navigation state and utilities
│   ├── i18n/                     # Localization (fr, en)
│   ├── navigation/               # React Navigation configuration
│   ├── App.tsx                   # Root component
│   └── types/                    # TypeScript shared types
├── tests/
│   ├── unit/                     # Component and utility tests
│   ├── integration/              # Screen and flow tests
│   └── e2e/                      # End-to-end user journeys
├── ios/                          # iOS native configuration
├── android/                      # Android native configuration
├── app.json                      # Expo configuration
├── package.json
└── tsconfig.json
```

**Structure Decision**: The mobile app uses a feature-organized screen structure with centralized services and components, matching the web frontend's pattern for consistency and maintainability.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|

No complexity violations. The architecture aligns with the constitution:
- Mobile rewrite uses the **same GraphQL API** as the web frontend (no duplicated business logic).
- Apollo Client patterns match the existing web frontend infrastructure.
- No new database tables or authentication systems required.
- i18n setup reuses the existing Mutuity localization framework.

---

# Phase 0: Research & Clarifications

## Research Tasks

1. **Tope-là 1.0 Mobile Code Review** ✓
   - **Finding**: React Native + Expo framework, Apollo Client, React Navigation.
   - **Decision**: Adopt same tech stack for Mutuity Mobile rewrite to reduce friction and leverage existing patterns.

1a. **Tope-là 1.0 Operational Continuity Inventory** ✓
   - **Finding**: The existing app includes remote client logging, session bootstrap with server-driven log level, push registration and sync, notification deep linking, minimum-version gating, support diagnostics, and notification preference controls.
   - **Decision**: Treat these as first-class migration scope rather than incidental polish.

2. **Mutuity Backend API Coverage** ✓
   - **Finding**: GraphQL API (via PostGraphile) already supports resources, needs, campaigns, bids, chat, tokens, and accounts. Mobile will consume the same API as the web frontend.
   - **Decision**: No new GraphQL types or mutations required; reuse existing backend.

3. **Needs and Campaigns GraphQL Operations**
   - **Finding**: Web frontend already uses `MyCampaignsConnection`, `CreateCampaignMutation`, and needs queries. Mobile will reuse these operations.
   - **Decision**: GraphQL codegen pipeline (same as web) will generate TypeScript types for mobile operations.

4. **i18n and Localization**
   - **Finding**: Mutuity uses i18next for web; mobile app needs same patterns.
   - **Decision**: Add i18n configuration to mobile app alongside web configuration.

5. **Authentication and Session Management**
   - **Finding**: Web frontend uses secure token storage and Apollo Client link middleware. Mobile must match.
   - **Decision**: Use react-native-secure-store or Expo SecureStore for token persistence; Apollo Client middleware for auth headers.

6. **Mobile Monitoring and Support Diagnostics**
   - **Finding**: Tope-là mobile does not rely only on console logs; it correlates remote client logs and support reports with activity/session metadata.
   - **Decision**: Add monitoring, diagnostics, and support-report scope to the shared foundation before screen parity work expands.

## Output: research.md

**All unknowns resolved; no NEEDS CLARIFICATION markers remain.**

---

# Phase 1: Design & Contracts

## 1. Data Model (from User Stories)

### User Story 1: Daily Mobile Use Parity
- **Entities**: Resource, ResourceImage, ResourceCategory, Bid, Chat, Notification, Token, Account, Session
- **Relationships**: Account owns Resources, sends Bids, creates Chat messages
- **Lifecycle**: Resource (created → active → claimed/completed/expired), Bid (sent → accepted/rejected), Chat (open conversation history)

### User Story 2: Needs Workflow
- **Entities**: Need, NeedClaim
- **New fields**: Need (title, description, location, intensity, expiry, proposedTokenAmount, created/updated timestamps)
- **Relationships**: Account owns Needs; Account can Claim a Need (one claim per need)
- **Lifecycle**: Need (created → open → claimed → closed), NeedClaim (created → fulfilled/rejected)

### User Story 3: Campaign Participation and Moderation
- **Entities**: Campaign, CampaignNeed, CampaignResource, CampaignModerationNote
- **New fields**: Campaign (title, description, creatorAccountId, moderationStatus, startAt, airdropAt, endAt, rewardsMultiplier, airdropAmount)
- **Relationships**: Campaign owns CampaignNeeds and CampaignResources; Campaign belongs to creator; moderationStatus determines visibility
- **Lifecycle**: Campaign (created → pending validation → approved → active/ended), CampaignNeed/CampaignResource (pending → accepted/rejected)

### User Story 4: Mobile Trust and Continuity
- **Session state**: Authenticated user, preferred language, notification preferences, profile data, notification routing state
- **Offline capability**: Apollo Client cache keeps recent resources, needs, and campaigns available when offline
- **Localization**: All UI strings keyed for i18next (fr/en translations)
- **Operational continuity**: Activity/log correlation id, push token state, minimum client version status, support diagnostics snapshot

## 2. Interface Contracts

### GraphQL Operations Contract

Mobile app will consume the following GraphQL operations (already defined in web frontend):

**Resources**:
- `SearchResources(location, distance, categoryIds, orderBy)` → ResourcesConnection
- `CreateResource(input: ResourceInput)` → Resource
- `UpdateResource(id, input: ResourceInput)` → Resource
- `DeleteResource(id)` → Boolean

**Needs**:
- `SearchNeeds(location, distance, intensity, orderBy)` → NeedsConnection
- `CreateNeed(input: NeedInput)` → Need
- `UpdateNeed(id, input: NeedInput)` → Need
- `ClaimNeed(needId, claimInput: NeedClaimInput)` → NeedClaim

**Campaigns**:
- `CreateCampaign(input: CampaignInput)` → Campaign
- `GetCampaignById(campaignId)` → Campaign
- `AllCampaigns(condition: {creatorAccountId, moderationStatus}, orderBy)` → CampaignsConnection
- `ApproveCampaign(campaignId)` → Campaign [admin only]
- `CreateCampaignNeed(input: CampaignNeedInput)` → CampaignNeed
- `CreateCampaignResource(input: CampaignResourceInput)` → CampaignResource

**Chat, Tokens, Notifications, Bids**: Reuse existing web frontend queries/mutations.

### Navigation Structure

Main tab navigation (React Navigation BottomTabNavigator):
1. **Search** → Browse resources, view detail, send bid
2. **Resources** → Manage own resources, create resource
3. **Needs** → Browse needs, create need, manage claims
4. **Campaigns** → Browse campaigns, create campaign, moderate items
5. **Bids** → View sent/received bids, track settlement
6. **Chat** → Conversations, message history
7. **Notifications** → Activity feed, mark read/unread
8. **Profile** → Account settings, preferences, tokens, language

### State Management Pattern

- **Apollo Client cache**: Single source of truth for all GraphQL data; normalized cache updates after mutations
- **Local state**: Navigation state, UI flags (modals, loading), form state (React Hook Form or Formik), notification routing intents, update-required gate
- **Offline state**: Apollo Client offline plugin tracks network status; queued mutations retry on reconnect
- **Session state**: Auth token stored in SecureStore; refreshed token propagated via Apollo Client link; invalid sessions cleared safely
- **Operational state**: Push permission and synced token, diagnostics context, remote logging severity, unread counts, minimum supported version result

## 3. Quickstart Guide

See [quickstart.md](quickstart.md) for setup, development, and deployment instructions.

---

## Output: Phase 1 Design Artifacts

✅ **data-model.md**: Entity definitions and relationships  
✅ **contracts/**: GraphQL operations, navigation structure, state management patterns  
✅ **quickstart.md**: Setup and development workflow  

---

## Constitution Re-Check (Post-Design)

✅ **All principles remain satisfied**:
- Mobile is a thin client consuming the shared GraphQL API.
- No mobile-specific business logic; all rules stay in PostgreSQL and GraphQL resolvers.
- i18n and security model unchanged from web.
- Offline capability via Apollo Client cache (standard pattern).

**Gate Result**: PASS. Ready for Phase 2 (task decomposition).

---

## Next Steps

Run `/speckit.tasks` to break the Phase 1 design into concrete, prioritized implementation tasks.