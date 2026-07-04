# Phase 0: Research Findings

**Feature**: Mutuity Mobile Rewrite  
**Date**: 2026-07-03

## Summary

All technical unknowns have been resolved. The rewrite adopts the proven React Native + Expo tech stack from Tope-là 1.0 and leverages the existing Mutuity GraphQL backend without requiring new API development. The code review also confirmed that several non-user-facing behaviors in Tope-là 1.0 are part of the baseline and must be carried into Mutuity Mobile instead of being treated as optional polish.

---

## Research Tasks & Decisions

### 1. Mobile Technology Stack Selection

**Research Question**: Should the mobile rewrite use the same stack as Tope-là 1.0 or explore alternatives?

**Finding**: Tope-là 1.0 mobile app uses:
- **React Native** with Expo (managed workflow)
- **Apollo Client** for GraphQL
- **React Navigation** for tab-based navigation
- **i18next** for localization (English/French)
- Jest + React Native Testing Library for unit tests

**Decision**: **Adopt the same tech stack.**

**Rationale**: 
- Minimizes friction by reusing existing patterns and libraries.
- Developers familiar with Tope-là 1.0 codebase can immediately contribute.
- Expo managed workflow simplifies iOS/Android builds and OTA updates.
- Apollo Client and React Navigation are stable, well-documented, and support offline caching (required for this feature).

**Alternatives Considered**:
- Flutter: Would require learning new language (Dart) and losing code reuse with web frontend.
- Native iOS/Android: Would double maintenance burden and require separate teams.
- **Rejected**: Both increase complexity beyond justified benefit.

---

### 2. Backend API Coverage

**Research Question**: Does the Mutuity GraphQL API (built for web) provide all data types and mutations needed for mobile needs and campaigns workflows?

**Finding**: The Mutuity backend (PostgreSQL + PostGraphile) already supports:
- Resources, needs, campaigns, bids, chat, tokens, notifications, accounts (via GraphQL)
- Role-based access control (anonymous, identified_account, admin)
- i18n infrastructure for French/English
- Mobile-agnostic GraphQL types designed for "multi-platform by design"

**Decision**: **No new GraphQL types or mutations required.**

**Rationale**: 
- The backend was explicitly designed to support both web and mobile via API-first architecture.
- Reusing existing operations reduces development time and minimizes backend changes.
- GraphQL schema is already versioned and tested.

**Dependencies**:
- Mobile relies on backend stable API availability during development and production.
- Any breaking backend changes must be coordinated with the mobile team.

---

### 3. GraphQL Code Generation for Mobile

**Research Question**: How should mobile consume GraphQL types to stay in sync with the backend?

**Finding**: The web frontend uses:
- `graphql-codegen` to generate TypeScript types from GraphQL operations
- Checked-in schema snapshot for offline type checking
- Apollo Client integration to validate operations at build time

**Decision**: **Adopt the same GraphQL codegen pipeline for mobile.**

**Rationale**: 
- Type safety across backend/frontend boundary.
- Catch schema mismatches at build time, not runtime.
- Reuse web frontend's existing codegen configuration with mobile-specific output.

**Implementation**:
- Mobile adds `codegen.cjs` configuration that points to the same backend schema.
- GraphQL operations in mobile use the same naming conventions as web (`*.gql` files).
- Generated types output to `mobile-app/src/types/graphql.generated.ts`.

---

### 4. Authentication & Session Management

**Research Question**: How should mobile securely persist and refresh authentication tokens?

