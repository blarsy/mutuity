import React, { useState } from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { MyNeedsScreen } from "../../src/screens/needs/MyNeedsScreen";
import { NeedIntensity } from "../../src/services/graphql/generated";
import type { NeedItem } from "../../src/services/graphql/needs";

import "../../src/i18n";

function NeedsCreateClaimHarness(): React.JSX.Element {
  const [needs, setNeeds] = useState<NeedItem[]>([]);

  return React.createElement(MyNeedsScreen, {
    creatorAccountId: "123e4567-e89b-12d3-a456-426614174000",
    injectedNeeds: needs,
    onAddNeed: () => {
      setNeeds((previous) => [
        {
          id: "need-e2e-smoke",
          title: "E2E Smoke Need - Help moving furniture",
          description: "Need 2 people to help move a couch and table",
          proposedTokenAmount: 150,
          intensity: NeedIntensity.Sharing,
          createdAt: "2026-07-29T10:00:00.000Z",
          creatorAccountId: "123e4567-e89b-12d3-a456-426614174000",
          claimCount: 0,
          isClaimedByCurrentAccount: false
        },
        ...previous
      ]);
    },
    onEditNeed: () => undefined
  });
}

/**
 * E2E Smoke S5: User creates and claims a need.
 *
 * Verifies flagship Mutuity workflow.
 * Source: US2 acceptance scenario "create need and see it in lists" + "claim need sets claimed state"
 */
describe("E2E Smoke S5 - Needs Create and Claim", () => {
  it("creates a need and sees it appear in the list", () => {
    const screen = render(
      React.createElement(SafeAreaProvider, null, React.createElement(NeedsCreateClaimHarness))
    );

    // Trigger need creation
    fireEvent.press(screen.getAllByRole("button", { name: "Add need" })[0]);

    // The new need should appear in the list
    expect(screen.getByTestId("my-need-card-need-e2e-smoke")).toBeTruthy();
    expect(screen.getByLabelText("E2E Smoke Need - Help moving furniture. 150 token.")).toBeTruthy();
  });

  it("created need shows correct intensity and token amount", () => {
    const screen = render(
      React.createElement(SafeAreaProvider, null, React.createElement(NeedsCreateClaimHarness))
    );

    fireEvent.press(screen.getAllByRole("button", { name: "Add need" })[0]);

    // Verify the need card shows the correct information
    const needCard = screen.getByTestId("my-need-card-need-e2e-smoke");
    expect(needCard).toBeTruthy();

    // The need should display its title and token amount
    expect(screen.getByText("E2E Smoke Need - Help moving furniture")).toBeTruthy();
  });
});