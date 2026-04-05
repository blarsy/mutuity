# Research Notes: Tope-là Migration And Mutuity Merge

## Key decisions

### 1. Clean-room redevelopment beats direct merge
- **Decision**: Rebuild from reverse-engineered specs rather than merging the two codebases directly.
- **Why**: Tope-là is product-rich but structurally less systematic; Mutuity is cleaner but not yet feature-complete for the target unified platform.
- **Consequence**: Reuse ideas, assets, and selected code patterns, but do not treat the legacy schema as the target architecture.

### 2. Tope-là is the product reference; Mutuity is the engineering reference
- **Decision**: Preserve Tope-là’s UX, look & feel, and broader scope while using Mutuity’s SpecKit + AI workflow and stronger validation discipline.
- **Why**: This keeps the product recognizable without inheriting avoidable legacy complexity.

### 3. Keep `resources` and `needs` distinct at first
- **Decision**: Do not force a single abstract listing model in MVP v1.
- **Why**: Offers and needs are complementary, but they still drive different user expectations and workflows.
- **Consequence**: Unify search, messaging, and account models first; revisit deeper abstraction later.

### 4. Prefer a single-version target schema
- **Decision**: The new unified platform should use a clean target schema and migration path, not the legacy multi-version database strategy seen in Tope-là.
- **Why**: It reduces drift, test complexity, and rollout confusion.

### 5. Preserve visual parity through evidence, not guesswork
- **Decision**: Use screenshots, assets, Storybook references, and live behavior capture to preserve look & feel.
- **Why**: The UI can be rebuilt cleanly while staying recognizably Tope-là.

## Early evidence from Tope-là audit

- `app/` contains an Expo / React Native mobile app.
- `backoffice/` contains a Next.js-based web app and support/admin flows.
- `webapi/` contains an Express + PostGraphile backend with PostgreSQL-backed business logic.
- The legacy product includes resources/offers, bids or responses, messaging, notifications, campaigns, and organization-facing flows.

## Reuse candidates

- PostGraphile server patterns
- Apollo client setup
- MUI theme or visual tokens
- Expo/mobile shell patterns
- push notification and media-upload integration patterns
- selected SQL and RLS ideas where they remain coherent

## Rewrite candidates

- legacy schema/version-routing assumptions
- inconsistent naming or duplicated domain concepts
- weakly tested flows
- coupled realtime logic that should be isolated behind cleaner feature boundaries