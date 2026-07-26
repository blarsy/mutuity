import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { SearchNeedsScreen } from "../../src/screens/needs/SearchNeedsScreen";
import { NeedIntensity } from "../../src/services/graphql/generated";
import type { NeedItem } from "../../src/services/graphql/needs";

import "../../src/i18n";

const injectedNeeds: NeedItem[] = [
  {
    id: "need-claim-target",
    title: "Need wheelchair ramp",
    description: "Need help for one-day event",
    proposedTokenAmount: 35,
    intensity: NeedIntensity.Commitment,
    createdAt: "2026-07-25T12:00:00.000Z",
    creatorAccountId: "00000000-0000-0000-0000-000000000002",
    claimCount: 0,
    isClaimedByCurrentAccount: false
  }
];

describe("US2 claim need acceptance", () => {
  it("claim need sets claimed state and blocks duplicate claim", async () => {
    const onClaimNeed = jest.fn(async () => undefined);
    const screen = render(
      React.createElement(
        SafeAreaProvider,
        null,
        React.createElement(SearchNeedsScreen, {
          needs: injectedNeeds,
          currentAccountId: "123e4567-e89b-12d3-a456-426614174000",
          onClaimNeed
        })
      )
    );

    const claimButton = screen.getByTestId("need-card-claim-need-claim-target");
    fireEvent.press(claimButton);

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: "Claimed" }).length).toBeGreaterThan(0);
    });

    fireEvent.press(screen.getByTestId("need-card-claim-need-claim-target"));

    expect(onClaimNeed).toHaveBeenCalledTimes(1);
  });
});
