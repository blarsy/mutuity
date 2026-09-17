import type { Meta, StoryObj } from "@storybook/react-native";
import React from "react";
import { View } from "react-native";

import { MyClaimsScreen, type ClaimDirection } from "./MyClaimsScreen";
import type { NeedClaimItem } from "../../services/graphql/needs";
import { NeedClaimStatus } from "../../services/graphql/generated";

const SAMPLE_CLAIMS: NeedClaimItem[] = [
  {
    id: "claim-001",
    needId: "need-001",
    needTitle: "Bike repair workshop",
    needImageUrl: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500",
    message: "I have all the tools needed and I'm free this weekend to help out.",
    createdAt: "2026-07-25T14:00:00.000Z",
    updatedAt: "2026-07-25T14:00:00.000Z",
    status: NeedClaimStatus.Open,
    claimerAccountId: "00000000-0000-0000-0000-000000000201",
    claimerDisplayName: "Marie",
    claimerAvatarUrl: null,
    ownerAccountId: "00000000-0000-0000-0000-000000000111",
    ownerDisplayName: "Karim",
    ownerAvatarUrl: null
  },
  {
    id: "claim-002",
    needId: "need-002",
    needTitle: "English tutoring for kids",
    needImageUrl: null,
    message: "Already settled, thanks again!",
    createdAt: "2026-07-20T10:30:00.000Z",
    updatedAt: "2026-07-21T09:00:00.000Z",
    status: NeedClaimStatus.Settled,
    claimerAccountId: "00000000-0000-0000-0000-000000000202",
    claimerDisplayName: "Lucas",
    claimerAvatarUrl: null,
    ownerAccountId: "00000000-0000-0000-0000-000000000111",
    ownerDisplayName: "Karim",
    ownerAvatarUrl: null
  }
];

const meta = {
  title: "Screens/MyClaimsScreen",
  component: MyClaimsScreen,
  args: {
    direction: "sent" as ClaimDirection,
    accountId: "00000000-0000-0000-0000-000000000111",
    injectedClaims: SAMPLE_CLAIMS,
    onOpenNeed: () => undefined,
    onOpenCounterparty: () => undefined
  }
} satisfies Meta<typeof MyClaimsScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

function Frame({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <View style={{ minHeight: 640 }}>{children}</View>;
}

export const Sent: Story = {
  render: (args) => (
    <Frame>
      <MyClaimsScreen {...args} />
    </Frame>
  )
};

export const Received: Story = {
  args: {
    direction: "received"
  },
  render: (args) => (
    <Frame>
      <MyClaimsScreen {...args} />
    </Frame>
  )
};

export const Empty: Story = {
  args: {
    injectedClaims: []
  },
  render: (args) => (
    <Frame>
      <MyClaimsScreen {...args} />
    </Frame>
  )
};

export const Loading: Story = {
  args: {
    injectedLoading: true
  },
  render: (args) => (
    <Frame>
      <MyClaimsScreen {...args} />
    </Frame>
  )
};

export const ErrorState: Story = {
  args: {
    injectedErrorMessage: "We could not load claims."
  },
  render: (args) => (
    <Frame>
      <MyClaimsScreen {...args} />
    </Frame>
  )
};