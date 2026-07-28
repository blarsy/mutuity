import React, { useState } from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { MyCampaignsScreen } from "../../src/screens/campaigns/MyCampaignsScreen";
import { CampaignModerationStatus } from "../../src/services/graphql/generated";
import type { CampaignItem } from "../../src/services/graphql/campaigns";

import "../../src/i18n";

function CreateCampaignHarness(): React.JSX.Element {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);

  return React.createElement(MyCampaignsScreen, {
    creatorAccountId: "123e4567-e89b-12d3-a456-426614174000",
    injectedCampaigns: campaigns,
    onAddCampaign: () => {
      setCampaigns((previous) => [
        {
          id: "campaign-pending",
          title: "Summer community garden project",
          description: "Help establish a community garden in the park",
          startAt: "2026-08-01T00:00:00.000Z",
          airdropAt: "2026-08-15T00:00:00.000Z",
          endAt: "2026-09-01T00:00:00.000Z",
          createdAt: "2026-07-25T12:00:00.000Z",
          creatorAccountId: "123e4567-e89b-12d3-a456-426614174000",
          moderationStatus: CampaignModerationStatus.Pending,
          resourceCount: 0,
          needCount: 0,
          theme: ""
        },
        ...previous
      ]);
    },
    onEditCampaign: () => undefined
  });
}

describe("US3 create campaign pending acceptance", () => {
  it("new campaign appears as pending", () => {
    const screen = render(
      React.createElement(SafeAreaProvider, null, React.createElement(CreateCampaignHarness))
    );

    fireEvent.press(screen.getAllByRole("button", { name: /add campaign|new campaign/i })[0]);

    expect(screen.getByTestId("campaign-card-campaign-pending")).toBeTruthy();
    expect(screen.getByText("Summer community garden project")).toBeTruthy();
    expect(screen.getByLabelText(/pending|awaiting approval/i)).toBeTruthy();
  });
});

