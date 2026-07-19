import type { Meta, StoryObj } from "@storybook/react-native";
import React from "react";
import { View } from "react-native";

import { MyResourcesScreen } from "./MyResourcesScreen";
import type { MyResourceItem } from "../../services/graphql/resources";

const SAMPLE_RESOURCES: MyResourceItem[] = [
  {
    id: "res-001",
    title: "Community bike repair stand",
    description: "Compact stand with full basic tool kit available on weekends.",
    defaultTokenAmount: 22,
    imageUrls: ["https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500"],
    isActive: true,
    isProduct: true,
    isService: false,
    canBeTakenAway: true,
    canBeDelivered: false,
    canBeExchanged: true,
    canBeGifted: true,
    location: {
      label: "12 Rue des Fleurs, Lyon"
    },
    expiresAt: null,
    updatedAt: "2026-07-10T12:30:00.000Z"
  },
  {
    id: "res-002",
    title: "One-hour legal counseling",
    description: "Housing paperwork review and orientation for tenants.",
    defaultTokenAmount: 35,
    imageUrls: [],
    isActive: true,
    isProduct: false,
    isService: true,
    canBeTakenAway: false,
    canBeDelivered: true,
    canBeExchanged: false,
    canBeGifted: true,
    location: {
      label: "Remote"
    },
    expiresAt: "2026-08-01T00:00:00.000Z",
    updatedAt: "2026-07-09T08:15:00.000Z"
  }
];

const meta = {
  title: "Screens/MyResourcesScreen",
  component: MyResourcesScreen,
  args: {
    creatorAccountId: "00000000-0000-0000-0000-000000000111",
    onAddResource: () => undefined,
    onEditResource: () => undefined,
    injectedResources: SAMPLE_RESOURCES
  }
} satisfies Meta<typeof MyResourcesScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

function Frame({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <View style={{ minHeight: 760 }}>{children}</View>;
}

export const Default: Story = {
  render: (args) => (
    <Frame>
      <MyResourcesScreen {...args} />
    </Frame>
  )
};

export const Empty: Story = {
  args: {
    injectedResources: []
  },
  render: (args) => (
    <Frame>
      <MyResourcesScreen {...args} />
    </Frame>
  )
};

export const Loading: Story = {
  args: {
    injectedLoading: true
  },
  render: (args) => (
    <Frame>
      <MyResourcesScreen {...args} />
    </Frame>
  )
};

export const ErrorState: Story = {
  args: {
    injectedErrorMessage: "Unable to load resources. Please try again."
  },
  render: (args) => (
    <Frame>
      <MyResourcesScreen {...args} />
    </Frame>
  )
};
