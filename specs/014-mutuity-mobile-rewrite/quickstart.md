# Quickstart: Mutuity Mobile Development

**Feature**: Mutuity Mobile Rewrite  
**Last Updated**: 2026-07-29

This guide walks you through setting up and running the Mutuity mobile app locally.

## Current Status

Phases 1–6 are complete. The mobile app has:

- Full project scaffolding, TypeScript strict mode, ESLint/Prettier, Jest/RNTL
- Apollo Client + GraphQL codegen with schema snapshot validation
- Auth token persistence (SecureStore), session bootstrap, language persistence
- i18n with en/fr namespaces (common, us1, us2, us3, us4)
- Root navigation shell with bottom tabs (Explore, My Hub, Campaigns, Chat, Notifications)
- Shared UI state patterns (LoadingState, EmptyState, ErrorState)
- Network/offline status service, push notification bootstrap, monitoring
- Minimum-version gate, support diagnostics, update-required screen
- All US1 screens ported: Search resources, My resources, My bids, Chat, Notifications, My profile, My preferences, Contribution
- All US2 screens ported: Search needs, My needs, Edit need, My claims
- All US3 screens ported: My campaigns, Campaign detail, Campaign moderation
- US4 cross-cutting continuity: language propagation, session recovery, notification deep-link, support flow, version gate
- 25 US4 acceptance tests, 13 E2E smoke tests (6 suites), all passing
- Storybook for reusable components

Phase 7 (E2E smoke matrix, CI, polish) is in progress.

---

## Prerequisites

- **Node.js** 18+ and npm
- **Expo CLI** (`npm install -g expo-cli`)
- **iOS Simulator** (macOS + Xcode) or **Android Emulator** (Android Studio)
- **Git** and access to the mutuity repository
- A running instance of the Mutuity backend (or access to a development backend URL)

---

## Project Structure

```
mobile-app/
├── src/
│   ├── screens/                  # Feature-specific screens
│   │   ├── auth/                 # Login, Register, ForgotPassword
│   │   ├── bids/                 # ReceivedBids, SentBids
│   │   ├── campaigns/            # MyCampaigns, CampaignDetail
│   │   ├── chat/                 # ChatList, ChatDetail
│   │   ├── claims/               # MyClaims
│   │   ├── economics/            # MyEconomics (Contribution)
│   │   ├── needs/                # SearchNeeds, MyNeeds, EditNeed
│   │   ├── notifications/        # NotificationsScreen
│   │   ├── profile/              # MyProfile, MyPreferences, SupportScreen
│   │   ├── resources/            # SearchResources, MyResources, EditResource
│   │   └── system/               # UpdateRequiredScreen
│   ├── components/               # Reusable UI components
│   │   ├── primitives/           # AppCard, PrimaryButton, ScreenContainer, etc.
│   │   ├── state/                # LoadingState, EmptyState, ErrorState
│   │   ├── forms/                # PrimaryField
│   │   └── icons/                # TopelaBottomTabIcons
│   ├── services/
│   │   ├── graphql/              # Apollo client, operations, adapters, codegen
│   │   ├── auth/                 # Token storage, session management, AuthProvider
│   │   ├── network/              # useNetworkStatus
│   │   ├── notifications/        # Push token sync, notification routing
│   │   ├── realtime/             # Session subscriptions
│   │   ├── support/              # Diagnostics, report issue
│   │   ├── app/                  # Version check
│   │   └── monitoring/           # Activity correlation, logger
│   ├── i18n/                     # i18next config, en/fr locale files
│   ├── navigation/               # AppNavigator, US1/US2/US3 navigators, mainScreenRegistry
│   ├── theme/                    # Design tokens, fonts
│   ├── App.tsx                   # Root component
│   └── types/                    # TypeScript definitions
├── tests/
│   ├── integration/              # Screen flow acceptance tests (US1-US4)
│   ├── e2e/                      # E2E smoke tests (S1-S6)
│   ├── contract/                 # GraphQL contract tests
│   ├── setup.ts                  # Jest setup with mocks
│   ├── TESTING_SELECTORS.md      # Semantic selector policy
│   └── utils/                    # selectorPolicy helpers
├── .storybook/                   # Storybook configuration
├── app.config.ts                 # Expo configuration
├── package.json
├── tsconfig.json
├── jest.config.ts
└── codegen.cjs / codegen.schema.cjs
```

---

## 1. Install

```bash
cd /Users/bertrandlarsy/code/mutuity/mobile-app
npm install
```

---

## 2. Environment Configuration

The GraphQL client reads `EXPO_PUBLIC_GRAPHQL_URL` from the environment and falls back to `http://localhost:5000/graphql`.

```bash
export EXPO_PUBLIC_GRAPHQL_URL=http://localhost:5000/graphql
```

- `EXPO_PUBLIC_GRAPHQL_URL`: URL of the Mutuity backend GraphQL endpoint.

---

## 3. Start the Development Server

```bash
npm start
```

Expo CLI will display a QR code and options:

- Press `i` to open in iOS Simulator (requires Xcode)
- Press `a` to open in Android Emulator (requires Android Studio)
- Scan QR code with Expo Go app on physical device

---

## 4. GraphQL Code Generation

```bash
npm run graphql:schema   # Fetch latest schema from backend
npm run graphql:codegen  # Generate types and typed document nodes
npm run typecheck        # Full chain: schema → codegen → tsc --noEmit
```

The CI enforces zero codegen drift via `git diff --exit-code`.

