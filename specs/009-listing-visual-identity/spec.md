# Feature Specification: Listing Visual Identity

**Feature Branch**: `009-listing-visual-identity`  
**Created**: 2026-05-05  
**Status**: Draft  
**Input**: User direction to introduce visual parity between resources and needs across all card and header surfaces; analysis of `ResourceCard`, `NeedCard`, `BidCard`, `ClaimCard`, and `ConversationThread` header gaps.

## Context

Resources already carry one or more images (`image_urls` text array). Needs currently have no images. As a result, every surface that renders a need alongside a resource looks visually inconsistent: resource cards show a thumbnail while need cards can only show a creator avatar. This asymmetry carries through to the bids workspace (bid cards show no creator image), the claims workspace (claim cards have no need thumbnail), and the conversation thread header (no counterparty avatar or listing thumbnail).

This feature closes that gap in two coordinated steps:

1. **Need images**: add `image_urls` storage, mutation support, and an upload UI to needs so they match the resource model.
2. **`ListingHeader` shared component**: introduce a single compact header component used by `ResourceCard`, `NeedCard`, `BidCard` in the bids workspace, the claim card in the claims workspace, and the `ConversationThread` header.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Need Creator Adds Images To A Need (Priority: P1)

As a need creator, I can attach one or more images to a need so that potential claimers can understand what I am looking for at a glance.

**Why this priority**: Without images, needs are visually second-class compared to resources. This blocks consistent UI treatment across the entire app.

**Independent Test**: Create a need, attach two images, save it, then open the contribute page, the claims workspace, and the conversation thread for a claim on that need. Verify the first image appears as a thumbnail in every location.

**Acceptance Scenarios**:

1. **Given** I am creating or editing a need, **When** I open the form, **Then** I can upload one or more images using the same image upload control used on resource forms.
2. **Given** I attach images to a need and save it, **When** the need is persisted, **Then** the image URLs are stored on the need record and are retrievable via GraphQL.
3. **Given** a need with images, **When** I edit the need later, **Then** the existing images are shown and I can add or remove them.
4. **Given** a need has no images, **When** it is displayed anywhere in the UI, **Then** the listing header falls back to the creator's account avatar instead of a thumbnail.

---

### User Story 2 - Listings Display A Consistent Visual Header Across All Surfaces (Priority: P1)

As any user of the platform, I see a consistent compact header showing the listing thumbnail (or creator avatar fallback), the creator's name, and the listing title on every surface where a resource or need is referenced.

**Why this priority**: Consistent visual treatment reduces cognitive overhead when switching between the bids workspace, claims workspace, search results, contribute page, and chat.

**Independent Test**: Open the search resources page, the contribute page, the bids workspace, the claims workspace, and a conversation thread. Verify that the listing header area looks and behaves identically across all five surfaces for both resources and needs.

**Acceptance Scenarios**:

1. **Given** a resource card on the search page, **When** it is rendered, **Then** the header shows the resource's first image thumbnail (or creator avatar fallback), the creator's name as a clickable link to their account, and the resource title as a clickable link to the resource detail page.
2. **Given** a need card on the contribute page, **When** it is rendered, **Then** the header shows the need's first image thumbnail (or creator avatar fallback), the creator's name, and the need title using the same layout as the resource card header.
3. **Given** a bid card on the bids workspace, **When** it is rendered, **Then** the header area shows the target resource's first image thumbnail (or creator avatar fallback) and the resource creator's name alongside the existing status chip.
4. **Given** a claim card on the claims workspace, **When** it is rendered, **Then** the header area shows the target need's first image thumbnail (or creator avatar fallback) and the need creator's name.
5. **Given** a conversation thread is open, **When** the thread header is rendered, **Then** it shows the counterparty's avatar, the counterparty's name, and the linked resource or need title, replacing the current title-only text.

---

### User Story 3 - Creator Account Avatar Is Always Available As A Fallback (Priority: P2)

As any user of the platform, listings without images still display a recognisable visual identity through the creator's account avatar.

**Why this priority**: Not all needs or resources will have images. The fallback must be consistent and non-broken.

**Independent Test**: Create a need and a resource without any images. Verify that the listing header on every surface shows the creator's avatar rather than a broken image placeholder.

**Acceptance Scenarios**:

