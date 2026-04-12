# Implementation Plan: Claims Workspace And Settlement

**Branch**: `008-claims-workspace-and-settlement` | **Date**: 2026-04-12 | **Spec**: `/specs/008-claims-workspace-and-settlement/spec.md`  
**Input**: Feature specification from `/specs/008-claims-workspace-and-settlement/spec.md`

## Summary

Extend the already implemented need-claim foundation into a practical `Claims` workspace that mirrors the operational strengths of the bids page while preserving the core differences of the claims lifecycle. The rebuilt page should separate sent and received claims, provide separate `active/inactive/all` filters with default `active`, order each section by latest status-change time, support page-size-5 loading, preserve navigation to need/account/conversation destinations, and support direct cancel, decline, and settle actions from the workspace.

This slice builds on the existing `need_claim`, claim conversation, claim notification, and settlement foundation from Feature 002. Unlike bids, claims do not reserve Topes at creation time, do not use their own validity window, and may only transfer Topes at settlement time if the need creator currently has enough balance.

## Technical Context

**Language/Version**: TypeScript (strict mode), SQL/PL-pgSQL  
**Primary Dependencies**: Next.js, React, MUI, Apollo Client, Express, PostGraphile, PostgreSQL 16  
**Storage**: PostgreSQL 16  
**Testing**: Jest/Vitest frontend tests, backend integration and contract tests  
**Target Platform**: Responsive web workspace  
**Project Type**: Monorepo feature slice extending the existing `frontend/`, `backend/`, and `database/` codebase  
**Constraints**: Keep lifecycle rules, permissions, notifications, and settlement logic SQL-owned; align with Feature 006 for chat entry points; preserve the current claim conversation model  
**Scale/Scope**: Dedicated claims workspace parity plus lifecycle and notification refinements

## Constitution Check

- Pass: Claim lifecycle transitions, auto-declines, notifications, and settlement effects remain PostgreSQL-owned and auditable.
- Pass: Existing `need_claim`, settlement, conversation, and notification foundations from Feature 002 are reused rather than duplicated.
- Pass: The workspace improves an already implemented route (`/claims`) with operational filtering, ordering, and direct actions.
- Pass: Chat entry points should align with the broader conversation direction from Feature 006 rather than create a separate claims-only messaging system.

## Current Baseline And Audit Findings

### Already present in the rebuilt app
- `frontend/src/pages/claims.tsx` already shows separate sent and received sections.
- Claim notifications are already surfaced through `ClaimNotificationsPanel`.
- Claim conversation support already exists through the claim conversation model and `ClaimConversationPanel`.
- Creator-side settlement already exists in `database/functions/claim/settle_need_claim.sql`.
- Settlement already transfers the need's configured Topes amount, not a claim-specific reserved amount.
- Settling a claim already auto-declines competing open claims on the same need.

### Current parity gaps in the rebuilt app
- no tri-state `active/inactive/all` filters yet on the sent and received claims sections
- ordering is currently by `createdAt`, not explicitly by latest status-switch time
- no page-size-5 paged loading behavior yet on the workspace
- no direct cancel action on sent claims from the cards
- no direct decline action on received claims from the cards
- no direct settle action on received claims from the cards
- no preemptive disabled-state validation message when the need creator lacks enough Topes to settle
- no explicit final-settlement confirmation warning on claim cards
- no explicit chat button on each claim card
- need-expiry and need-deactivation auto-decline behavior needs to be represented explicitly in the workspace UX and notification copy
- the current domain still references a legacy `expired` claim status, which should be reconciled with the product rule that claims themselves do not expire

## Delivery Slices

### Slice 1 — Claims workspace parity (P1)
- refine `/claims` into a practical sent/received operations page
- add separate tri-state `active/inactive/all` filters with default `active`
- order by latest status-change time
- add paged loading with a page size of 5 per section
- show current status, timestamps, need summary, and counterparty summary

### Slice 2 — Direct claim lifecycle actions (P1)
- allow the claimer to cancel open sent claims directly from the workspace
- allow the need creator to decline or settle open received claims directly from the workspace
- show inactive reasons for settled, declined, and withdrawn claims
- keep all lifecycle changes SQL-owned
- preserve the rule that settling one claim automatically declines other open claims on the same need atomically
- keep claim cancellation available even when a conversation already exists

### Slice 3 — Notifications and need-driven closure rules (P1)
- encode the explicit vs automatic notification rules for claim lifecycle events
- regularly poll for expired needs and auto-decline all linked open claims
- auto-decline open claims when a need is deactivated
- ensure reason-specific notification copy is deterministic for creator-side decline, need expiry, and need deactivation

