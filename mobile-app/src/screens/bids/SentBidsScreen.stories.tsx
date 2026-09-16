import type { Meta, StoryObj } from "@storybook/react-native";
import React from "react";
import { View } from "react-native";

import { SentBidsScreen } from "./SentBidsScreen";
import type { BidWorkspaceItem } from "./types";

const SAMPLE_BIDS: BidWorkspaceItem[] = [
  {
    id: "bid-001",
    direction: "sent",
    status: "OPEN",
    title: "Cargo bike weekend rental",
    counterpartyDisplayName: "Marie",
    counterpartyAccountId: "acc-marie",
    resourceId: "resource-001",
    conversationId: "conversation-001",
    createdAt: "2026-07-28T10:00:00.000Z",
    validUntil: "2026-07-29T10:00:00.000Z",
    tokenAmount: 45,
    isActive: true,
    updatedAt: "2026-07-28T14:00:00.000Z"
  }
];

const meta = {
  title: "Screens/SentBidsScreen",
  component: SentBidsScreen,
  args: {
    fetchBids: async () => SAMPLE_BIDS
  }
} satisfies Meta<typeof SentBidsScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

function Frame({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <View style={{ minHeight: 640 }}>{children}</View>;
}

export const Default: Story = {
  render: (args) => (
    <Frame>
      <SentBidsScreen {...args} />
    </Frame>
  )
};