1. **Given** a listing (resource or need) with no images, **When** a `ListingHeader` is rendered for it, **Then** the creator's account avatar is shown in the thumbnail position with no broken image element.
2. **Given** a creator account with no profile image, **When** a `ListingHeader` is rendered for a listing they own, **Then** a generated initials avatar is shown instead.

## Edge Cases

- A need with an empty `image_urls` array must not trigger an image element; the fallback avatar must appear cleanly.
- Image upload validation on needs must mirror the existing resource validation: URL normalisation, deduplication, and the milestone reward trigger if applicable.
- The `ListingHeader` component must not embed any data-fetching logic; all data is passed in as props by the parent card or thread component.
- The `ConversationThread` query enrichment must remain backward-compatible: if the counterparty account or listing title cannot be fetched, the header must degrade gracefully to the title-only text it shows today.
- The `ResourceCard` and `NeedCard` components must delegate only their header row to `ListingHeader`; their body (description, chips, expiry, actions) remains in the existing card components.
- Removing `creatorImageUrl` from `NeedCard` props is a breaking prop-interface change; all callers must be updated in the same commit.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The `need` table MUST gain an `image_urls text[] not null default '{}'` column equivalent to the same column on `resource`.
- **FR-002**: The `create_need` and `update_need` SQL mutations MUST accept an `image_urls` parameter and persist the value with the same URL normalisation applied to resources.
- **FR-003**: The GraphQL `Need` type MUST expose `imageUrls: [String!]!` so all frontend queries can request it.
- **FR-004**: The need creation and editing form MUST include the same `ImageUploadField` control used on resource forms, allowing upload, reordering, and removal.
- **FR-005**: A shared `ListingHeader` React component MUST be created at `frontend/src/features/ui/ListingHeader.tsx` with props: `title`, `titleHref?`, `imageUrl?`, `accountName`, `accountImageUrl?`, `accountHref?`.
- **FR-006**: `ListingHeader` MUST render the `imageUrl` as a fixed-size thumbnail when present, falling back to `AvatarIconButton` when absent.
- **FR-007**: `ResourceCard` MUST use `ListingHeader` for its header row, removing the duplicated avatar + creator-name markup.
- **FR-008**: `NeedCard` MUST use `ListingHeader` for its header row, removing the duplicated avatar + creator-name markup.
- **FR-009**: The `BidCard` component in the bids workspace MUST use `ListingHeader` to show the target resource's first image (or creator avatar fallback), creator name, and resource title.
- **FR-010**: The claim card rendering in the claims workspace MUST use `ListingHeader` to show the target need's first image (or creator avatar fallback), creator name, and need title.
- **FR-011**: The `RESOURCE_CONVERSATION_QUERY` and `CLAIM_CONVERSATION_QUERY` in `frontend/src/features/chat/chat.queries.ts` MUST be extended to fetch the counterparty account's `displayName` and `externalSubject`, and the listing's `imageUrls` (first element only).
- **FR-012**: The `ThreadHeader` component inside `ConversationThread.tsx` MUST use `ListingHeader` instead of its current title-only `Link` / `Typography` block.
- **FR-013**: All i18n strings introduced by this feature MUST use the project's existing i18n approach with EN and FR locale files.
- **FR-014**: The `ListingHeader` component MUST be covered by at least one Storybook story or dedicated unit test demonstrating the image-present and image-absent states.

### Key Entities *(include if feature involves data)*

- **NeedImage**: A URL string in the `need.image_urls` array, stored and normalised the same way as `resource.image_urls`.
- **ListingHeader**: A stateless React component that renders the compact visual identity strip (thumbnail or avatar fallback, creator name, listing title) shared across all card and thread header surfaces.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100 percent of need creation and edit flows allow image upload and persist the URLs correctly.
- **SC-002**: 100 percent of surfaces that display a resource or need (search cards, contribute cards, bids workspace cards, claims workspace cards, conversation thread header) use `ListingHeader` for the identity row.
- **SC-003**: 100 percent of listings without images display the creator avatar fallback with no broken image element on any surface.
- **SC-004**: 100 percent of conversation thread headers show the counterparty name and listing title (with thumbnail if available) after this feature lands.
- **SC-005**: All existing `ResourceCard` and `NeedCard` tests continue to pass after the header row is delegated to `ListingHeader`.
