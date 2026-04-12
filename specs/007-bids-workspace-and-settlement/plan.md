# Implementation Plan: Bids Workspace And Settlement

**Branch**: `007-bids-workspace-and-settlement` | **Date**: 2026-04-11 | **Spec**: `/specs/007-bids-workspace-and-settlement/spec.md`  
**Input**: Feature specification from `/specs/007-bids-workspace-and-settlement/spec.md`

## Summary

Extend the already implemented resource-bid foundation into a full Tope-là-style `Bids` workspace. The rebuilt page should separate sent and received bids, provide separate active-only filters, order each section by latest status-change time, preserve the operational navigation links to the related account/resource/conversation, and support practical lifecycle actions such as cancel, accept, and reject directly from the workspace.

The workspace should also use paged loading with a page size of 5 per section, while improving on Tope-là by explicitly sorting on `latestStatusChangedAt` rather than a simpler created-time ordering.

This slice builds on the existing `resource_bid` PostgreSQL model, notification hooks, token reservation/refund logic, and `submitResourceBid` / `respondToResourceBid` mutations already landed under Feature 005. It now explicitly treats bid creation as a token-reservation event, constrains bid validity to a short 12–48 hour window, and keeps final acceptance behind a strong confirmation step because the reserved Topes transfer directly to the receiver.

## Technical Context

**Language/Version**: TypeScript (strict mode), SQL/PL-pgSQL  
**Primary Dependencies**: Next.js, React, MUI, Apollo Client, Express, PostGraphile, PostgreSQL 16  
**Storage**: PostgreSQL 16  
**Testing**: Jest/Vitest frontend tests, backend integration and contract tests  
**Target Platform**: Responsive web workspace  
**Project Type**: Monorepo feature slice extending the existing `frontend/`, `backend/`, and `database/` codebase  
**Constraints**: Keep lifecycle rules, permissions, and token settlement logic SQL-owned; integrate cleanly with Feature 006 for chat deep links; preserve the non-fiat Tope-là wording around Topes negotiation  
**Scale/Scope**: Dedicated bids workspace parity plus any missing settlement/lifecycle gaps

## Constitution Check

- Pass: Bid lifecycle transitions and settlement effects remain PostgreSQL-owned and auditable.
- Pass: Existing `resource_bid` and notification foundation from Feature 005 is reused rather than duplicated.
- Pass: The workspace improves an already reserved route (`/bids`) with an operational feature, not just a placeholder.
- Pass: Chat deep links should integrate with the new `006-chat-and-conversations` feature instead of creating a parallel messaging system.

## Current Baseline And Audit Findings

### Already present in the rebuilt app
- `frontend/src/pages/bids.tsx` shows a basic sent/received split.
- Bid creation and creator-side response are already backed by:
  - `database/functions/resource/create_resource_bid.sql`
  - `database/functions/resource/respond_to_resource_bid.sql`
- Notifications and refund behavior for declines/expiry/cancellation already exist.
- The contribution ledger already records `resource_bid_reserved` and `resource_bid_refunded` events, which matches the rule that bid creation removes the proposed Topes from the bidder’s available balance until resolution.

### Observed in the audited Tope-là UI
- a dedicated two-column sent/received workspace
- separate `only active bids` filters for each side
- load-more pagination
- bid cards with clear inactive explanations
- direct action buttons for cancel / accept / refuse
- direct shortcut into the focused chat conversation for that bid’s resource context

### Current parity gaps in the rebuilt app
- no separate `only active bids` filters yet on the new `/bids` page
- ordering is currently by `createdAt`, not explicitly by latest status-switch time
- no page-size-5 paged loading behavior yet on the workspace
- no direct cancel action in the sent-bids list page
- no direct accept/reject actions in the received-bids list page (review is still pushed to the resource page)
- no workspace-level chat deep link yet
- no enforcement of the 12–48 hour bid-validity window constraint
- no UI messaging that the proposed Topes are reserved/unavailable at bid creation until the bid is resolved
- no final-acceptance confirmation warning advising the receiver to handle logistics before accepting because the settlement is final
- the accepted-bid settlement path needs to be verified to ensure reserved Topes transfer directly to the receiver exactly once
- resource-expiry and manual-deactivation auto-cancellation behavior needs to be reflected explicitly in the workspace and resource-management UX
- the refund paths for bid expiry, cancellation, and rejection need to be verified as returning reserved Topes to the bidder exactly once

## Delivery Slices

### Slice 1 — Bids workspace parity (P1)
- refine `/bids` into a practical sent/received operations page
- order by latest status-change time
- show current status, amount, timestamps, resource summary, and counterparty summary
- add separate `only active bids` filters and paged loading with a page size of 5 per section

### Slice 2 — Direct bid lifecycle actions (P1)
- allow the bidder to cancel sent bids directly from the workspace
- allow the resource owner to accept or reject received bids directly from the workspace
- show inactive reasons for accepted/rejected/cancelled/expired bids
- keep all lifecycle changes SQL-owned; only notify the party who did **not** explicitly trigger the action (see Notification Model below)
- preserve the rule that accepting one bid does not automatically close the other still-open bids on the same resource
- automatically cancel open bids when the resource expires or is manually deactivated after user confirmation