### Slice 4 — Navigation, chat, and settlement polish (P2)
- add explicit card-level navigation to account details and need details
- add direct entry into the claim conversation from any claim card
- disable settlement preemptively when the need creator's balance is insufficient
- show the final-settlement warning and confirmation dialog on the workspace

## Data And Lifecycle Notes

### Status model
The current codebase still references `open`, `settled`, `declined`, `withdrawn`, and `expired`. The product rule for this slice is that claims themselves do not independently expire; they become inactive only by withdrawal, decline, settlement, or by being declined because the target need expired or was deactivated. This slice should reconcile the existing status model with that product rule.

### Activity model
A claim is considered active only while its status is `open`. The claims page should therefore treat `active` as `open`, and `inactive` as every non-open state.

### Ordering model
The claims workspace should sort by a normalized `latestStatusChangedAt` value, defined as the newest relevant status-transition timestamp for the claim, with creation time used as fallback when the claim has not transitioned since creation.

### Settlement model
- claim creation does not reserve Topes
- settlement transfers the need's configured Topes amount from the need creator to the claimer exactly once
- settlement must be unavailable when the need creator's current balance is insufficient
- settlement is final, so the UI should warn that logistics should be handled first and then require explicit confirmation
- settling one claim auto-declines competing open claims on the same need atomically

### Need-driven closure model
- a scheduled background worker should regularly poll for expired needs and decline all still-open claims linked to those needs
- when a need is manually deactivated, all still-open claims on that need should be declined automatically
- these automatic declines must be idempotent and audit-backed

### Notification model
The general rule is that notifications are sent to the party who did not explicitly trigger the event. For system-automatic events neither party explicitly triggered, all directly affected parties are notified according to the product matrix.

| Event | Triggered by | Notified | From status | To status |
|---|---|---|---|---|
| Claim created | claimer (explicit) | need creator | N/A | open |
| Claim cancelled | claimer (explicit) | need creator | open | withdrawn |
| Claim declined | need creator (explicit) | claimer only, with `Claim declined by the need creator` | open | declined |
| Claim settled | need creator (explicit) | settled claimer only | open | settled |
| Need expires, linked claims declined | system polling | affected claimers with `Claim automatically declined because the need expired`; need creator gets one summary notification | open | declined |
| Need deactivated, linked claims declined | need creator (explicit) | affected claimers with `Claim automatically declined because the need was deactivated` | open | declined |
| Another claim on same need is settled, causing this claim to be auto-declined | need creator settlement action | affected claimer only, with the same `Claim declined by the need creator` copy | open | declined |

## Web IA And Componentization Plan

### Primary route
- **`/claims`**: authenticated workspace showing `Claims you sent` and `Claims received on your needs`

### Supporting routes and dependencies
- account details routes from claimer/creator links
- need details route from each claim row
- claim conversation route from the chat shortcut

### Proposed frontend surfaces

| Surface | Responsibility |
|--------|----------------|
| `ClaimsPage` | authenticated workspace shell, filters, counts, layout, and pagination |
| `SentClaimCard` | sent-side display, inactive message, cancel action, need/account/chat links |
| `ReceivedClaimCard` | received-side display, decline/settle actions, balance guard, inactive message, need/account/chat links |
| `ClaimWorkspaceFilterBar` | tri-state section filter controls and load-more affordances |
| `ClaimSettlementGuard` | settlement disabled-state explanation and confirmation dialog |

## Testing Strategy

### Backend
- verify sent/received list ordering by latest status-change timestamp
- verify tri-state filtering based on open vs non-open status
- verify claimer-side cancellation permissions and behavior
- verify creator-side decline and settlement permissions and behavior
- verify that settlement auto-declines competing open claims on the same need atomically
- verify that settlement fails when the need creator balance is insufficient
- verify need-expiry polling auto-declines linked claims idempotently
- verify need-deactivation auto-declines linked claims
- verify notification alignment for explicit and automatic claim events

### Frontend
- verify separate section filters default to `active`
- verify paged loading with a page size of 5 per section
- verify direct cancel, decline, and settle controls with correct enablement
- verify the insufficient-balance disabled message for settlement
- verify the final settlement confirmation warning
- verify navigation to account, need, and conversation destinations
- verify the page remains usable on smaller screens with the two sections stacked responsively

## Non-Goals For This Slice

- redesigning need discovery or search ranking
- changing the existing one-conversation-per-claim model
- introducing claim-side token reservation or claim-specific validity windows
- replacing the broader chat direction defined in Feature 006 with a claims-only messaging system
