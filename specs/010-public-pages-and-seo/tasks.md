# Tasks: Public Pages (Needs, Campaigns, Accounts)

## Milestone A - Query and State Model

- [x] T010-001 Define public detail query fields for need page.
- [x] T010-002 Define public detail query fields for campaign page.
- [x] T010-003 Define public detail query fields for account page.
- [x] T010-004 Implement shared availability-state mapper utility including deleted-visible outcome.
- [x] T010-005 Define consistent not-found vs unavailable response policy.
- [x] T010-006 Align deleted-visible state mapping with feature 011 anonymization outputs.

## Milestone B - Need Public Page

- [x] T010-007 Replace placeholder need detail UI with production layout.
- [x] T010-008 Add need state chips/alerts for active, expired, deleted-visible, unavailable.
- [x] T010-009 Implement need CTA contract (guest redirect + authenticated open existing or draft conversation).
- [x] T010-010 Add SSR metadata mapping for need title/description.
- [x] T010-011 Add EN/FR copy for need public-page states and CTAs.

## Milestone C - Campaign Public Page

- [x] T010-012 Create `/campaigns/[campaignId]` public detail page.
- [x] T010-013 Render campaign rich theme content with shared allowlist sanitization utility.
- [x] T010-014 Render campaign description summary and schedule timeline.
- [x] T010-015 Add campaign lifecycle-state rendering (upcoming/active/ended/deleted-visible + availability).
- [x] T010-016 Add SSR metadata using mandatory campaign description as sole source with per-id correctness checks.
- [x] T010-017 Remove/forbid direct chat-contact CTA entry points on campaign page.

## Milestone D - Account Public Page

- [x] T010-018 Replace placeholder account page with production public profile.
- [x] T010-019 Render policy-safe account summary and public listing links.
- [x] T010-020 Add account unavailable/restricted/deleted-visible state UI.
- [x] T010-021 Ensure account page exposes no direct chat/contact CTA.
- [x] T010-022 Add SSR metadata mapping for account page.

## Milestone E - Verification and Quality

- [x] T010-023 Add route tests for not-found and unavailable outcomes.
- [x] T010-024 Add SSR metadata tests for need/campaign/account pages.
- [x] T010-025 Add CTA flow tests for guest redirect with return URL on need pages only.
- [x] T010-026 Add CTA flow tests for authenticated need conversation open-existing-or-draft behavior.
- [x] T010-027 Add snapshot checks ensuring no restricted field leakage.
- [x] T010-028 Add explicit tests that campaign and account pages expose no direct chat/contact CTA.
- [x] T010-029 Manual QA pass for desktop/mobile polish and accessibility baseline.
