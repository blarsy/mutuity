import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { CampaignDetailScreen } from "../../src/screens/campaigns/CampaignDetailScreen";
import type { CampaignItem } from "../../src/services/graphql/campaigns";
import { CampaignModerationStatus } from "../../src/services/graphql/generated";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? _key,
    i18n: { language: "en" }
  })
}));

const newCampaign: CampaignItem = {
  id: "",
  title: "",
  theme: "",
  description: "",
  imageUrl: null,
  startAt: "2026-08-08T00:00:00.000Z",
  airdropAt: "2026-08-23T00:00:00.000Z",
  endAt: "2026-09-07T00:00:00.000Z",
  createdAt: "2026-08-08T00:00:00.000Z",
  creatorAccountId: "00000000-0000-0000-0000-000000000111",
  moderationStatus: CampaignModerationStatus.Pending,
  resourceCount: 0,
  needCount: 0,
  rewardsMultiplier: 5,
  airdropAmount: 3000,
  pendingEntries: []
};

describe("CampaignDetailScreen", () => {
  it("shows validation errors only after the first submit attempt", () => {
    const screen = render(
      <CampaignDetailScreen
        campaign={newCampaign}
        creatorAccountId={newCampaign.creatorAccountId}
        isNew
      />
    );

    expect(screen.queryAllByText("This field is required.")).toHaveLength(0);

    fireEvent.press(screen.getByRole("button", { name: "Create campaign" }));

    expect(screen.getAllByText("This field is required.").length).toBeGreaterThan(0);
    expect(screen.queryByTestId("campaign-created-at")).toBeNull();
  });

  it.each([CampaignModerationStatus.Approved, CampaignModerationStatus.Pending])(
    "shows all saved campaign details for a non-editable %s campaign",
    moderationStatus => {
      const campaign = {
        ...newCampaign,
        id: "campaign-1",
        title: "Community garden",
        description: "Grow together in our neighbourhood.",
        imageUrl: "https://example.com/campaign.jpg",
        moderationStatus
      };
      const screen = render(<CampaignDetailScreen campaign={campaign} creatorAccountId={null} />);
      const format = (value: string) => new Intl.DateTimeFormat("en", {
        year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"
      }).format(new Date(value));

      expect(screen.getByText(`Created: ${format(campaign.createdAt)}`)).toBeTruthy();
      expect(screen.getByText(`Start date: ${format(campaign.startAt)}`)).toBeTruthy();
      expect(screen.getByText(`End date: ${format(campaign.endAt)}`)).toBeTruthy();
      expect(screen.getByText(`Airdrop date: ${format(campaign.airdropAt)}`)).toBeTruthy();
      expect(screen.getByText("Airdrop amount: 3000")).toBeTruthy();
      expect(screen.getByText("Rewards multiplier: 5")).toBeTruthy();
      expect(screen.getByText(campaign.description)).toBeTruthy();
      expect(screen.getByLabelText(campaign.title).props.source).toEqual({ uri: campaign.imageUrl });
    }
  );

  it("shows the saved creation datetime alongside the pending campaign editor", () => {
    const screen = render(
      <CampaignDetailScreen campaign={newCampaign} creatorAccountId={newCampaign.creatorAccountId} />
    );
    expect(screen.getByTestId("campaign-created-at")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save campaign" })).toBeTruthy();
  });
});