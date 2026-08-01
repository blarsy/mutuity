import type { Meta, StoryObj } from "@storybook/react-native";
import React from "react";
import { View } from "react-native";

import { EditNeedScreen } from "./EditNeedScreen";
import type { NeedItem } from "../../services/graphql/needs";
import { NeedIntensity } from "../../services/graphql/generated";

const EXISTING_NEED: NeedItem = {
  id: "need-100",
  title: "Bike repair workshop",
  description: "Looking for someone to help fix flat tires and adjust brakes.",
  imageUrls: ["https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500"],
  location: {
    label: "12 Rue des Fleurs, Lyon",
    latitude: 45.7640,
    longitude: 4.8357
  },
  proposedTokenAmount: 30,
  intensity: NeedIntensity.Sharing,
  objectRequired: true,
  competenceRequired: false,
  toolingRequired: true,
  multiplePeopleRequired: false,
  requiredCompetenceText: "",
  requiredToolingText: "Tire levers, pump, multi-tool",
  requiredPeopleCount: null,
  campaignId: "camp-001",
  expiresAt: "2026-08-15T00:00:00.000Z",
  createdAt: "2026-07-20T10:00:00.000Z",
  creatorAccountId: "00000000-0000-0000-0000-000000000111",
  claimCount: 2,
  isClaimedByCurrentAccount: false
};

const meta = {
  title: "Screens/EditNeedScreen",
  component: EditNeedScreen,
  args: {
    creatorAccountId: "00000000-0000-0000-0000-000000000111",
    onBack: () => undefined,
    onSaved: () => undefined,
    initialNeed: null
  }
} satisfies Meta<typeof EditNeedScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

function Frame({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <View style={{ minHeight: 820 }}>{children}</View>;
}

export const Create: Story = {
  render: (args) => (
    <Frame>
      <EditNeedScreen {...args} />
    </Frame>
  )
};

export const EditExisting: Story = {
  args: {
    initialNeed: EXISTING_NEED
  },
  render: (args) => (
    <Frame>
      <EditNeedScreen {...args} />
    </Frame>
  )
};