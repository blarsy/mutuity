import type { Meta, StoryObj } from "@storybook/react-native";
import React from "react";
import { View } from "react-native";

import { MyCampaignsScreen } from "./MyCampaignsScreen";
import type { CampaignItem } from "../../services/graphql/campaigns";
import { CampaignModerationStatus } from "../../services/graphql/generated";

const SAMPLE_CAMPAIGNS: CampaignItem[] = [
  {
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
    airdropAmount: 3000
  },
  {
    id: "camp-002",
    title: "Education for All",
    theme: "Education",
    description: "Tutoring and school supplies exchange program.",
    imageUrl: null,
    startAt: "2026-08-01T00:00:00.000Z",
    airdropAt: "2026-08-10T00:00:00.000Z",
    endAt: "2026-09-01T00:00:00.000Z",
    createdAt: "2026-07-25T08:00:00.000Z",
    creatorAccountId: "00000000-0000-0000-0000-000000000111",
    moderationStatus: CampaignModerationStatus.Pending,
    resourceCount: 3,
    needCount: 8
  }
];

const meta = {
  title: "Screens/MyCampaignsScreen",
  component: MyCampaignsScreen,
  args: {
    creatorAccountId: "00000000-0000-0000-0000-000000000111",
    onAddCampaign: () => undefined,
    onEditCampaign: () => undefined,
    injectedCampaigns: SAMPLE_CAMPAIGNS
  }
} satisfies Meta<typeof MyCampaignsScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

function Frame({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <View style={{ minHeight: 640 }}>{children}</View>;
}

export const Default: Story = {
  render: (args) => (
    <Frame>
      <MyCampaignsScreen {...args} />
    </Frame>
  )
};

export const Empty: Story = {
  args: {
    injectedCampaigns: []
  },
  render: (args) => (
    <Frame>
      <MyCampaignsScreen {...args} />
    </Frame>
  )
};

export const Loading: Story = {
  args: {
    injectedLoading: true
  },
  render: (args) => (
    <Frame>
      <MyCampaignsScreen {...args} />
    </Frame>
  )
};

export const ErrorState: Story = {
  args: {
    injectedErrorMessage: "We could not load your campaigns."
  },
  render: (args) => (
    <Frame>
      <MyCampaignsScreen {...args} />
    </Frame>
  )
};