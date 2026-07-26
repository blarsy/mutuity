import React, { useState } from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { MyNeedsScreen } from "../../src/screens/needs/MyNeedsScreen";
import { NeedIntensity } from "../../src/services/graphql/generated";
import type { NeedItem } from "../../src/services/graphql/needs";

import "../../src/i18n";

function CreateNeedHarness(): React.JSX.Element {
  const [needs, setNeeds] = useState<NeedItem[]>([]);

  return React.createElement(MyNeedsScreen, {
    creatorAccountId: "123e4567-e89b-12d3-a456-426614174000",
    injectedNeeds: needs,
    onAddNeed: () => {
      setNeeds((previous) => [
        {
          id: "need-created",
          title: "Urgent grocery pickup",
          description: "Need someone to help before 7pm",
          proposedTokenAmount: 25,
          intensity: NeedIntensity.Commitment,
          createdAt: "2026-07-25T12:00:00.000Z",
          creatorAccountId: "123e4567-e89b-12d3-a456-426614174000",
          claimCount: 0,
          isClaimedByCurrentAccount: false
        },
        ...previous
      ]);
    },
    onEditNeed: () => undefined
  }
  );
}

describe("US2 create need acceptance", () => {
  it("create need and see it in lists", () => {
    const screen = render(
      React.createElement(SafeAreaProvider, null, React.createElement(CreateNeedHarness))
    );

    fireEvent.press(screen.getAllByRole("button", { name: "Add need" })[0]);

    expect(screen.getByTestId("my-need-card-need-created")).toBeTruthy();
    expect(screen.getByLabelText("Urgent grocery pickup. 25 token.")).toBeTruthy();
  });
});
