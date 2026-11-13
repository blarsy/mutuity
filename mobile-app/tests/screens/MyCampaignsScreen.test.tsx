import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";

import { MyCampaignsScreen } from "../../src/screens/campaigns/MyCampaignsScreen";
import { CampaignModerationStatus } from "../../src/services/graphql/generated";
import type { CampaignItem } from "../../src/services/graphql/campaigns";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? _key
  })
}));

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
  moderationStatus: CampaignModerationStatus.Pending,
  resourceCount: 0,
  needCount: 0
};

describe("MyCampaignsScreen card actions", () => {
  it("opens the public campaign from the card body and moderation from its separate action", () => {
    const onOpenCampaign = jest.fn();
    const onModerateCampaign = jest.fn();
    const screen = render(
      <PaperProvider>
        <MyCampaignsScreen
          creatorAccountId="account-1"
          injectedCampaigns={[campaign]}
          injectedLoading={false}
          onAddCampaign={jest.fn()}
          onOpenCampaign={onOpenCampaign}
          onModerateCampaign={onModerateCampaign}
        />
      </PaperProvider>
    );

    fireEvent.press(screen.getByTestId("campaign-card-campaign-1"));
    expect(onOpenCampaign).toHaveBeenCalledWith(campaign);
    expect(onModerateCampaign).not.toHaveBeenCalled();

    fireEvent.press(screen.getByTestId("campaign-card-moderation-campaign-1"));
    expect(onModerateCampaign).toHaveBeenCalledWith(campaign);
    expect(onOpenCampaign).toHaveBeenCalledTimes(1);
  });
});
