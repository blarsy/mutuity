import type { Meta, StoryObj } from "@storybook/react-native";
import React from "react";
import { View } from "react-native";

import { EditResourceScreen } from "./EditResourceScreen";
import type { MyResourceItem } from "../../services/graphql/resources";
import type { LinkableCampaignItem } from "../../services/graphql/campaigns";
import type { ResourceCategoryItem } from "../../services/graphql/resources";

const SAMPLE_CAMPAIGNS: LinkableCampaignItem[] = [
  { id: "camp-work", title: "Back to work support" },
  { id: "camp-rights", title: "Housing rights clinic" }
];

const SAMPLE_CATEGORIES: ResourceCategoryItem[] = [
  { code: 1, label: "Transport", labelFr: "Transport" },
  { code: 2, label: "Furniture", labelFr: "Meubles" }
];

const EXISTING_RESOURCE: MyResourceItem = {
  id: "res-100",
  title: "Family moving van (2h slot)",
  description: "Driver included in-city on Saturday mornings.",
  defaultTokenAmount: 48,
  imageUrls: ["https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=500"],
  isActive: true,
  isProduct: false,
  isService: true,
  canBeTakenAway: true,
  canBeDelivered: false,
  canBeExchanged: true,
  canBeGifted: false,
  location: {
    label: "4 Rue Pierre, Marseille",
    latitude: 43.2965,
    longitude: 5.3698
  },
  expiresAt: null,
  updatedAt: "2026-07-11T14:00:00.000Z"
};

const meta = {
  title: "Screens/EditResourceScreen",
  component: EditResourceScreen,
  args: {
    creatorAccountId: "00000000-0000-0000-0000-000000000111",
    onBack: () => undefined,
    onSaved: () => undefined,
    initialResource: null,
    categories: SAMPLE_CATEGORIES,
    campaigns: SAMPLE_CAMPAIGNS
  }
} satisfies Meta<typeof EditResourceScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

function Frame({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <View style={{ minHeight: 820 }}>{children}</View>;
}

export const Create: Story = {
  render: (args) => (
    <Frame>
      <EditResourceScreen {...args} />
    </Frame>
  )
};

export const EditExisting: Story = {
  args: {
    initialResource: EXISTING_RESOURCE
  },
  render: (args) => (
    <Frame>
      <EditResourceScreen {...args} />
    </Frame>
  )
};
