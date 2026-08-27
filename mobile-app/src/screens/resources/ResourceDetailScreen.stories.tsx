import type { Meta, StoryObj } from "@storybook/react-native";
import React from "react";
import { View } from "react-native";

import { ResourceDetailScreen } from "./ResourceDetailScreen";
import type { ResourceDetailItem } from "../../services/graphql/resources";

const SAMPLE_RESOURCE: ResourceDetailItem = {
  id: "res-001",
  title: "Garden Tool Set",
  description:
    "Durable tool set including spade, rake, and hand trowel. Great for urban gardens and shared allotments.",
  creatorAccountId: "00000000-0000-0000-0000-000000000001",
  creatorDisplayName: "Maya",
  creatorAvatarUrl: null,
  createdAt: "2026-08-01T09:00:00.000Z",
  expiresAt: "2026-08-30T09:00:00.000Z",
  isActive: true,
  isProduct: true,
  isService: false,
  canBeTakenAway: true,
  canBeDelivered: true,
  canBeExchanged: true,
  canBeGifted: true,
  locationLabel: "12 Rue des Jardins, Paris",
  latitude: 48.8566,
  longitude: 2.3522,
  defaultTokenAmount: 120,
  categoryLabels: ["Garden", "DIY"],
  imageUrls: [
    "https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=800",
    "https://images.unsplash.com/photo-1599685315640-9634f0f36742?w=800"
  ]
};

const meta = {
  title: "Screens/ResourceDetailScreen",
  component: ResourceDetailScreen,
  args: {
    resourceId: SAMPLE_RESOURCE.id,
    resource: SAMPLE_RESOURCE,
    loading: false,
    errorMessage: null,
    currentAccountId: "00000000-0000-0000-0000-000000000099",
    onBack: () => undefined,
    onOpenCreatorAccount: () => undefined,
    onOpenResourceChat: () => undefined,
    onRetry: () => undefined
  }
} satisfies Meta<typeof ResourceDetailScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

function Frame({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <View style={{ minHeight: 1300 }}>{children}</View>;
}

export const Default: Story = {
  render: (args) => (
    <Frame>
      <ResourceDetailScreen {...args} />
    </Frame>
  )
};

export const Loading: Story = {
  args: {
    loading: true
  },
  render: (args) => (
    <Frame>
      <ResourceDetailScreen {...args} />
    </Frame>
  )
};

export const ErrorState: Story = {
  args: {
    resource: null,
    errorMessage: "Unable to load resource details."
  },
  render: (args) => (
    <Frame>
      <ResourceDetailScreen {...args} />
    </Frame>
  )
};

export const WithoutMapAndImages: Story = {
  args: {
    resource: {
      ...SAMPLE_RESOURCE,
      imageUrls: [],
      latitude: null,
      longitude: null,
      locationLabel: "",
      categoryLabels: []
    }
  },
  render: (args) => (
    <Frame>
      <ResourceDetailScreen {...args} />
    </Frame>
  )
};
