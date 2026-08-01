import type { Meta, StoryObj } from "@storybook/react-native";
import React from "react";
import { View } from "react-native";

import { SearchNeedsScreen } from "./SearchNeedsScreen";
import type { NeedItem } from "../../services/graphql/needs";
import { NeedIntensity } from "../../services/graphql/generated";

const SAMPLE_NEEDS: NeedItem[] = [
  {
    id: "need-a",
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
    creatorAccountId: "00000000-0000-0000-0000-000000000101",
    claimCount: 2,
    isClaimedByCurrentAccount: false
  },
  {
    id: "need-b",
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
    creatorAccountId: "00000000-0000-0000-0000-000000000102",
    claimCount: 1,
    isClaimedByCurrentAccount: false
  },
  {
    id: "need-c",
    title: "Garden cleanup help",
    description: "Need help trimming hedges and clearing fallen branches.",
    imageUrls: ["https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=500"],
    location: {
      label: "5 Avenue des Lilas, Paris"
    },
    proposedTokenAmount: 50,
    intensity: NeedIntensity.LegUp,
    campaignId: null,
    createdAt: "2026-07-10T14:00:00.000Z",
    creatorAccountId: "00000000-0000-0000-0000-000000000103",
    claimCount: 0,
    isClaimedByCurrentAccount: false
  }
];

const meta = {
  title: "Screens/SearchNeedsScreen",
  component: SearchNeedsScreen,
  args: {
    needs: SAMPLE_NEEDS,
    loading: false,
    errorMessage: null,
    onRetry: () => undefined,
    onSwitchToResources: () => undefined,
    onOpenNeed: () => undefined,
    onClaimNeed: async () => undefined
  }
} satisfies Meta<typeof SearchNeedsScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

function Frame({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <View style={{ minHeight: 640 }}>{children}</View>;
}

export const Default: Story = {
  render: (args) => (
    <Frame>
      <SearchNeedsScreen {...args} />
    </Frame>
  )
};

export const Empty: Story = {
  args: {
    needs: []
  },
  render: (args) => (
    <Frame>
      <SearchNeedsScreen {...args} />
    </Frame>
  )
};

export const Loading: Story = {
  args: {
    loading: true
  },
  render: (args) => (
    <Frame>
      <SearchNeedsScreen {...args} />
    </Frame>
  )
};

export const ErrorState: Story = {
  args: {
    errorMessage: "We could not load needs."
  },
  render: (args) => (
    <Frame>
      <SearchNeedsScreen {...args} />
    </Frame>
  )
};