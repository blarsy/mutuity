# Tasks: Tope-là Migration And Mutuity Merge Foundation

**Input**: Design documents from `/specs/003-topela-migration-foundation/`  
**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `data-model.md`, `quickstart.md`

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependency)
- **[Story]**: User story scope (`US1`, `US2`, `US3`)
- Every task references concrete file paths

## Phase 1: Setup (Shared Foundation)

- [x] T001 Confirm the new Feature 003 direction and archive the old external-API concept in `specs/003-topela-migration-foundation/spec.md`
- [x] T002 [P] Draft the migration implementation plan in `specs/003-topela-migration-foundation/plan.md`
- [x] T003 [P] Draft the initial research decisions in `specs/003-topela-migration-foundation/research.md`
- [x] T004 [P] Draft the initial unified domain glossary in `specs/003-topela-migration-foundation/data-model.md`
- [x] T005 [P] Draft the audit quickstart/checklist in `specs/003-topela-migration-foundation/quickstart.md`

## Phase 2: User Story 1 - Define Unified Product Scope (Priority: P1)

**Goal**: Produce a trustworthy inventory of what Tope-là and Mutuity currently do and what the unified platform should include first.

**Independent Test**: A reviewer can read the documentation and clearly identify current capabilities, target scope, non-goals, and the product/architecture references.

### Tasks (US1)

- [x] T006 [US1] Audit the Tope-là web, mobile, backend, and SQL surfaces and record evidence in `specs/003-topela-migration-foundation/research.md`
- [x] T007 [P] [US1] Audit the Mutuity web, backend, and SQL surfaces and record evidence in `specs/003-topela-migration-foundation/research.md`
- [x] T008 [US1] Create a capability inventory and non-goals list in `specs/003-topela-migration-foundation/spec.md`
- [x] T009 [US1] Record visual parity references and owned asset assumptions in `specs/003-topela-migration-foundation/quickstart.md`

## Phase 3: User Story 2 - Reverse-Engineer Into SpecKit Features (Priority: P1)

**Goal**: Convert legacy behavior into clean feature slices and define the first roadmap for redevelopment.

**Independent Test**: The first 3–5 implementation-ready specs can be derived from the migration docs without rediscovering scope from source code.

### Tasks (US2)

- [x] T010 [US2] Define the unified glossary for accounts, organizations, resources, needs, bids/claims, and conversations in `specs/003-topela-migration-foundation/data-model.md`
- [x] T011 [P] [US2] Decide what stays distinct in MVP v1 versus what is later unified in `specs/003-topela-migration-foundation/data-model.md`
- [x] T012 [US2] Propose the first implementation waves in `specs/003-topela-migration-foundation/plan.md`
- [x] T013 [US2] Create a future-spec backlog outline in `specs/003-topela-migration-foundation/spec.md`

## Phase 4: User Story 3 - Preserve Look & Feel During Rebuild (Priority: P2)

**Goal**: Ensure the rebuild keeps Tope-là’s product identity while improving code quality and delivery discipline.

**Independent Test**: A future implementation team can use the docs to preserve UX parity without copying legacy structural debt.

### Tasks (US3)

- [x] T014 [US3] Document the visual-parity strategy and screen-capture workflow in `specs/003-topela-migration-foundation/quickstart.md`
- [x] T015 [P] [US3] Document reuse candidates versus rewrite candidates in `specs/003-topela-migration-foundation/research.md`
- [x] T016 [US3] Document technical risks and mitigation controls in `specs/003-topela-migration-foundation/plan.md`

## Phase 5: Readiness & Handoff

- [ ] T017 Review the migration foundation documents with the product owner and confirm the target MVP boundary
- [x] T018 Convert the approved roadmap into the next concrete feature specs under `specs/`
- [ ] T019 Capture any scope or architecture updates back into `specs/003-topela-migration-foundation/`

## Dependencies & Execution Order

- Phase 1 first, then Phase 2.
- US1 must be solid before committing to the roadmap in US2.
- US2 should establish the glossary and implementation waves before UX-preservation rules are finalized in US3.
- Handoff tasks start only after the migration foundation is reviewed and accepted.

## Parallel Execution Examples

- T002, T003, T004, and T005 can run in parallel.
- T006 and T007 can run in parallel.
- T010 and T011 can run in parallel.
- T014 and T015 can run in parallel.

## Implementation Strategy

1. Audit both systems and freeze the target scope.
2. Define the shared vocabulary and the initial boundaries between `needs` and `resources`.
3. Design the target architecture and migration waves.
4. Use that foundation to open the next implementation-ready feature specs.