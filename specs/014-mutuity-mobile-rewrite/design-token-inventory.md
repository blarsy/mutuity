# Mutuity Mobile Design Token Inventory (Imported from Tope-la)

Status: Frozen for initial porting pass (US1-US2).

## Source Reference (Tope-la)

- Color constants: `/Users/bertrandlarsy/code/symmetrical-broccoli/app/components/layout/constants.ts`
- Theme and typography setup: `/Users/bertrandlarsy/code/symmetrical-broccoli/app/lib/utils.ts` (`getTheme`, `useCustomFonts`)
- Theme provider bootstrap: `/Users/bertrandlarsy/code/symmetrical-broccoli/app/components/mainViews/Start.tsx`

## Brand Colors (Phase 1 freeze)

- `brand.primary`: `#ff4401`
- `brand.primaryContainer`: `#fef0e3`
- `brand.deleted`: `#E0E0E0`
- `brand.backdrop`: `rgba(227,94,30,0.3)`

## Core Radius and Spacing (Phase 1 freeze)

- `radius.sm`: `8`
- `radius.md`: `12`
- `radius.lg`: `16`
- `spacing.xs`: `4`
- `spacing.sm`: `8`
- `spacing.md`: `12`
- `spacing.lg`: `16`
- `spacing.xl`: `24`

## Typography Strategy (Phase 1 freeze)

- Keep React Native Paper MD3 type scale.
- Keep portable fallback family in Mutuity now (`System`).
- Add Tope-la font assets in a dedicated follow-up task, then switch token families to:
  - title: `LTMakeup-Regular.otf`
  - text: `renner-book.otf`

## Component Primitive Policy

All new screens must consume wrapper primitives instead of direct library controls:

- `PrimaryButton`
- `AppTextField`
- `AppCard`
- `ScreenContainer`

This keeps styling consistent and allows future UI-library replacement with low churn.
