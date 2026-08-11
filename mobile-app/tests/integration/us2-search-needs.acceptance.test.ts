import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { SearchNeedsScreen } from "../../src/screens/needs/SearchNeedsScreen";
import { NeedIntensity } from "../../src/services/graphql/generated";
import type { NeedItem } from "../../src/services/graphql/needs";

import "../../src/i18n";

jest.mock("../../src/services/graphql/campaigns", () => ({
  fetchLinkableCampaigns: jest.fn().mockResolvedValue([
    { id: "campaign-education", title: "Education" },
    { id: "campaign-mobility", title: "Mobility" }
  ])
}));

const injectedNeeds: NeedItem[] = [
  {
    id: "need-sharing",
    title: "Library desk lamp",
    description: "Need a lamp for evening study",
    proposedTokenAmount: 10,
    intensity: NeedIntensity.Sharing,
    campaignId: "campaign-education",
    createdAt: "2026-07-24T12:00:00.000Z",
    creatorAccountId: "00000000-0000-0000-0000-000000000001",
    claimCount: 0,
    isClaimedByCurrentAccount: false
  },
  {
    id: "need-urgent",
    title: "Urgent child seat",
    description: "Need today for carpool",
    proposedTokenAmount: 40,
    intensity: NeedIntensity.Commitment,
    campaignId: "campaign-mobility",
    createdAt: "2026-07-25T12:00:00.000Z",
    creatorAccountId: "00000000-0000-0000-0000-000000000001",
    claimCount: 0,
    isClaimedByCurrentAccount: false
  }
];

describe("US2 search needs acceptance", () => {
  it("search needs with filters", () => {
    const screen = render(
      React.createElement(
        SafeAreaProvider,
        null,
        React.createElement(
          PaperProvider,
          null,
          React.createElement(SearchNeedsScreen, {
            needs: injectedNeeds,
            currentAccountId: "123e4567-e89b-12d3-a456-426614174000"
          })
        )
      )
    );

    expect(screen.getByPlaceholderText("Search needs")).toBeTruthy();

    fireEvent.changeText(screen.getByPlaceholderText("Search needs"), "child");
    expect(screen.getByTestId("need-card-need-urgent")).toBeTruthy();

    fireEvent.changeText(screen.getByLabelText("Max token amount"), "20");
    expect(screen.queryByTestId("need-card-need-urgent")).toBeNull();

    fireEvent.changeText(screen.getByPlaceholderText("Search needs"), "");
    fireEvent.press(screen.getByTestId("need-intensity-chip-sharing"));

    expect(screen.getByTestId("need-card-need-sharing")).toBeTruthy();
    expect(screen.queryByTestId("need-card-need-urgent")).toBeNull();
  });

  it("filters by zero to many campaigns", async () => {
    const screen = render(
      React.createElement(
        SafeAreaProvider,
        null,
        React.createElement(
          PaperProvider,
          null,
          React.createElement(SearchNeedsScreen, {
            needs: injectedNeeds,
            currentAccountId: "123e4567-e89b-12d3-a456-426614174000"
          })
        )
      )
    );

    expect(screen.getByTestId("need-card-need-sharing")).toBeTruthy();
    expect(screen.getByTestId("need-card-need-urgent")).toBeTruthy();

    fireEvent.press(screen.getByTestId("needs-campaign-filter-button"));
    await waitFor(() => expect(screen.getByText("Education")).toBeTruthy());
    fireEvent.press(screen.getByText("Education"));
    fireEvent.press(screen.getByText("OK"));

    expect(screen.getByTestId("need-card-need-sharing")).toBeTruthy();
    expect(screen.queryByTestId("need-card-need-urgent")).toBeNull();

    fireEvent.press(screen.getByTestId("needs-campaign-filter-button"));
    fireEvent.press(screen.getByText("Mobility"));
    fireEvent.press(screen.getByText("OK"));

    expect(screen.getByTestId("need-card-need-sharing")).toBeTruthy();
    expect(screen.getByTestId("need-card-need-urgent")).toBeTruthy();
  });
});
