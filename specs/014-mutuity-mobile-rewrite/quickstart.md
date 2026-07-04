# Quickstart: Mutuity Mobile Development

**Feature**: Mutuity Mobile Rewrite  
**Last Updated**: 2026-07-04

This guide walks you through setting up and running the Mutuity mobile app locally.

## Current Status

This feature is still at an early implementation stage.

- Shared setup and quality-tooling scaffolding exist.
- Under `mobile-app/src`, only the initial GraphQL client scaffold and GraphQL operations index are currently implemented.
- Auth bootstrap, navigation shell, push handling, monitoring, support diagnostics, and screen ports are still planned work.

---

## Prerequisites

- **Node.js** 18+ and npm/yarn
- **Expo CLI** (`npm install -g expo-cli`)
- **iOS Simulator** (macOS + Xcode) or **Android Emulator** (Android Studio)
- **Git** and access to the mutuity repository
- A running instance of the Mutuity backend (or access to a development backend URL)

---

## Project Structure

Target structure for the feature:

```
mobile-app/
├── src/
│   ├── screens/                  # Feature-specific screens
│   ├── components/               # Reusable UI components
│   ├── services/
│   │   ├── graphql/              # Apollo setup, hooks, codegen output
│   │   ├── auth/                 # Token storage, session management
│   │   └── navigation/           # Navigation utilities
│   ├── i18n/                     # Localization config and translations
│   ├── navigation/               # React Navigation setup
│   ├── App.tsx                   # Root component
│   └── types/                    # TypeScript definitions
├── tests/
│   ├── unit/                     # Component and utility tests
│   ├── integration/              # Screen flow tests
│   └── e2e/                      # End-to-end tests (Detox)
├── app.json                      # Expo configuration
├── package.json
├── tsconfig.json
├── jest.config.ts
└── .env.example                  # Environment variables template
```

---

## 1. Install

```bash
cd /Users/bertrandlarsy/code/mutuity/mobile-app
npm install
```

---

## 2. Environment Configuration

The current GraphQL client reads `EXPO_PUBLIC_GRAPHQL_URL` from the environment and falls back to `http://localhost:5000/graphql`.

At this stage, use an exported shell variable or your preferred Expo environment mechanism:

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
- Press `w` to open in web (React Native Web)
- Scan QR code with Expo Go app on physical device

---

## 4. Hot Reloading & Debugging

- **Fast Refresh**: Save a file to see changes instantly (in most cases).
- **Debugger**: Open Flipper (from Android Studio/Xcode) to inspect network, logs, and React components.
- **Console Logs**: Visible in terminal when you run `npm start`.

---

## 5. GraphQL Code Generation

GraphQL codegen is part of the planned foundation but is not fully wired into the mobile workspace yet.

Target commands once the remaining foundation tasks land:

```bash
npm run graphql:schema   # Fetch latest schema from backend
npm run graphql:codegen  # Generate types
npm run typecheck        # Verify TypeScript types
```

Do not expect these commands to work until the corresponding codegen tasks are completed.

---

## 6. Running Tests

### Unit Tests

```bash
npm test
```

Runs Jest on component and utility tests.

### Integration Tests

```bash
npm run test:integration
```

Tests screen flows and data fetching.

### E2E Tests

```bash
npm run e2e              # Run Detox tests
```

The `e2e` script exists in `package.json`, but the full E2E setup is still part of the planned feature work.

---

## 7. Building for iOS/Android

Native build and release automation are still part of the planned foundation and polish work.

### Build with Expo (recommended for development)

```bash
eas build --platform ios
eas build --platform android
```

Treat these as target workflows, not a guaranteed current-day path.

### Local Build (advanced)

Local platform-specific build scripts are not yet wired in `mobile-app/package.json`.
Add them only after the native build path is intentionally configured.

---

## 8. Localization (i18n)

All user-facing strings use i18next keys. To add a string:

1. Add the key to `src/i18n/locales/en/features.json`:
   ```json
   {
     "needs": {
       "createButton": "Create Need"
     }
   }
   ```

2. Add French translation to `src/i18n/locales/fr/features.json`:
   ```json
   {
     "needs": {
       "createButton": "Créer un besoin"
     }
   }
   ```

3. Use in component:
   ```typescript
   import { useTranslation } from 'react-i18next';

   export function NeedsScreen() {
     const { t } = useTranslation();
     return <Button title={t('needs.createButton')} />;
   }
   ```

---

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
