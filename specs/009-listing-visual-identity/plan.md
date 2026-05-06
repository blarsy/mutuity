# Implementation Plan: Listing Visual Identity

**Branch**: `009-listing-visual-identity` | **Date**: 2026-05-05 | **Spec**: `/specs/009-listing-visual-identity/spec.md`  
**Input**: Feature specification from `/specs/009-listing-visual-identity/spec.md`

## Summary

Two coordinated deliverables shipped in dependency order:

1. **Need images** — add `image_urls` to the `need` table, extend the `create_need` and `update_need` SQL mutations, expose `imageUrls` on the GraphQL `Need` type, and add the `ImageUploadField` control to the need creation and editing forms.
2. **`ListingHeader` shared component** — build a stateless `ListingHeader` React component and replace the duplicated header markup in `ResourceCard`, `NeedCard`, `BidCard` (bids workspace), the claim card (claims workspace), and `ConversationThread`'s `ThreadHeader`.

The second deliverable depends on the first because `NeedCard` callers must be able to pass an `imageUrl` derived from `imageUrls[0]` once the field exists.

## Technical Context

**Language/Version**: TypeScript (strict mode), SQL/PL-pgSQL  
**Primary Dependencies**: Next.js, React, MUI, Apollo Client, PostGraphile, PostgreSQL 16  
**Storage**: PostgreSQL 16  
**Testing**: Jest frontend unit tests  
**Target Platform**: Responsive web  
**Project Type**: Monorepo feature slice  
**Constraints**: `ListingHeader` must be stateless (no data-fetching). `ConversationThread` query extensions must be backward-compatible. Image upload on needs must reuse the existing `ImageUploadField` and URL normalisation logic without duplicating it.

## Constitution Check

- Pass: Image storage for needs mirrors the existing resource pattern; no new storage strategy is introduced.
- Pass: `ListingHeader` is a pure presentational component; no new data layer is required.
- Pass: `ThreadHeader` enrichment extends existing queries rather than adding new endpoints.
- Pass: All callers of `ResourceCard` and `NeedCard` are updated in the same change that delegates the header to `ListingHeader`, keeping the interface consistent.

## Current Baseline And Audit Findings

### Already present in the rebuilt app
- `resource.image_urls text[] not null default '{}'` — established in migration `021`.
- `ImageUploadField` component — exists and is used on resource creation/editing forms.
- `AvatarIconButton` — used in both `ResourceCard` and `NeedCard` for creator avatar display.
- `ResourceCard` — has a full header row with avatar, creator name, expiry chip, and optional image carousel.
- `NeedCard` — has avatar + creator name header but no image support.
- `BidCard` (inline in `bids.tsx`) — shows resource title as a link and a status chip but has no creator avatar or thumbnail.
- Claims workspace claim cards (inline in `claims.tsx`) — uses `NeedCard` for the need summary; no dedicated claim card component yet.
- `ConversationThread` / `ThreadHeader` — shows only the listing title (as a link) and a kind label; no counterparty avatar or listing thumbnail.

### Gaps to close
- `need` table has no `image_urls` column.
- `create_need` and `update_need` mutations do not accept image URLs.
- `Need` GraphQL type does not expose `imageUrls`.
- Need creation/editing forms have no image upload control.
- `BidCard` has no `ListingHeader`-style creator identity strip.
- `ClaimCard` (once extracted as a component) will need the same.
- `ThreadHeader` queries do not fetch counterparty display name or listing image URLs.

## Delivery Slices

### Slice 1 — Need images (database + API)
- Add `image_urls` column to the `need` table via a new migration.
- Extend `create_need` and `update_need` SQL functions to accept and normalise `image_urls`.
- Regenerate or update the PostGraphile-facing schema so `Need.imageUrls` is exposed.
- Update any existing need-related GraphQL query documents in the frontend to optionally request `imageUrls`.

### Slice 2 — Need image upload UI
- Add `ImageUploadField` to the need creation form (wherever it lives in the frontend).
- Add `ImageUploadField` to the need editing form.
- Validate that uploaded URLs round-trip correctly via the updated mutations.

