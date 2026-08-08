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
  });
});