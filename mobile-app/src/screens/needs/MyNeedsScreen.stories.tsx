import type { Meta, StoryObj } from "@storybook/react-native";
import React from "react";
import { View } from "react-native";

import { MyNeedsScreen } from "./MyNeedsScreen";
import type { NeedItem } from "../../services/graphql/needs";
import { NeedIntensity } from "../../services/graphql/generated";

const SAMPLE_NEEDS: NeedItem[] = [
  {
    id: "need-001",
    title: "Bike repair workshop",
    description: "Looking for someone to help fix flat tires and adjust brakes.",
    imageUrls: ["https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500"],
    location: {
      label: "12 Rue des Fleurs, Lyon"
    },
    proposedTokenAmount: 30,
    intensity: NeedIntensity.Sharing,
    campaignId: "camp-001",
    createdAt: "2026-07-20T10:00:00.000Z",
    creatorAccountId: "00000000-0000-0000-0000-000000000111",
    claimCount: 2,
    isClaimedByCurrentAccount: false
  },
  {
    id: "need-002",
    title: "English tutoring for kids",
    description: "Weekly 1-hour sessions for two children aged 8 and 10.",
    imageUrls: [],
    location: {
      label: "Remote"
    },
    proposedTokenAmount: 25,
    intensity: NeedIntensity.Commitment,
    campaignId: "camp-002",
    createdAt: "2026-07-15T08:30:00.000Z",
    creatorAccountId: "00000000-0000-0000-0000-000000000111",
    claimCount: 1,
    isClaimedByCurrentAccount: true
  }
];

const meta = {
  title: "Screens/MyNeedsScreen",
  component: MyNeedsScreen,
  args: {
    creatorAccountId: "00000000-0000-0000-0000-000000000111",
    onAddNeed: () => undefined,
    onEditNeed: () => undefined,
    injectedNeeds: SAMPLE_NEEDS
  }
} satisfies Meta<typeof MyNeedsScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

function Frame({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <View style={{ minHeight: 640 }}>{children}</View>;
}

export const Default: Story = {
  render: (args) => (
    <Frame>
      <MyNeedsScreen {...args} />
    </Frame>
  )
};

export const Empty: Story = {
  args: {
    injectedNeeds: []
  },
  render: (args) => (
    <Frame>
      <MyNeedsScreen {...args} />
    </Frame>
  )
};

export const Loading: Story = {
  args: {
    injectedLoading: true
  },
  render: (args) => (
    <Frame>
      <MyNeedsScreen {...args} />
    </Frame>
  )
};

export const ErrorState: Story = {
  args: {
    injectedErrorMessage: "We could not load your needs."
  },
  render: (args) => (
    <Frame>
      <MyNeedsScreen {...args} />
    </Frame>
  )
};