# Implementation Plan: Public Pages (Needs, Campaigns, Accounts)

## Goal

Ship production-ready public detail pages for needs, campaigns, and accounts with SSR metadata, explicit lifecycle-state rendering (including deleted-visible), and auth-aware contextual actions where applicable.

## Phase 1 - Data and Routing Foundation

- Confirm GraphQL fields required for public need, campaign, and account detail views.
- Add/adjust public detail queries with policy-safe field selection.
- Create page-level data-loading utilities for SSR route handling.
- Define shared availability-state mapper for active/expired/deleted-visible/unavailable outcomes.
- Align deleted-visible semantics with feature `011-account-deletion-anonymization` contract.

Exit criteria:

- Each route can resolve data model or not-found/unavailable model server-side.

## Phase 2 - Page UI Delivery

- Implement production page UI for `/needs/[needId]`.
- Implement production page UI for `/campaigns/[campaignId]`.
- Implement production page UI for `/accounts/[accountId]`.
- Reuse shared visual primitives (`ListingHeader`, rich text renderer, state chips/alerts) for consistency.

Exit criteria:

- Placeholder UI removed from need/account detail pages.
- Campaign public detail page exists and renders complete content.

## Phase 3 - Metadata and Action Contracts

- Add SSR metadata generation for all three routes.
- Implement metadata mapping with mandatory campaign `description` as sole campaign source and plain-text sanitization guarantees.
- Implement contextual CTA contract on need pages only:
  - authenticated: open existing conversation or open draft chat (no persistence until first message)
  - guest: redirect to auth with return URL
- Enforce no direct chat/contact CTA on campaign and account pages.
- Enforce disabled/hidden action states when entity is unavailable.

Exit criteria:

- Metadata present in server HTML.
- CTA behavior consistent and tested across auth states.

## Phase 4 - Validation and Hardening

- Add route-level tests for availability-state outcomes.
- Add metadata assertions for need/campaign/account pages.
- Add auth-action flow tests (logged in, logged out, unavailable states).
- Verify no restricted-data leakage in HTML snapshots.

Exit criteria:

- Tests pass for happy paths and key edge cases.
- Public pages are production-acceptable for UX and SEO.

## Dependency Notes

- Feature `010` consumes deletion/anonymization outcomes from feature `011` and should not duplicate profile deletion UX or mutation logic.
