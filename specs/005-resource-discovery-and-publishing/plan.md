# Implementation Plan: Resource Discovery And Publishing

**Branch**: `005-resource-discovery-and-publishing` | **Date**: 2026-04-05 | **Spec**: `/specs/005-resource-discovery-and-publishing/spec.md`
**Input**: Feature specification from `/specs/005-resource-discovery-and-publishing/spec.md`

## Summary

Implement the first concrete Tope-là-native slice in the unified platform: browsing active resources, publishing new offers, and capturing the separate resource-response (`bid`) flow. The implementation should reuse the proven search/auth/conversation patterns from Mutuity where they fit, while respecting the fact that `resource` and `bid` are not identical to `need` and `claim`.

## Technical Context

**Language/Version**: TypeScript (strict mode), SQL/PL-pgSQL  
**Primary Dependencies**: Next.js, React, MUI, Apollo Client, Express, PostGraphile, PostgreSQL, Graphile Worker  
**Storage**: PostgreSQL 16  
**Testing**: Jest/Vitest frontend tests, backend integration and contract tests  
**Target Platform**: Web first, with mobile parity to follow from the same domain API  
**Project Type**: Monorepo feature slice building on the existing `frontend/`, `backend/`, and `database/` structure  
**Constraints**: Preserve Tope-là-style UX, keep `resource` and `bid` distinct from `need` and `claim`, and maintain the repository rule of no business SQL in TypeScript  
**Scale/Scope**: MVP resource discovery, publication, and response foundation

## Constitution Check

- Pass: PostgreSQL remains the source of truth for resource visibility, bid permissions, and lifecycle state.
- Pass: Sensitive rules stay in SQL functions/RLS rather than frontend-only checks.
- Pass: UX work is end-to-end: discovery, publish form, and response handling.
- Pass: Existing auth/session work from Feature 004 can be reused as the foundation.
- Pass: This slice intentionally complements Feature 002 rather than merging away the distinct resource domain too early.

## Delivery Slices

### Slice 1 — Public resource discovery (P1)
- Search active resources
- sort solely by geographical closeness, with most-recently-created as the deterministic tie-breaker
- respect expiration behavior: dated resources disappear once expired, undated resources remain permanent
- location/category/text filters
- six tri-state modality filters (`neutral` / `yes` / `no`)
- resource cards and detail surface

### Slice 2 — Resource publishing (P1)
- publish/edit form
- subtype-aware validation
- mandatory shared `intensity` field
- optional negotiated Topes reference amount with the same range mapping used for needs
- optional rich-text description (max 8000 chars) on the detail view
- optional image/media support

### Slice 3 — Resource responses (P2)
- bid creation
- reject bids on expired resources
- publisher review state
- conversation handoff and notification wiring

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Resource subtypes have divergent field rules | Validation/UI confusion | Model subtype-specific validation explicitly and keep the first MVP field set focused |
| Commercial wording around the legacy `price` field could misframe the product | UX and regulatory confusion | Use non-commercial, gratitude-driven copy such as suggested/reference Topes amount and keep the field negotiable |
| Six tri-state flag filters add query and UI complexity | Discovery bugs or confusing filter behavior | Reuse the proven tri-state filter pattern from needs and test each `neutral` / `yes` / `no` branch explicitly |
| Legacy Tope-là media/location formats vary | Broken migrated cards | Normalize legacy data during import and keep UI tolerant of partial metadata |
| Bid lifecycle differs from claim lifecycle | Incorrect unification assumptions | Keep `bid` distinct and document the lifecycle rules before implementation |
| Scope expands into campaigns too early | Delays the first merge slice | Treat campaign coupling as optional unless needed for basic publishing/discovery |

## Structure Decision

Start with the web slice and database shape first, then add mobile parity after the domain rules and UX patterns are validated on the shared API.