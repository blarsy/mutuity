import type { Meta, StoryObj } from "@storybook/react-native";
import React from "react";
import { View } from "react-native";

import { ListingContextHeader } from "./ListingContextHeader";

const meta = {
  title: "Components/ListingContextHeader",
  component: ListingContextHeader,
  args: {
    kind: "resource",
    title: "Cargo bike for weekend trips",
    authorDisplayName: "Maya Dupont",
    authorAvatarUrl: null,
    listingImageUrl: null,
    onPress: () => undefined
  }
} satisfies Meta<typeof ListingContextHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

function Frame({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <View style={{ padding: 16, width: "100%" }}>{children}</View>;
}

export const ResourceDefault: Story = {
  render: (args) => (
    <Frame>
      <ListingContextHeader {...args} />
    </Frame>
  )
};

export const NeedDefault: Story = {
  args: {
    kind: "need",
    title: "Looking for a ladder to paint the ceiling",
    authorDisplayName: "Nora Silva"
  },
  render: (args) => (
    <Frame>
      <ListingContextHeader {...args} />
    </Frame>
  )
};

export const DeletedListing: Story = {
  args: {
    title: "Evening babysitting help",
    deletedAt: "2026-08-03T09:00:00.000Z"
  },
  render: (args) => (
    <Frame>
      <ListingContextHeader {...args} />
    </Frame>
  )
};

export const ListingWithImage: Story = {
  args: {
    title: "Solid wood desk available",
    listingImageUrl: "https://picsum.photos/seed/mutuity-listing-header/120/120"
  },
  render: (args) => (
    <Frame>
      <ListingContextHeader {...args} />
    </Frame>
  )
};

export const AccountWithAvatarImage: Story = {
  args: {
    authorDisplayName: "Camille Bernard",
    authorAvatarUrl: "https://i.pravatar.cc/80?img=47"
  },
  render: (args) => (
    <Frame>
      <ListingContextHeader {...args} />
    </Frame>
  )
};

export const ListingAndAccountWithImages: Story = {
  args: {
    title: "Portable induction cooker",
    listingImageUrl: "https://picsum.photos/seed/mutuity-listing-avatar/120/120",
    authorDisplayName: "Nael Martin",
    authorAvatarUrl: "https://i.pravatar.cc/80?img=31"
  },
  render: (args) => (
    <Frame>
      <ListingContextHeader {...args} />
    </Frame>
  )
};
