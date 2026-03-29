# Quickstart: Campaign And Need Management

## Goal
Validate the Feature 1 workflow end-to-end in a local development environment.

## Prerequisites
- PostGraphile API server running locally
- Graphile Worker process running locally
- Frontend application running locally
- PostgreSQL database available with latest migrations applied
- At least two accounts available:
  - one standard account
  - one Mutuity manager account

## Runtime Notes
- Ensure PostGraphile is connected with the same DB role and schema settings expected in development.
- Ensure Graphile Worker is connected to the same database so recurring and deferred tasks are visible in local logs.

## Scenario 1: Create Campaign
1. Sign in as a standard account.
2. Open the campaign creation screen.
3. Submit a valid campaign with:
   - title
   - theme
   - rewards multiplier between 5 and 10
   - start datetime
   - airdrop datetime within campaign bounds
   - airdrop amount between 3000 and 8000
   - end datetime
4. Verify the campaign is created with `pending` moderation status.
5. Verify the campaign is not visible on the public interface.

## Scenario 2: Manager Moderates And Approves Campaign
1. Sign in as Mutuity manager.
2. Open pending campaigns.
3. Add a moderation note to the created campaign.
4. Verify the campaign creator can see the note.
5. Approve the campaign.
6. Verify the campaign is now visible on the public interface.

## Scenario 3: Create Standalone Need
1. Sign in as a standard account.
2. Open need creation screen.
3. Create a need with valid title, location, intensity, and nature flags.
4. Optionally set a Topes amount matching the intensity range.
5. Verify the need is stored successfully.

## Scenario 4: Create Need Linked To Campaign
1. Sign in as a standard account.
2. Create a need and link it to an approved active campaign.
3. Verify the need is created.
4. Verify the campaign association is stored with `pending` triage status.

## Scenario 5: Campaign Creator Triages Linked Need
1. Sign in as the creator of the campaign.
2. Open campaign-linked needs.
3. Accept one linked need.
4. Reject another linked need.
5. Verify state transitions and audit history are visible.

## Validation Checks
- Invalid rewards multiplier is rejected.
- Invalid airdrop amount is rejected.
- Invalid datetime ordering is rejected.
- Invalid Topes amount for selected intensity is rejected.
- Non-manager cannot approve campaign or create moderation note.
- Non-creator cannot triage campaign-linked needs.