---

## 5. Running Tests

### All Tests

```bash
npm test
```

### Integration Acceptance Tests

```bash
npm run test:integration
```

Runs US1-US4 acceptance tests with semantic selectors only.

### E2E Smoke Tests

```bash
npx jest --no-coverage tests/e2e/
```

Runs the 6-smoke E2E matrix (S1-S6) covering main navigation, search, edit, offline exception, needs create/claim, and campaign pending.

### Typecheck

```bash
npm run typecheck
```

Runs GraphQL schema refresh, codegen, and TypeScript compilation.

### UI Contract Gate

```bash
npm run guard:ui-contract-gate
```

Blocks port tasks without approved UI contracts.

---

## 6. Localization (i18n)

All user-facing strings use i18next keys across namespaces: `common`, `us1`, `us2`, `us3`, `us4`.

To add a string:

1. Add the key to the appropriate namespace in `src/i18n/locales/en/`:
   ```json
   { "myNewKey": "My new label" }
   ```

2. Add French translation to `src/i18n/locales/fr/`:
   ```json
   { "myNewKey": "Mon nouveau libellé" }
   ```

3. Use in component:
   ```typescript
   import { useTranslation } from 'react-i18next';
   const { t } = useTranslation();
   // t('myNewKey', { defaultValue: 'My new label' })
   ```

Language preference is persisted via SecureStore and restored on app relaunch.

---

## 7. Storybook

```bash
npm run storybook          # Start Storybook dev server
npm run storybook:ios      # Run Storybook on iOS simulator
npm run storybook:android  # Run Storybook on Android emulator
```

Reusable component stories exist for LoadingState, EmptyState, ErrorState, and PrimaryField.

---

## 8. CI Pipelines

| Workflow | File | Purpose |
|---|---|---|
| Mobile Typecheck | `.github/workflows/mobile-typecheck.yml` | GraphQL codegen drift + TypeScript |
| Mobile Smoke | `.github/workflows/mobile-smoke.yml` | Integration + E2E smoke + typecheck + UI gate |
| Mobile Storybook | `.github/workflows/mobile-storybook.yml` | Storybook build verification |

---

## 9. Testing Selector Policy

All tests must use semantic selectors only:
- `getByRole`, `getByLabelText`, `getByPlaceholderText`
- `getByTestId` only as fallback

See `tests/TESTING_SELECTORS.md` for the full policy.

## 9. Common Tasks

### Clear Cache

```bash
npm start -- --reset-cache
```

### Update Dependencies

```bash
npm update
npm audit fix
```

### Check TypeScript Errors

```bash
npm run typecheck
```

### Lint Code

```bash
npm run lint
```

---

## 10. Connecting to Backend

The app connects to the backend via the GraphQL endpoint specified in `.env` (EXPO_PUBLIC_GRAPHQL_URL).

### Local Backend Setup

If running the backend locally:

```bash
# In /path/to/mutuity/backend
docker compose up
# Backend runs on http://localhost:5000/graphql
```

Then set:
```
EXPO_PUBLIC_GRAPHQL_URL=http://localhost:5000/graphql
```

### Remote Backend

For a deployed backend (staging, production):

```
EXPO_PUBLIC_GRAPHQL_URL=https://api.staging.mutuity.org/graphql
```

---

## 11. Troubleshooting

### "Cannot find module 'graphql'"

```bash
npm install
```

### Simulator/Emulator not launching

Ensure Xcode (iOS) or Android Studio (Android) is installed and configured:

```bash
xcode-select --install        # macOS
echo $ANDROID_HOME            # Check Android SDK path
```

### Network errors connecting to backend

1. Verify `.env` GRAPHQL_URL is correct.
2. Check backend is running: `curl https://<backend-url>/graphql`
3. Ensure mobile device/simulator can reach backend (firewall, proxy, etc.).

### TypeScript errors after backend changes

Regenerate types:

```bash
npm run graphql:schema
npm run graphql:codegen
npm run typecheck
```

---

## 12. Project Conventions

- **File naming**: PascalCase for components (Screen.tsx, Button.tsx), camelCase for utilities/services.
- **Localization**: All user-facing strings use i18n keys; no hardcoded text.
- **GraphQL**: Use codegen-generated types; avoid `any`.
- **Testing**: Each component and hook has unit tests; critical flows have E2E tests.
- **Commits**: Follow conventional commit style: `feat(needs): add need search`, `fix(auth): token refresh`, etc.

---

## 13. Next Steps

1. **Familiarize yourself** with the codebase:
   - Review `src/services/graphql/client.ts` for the current Apollo scaffold.
   - Review `src/services/graphql/operations/index.ts` for the current GraphQL export surface.
   - Review the feature docs under `specs/014-mutuity-mobile-rewrite/` for the planned auth, monitoring, push, and screen work.

2. **Start developing** your assigned feature (from `/speckit.tasks`).

3. **Write tests** as you go (unit, integration, E2E as needed).

4. **Test on device** before submitting a pull request:
   ```bash
   npm run build:e2e && npm run e2e
   ```

5. **Check types and lints**:
   ```bash
   npm run typecheck && npm run lint
   ```

---

## Support & Questions

- Backend GraphQL schema: `<backend-url>/graphql` (GraphiQL explorer)
- Constitution: `/specs/014-mutuity-mobile-rewrite/.specify/memory/constitution.md`
- Web frontend patterns: `frontend/src/` (same patterns apply to mobile)

Happy coding!
