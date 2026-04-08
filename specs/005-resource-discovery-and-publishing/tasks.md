# Tasks: Resource Discovery And Publishing

**Input**: Design documents from `/specs/005-resource-discovery-and-publishing/`

## Phase 1: Spec Foundation

- [ ] T001 Confirm the feature scope for resource discovery, publishing, and bid handling in `specs/005-resource-discovery-and-publishing/spec.md`
- [ ] T002 Draft the implementation plan in `specs/005-resource-discovery-and-publishing/plan.md`
- [ ] T003 Audit the relevant Tope-là resource screens and flows before coding begins

## Phase 1b: UI Architecture Foundations

- [ ] T015 Document the shared navigation shell, route inventory, and reusable UI building blocks in `specs/005-resource-discovery-and-publishing/spec.md` and `plan.md`
- [ ] T016 Create shared `AvatarIconButton`, `ResourceCard`, and `NeedCard` components for reuse across discovery, detail, account, and campaign pages
- [ ] T017 Add reusable auth entry surfaces for `Login`, `Register`, `ResetPassword`, and `RestoreAccess`, including dialog-based entry points for gated actions
- [ ] T018 Add dedicated workspace pages for `Bids`, `Claims`, `Chat`, `Notifications`, `Profile`, `Preferences`, and `Contribution` as the route map fills out

## Phase 2: Resource Discovery (P1)

- [ ] T004 Add backend tests for active-resource filtering, closeness-only sorting with recent-created tie-breaking, expiration-versus-permanent behavior, ranking, and the six tri-state flag filters
- [ ] T005 Implement PostgreSQL search/query helpers for resources, including closeness-based ordering, deterministic recent-created tie-breaking, expiration handling, and `neutral` / `yes` / `no` semantics for each modality flag
- [ ] T006 Build the public resource discovery page and tri-state filters

## Phase 3: Resource Publishing (P1)

- [ ] T007 Add publish-form validation tests and contract coverage for mandatory intensity, optional negotiated Topes reference amount range mapping, and rich-text description length/validation
- [ ] T008 Implement the resource publish/edit mutation and SQL-owned validation rules, including shared intensity/Topes-range checks and safe rich-text description handling
- [ ] T009 Build the resource publish/edit UI with media handling, a rich-text description field, and non-commercial wording for the optional Topes reference amount field

## Phase 4: Resource Responses (P2)

- [ ] T010 Add backend tests for resource bid creation, expired-resource rejection, and lifecycle rules
- [ ] T011 Implement resource response queries/mutations and notification hooks, including expired-resource guards
- [ ] T012 Build the publisher review and response-management UI

## Phase 5: Validation

- [ ] T013 Run end-to-end verification for discovery, publishing, and bid handling
- [ ] T014 Capture any differences between legacy Tope-là behavior and the rebuilt MVP back into the spec