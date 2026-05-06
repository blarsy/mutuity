# Tasks: Listing Visual Identity

**Input**: Design documents from `/specs/009-listing-visual-identity/`  
**Prerequisites**: `spec.md`, `plan.md`

## Format: `[ID] [P?] [Slice] Description`
- **[P]**: Can run in parallel (different files, no dependency)
- **[Slice]**: Delivery slice scope (`S1`–`S6`)
- All task descriptions include concrete file paths

## Phase 1: Spec Foundation

- [ ] T001 Confirm the listing-visual-identity feature scope in `specs/009-listing-visual-identity/spec.md`
- [ ] T002 Draft the implementation plan in `specs/009-listing-visual-identity/plan.md`
- [ ] T003 Audit existing `ImageUploadField` usage in resource forms and `image_urls` normalisation in `database/functions/` before coding begins

## Phase 2: Slice 1 — Need Images Database And API

**Goal**: `need.image_urls` exists in the DB, mutations accept it, and the GraphQL type exposes it.

**Independent Test**: Via GraphQL playground, create a need with `imageUrls`, fetch it back, and confirm the values round-trip correctly with whitespace normalisation applied.

- [ ] T004 [S1] Add `image_urls text[] not null default '{}'` to the `need` table in a new migration `database/migrations/NNN_need_image_urls.sql` and apply the same normalisation trigger pattern used on `resource`
- [ ] T005 [S1] Update `database/functions/need/create_need.sql` to accept and persist `p_image_urls text[] default '{}'`
- [ ] T006 [S1] Update `database/functions/need/update_need.sql` to accept and persist `p_image_urls text[] default '{}'`
- [ ] T007 [P] [S1] Add backend integration tests for `image_urls` round-trip on create and update in `backend/tests/integration/need-images.spec.ts`
- [ ] T008 [S1] Regenerate or manually update `frontend/src/graphql/schema.graphql` and `frontend/src/graphql/generated.ts` so `Need.imageUrls` is present

## Phase 3: Slice 2 — Need Image Upload UI

**Goal**: Need creation and editing forms include the image upload control.

**Independent Test**: Create a need with two images via the UI, reload the page, edit the need, and verify both images are shown with remove/reorder controls.

- [ ] T009 [S2] Add `ImageUploadField` to the need creation form (identify the form component path during T003 audit)
- [ ] T010 [S2] Add `ImageUploadField` to the need editing form
- [ ] T011 [P] [S2] Add frontend tests for the image upload control presence and mutation variable shape in the need form test files

## Phase 4: Slice 3 — `ListingHeader` Component

**Goal**: A tested, stateless `ListingHeader` component exists and is ready for rollout.

**Independent Test**: Run the unit test / view the Storybook story confirming image-present and image-absent render states.

- [ ] T012 [P] [S3] Create `frontend/src/features/ui/ListingHeader.tsx` with props `title`, `titleHref?`, `imageUrl?`, `accountName`, `accountImageUrl?`, `accountHref?`; render thumbnail when `imageUrl` is present, `AvatarIconButton` fallback otherwise
- [ ] T013 [P] [S3] Add unit tests for `ListingHeader` in `frontend/tests/ui/listing-header.spec.tsx` covering image-present, image-absent, and no-account-image states

## Phase 5: Slice 4 — Roll Out To `ResourceCard` And `NeedCard`

**Goal**: Both existing card components delegate their header row to `ListingHeader`.

**Independent Test**: Open the search resources page and the contribute page; verify the header row looks identical for both resource and need cards.

- [ ] T014 [S4] Replace the avatar + creator-name header row in `frontend/src/features/ui/ResourceCard.tsx` with `<ListingHeader>` using `imageUrl={imageUrls?.[0]}`, `accountName`, `accountImageUrl`, `title`, `titleHref`; add `accountHref` prop to `ResourceCard` if not yet present
- [ ] T015 [S4] Replace the avatar + creator-name header row in `frontend/src/features/ui/NeedCard.tsx` with `<ListingHeader>`; add `imageUrls?: string[] | null` prop to `NeedCard` and pass `imageUrl={imageUrls?.[0]}`
- [ ] T016 [P] [S4] Update all callers of `NeedCard` to pass `imageUrls` (from the updated GraphQL query fields) and all callers of `ResourceCard` to pass `accountHref` if the prop is added
- [ ] T017 [P] [S4] Verify all existing `ResourceCard` and `NeedCard` unit/snapshot tests still pass; update fixtures to include `imageUrls` where needed

