import type { Meta, StoryObj } from "@storybook/react-native";
import React from "react";
import { View } from "react-native";

import { CampaignDetailScreen } from "./CampaignDetailScreen";
import type { CampaignItem } from "../../services/graphql/campaigns";
import { CampaignModerationStatus } from "../../services/graphql/generated";

const EXISTING_CAMPAIGN: CampaignItem = {
  id: "camp-001",
  title: "Sustainable Mobility Week",
  theme: "Mobility",
  description: "Promoting bike sharing and carpooling across the neighborhood.",
  imageUrl: "https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=500",
  startAt: "2026-07-01T00:00:00.000Z",
  airdropAt: "2026-07-15T00:00:00.000Z",
  endAt: "2026-08-01T00:00:00.000Z",
  createdAt: "2026-06-20T10:00:00.000Z",
  creatorAccountId: "00000000-0000-0000-0000-000000000111",
  moderationStatus: CampaignModerationStatus.Approved,
  resourceCount: 12,
  needCount: 5,
  rewardsMultiplier: 5,
  airdropAmount: 3000,
  pendingEntries: [
    {
      id: "entry-001",
      type: "resource",
      title: "Cargo bike",
      creatorAccountId: "00000000-0000-0000-0000-000000000201",
      creatorDisplayName: "Alex"
    },
    {
      id: "entry-002",
      type: "need",
      title: "Bike repair workshop",
      creatorAccountId: "00000000-0000-0000-0000-000000000202",
      creatorDisplayName: "Nadia"
    }
  ]
};

const PENDING_CAMPAIGN: CampaignItem = {
  ...EXISTING_CAMPAIGN,
  id: "camp-002",
  title: "Education for All",
  moderationStatus: CampaignModerationStatus.Pending,
  pendingEntries: []
};

const meta = {
  title: "Screens/CampaignDetailScreen",
  component: CampaignDetailScreen,
  args: {
    campaign: EXISTING_CAMPAIGN,
    creatorAccountId: "00000000-0000-0000-0000-000000000111",
    isNew: false,
    onBack: () => undefined,
    onSaved: () => undefined,
    onApprovePendingEntry: async () => undefined,
    onRejectPendingEntry: async () => undefined
  }
} satisfies Meta<typeof CampaignDetailScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

function Frame({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <View style={{ minHeight: 820 }}>{children}</View>;
}

export const EditExisting: Story = {
  render: (args) => (
    <Frame>
      <CampaignDetailScreen {...args} />
    </Frame>
  )
};

export const CreateNew: Story = {
  args: {
    campaign: {
      ...EXISTING_CAMPAIGN,
      id: "",
      title: "",
      theme: "",
      description: "",
      imageUrl: null,
      startAt: new Date().toISOString(),
      airdropAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      moderationStatus: CampaignModerationStatus.Pending,
      resourceCount: 0,
      needCount: 0
    },
    isNew: true
  },
  render: (args) => (
    <Frame>
      <CampaignDetailScreen {...args} />
    </Frame>
  )
};

export const WithPendingEntries: Story = {
  args: {
    campaign: EXISTING_CAMPAIGN
  },
  render: (args) => (
    <Frame>
      <CampaignDetailScreen {...args} />
    </Frame>
  )
};

export const PendingModeration: Story = {
  args: {
    campaign: PENDING_CAMPAIGN
  },
  render: (args) => (
    <Frame>
      <CampaignDetailScreen {...args} />
    </Frame>
  )
};