**Finding**: Web frontend:
- Uses secure token storage (browser's secure storage)
- Apollo Client middleware injects auth headers on every request
- Tokens are refreshed transparently when expired

**Decision**: **Mobile will use Expo SecureStore (or react-native-secure-store) + Apollo Client middleware.**

**Rationale**:
- SecureStore is OS-native, encrypted storage (Keychain on iOS, Keystore on Android).
- Apollo Client middleware pattern is identical to web, minimizing code differences.
- Token refresh happens transparently; no mobile-specific session logic needed.

**Implementation**:
- Auth service wraps SecureStore token access.
- Apollo Client link middleware adds `Authorization: Bearer <token>` header.
- Token refresh happens on 401 response via retry link.

---

### 5. Localization (i18n)

**Research Question**: How should mobile localize French and English strings?

**Finding**: Mutuity uses i18next with:
- Separate `.json` files per language per feature (e.g., `campaigns.fr.json`, `campaigns.en.json`)
- React-i18next hooks for component-level string loading
- Web frontend strings already translated

**Decision**: **Mobile adopts the same i18next structure.**

**Rationale**: 
- Consistent localization approach across web and mobile.
- Shared string files can be maintained together (single PR for feature + translations).
- React-i18next works identically on React Native via react-native-i18next or standard react-i18next.

**Implementation**:
- Mobile copies `frontend/src/locales/fr` and `frontend/src/locales/en` structures.
- Mobile components use `useTranslation()` hook (same as web).
- Mobile's language preference stored in SecureStore; Apollo Client refetches UI on language change.

---

### 6. Offline Capability

**Research Question**: Should mobile support offline use for the needs and campaigns workflows?

**Finding**: The spec does not explicitly require offline support, but the constraint "offline-capable (caching)" is listed.

**Decision**: **Apollo Client cache provides offline reads; mutations queue when offline.**

**Rationale**: 
- Apollo Client's offline plugin (apollo-offline or apollo-link-persist-cache) handles this automatically.
- Offline reads work on cached data; mutations are queued and retry on reconnect.
- Minimal additional code needed; Apollo Client handles lifecycle.

**Implementation**:
- Enable Apollo Client persistence cache (`apollo-cache-persist`).
- Add network status detector (Expo NetInfo).
- Queued mutations shown to user with "pending" badge; retry automatically on online.

---

### 7. Client Logging and Error Capture

**Research Question**: What monitoring behavior does the existing mobile app preserve beyond visible screens?

**Finding**: Tope-là mobile includes:
- Remote client logging through GraphQL mutations
- Correlated activity identifiers for log grouping
- Optional device metadata attached to logs
- Server-driven log verbosity during session bootstrap
- Global JS error capture and GraphQL error logging

**Decision**: **Treat logging and error capture as foundational migration scope.**

**Rationale**:
- This behavior helps support and operations investigate mobile failures that are otherwise hard to reproduce.
- The legacy app already depends on this workflow, so removing it would be a regression even if the UI still works.

**Implementation**:
- Add a monitoring service with a generated activity id.
- Route important GraphQL and client errors through a shared logger.
- Preserve safe log sanitization for secrets and credentials.

---

### 8. Push Notifications, Deep Linking, and Realtime Continuity

**Research Question**: Which hidden notification behaviors exist in Tope-là mobile beyond displaying a notifications screen?

**Finding**: Tope-là mobile:
- Registers push permissions and synchronizes Expo push tokens to the backend after login
- Deep-links from notification taps into app destinations
- Tracks unread counts and refreshes account/notification state from realtime events
- Maintains realtime subscriptions for chat, notifications, and account changes

**Decision**: **Preserve push and realtime continuity as shared foundation work.**

**Rationale**:
- Notification trust depends on routing, unread state, and backend token sync, not only on rendering a feed.
- These behaviors affect daily retention and support load.

**Implementation**:
- Add push bootstrap service and backend token sync mutation.
- Define navigation/linking hooks for notification responses.
- Preserve unread continuity in shared session/app state.

---

### 9. Session Bootstrap and Minimum Version Gate

**Research Question**: What startup behaviors in Tope-là mobile shape reliability before any main screen appears?

**Finding**: The legacy app:
- Restores the stored token on launch
- Clears the session safely when the token becomes invalid or expired
- Checks a server-provided minimum client version and blocks outdated builds with update guidance

**Decision**: **Move session bootstrap and minimum-version enforcement into the early foundation phase.**

**Rationale**:
- These are startup-critical trust behaviors.
- Delaying them until late UI parity would create misleading progress.

---

### 10. Support Diagnostics and Notification Preferences

**Research Question**: Which support-oriented and user-preference features should be explicitly scoped in the rewrite?

**Finding**: Tope-là mobile includes:
- A support/report-issue flow that packages app config, version, account id, dimensions, and activity id
- Notification preference controls for immediate versus summary-style deliveries

**Decision**: **Keep support diagnostics and notification preferences in scope for the rewrite docs and tasks.**

**Rationale**:
- These features are easy to overlook because they are not core list/detail screens, but they affect supportability and continuity.
- They already exist in the mobile baseline.

---

### 11. Testing Strategy

**Research Question**: What testing tools and patterns should mobile use?

**Finding**: Tope-là 1.0 uses Jest + React Native Testing Library. Mutuity's constitution emphasizes semantic selectors and avoiding CSS framework internals.

**Decision**: **Jest + React Native Testing Library + Detox for E2E.**

**Rationale**:
- Jest and RTL are the standard for React Native testing.
- Detox provides E2E testing with proper async handling and zero flakes.
- Constitution's semantic selector discipline applies to React Native (`getByRole`, `getByLabel`, `getByTestId`).

**Implementation**:
- Unit tests for components, hooks, services.
- Integration tests for screen flows (using RTL + mocks).
- E2E tests for critical user journeys (login → create need → claim need).

---

### 12. Data Storage (Local)

**Research Question**: Should mobile store any local data beyond Apollo Client cache?

**Finding**: Needs, resources, campaigns, bids, chat, and tokens are all managed via GraphQL; no custom data storage needed.

**Decision**: **Use Apollo Client cache only; no additional local storage required.**

**Rationale**: 
- Apollo Client normalized cache is sufficient for all data access patterns.
- Avoids data sync issues between cache and local storage.
- Simpler architecture = fewer bugs.

---

### 13. Navigation Architecture

**Research Question**: How should mobile organize screens and navigation given 5+ main feature areas?

**Finding**: Tope-là 1.0 uses React Navigation BottomTabNavigator with nested stack navigation per tab.

**Decision**: **Use the same bottom-tab + nested-stack pattern.**

**Rationale**:
- Proven pattern from Tope-là 1.0; familiar to mobile users.
- Supports deep linking and complex screen hierarchies.
- Scales to 25+ screens without becoming unwieldy.

**Implementation**:
- 5 main tabs: Search, Resources, Needs, Campaigns, Bids, Chat, Notifications, Profile.
- Each tab has its own nested stack (e.g., SearchStack, ResourcesStack).
- Deep linking configured to open screens from notifications or external URLs.

---

## Assumptions Verified

✅ Mutuity backend GraphQL API is stable and accessible from mobile environment.  
✅ Existing backend GraphQL schema satisfies mobile data requirements.  
✅ React Native + Expo ecosystem supports the required offline, localization, and auth patterns.  
✅ Web frontend's GraphQL operations can be reused or extended for mobile without breaking changes.  

---

## Blockers / Dependencies

**None identified.**

All technical decisions are grounded in proven patterns from:
- Tope-là 1.0 mobile implementation
- Mutuity web frontend (frontend/ folder)
- Existing backend infrastructure

---

## Next Phase

Proceed to Phase 1: Design & Contracts (data model, GraphQL operations, navigation, state management).