## Phase 6: Slice 5 — Roll Out To Bids And Claims Workspaces

**Goal**: Bid cards and claim cards show the listing thumbnail and creator name via `ListingHeader`.

**Independent Test**: Open `/bids` and `/claims`; verify each card has a listing header with thumbnail (or avatar fallback) and creator name above the status/action row.

- [ ] T018 [S5] Add `ListingHeader` to `BidCard` in `frontend/src/pages/bids.tsx`; update `BID_WORKSPACE_FIELDS` fragment in `frontend/src/features/resources/resources.queries.ts` to ensure `accountByCreatorAccountId { displayName externalSubject }` and `imageUrls` are included
- [ ] T019 [P] [S5] Update bid workspace frontend tests in `frontend/tests/bids/` to include `imageUrls` in fixtures and assert the listing header renders
- [ ] T020 [S5] Add `ListingHeader` to the claim card rendering in `frontend/src/pages/claims.tsx`; update `VIEWER_CLAIM_OVERVIEW_QUERY` in `frontend/src/features/needs/needClaims.queries.ts` to fetch `needByNeedId { imageUrls accountByCreatorAccountId { displayName externalSubject } }`
- [ ] T021 [P] [S5] Update claim workspace frontend tests in `frontend/tests/claims/` to include `imageUrls` in need fixtures and assert the listing header renders

## Phase 7: Slice 6 — `ConversationThread` Header Enrichment

**Goal**: The conversation thread header shows the counterparty's avatar and listing thumbnail alongside the title.

**Independent Test**: Open a resource conversation and a claim conversation; verify the thread header shows the counterparty name, their avatar, the listing title as a link, and the listing thumbnail when available.

- [ ] T022 [S6] Extend `RESOURCE_CONVERSATION_QUERY` in `frontend/src/features/chat/chat.queries.ts` to fetch `resourceByResourceId { imageUrls }` and the non-me counterparty account's `displayName` and `externalSubject`
- [ ] T023 [S6] Extend `CLAIM_CONVERSATION_QUERY` in `frontend/src/features/chat/chat.queries.ts` to fetch `needByNeedId { imageUrls }` and the non-me counterparty account's `displayName` and `externalSubject`
- [ ] T024 [S6] Update `ResourceConversationData` and `ClaimConversationData` types in `frontend/src/features/chat/ConversationThread.tsx` to include the new fields
- [ ] T025 [S6] Replace the `ThreadHeader` title-link block in `ConversationThread.tsx` with `<ListingHeader>` passing counterparty name, counterparty avatar URL, listing title, listing image URL, and context href; degrade gracefully when data is loading or missing
- [ ] T026 [P] [S6] Update or add `ConversationThread` tests in `frontend/tests/chat/` to assert the enriched header renders correctly in both resource and claim variants

## Phase 8: Polish & Validation

- [ ] T027 [P] Ensure all new UI strings (aria labels, fallback text) are i18n-backed in EN and FR locale files
- [ ] T028 [P] Add responsive polish to `ListingHeader` for very narrow viewports (truncate title and name with `noWrap` or `textOverflow`)
- [ ] T029 Run end-to-end verification: create needs with and without images, open all affected surfaces, confirm visual consistency
- [ ] T030 Update `specs/009-listing-visual-identity/spec.md` with any implementation notes or scope changes discovered during delivery

## Dependencies & Execution Order

- Phase 2 (Slice 1) must land before Phases 3, 5, 6, and 7 can use real `imageUrls` data.
- Phase 4 (Slice 3, `ListingHeader`) can be built in parallel with Phases 2–3.
- Phases 5, 6, and 7 can proceed in parallel once Phases 2 and 4 are done.
- Phase 3 (Slice 2, upload UI) can proceed in parallel with Phases 5–7 once Phase 2 is done.

## Parallel Execution Examples

- T007 and T008 can run in parallel with each other after T004–T006.
- T012 and T013 can run in parallel with Phase 2 entirely.
- T014 and T015 can run in parallel after T012.
- T016 and T017 can run in parallel after T014–T015.
- T019, T021, and T026 (test updates) can run in parallel with their respective implementation tasks.
- T022, T023, T024, and T025 are sequential within Slice 6.
- T027 and T028 can run in parallel.
