# Quickstart: Resource Discovery And Publishing

## Objective

Validate the first merged-product resource flow: browsing active resources, publishing them with the correct modality/intensity semantics, and creating bids only on eligible resources.

## Prerequisites
- local stack running for the unified Mutuity workspace
- at least two authenticated accounts available: one resource creator and one bidder
- database migrated to include the resource and bid model used by this feature

## Suggested manual QA scenarios

### Scenario 1: Browse active resources
1. Seed or create several resources at different distances from the test location.
2. Ensure at least one resource is expired and one has no expiration datetime.
3. Open the public resource browsing page.
4. Verify:
   - expired resources do not appear
   - resources with no expiration remain visible
   - closer resources appear first
   - ties on distance are ordered by most recent creation first

### Scenario 2: Use the six tri-state modality filters
1. Leave all six modality filters at `neutral`.
2. Verify that resources are not excluded merely because a flag is true or false.
3. Switch one filter to `yes` and confirm only matching resources remain.
4. Switch the same filter to `no` and confirm only false-valued resources remain.
5. Repeat for at least one additional flag.

### Scenario 3: Publish a resource
1. Sign in as a resource creator.
2. Create a resource with:
   - title
   - optional rich-text description
   - one or more categories
   - location
   - required `intensity`
   - optional Topes reference amount consistent with the selected intensity
   - any intended combination of the six modality flags
3. Verify the resource appears in browse results when eligible.

### Scenario 4: Validate the Topes reference amount behavior
1. Create one resource with no Topes reference amount.
2. Create another with a Topes reference amount that matches the chosen intensity range.
3. Verify the UI does not label this field as `price`.
4. Start a bid and confirm the reference amount appears as the default proposed amount when set.

### Scenario 5: Prevent bidding on expired resources
1. Create or edit a resource so its expiration datetime is in the past.
2. Attempt to place a bid on it as a non-owner account.
3. Verify the action is rejected and no bid is stored.

### Scenario 6: Rich-text description handling
1. Publish a resource with formatted description content.
2. Open the detail page and verify the rich-text formatting renders safely.
3. Attempt to exceed the 8000-character limit and confirm validation blocks the submission.

## Suggested verification commands

```bash
npm --workspace frontend run typecheck
npm --workspace backend run typecheck
npm --workspace frontend test -- --runInBand
npm --workspace backend test -- --runInBand
```

Add narrower resource-specific commands once implementation lands.