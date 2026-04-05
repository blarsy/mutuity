# Implementation Plan: Tope-là Migration And Mutuity Merge Foundation

**Branch**: `003-topela-migration-foundation` | **Date**: 2026-04-04 | **Spec**: `/specs/003-topela-migration-foundation/spec.md`
**Input**: Feature specification from `/specs/003-topela-migration-foundation/spec.md`

## Summary

Replace the abandoned “external minting API” direction with a migration foundation for a unified Tope-là + Mutuity platform. The plan treats **Tope-là as the product and visual reference** while using **Mutuity’s SpecKit + AI workflow and cleaner architecture** as the implementation standard. The result of this feature is not end-user functionality yet; it is a validated roadmap, glossary, and delivery breakdown that make the actual merge tractable.

## Technical Context

**Language/Version**: TypeScript (strict mode), SQL/PL-pgSQL, React/Next.js, React Native/Expo  
**Primary Dependencies**: Next.js, React, MUI, Apollo Client, Express, PostGraphile, Graphile Worker, PostgreSQL, Expo  
**Storage**: PostgreSQL 16 target model; legacy Tope-là PostgreSQL schema to be reverse-engineered and mapped  
**Testing**: Documentation validation, architecture review, and then automated tests per rebuilt feature slice  
**Target Platform**: Unified web + mobile + backend platform  
**Project Type**: Monorepo with legacy-product audit feeding a new SpecKit-driven redevelopment roadmap  
**Performance Goals**: Not applicable for this planning feature beyond producing an actionable phased roadmap  
**Constraints**: Preserve Tope-là look & feel, avoid direct schema merge, keep business SQL in PostgreSQL, support staged data migration, and prioritize independently deliverable slices  
**Scale/Scope**: Large multi-phase product merge spanning mobile app, web app, backend, database, auth, messaging, campaigns, and notifications

## Constitution Check

*GATE: Must pass before implementation begins.*

- Pass: The migration is driven by explicit specs and phased verification rather than ad-hoc copying from the legacy repo.
- Pass: Tope-là remains the UX/product reference, so the rebuild does not lose the current product identity.
- Pass: Mutuity remains the architecture/process reference, so the rebuild benefits from cleaner structure and stronger validation discipline.
- Pass: The plan assumes PostgreSQL and RLS remain central to the unified platform.
- Pass: The initiative explicitly avoids direct schema merging until a mapping and migration strategy are documented.
- Pass: Future implementation slices will keep the repository rule intact: **no business SQL in TypeScript**.

## Project Structure

### Documentation (this feature)

```text
specs/003-topela-migration-foundation/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Source Systems Being Assessed

```text
/Users/bertrandlarsy/code/mutuity/
├── frontend/
├── backend/
└── database/

/Users/bertrandlarsy/code/symmetrical-broccoli/
├── app/
├── backoffice/
├── webapi/
└── docker/
```

**Structure Decision**: Do not begin with direct code or schema merging. First create a clean documentation foundation that extracts reusable patterns, records risky legacy areas, and defines the first delivery waves.

## Delivery Slices

### Slice 1 — Legacy product audit (P1)
- Inventory Tope-là and Mutuity capabilities
- Capture screenshots / UX references / asset ownership status
- Identify live integrations and operational dependencies

### Slice 2 — Unified domain and glossary (P1)
- Reconcile `resource`, `need`, `bid`, `claim`, `conversation`, and organization concepts
- Define what stays distinct in MVP v1
- Record non-goals and deferred complexity

### Slice 3 — Target architecture and migration strategy (P1)
- Define target monorepo and platform boundaries
- Decide how auth, data, realtime, media, and admin fit the unified platform
- Plan staged data migration and cutover approach

### Slice 4 — First implementation waves (P2)
- Select the first feature slices for redevelopment
- Define verification expectations and rollout order
- Prepare future feature specs under the new direction

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Hidden legacy behavior only exists in code conditionals or SQL | Rebuild can miss important rules | Reverse-engineer from both source and observed UX, not source alone |
| Direct schema merge introduces drift and downtime risk | High implementation churn | Use a new target schema and explicit migration maps |
| Tope-là web/mobile parity may diverge | Confusing product behavior | Capture platform-specific differences during the audit and decide MVP parity rules |
| Realtime, push, and messaging flows are tightly coupled | Hard-to-debug regressions | Isolate them into dedicated future feature slices with tests |
| Backoffice/campaign complexity may balloon scope | Delays unified MVP | Mark non-essential admin features as deferred unless proven necessary |

## Complexity Tracking

| Decision | Why Needed | Simpler Alternative Rejected Because |
|----------|------------|--------------------------------------|
| Clean-room redevelopment instead of direct merge | Reduces legacy debt propagation | Direct merging would entangle two imperfect codebases and schemas |
| Preserve `need` and `resource` as separate first-class concepts at first | Lowers domain confusion during migration | Over-unifying too early would hide important behavioral differences |
| Use Tope-là as UX reference and Mutuity as architecture reference | Keeps both products’ strengths | Choosing only one as the full template would lose either product continuity or engineering discipline |