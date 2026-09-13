import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ChatDetailScreen, type ChatDetailConversation } from "../../src/screens/chat/ChatDetailScreen";

import "../../src/i18n";

jest.mock("../../src/components/chat/MessageComposer", () => ({
  MessageComposer: () => null
}));

const conversation: ChatDetailConversation = {
  id: "conversation-1",
  otherAccountId: "account-1",
  otherAccountDisplayName: "Alex",
  otherAccountAvatarUrl: null,
  linkedResourceId: "listing-1",
  linkedResourceTitle: "A useful listing",
  linkedResourceImageUrl: "https://example.com/listing.jpg"
};

function renderChat(
  conversationKind: "resource" | "need",
  onOpenLinkedResource: (id: string) => void,
  onOpenLinkedNeed: (id: string) => void
) {
  return render(
    <SafeAreaProvider>
      <PaperProvider>
        <ChatDetailScreen
          conversationKind={conversationKind}
          conversation={conversation}
          messages={[]}
          onBackToList={jest.fn()}
          onOpenLinkedResource={onOpenLinkedResource}
          onOpenLinkedNeed={onOpenLinkedNeed}
        />
      </PaperProvider>
    </SafeAreaProvider>
  );
}

describe("ChatDetailScreen listing navigation", () => {
  it("opens a resource from both its image and title", () => {
    const onOpenLinkedResource = jest.fn();
    const screen = renderChat("resource", onOpenLinkedResource, jest.fn());

    fireEvent.press(screen.getByLabelText("Alex. A useful listing"), { stopPropagation: jest.fn() });
    fireEvent.press(screen.getByLabelText("A useful listing"), { stopPropagation: jest.fn() });

    expect(onOpenLinkedResource).toHaveBeenNthCalledWith(1, "listing-1");
    expect(onOpenLinkedResource).toHaveBeenNthCalledWith(2, "listing-1");
  });

  it("opens a need from both its image and title", () => {
    const onOpenLinkedResource = jest.fn();
    const onOpenLinkedNeed = jest.fn();
    const screen = renderChat("need", onOpenLinkedResource, onOpenLinkedNeed);

    fireEvent.press(screen.getByLabelText("Alex. A useful listing"), { stopPropagation: jest.fn() });
    fireEvent.press(screen.getByLabelText("A useful listing"), { stopPropagation: jest.fn() });

    expect(onOpenLinkedNeed).toHaveBeenCalledTimes(2);
    expect(onOpenLinkedNeed).toHaveBeenCalledWith("listing-1");
    expect(onOpenLinkedResource).not.toHaveBeenCalled();
  });
});