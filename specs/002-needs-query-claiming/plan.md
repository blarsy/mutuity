# Implementation Plan: Needs Querying And Claiming

**Branch**: `002-needs-query-claiming` | **Date**: 2026-04-03 | **Spec**: `/specs/002-needs-query-claiming/spec.md`
**Input**: Feature specification from `/specs/002-needs-query-claiming/spec.md`

## Summary

Implement the next collaboration flow for Mutuity: public need discovery with weighted ranking and filters, authenticated claim creation, creator/claimer messaging, and claim settlement. The solution should stay GraphQL-first, keep authorization in PostgreSQL/PostGraphile, and build on the cookie-based authentication shipped in Feature 004.

## Technical Context

**Language/Version**: TypeScript (strict mode) for frontend/backend; SQL/PL-pgSQL for data logic  
**Primary Dependencies**: Next.js, React, MUI, Apollo Client, Express, PostGraphile, PostgreSQL, Graphile Worker  
**Storage**: PostgreSQL 16  
**Testing**: Jest integration + contract tests on backend; frontend component/integration tests for filters and claim flows  
**Target Platform**: Web app in desktop/mobile browsers  
**Project Type**: Monorepo with `frontend/`, `backend/`, and `database/`  
**Performance Goals**: need search returns within 1s locally for <=50 rows; claim/messaging actions feel immediate; default query stays capped at 50 ranked results  
**Constraints**: GraphQL-first contract, sanitized user-facing errors, authenticated claims only, atomic settlement, deterministic ranking/tie-breaking, location fallback order must match spec  
**Scale/Scope**: MVP discovery + claim lifecycle; polling-based near-realtime notifications are acceptable if full websocket infrastructure is not yet present

## Constitution Check

*GATE: Must pass before implementation begins.*

- Pass: PostgreSQL remains the source of truth for needs, claims, conversations, and settlement state.
- Pass: Sensitive authorization stays enforced by SQL functions/RLS, not the frontend.
- Pass: UX coverage is end-to-end: search, filters, claim, conversation, settlement, and failure states.
- Pass: New flows must work with the existing Feature 004 session-based authentication.
- Pass: Work will be test-led for ranking, claim permissions, and settlement idempotency.

## Project Structure

### Documentation (this feature)

```text
specs/002-needs-query-claiming/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Source Code (repository root)

```text
database/
├── migrations/
│   ├── 008_need_search_and_claims.sql
│   └── 009_need_search_indexes.sql
└── functions/
    ├── need/
    └── claim/

backend/
└── tests/
    ├── integration/
    └── contract/

frontend/
└── src/
    ├── features/needs/
    └── pages/needs/
```

**Structure Decision**: Keep ranking, claim creation, and settlement in SQL functions exposed through PostGraphile. The frontend should orchestrate search/filter state and render results, but not own business rules.

## Delivery Slices

### Slice 1 — Public need discovery (P1)
- Search active, non-expired needs
- Weighted ranking + deterministic tie-break
- Default result cap of 50
- Public needs page + query wiring

### Slice 2 — Filters + location fallback (P1)
- Text search across required fields
- Tri-state boolean filters
- Account/browser/Tournai location fallback behavior

### Slice 3 — Authenticated claiming (P1)
- Claim mutation with optional initial message
- Permission checks for signed-in accounts only
- Creator notification record + surfaced UI state

### Slice 4 — Messaging and settlement (P2)
- Lazy conversation creation on first creator response
- Read tracking and optional image metadata support
- Atomic settlement with sibling-claim closure + Topes event recording

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Current `need.location` is text-only | Hard to compute distance ranking | Add latitude/longitude fields and a normalized fallback strategy in the migration |
| No existing websocket channel is visible | “Realtime” notification may be blocked | Use persisted notifications with short polling as the MVP implementation |
| Settlement can race across multiple claims | Double-settlement or inconsistent status | Implement one SQL transaction with row locking and idempotency guards |
| Accent-insensitive partial search can become slow | Poor UX on larger datasets | Use `unaccent` + trigram-friendly indexes in a follow-up perf migration |

## Complexity Tracking

| Decision | Why Needed | Simpler Alternative Rejected Because |
|----------|------------|--------------------------------------|
| Use numeric lat/lng scoring instead of plain text location | Ranking must include distance | Text labels alone cannot produce deterministic closeness scoring |
| Persist notifications and poll for MVP | Need creator must be alerted quickly | Full websocket infrastructure is not yet established in this repo |
| SQL-owned settlement transaction | Correctness and permissions matter | Frontend-side orchestration would be fragile and bypassable |
