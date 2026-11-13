import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { CampaignModerationScreen } from "../../src/screens/campaigns/CampaignModerationScreen";
import { CampaignDetailScreen } from "../../src/screens/campaigns/CampaignDetailScreen";
import type { CampaignItem } from "../../src/services/graphql/campaigns";
import { CampaignModerationStatus } from "../../src/services/graphql/generated";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? _key,
    i18n: { language: "en" }
  })
}));

jest.mock("../../src/services/graphql/campaignModeration", () => ({
  fetchCampaignModerationHistory: jest.fn().mockResolvedValue([
    { eventType: "campaign_approved", body: "Looks good", createdAt: "2026-07-25T12:00:00.000Z" }
  ]),
  fetchCampaignNeedTriage: jest.fn().mockResolvedValue([
    {
      campaignId: "campaign-1",
      needId: "need-1",
      status: "PENDING",
      campaignTitle: "Community garden",
      title: "Gardening volunteers",
      intensity: "COMMITMENT",
      proposedTokens: 10
    }
  ]),
  fetchCampaignResourceTriage: jest.fn().mockResolvedValue([
    {
      campaignId: "campaign-1",
      resourceId: "resource-1",
      status: "PENDING",
      campaignTitle: "Community garden",
      title: "Community garden tools",
      location: "Central park",
      defaultTokens: 15
    }
  ]),
  triageCampaignNeed: jest.fn().mockResolvedValue(undefined),
  triageCampaignResource: jest.fn().mockResolvedValue(undefined)
}));

jest.mock("../../src/services/graphql/campaigns", () => ({
  fetchCampaignById: jest.fn().mockResolvedValue(null)
}));

import { triageCampaignNeed, triageCampaignResource } from "../../src/services/graphql/campaignModeration";

const campaign: CampaignItem = {
  id: "campaign-1",
  title: "Community garden",
  theme: "Gardening",
  description: "Grow together.",
  imageUrl: null,
  startAt: "2026-08-01T00:00:00.000Z",
  airdropAt: "2026-08-15T00:00:00.000Z",
  endAt: "2026-09-01T00:00:00.000Z",
  createdAt: "2026-07-25T12:00:00.000Z",
  creatorAccountId: "account-1",
  moderationStatus: CampaignModerationStatus.Approved,
  resourceCount: 1,
  needCount: 1,
  rewardsMultiplier: 5,
  airdropAmount: 3000
};

function renderScreen(): ReturnType<typeof render> {
  return render(
    <SafeAreaProvider>
      <PaperProvider>
        <CampaignModerationScreen campaign={campaign} creatorAccountId="account-1" />
      </PaperProvider>
    </SafeAreaProvider>
  );
}

describe("CampaignModerationScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("hides the approved campaign form and details while keeping the notice", async () => {
    const screen = renderScreen();
    await waitFor(() => expect(screen.getByText("Community garden tools")).toBeTruthy());

    expect(screen.getByText("This campaign has been approved and can no longer be modified.")).toBeTruthy();
    expect(screen.queryByLabelText("Title")).toBeNull();
    expect(screen.queryByTestId("campaign-details")).toBeNull();
    expect(screen.queryByTestId("campaign-created-at")).toBeNull();
    expect(screen.queryByRole("button", { name: "Save campaign" })).toBeNull();
  });

  it("keeps the moderation form editable and save available before approval", () => {
    const pendingCampaign = { ...campaign, moderationStatus: CampaignModerationStatus.Pending };
    const screen = render(
      <CampaignDetailScreen
        campaign={pendingCampaign}
        creatorAccountId="account-1"
        moderationMode
      />
    );

    expect(screen.getByLabelText("Title").props.editable).toBe(true);
    expect(screen.getByRole("button", { name: "Save campaign" })).toBeTruthy();
    expect(screen.queryByText("This campaign has been approved and can no longer be modified.")).toBeNull();
  });

  it("opens the journal by default, keeps it collapsible, and supports linked-entry triage", async () => {
    const screen = renderScreen();

    await waitFor(() => expect(screen.getByText("Community garden tools")).toBeTruthy());
    await waitFor(() => expect(screen.getByText("Looks good")).toBeTruthy());
    expect(screen.getByTestId("campaign-moderation-journal-toggle").props.accessibilityState.expanded).toBe(true);
    fireEvent.press(screen.getByTestId("campaign-moderation-journal-toggle"));
    expect(screen.queryByText("Looks good")).toBeNull();
    fireEvent.press(screen.getByTestId("campaign-moderation-journal-toggle"));
    await waitFor(() => expect(screen.getByText("Looks good")).toBeTruthy());
    expect(screen.getByText(/Campaign approved/)).toBeTruthy();

    expect(screen.getByText("Gardening volunteers")).toBeTruthy();

    fireEvent.press(screen.getAllByRole("button", { name: "Approve" })[0]);
    await waitFor(() => {
      expect(triageCampaignResource).toHaveBeenCalledWith("campaign-1", "resource-1", "accept");
    });
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: "Approve" })[0].props.accessibilityState?.disabled).not.toBe(true);
    });

    fireEvent.press(screen.getAllByRole("button", { name: "Approve" })[1]);
    await waitFor(() => {
      expect(triageCampaignNeed).toHaveBeenCalledWith("campaign-1", "need-1", "accept");
    });
  });
});
