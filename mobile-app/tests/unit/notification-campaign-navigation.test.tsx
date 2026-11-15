import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { US3Navigator } from "../../src/navigation/US3Navigator";
import { fetchCampaignById } from "../../src/services/graphql/campaigns";
jest.mock("../../src/services/graphql/campaigns", () => ({ fetchCampaignById: jest.fn() }));
jest.mock("../../src/screens/campaigns/MyCampaignsScreen", () => ({ MyCampaignsScreen: () => null }));
jest.mock("../../src/screens/campaigns/CampaignDetailScreen", () => ({ CampaignDetailScreen: () => null }));
jest.mock("../../src/screens/campaigns/CampaignPublicInfoScreen", () => ({ CampaignPublicInfoScreen: () => {
  const React = require("react");
  return React.createElement(require("react-native").Text, null, "Public campaign");
} }));
jest.mock("../../src/screens/campaigns/CampaignModerationScreen", () => ({ CampaignModerationScreen: () => {
  const React = require("react");
  return React.createElement(require("react-native").Text, null, "Campaign moderation");
} }));

it.each([true, false])("honors the notification moderation destination %s", async moderation => {
  (fetchCampaignById as jest.Mock).mockResolvedValue({ id: "campaign-123", creatorAccountId: "owner" });
  const consume = jest.fn();
  const screen = render(<US3Navigator currentAccountId="owner" pendingCampaignId="campaign-123" pendingCampaignModeration={moderation} onConsumePendingCampaign={consume} />);
  await waitFor(() => expect(screen.getByText(moderation ? "Campaign moderation" : "Public campaign")).toBeTruthy());
  expect(fetchCampaignById).toHaveBeenCalledWith("campaign-123");
  expect(consume).toHaveBeenCalledTimes(1);
});