### Slice 3 — `ListingHeader` component
- Create `frontend/src/features/ui/ListingHeader.tsx` with props: `title`, `titleHref?`, `imageUrl?`, `accountName`, `accountImageUrl?`, `accountHref?`.
- Render a fixed-size square thumbnail (`imageUrl`) when present; fall back to `AvatarIconButton` when absent.
- Render `accountName` as a `ButtonBase` / clickable text linking to `accountHref` when provided.
- Render `title` as a link to `titleHref` when provided, otherwise plain text.
- Add a unit test or Storybook story covering image-present and image-absent states.

### Slice 4 — Roll out to `ResourceCard` and `NeedCard`
- Replace the duplicated avatar + creator-name block at the top of `ResourceCard` with `<ListingHeader>`.
  - Pass `imageUrl={imageUrls?.[0]}`, `accountName={creatorName}`, `accountImageUrl={creatorImageUrl}`, `accountHref` (if a prop is added), `title`, `titleHref`.
- Replace the duplicated avatar + creator-name block at the top of `NeedCard` with `<ListingHeader>`.
  - Pass `imageUrl={imageUrls?.[0]}` (new prop) alongside the existing props.
- Update all callers of `NeedCard` to pass `imageUrls` once the column is available.
- Ensure all existing `ResourceCard` and `NeedCard` tests still pass.

### Slice 5 — Roll out to bids and claims workspaces
- Extract an inline `BidCard` component (currently defined inline in `bids.tsx`) or add `ListingHeader` directly to the existing `BidCard` local function.
  - Pass `imageUrl={resource.imageUrls?.[0]}`, `accountName` (creator), `accountImageUrl`, resource `titleHref`.
  - Update the `BID_WORKSPACE_FIELDS` GraphQL fragment to request `accountByCreatorAccountId { imageUrls }` if needed (the account avatar URL is already fetched; only the resource's `imageUrls[0]` needs to be confirmed present in the fragment).
- Add `ListingHeader` to the claim card rendering in `claims.tsx`.
  - Extend `VIEWER_CLAIM_OVERVIEW_QUERY` to fetch `needByNeedId { imageUrls }` and `needByNeedId.accountByCreatorAccountId { imageUrls }` as needed.

### Slice 6 — `ConversationThread` header enrichment
- Extend `RESOURCE_CONVERSATION_QUERY` to also fetch `resourceByResourceId { imageUrls }` and the counterparty's `accountByBidderAccountId { displayName externalSubject }` / `accountByOwnerAccountId { displayName externalSubject }` (whichever is the other party).
- Extend `CLAIM_CONVERSATION_QUERY` similarly for `needByNeedId { imageUrls }` and the counterparty account.
- Update the `ResourceConversationData` and `ClaimConversationData` types in `ConversationThread.tsx`.
- Replace `ThreadHeader`'s current title-link block with `<ListingHeader>` passing the counterparty name, counterparty avatar URL, listing title, listing image URL, and context href.

## Dependencies & Execution Order

1. Slice 1 must land before Slices 2, 4, 5, and 6 (all depend on `imageUrls` being available on `Need`).
2. Slice 3 (`ListingHeader` component) can be built in parallel with Slices 1–2.
3. Slices 4, 5, and 6 can proceed in parallel once Slices 1 and 3 are done.
4. Slice 2 (upload UI) can proceed in parallel with Slices 4–6 once Slice 1 is done.

## Implementation Strategy

1. Land the DB migration and SQL mutation changes first; regenerate the schema.
2. Build `ListingHeader` as a standalone component with tests before touching any existing card.
3. Roll out to `ResourceCard` and `NeedCard` together so the component is immediately exercised by existing pages.
4. Roll out to bids and claims workspaces.
5. Enrich the `ConversationThread` queries and replace `ThreadHeader` last, as it requires the most query surgery.
6. Add the upload UI for needs once the backend is proven.
