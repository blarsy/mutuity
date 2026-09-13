import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { NeedDetailScreen } from "../../src/screens/needs/NeedDetailScreen";
import { NeedClaimStatus, NeedIntensity } from "../../src/services/graphql/generated";
import type { NeedDetailItem } from "../../src/services/graphql/needs";

import "../../src/i18n";

const mockClaimNeedById = jest.fn();

jest.mock("../../src/services/graphql/needs", () => ({
  ...jest.requireActual("../../src/services/graphql/needs"),
  claimNeedById: (...args: unknown[]) => mockClaimNeedById(...args)
}));

jest.mock("../../src/components/TokenAmount", () => ({
  TokenAmount: () => null
}));

jest.mock("../../src/assets/img/CHAT.svg", () => () => null);

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
  ownClaim: null,
  claimCount: 0,
  isClaimedByCurrentAccount: false
};

describe("NeedDetailScreen", () => {
  beforeEach(() => {
    mockClaimNeedById.mockReset();
  });

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

  it("shows chat and claim actions to a signed-in non-owner", async () => {
    const onOpenNeedChat = jest.fn();
    mockClaimNeedById.mockResolvedValue({ id: "claim-1", needId: need.id, status: "OPEN" });
    const screen = render(
      <SafeAreaProvider>
        <PaperProvider>
          <NeedDetailScreen
            needId={need.id}
            need={need}
            currentAccountId="account-2"
            onOpenNeedChat={onOpenNeedChat}
          />
        </PaperProvider>
      </SafeAreaProvider>
    );

    fireEvent.press(screen.getByLabelText("Chat"));
    expect(onOpenNeedChat).toHaveBeenCalledWith(need);

    fireEvent.press(screen.getByLabelText("Claim need"));
    expect(screen.getByTestId("need-claim-dialog")).toBeTruthy();
    fireEvent.changeText(screen.getByPlaceholderText("Explain how you can help"), "  I can help Saturday.  ");
    fireEvent.press(screen.getByText("Submit claim"));

    await waitFor(() => expect(mockClaimNeedById).toHaveBeenCalledWith(need.id, "I can help Saturday."));
  });

  it("hides chat and claim actions from the need creator", () => {
    const screen = render(
      <SafeAreaProvider>
        <PaperProvider>
          <NeedDetailScreen
            needId={need.id}
            need={need}
            currentAccountId={need.creatorAccountId}
            onOpenNeedChat={jest.fn()}
          />
        </PaperProvider>
      </SafeAreaProvider>
    );

    expect(screen.queryByLabelText("Chat")).toBeNull();
    expect(screen.queryByLabelText("Claim need")).toBeNull();
  });

  it("prefills and updates an existing open claim", () => {
    const needWithClaim: NeedDetailItem = {
      ...need,
      ownClaim: {
        id: "claim-1",
        message: "I am available Sunday.",
        status: NeedClaimStatus.Open
      }
    };
    const screen = render(
      <SafeAreaProvider>
        <PaperProvider>
          <NeedDetailScreen
            needId={need.id}
            need={needWithClaim}
            currentAccountId="account-2"
          />
        </PaperProvider>
      </SafeAreaProvider>
    );

    fireEvent.press(screen.getByLabelText("Update claim note"));

    expect(screen.getByText("Update your claim")).toBeTruthy();
    expect(screen.getByDisplayValue("I am available Sunday.")).toBeTruthy();
    expect(screen.getByText("Save claim")).toBeTruthy();
  });
});