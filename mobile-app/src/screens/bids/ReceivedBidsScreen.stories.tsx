import type { Meta, StoryObj } from "@storybook/react-native";
import React from "react";
import { View } from "react-native";

import { ReceivedBidsScreen } from "./ReceivedBidsScreen";
import type { BidWorkspaceItem } from "./types";

const SAMPLE_BIDS: BidWorkspaceItem[] = [
  {
    id: "bid-002",
    direction: "received",
    status: "OPEN",
    title: "English tutoring session",
    counterpartyDisplayName: "Karim",
    counterpartyAccountId: "acc-karim",
    resourceId: "resource-002",
    conversationId: null,
    createdAt: "2026-07-27T08:30:00.000Z",
    validUntil: "2026-07-28T08:30:00.000Z",
    tokenAmount: 30,
    isActive: true,
    updatedAt: "2026-07-27T09:30:00.000Z"
  }
];

const meta = {
  title: "Screens/ReceivedBidsScreen",
  component: ReceivedBidsScreen,
  args: {
    fetchBids: async () => SAMPLE_BIDS
  }
} satisfies Meta<typeof ReceivedBidsScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

function Frame({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <View style={{ minHeight: 640 }}>{children}</View>;
}

export const Default: Story = {
  render: (args) => (
    <Frame>
      <ReceivedBidsScreen {...args} />
    </Frame>
  )
};