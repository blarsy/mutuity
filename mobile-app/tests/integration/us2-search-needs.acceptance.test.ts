import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { SearchNeedsScreen } from "../../src/screens/needs/SearchNeedsScreen";
import { NeedIntensity } from "../../src/services/graphql/generated";
import type { NeedItem } from "../../src/services/graphql/needs";

import "../../src/i18n";

const injectedNeeds: NeedItem[] = [
  {
    id: "need-sharing",
    title: "Library desk lamp",
    description: "Need a lamp for evening study",
    proposedTokenAmount: 10,
    intensity: NeedIntensity.Sharing,
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
        React.createElement(SearchNeedsScreen, {
          needs: injectedNeeds,
          currentAccountId: "123e4567-e89b-12d3-a456-426614174000"
        })
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
});
