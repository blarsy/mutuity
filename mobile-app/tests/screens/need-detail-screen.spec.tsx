import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { NeedDetailScreen } from "../../src/screens/needs/NeedDetailScreen";
import { NeedIntensity } from "../../src/services/graphql/generated";
import type { NeedDetailItem } from "../../src/services/graphql/needs";

import "../../src/i18n";

jest.mock("../../src/components/TokenAmount", () => ({
  TokenAmount: () => null
}));

const need: NeedDetailItem = {
  id: "need-1",
  title: "Help moving a cabinet",
  description: "Two people are needed on Saturday.",
  imageUrls: [],
  location: { label: "Central district" },
  proposedTokenAmount: 120,
  intensity: NeedIntensity.Sharing,
  objectRequired: false,
  competenceRequired: false,
  toolingRequired: false,
  multiplePeopleRequired: true,
  requiredPeopleCount: 2,
  createdAt: "2026-09-01T10:00:00.000Z",
  expiresAt: null,
  creatorAccountId: "account-1",
  creatorDisplayName: "Alex Morgan",
  creatorAvatarUrl: null,
  claimCount: 0,
  isClaimedByCurrentAccount: false
};

describe("NeedDetailScreen", () => {
  it("shows public need information and opens the creator profile", () => {
    const onOpenCreatorAccount = jest.fn();
    const screen = render(
      <SafeAreaProvider>
        <PaperProvider>
          <NeedDetailScreen
            needId={need.id}
            need={need}
            onOpenCreatorAccount={onOpenCreatorAccount}
          />
        </PaperProvider>
      </SafeAreaProvider>
    );

    expect(screen.getByText("Help moving a cabinet")).toBeTruthy();
    expect(screen.getByText("Two people are needed on Saturday.")).toBeTruthy();
    expect(screen.getByText("Multiple people required")).toBeTruthy();
    expect(screen.getByText("Central district")).toBeTruthy();

    fireEvent.press(screen.getByText("Alex Morgan"));
    expect(onOpenCreatorAccount).toHaveBeenCalledWith("account-1");
  });
});