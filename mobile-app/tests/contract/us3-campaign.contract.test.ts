import { CampaignModerationStatus } from "../../src/services/graphql/generated";
import { CREATE_CAMPAIGN_MUTATION, UPDATE_CAMPAIGN_BY_ID_MUTATION } from "../../src/services/graphql/operations";
import { normalizeCampaignPayload } from "../../src/services/graphql/campaigns";

describe("US3 campaign contract", () => {
  it("exports the create campaign mutation document", () => {
    expect(CREATE_CAMPAIGN_MUTATION).toBeDefined();
  });

  it("exports the update campaign mutation document", () => {
    expect(UPDATE_CAMPAIGN_BY_ID_MUTATION).toBeDefined();
  });

  it("normalizes campaign payload with pending status", () => {
    const normalized = normalizeCampaignPayload({
      campaign: {
        __typename: "Campaign",
        nodeId: "ABC123",
        id: "00000000-0000-0000-0000-000000000055",
        title: "Test campaign",
        description: "A test campaign",
        startAt: "2026-08-01T00:00:00.000Z",
        endAt: "2026-09-01T00:00:00.000Z",
        moderationStatus: CampaignModerationStatus.Pending,
        createdAt: "2026-07-25T12:00:00.000Z",
        creatorAccountId: "123e4567-e89b-12d3-a456-426614174000"
      } as any
    });

    expect(normalized).toEqual({
      id: "00000000-0000-0000-0000-000000000055",
      title: "Test campaign",
      description: "A test campaign",
      startAt: "2026-08-01T00:00:00.000Z",
      endAt: "2026-09-01T00:00:00.000Z",
      moderationStatus: CampaignModerationStatus.Pending,
      createdAt: "2026-07-25T12:00:00.000Z",
      creatorAccountId: "123e4567-e89b-12d3-a456-426614174000",
      resourceCount: 0,
      needCount: 0
    });
  });

  it("returns null when payload has no campaign id", () => {
    const normalized = normalizeCampaignPayload({
      campaign: {
        __typename: "Campaign",
        nodeId: "ABC123",
        id: null,
        title: "Test campaign",
        description: "A test campaign",
        startAt: "2026-08-01T00:00:00.000Z",
        endAt: "2026-09-01T00:00:00.000Z",
        moderationStatus: CampaignModerationStatus.Pending,
        createdAt: "2026-07-25T12:00:00.000Z",
        creatorAccountId: "123e4567-e89b-12d3-a456-426614174000"
      } as any
    });

    expect(normalized).toBeNull();
  });

  it("transitions campaign status from pending to approved", () => {
    const pendingNormalized = normalizeCampaignPayload({
      campaign: {
        __typename: "Campaign",
        nodeId: "ABC123",
        id: "campaign-123",
        title: "Community project",
        description: "Test project",
        startAt: "2026-08-01T00:00:00.000Z",
        endAt: "2026-09-01T00:00:00.000Z",
        moderationStatus: CampaignModerationStatus.Pending,
        createdAt: "2026-07-25T12:00:00.000Z",
        creatorAccountId: "123e4567-e89b-12d3-a456-426614174000"
      } as any
    });

    const approvedNormalized = normalizeCampaignPayload({
      campaign: {
        __typename: "Campaign",
        nodeId: "ABC123",
        id: "campaign-123",
        title: "Community project",
        description: "Test project",
        startAt: "2026-08-01T00:00:00.000Z",
        endAt: "2026-09-01T00:00:00.000Z",
        moderationStatus: CampaignModerationStatus.Approved,
        createdAt: "2026-07-25T12:00:00.000Z",
        creatorAccountId: "123e4567-e89b-12d3-a456-426614174000"
      } as any
    });

    expect(pendingNormalized?.moderationStatus).toBe(CampaignModerationStatus.Pending);
    expect(approvedNormalized?.moderationStatus).toBe(CampaignModerationStatus.Approved);
  });
});
