import type { Meta, StoryObj } from "@storybook/react-native";
import React from "react";
import { View } from "react-native";

import { BidsListScreen } from "./BidsListScreen";
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
  },
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
  },
  {
    id: "bid-003",
    direction: "sent",
    status: "WITHDRAWN",
    title: "Moving help (3h)",
    counterpartyDisplayName: "Lucas",
    counterpartyAccountId: "acc-lucas",
    resourceId: "resource-003",
    conversationId: "conversation-003",
    createdAt: "2026-07-20T14:00:00.000Z",
    validUntil: "2026-07-20T18:00:00.000Z",
    tokenAmount: 100,
    isActive: false,
    updatedAt: "2026-07-20T16:00:00.000Z"
  }
];

const meta = {
  title: "Screens/BidsListScreen",
  component: BidsListScreen,
  args: {
    title: "My Bids",
    testID: "bids-list-screen",
    fetchBids: async () => SAMPLE_BIDS,
    onRetry: () => undefined,
    onOpenBid: () => undefined,
    onBackToMyHub: () => undefined
  }
} satisfies Meta<typeof BidsListScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

function Frame({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <View style={{ minHeight: 640 }}>{children}</View>;
}

export const Default: Story = {
  render: (args) => (
    <Frame>
      <BidsListScreen {...args} />
    </Frame>
  )
};

export const Empty: Story = {
  args: {
    fetchBids: async () => []
  },
  render: (args) => (
    <Frame>
      <BidsListScreen {...args} />
    </Frame>
  )
};

export const ErrorState: Story = {
  args: {
    fetchBids: async () => {
      throw new Error("Failed to load bids");
    }
  },
  render: (args) => (
    <Frame>
      <BidsListScreen {...args} />
    </Frame>
  )
};

export const InactiveIncluded: Story = {
  args: {
    includeInactiveDefault: true
  },
  render: (args) => (
    <Frame>
      <BidsListScreen {...args} />
    </Frame>
  )
};