### Slice 3 — Navigation and chat integration (P2)
- add workspace-level navigation to counterparty account details and resource details
- add direct entry into the focused resource-bound conversation for any bid row
- align this behavior with the future shared chat workspace from Feature 006

### Slice 4 — Settlement and auditability polish (P2)
- verify that accepted bids have an explicit, one-time settlement effect for the resource owner
- ensure ledger and notification copy remain consistent with the bids page state
- preserve clear non-fiat wording around negotiated Topes amounts

## Data And Lifecycle Notes

### Status model
The rebuilt app already uses `OPEN`, `ACCEPTED`, `DECLINED`, `WITHDRAWN`, and `EXPIRED`. The workspace should present these as friendly user-facing labels while still preserving the exact underlying state for auditing and filtering.

### Activity and validity model
A bid is considered active only while it remains open, its own validity timestamp has not passed, and the target resource is still active and not expired. This activity check should be enforced at query time rather than by relying only on client-side presentation.

The bid validity window should stay intentionally short, with a minimum of 12 hours and a maximum of 48 hours. This short validity is justified by the fact that the proposed Topes are reserved immediately at creation time and therefore unavailable for other uses while the bid remains open.

### Ordering model
The bids workspace should sort by a normalized `latestStatusChangedAt` value, defined as the newest relevant state-change timestamp for the bid, with creation time used as the fallback when the bid has not moved beyond its initial open state.

### Notification model
The general rule is that notifications are sent to the party who did **not** explicitly trigger the event. For system-automatic events neither party triggered, all directly affected parties are notified.

| Event | Triggered by | Notified |
|---|---|---|
| Bid created | bidder (explicit) | receiver (resource owner) |
| Bid cancelled by bidder | bidder (explicit) | receiver only |
| Bid rejected by receiver | receiver (explicit) | bidder only |
| Bid accepted by receiver | receiver (explicit) | bidder only |
| Bid expires without answer | background worker (automatic) | bidder **and** receiver |
| Resource expires → bids auto-cancelled | background worker (automatic) | bidder **and** resource owner |
| Resource deactivated → bids auto-cancelled | resource owner (explicit) | bidder only |

### Parallel bids model
Unlike need claims, accepting one bid on a resource does not automatically close the other open bids on that same resource, because the system cannot assume that every resource is single-consumption.

### Resource expiry and deactivation behavior
- when a resource reaches the end of its validity, all still-open bids on that resource should be automatically cancelled
- when a user attempts to toggle a resource from active to inactive while open bids exist, the UI should request confirmation before applying the change
- if that deactivation is confirmed, the system should automatically cancel all still-open bids on the resource and emit the expected refunds and notifications

### Settlement model
- creating a bid should immediately reserve the proposed Topes from the bidder’s available balance
- declining, expiring, or cancelling should refund those reserved Topes to the bidder exactly once
- accepting should transfer the reserved amount directly to the receiver in a one-time, explicitly auditable way
- because this acceptance is final from the settlement perspective, the receiver-facing UI should warn that logistics should be handled first and then require explicit confirmation- a scheduled background worker (similar to the existing `process_resource_bid_notifications` worker) should periodically check for bids that have reached their `validUntil` without a response and automatically expire them, refunding reserved Topes and issuing notifications
## Web IA And Componentization Plan

### Primary route
- **`/bids`**: authenticated workspace showing `Bids you sent` and `Bids received on your resources`

### Supporting routes and dependencies
- account details routes from bidder/creator links
- resource details route from each bid row
- focused resource conversation route from the chat shortcut

### Proposed frontend surfaces

| Surface | Responsibility |
|--------|----------------|
| `BidsPage` | authenticated workspace shell, counts, filters, and layout |
| `SentBidCard` | sent-side display, inactive message, cancel action, resource/account/chat links |
| `ReceivedBidCard` | received-side display, inactive message, accept/reject actions, resource/account/chat links |
| `BidStatusChip` | consistent status rendering across sent and received sections |
| `BidConversationLink` | opens the focused conversation for the bid’s resource context |

## Testing Strategy

### Backend
- verify sent/received list ordering by latest status-change timestamp
- verify active-only filtering based on persisted status, bid validity, and resource state
- verify cancel/accept/reject permissions and lifecycle behavior
- verify that accepting one bid leaves other open bids on the same resource untouched
- verify automatic bid cancellation when the resource expires or is manually deactivated
- verify settlement/refund token effects for the affected accounts
- verify notification alignment after state changes

### Frontend
- verify separate active-only filters, sent/received rendering, and inactive explanations
- verify paged loading with a page size of 5 per section
- verify direct action buttons on both sides of the workspace
- verify navigation to account/resource/chat destinations
- verify the resource-deactivation confirmation flow when open bids exist
- verify the page remains usable on smaller screens with the two sections stacked responsively

## Non-Goals For This Slice

- redesigning the underlying resource discovery flow
- adding multi-counterparty auctions or complex bidding rounds
- replacing the shared chat model defined in Feature 006 with a bids-only messaging system
- introducing fiat-currency concepts or payment processors
