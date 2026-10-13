import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";

import { SentBidsScreen } from "../../src/screens/bids/SentBidsScreen";
import { ReceivedBidsScreen } from "../../src/screens/bids/ReceivedBidsScreen";
import type { BidWorkspaceItem } from "../../src/screens/bids/types";
import { MyClaimsScreen } from "../../src/screens/claims/MyClaimsScreen";
import { NeedClaimStatus } from "../../src/services/graphql/generated";
import type { NeedClaimItem } from "../../src/services/graphql/needs";
import "../../src/i18n";

jest.mock("../../src/assets/img/CHAT.svg", () => () => null);
jest.mock("../../src/components/TokenAmount", () => ({ TokenAmount: () => null }));

const claim: NeedClaimItem = {
  id: "claim-1",
  needId: "need-1",
  needTitle: "Help with repairs",
  needImageUrl: null,
  message: "I can help",
  conversationId: "claim-conversation-1",
  createdAt: null,
  updatedAt: null,
  status: NeedClaimStatus.Settled,
  claimerAccountId: "claimer-1",
  claimerDisplayName: "Alex",
  claimerAvatarUrl: null,
  ownerAccountId: "owner-1",
  ownerDisplayName: "Sam",
  ownerAvatarUrl: null
};

describe.each(["sent", "received"] as const)("%s workspace chat buttons", (direction) => {
  it("always shows claim chat, including settled claims and absent conversations", async () => {
    const onOpenConversation = jest.fn();
    const onOpenChat = jest.fn();
    const screen = render(
      <PaperProvider>
        <MyClaimsScreen
          direction={direction}
          injectedClaims={[claim, { ...claim, id: "claim-2", conversationId: null }]}
          onOpenConversation={onOpenConversation}
        />
      </PaperProvider>
    );

    fireEvent.press(screen.getByTestId("my-claim-chat-claim-1"));
    expect(onOpenConversation).toHaveBeenCalledWith("claim-conversation-1");
    expect(screen.getByTestId("my-claim-chat-claim-2")).toBeTruthy();
    screen.rerender(
      <PaperProvider>
        <MyClaimsScreen direction={direction} injectedClaims={[claim, { ...claim, id: "claim-2", conversationId: null }]} onOpenChat={onOpenChat} />
      </PaperProvider>
    );
    fireEvent.press(screen.getByTestId("my-claim-chat-claim-2"));
    await waitFor(() => expect(onOpenChat).toHaveBeenCalledWith(expect.objectContaining({ id: "claim-2", conversationId: null })));
  });

  it("opens an existing bid conversation without triggering the card action", async () => {
    const bid: BidWorkspaceItem = {
      id: "bid-1",
      direction,
      status: "OPEN",
      title: "Repair tools",
      counterpartyDisplayName: "Alex",
      counterpartyAccountId: "account-1",
      resourceId: "resource-1",
      conversationId: "bid-conversation-1",
      tokenAmount: 100,
      isActive: true,
      updatedAt: null
    };
    const fetchBids = jest.fn().mockResolvedValue([bid, { ...bid, id: "bid-2", conversationId: null }]);
    const onOpenConversation = jest.fn();
    const onOpenChat = jest.fn();
    const onOpenBid = jest.fn();
    const Screen = direction === "sent" ? SentBidsScreen : ReceivedBidsScreen;
    const screen = render(
      <PaperProvider>
        <Screen fetchBids={fetchBids} onOpenConversation={onOpenConversation} onOpenBid={onOpenBid} />
      </PaperProvider>
    );

    await waitFor(() => expect(screen.getByTestId("my-bid-chat-bid-1")).toBeTruthy());
    const stopPropagation = jest.fn();
    fireEvent.press(screen.getByTestId("my-bid-chat-bid-1"), { stopPropagation });
    expect(stopPropagation).toHaveBeenCalled();
    expect(onOpenConversation).toHaveBeenCalledWith("bid-conversation-1");
    expect(onOpenBid).not.toHaveBeenCalled();
    expect(screen.getByTestId("my-bid-chat-bid-2")).toBeTruthy();
    screen.rerender(
      <PaperProvider>
        <Screen fetchBids={fetchBids} onOpenChat={onOpenChat} onOpenBid={onOpenBid} />
      </PaperProvider>
    );
    fireEvent.press(screen.getByTestId("my-bid-chat-bid-2"), { stopPropagation });
    await waitFor(() => expect(onOpenChat).toHaveBeenCalledWith(expect.objectContaining({ id: "bid-2", conversationId: null })));
    expect(onOpenBid).not.toHaveBeenCalled();
  });
});