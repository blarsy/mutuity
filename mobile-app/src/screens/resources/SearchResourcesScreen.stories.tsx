import type { Meta, StoryObj } from "@storybook/react-native";
import React from "react";
import { View } from "react-native";

import {
  SearchResourcesScreen,
  type SearchResourceItem
} from "./SearchResourcesScreen";

const SAMPLE_RESOURCES: SearchResourceItem[] = [
  {
    id: "res-a",
    title: "Laptop Stand",
    description: "Adjustable aluminum stand for remote work setups.",
    category: "Office",
    distanceKm: 1.8,
    type: "product",
    canBeTakenAway: true,
    canBeDelivered: true,
    canBeExchanged: true,
    canBeGifted: false,
    located: true,
    campaignIds: ["camp-work"]
  },
  {
    id: "res-b",
    title: "Legal Guidance Session",
    description: "30-minute consultation for housing paperwork.",
    category: "Services",
    distanceKm: 5.2,
    type: "service",
    canBeTakenAway: false,
    canBeDelivered: true,
    canBeExchanged: false,
    canBeGifted: true,
    located: true,
    campaignIds: ["camp-rights", "camp-work"]
  },
  {
    id: "res-c",
    title: "School Starter Kit",
    description: "Notebooks, pencils, and ruler for primary school students.",
    category: "Education",
    distanceKm: 9.4,
    type: "product",
    canBeTakenAway: true,
    canBeDelivered: false,
    canBeExchanged: true,
    canBeGifted: true,
    located: false,
    campaignIds: ["camp-education"]
  }
];

const meta = {
  title: "Screens/SearchResourcesScreen",
  component: SearchResourcesScreen,
  args: {
    resources: SAMPLE_RESOURCES,
    loading: false,
    errorMessage: null,
    onRetry: () => undefined,
    onSwitchToNeeds: () => undefined,
    onOpenResource: () => undefined
  }
} satisfies Meta<typeof SearchResourcesScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

function Frame({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <View style={{ minHeight: 760 }}>{children}</View>;
}

export const Default: Story = {
  render: (args) => (
    <Frame>
      <SearchResourcesScreen {...args} />
    </Frame>
  )
};

export const Loading: Story = {
  args: {
    loading: true
  },
  render: (args) => (
    <Frame>
      <SearchResourcesScreen {...args} />
    </Frame>
  )
};

export const ErrorState: Story = {
  args: {
    errorMessage: "Unable to load resources. Please try again."
  },
  render: (args) => (
    <Frame>
      <SearchResourcesScreen {...args} />
    </Frame>
  )
};

export const EmptyState: Story = {
  args: {
    resources: []
  },
  render: (args) => (
    <Frame>
      <SearchResourcesScreen {...args} />
    </Frame>
  )
};