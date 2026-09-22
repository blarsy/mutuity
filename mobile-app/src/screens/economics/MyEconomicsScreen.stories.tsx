import type { Meta, StoryObj } from "@storybook/react-native";
import React from "react";
import { View } from "react-native";

import { MyEconomicsScreen, type ContributionHistoryItem } from "./MyEconomicsScreen";

const SAMPLE_HISTORY: ContributionHistoryItem[] = [
  {
    id: "hist-001",
    title: "resource_bid_settled",
    eventType: "resource_bid_settled",
    tokenChange: 45,
    createdAt: "2026-07-28T14:00:00.000Z"
  },
  {
    id: "hist-002",
    title: "resource_bid_reserved",
    eventType: "resource_bid_reserved",
    tokenChange: -30,
    createdAt: "2026-07-27T09:30:00.000Z"
  },
  {
    id: "hist-003",
    title: "claim_settlement_credit",
    eventType: "claim_settlement_credit",
    tokenChange: 100,
    createdAt: "2026-07-20T16:00:00.000Z"
  },
  {
    id: "hist-004",
    title: "campaign_airdrop_received",
    eventType: "campaign_airdrop_received",
    tokenChange: 3000,
    createdAt: "2026-07-15T00:00:00.000Z"
  }
];

const meta = {
  title: "Screens/MyEconomicsScreen",
  component: MyEconomicsScreen,
  args: {
    currentTokenBalance: 3115,
    history: SAMPLE_HISTORY,
    hasNextPage: true,
    onLoadMore: () => undefined,
    onRetry: () => undefined,
    onBack: () => undefined,
    onLearnMore: () => undefined,
    onGoToOpportunity: () => undefined
  }
} satisfies Meta<typeof MyEconomicsScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

function Frame({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <View style={{ minHeight: 640 }}>{children}</View>;
}

export const Default: Story = {
  render: (args) => (
    <Frame>
      <MyEconomicsScreen {...args} />
    </Frame>
  )
};

export const ZeroBalance: Story = {
  args: {
    currentTokenBalance: 0,
    history: []
  },
  render: (args) => (
    <Frame>
      <MyEconomicsScreen {...args} />
    </Frame>
  )
};

export const Loading: Story = {
  args: {
    loading: true
  },
  render: (args) => (
    <Frame>
      <MyEconomicsScreen {...args} />
    </Frame>
  )
};

export const ErrorState: Story = {
  args: {
    errorMessage: "We could not load contribution details."
  },
  render: (args) => (
    <Frame>
      <MyEconomicsScreen {...args} />
    </Frame>
  )
};