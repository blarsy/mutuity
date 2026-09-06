import type { Meta, StoryObj } from "@storybook/react-native";
import React from "react";
import { View } from "react-native";

import { NotificationsScreen, type NotificationFeedItem } from "./NotificationsScreen";

const SAMPLE_NOTIFICATIONS: NotificationFeedItem[] = [
  {
    id: "notif-001",
    source: "resource-bid",
    eventType: "resource_bid_created",
    headline1: "New bid",
    headline2: "Marie",
    description: "Cargo bike rental",
    createdAt: "2026-07-29T14:30:00.000Z",
    readAt: null
  },
  {
    id: "notif-002",
    source: "resource-bid",
    eventType: "resource_bid_accepted",
    headline1: "Bid accepted",
    headline2: "",
    description: "Bike repair workshop",
    createdAt: "2026-07-28T09:15:00.000Z",
    readAt: null
  },
  {
    id: "notif-003",
    source: "account",
    eventType: "campaign_airdrop_done",
    headline1: "Airdrop received!",
    headline2: "Sustainable Mobility Week",
    description: "3000 tokens",
    createdAt: "2026-07-15T00:00:00.000Z",
    readAt: "2026-07-15T08:00:00.000Z"
  }
];

const meta = {
  title: "Screens/NotificationsScreen",
  component: NotificationsScreen,
  args: {
    notifications: SAMPLE_NOTIFICATIONS,
    onRetry: () => undefined,
    onOpenNotification: () => undefined,
    onMarkRead: () => undefined,
    onLoadEarlier: () => undefined
  }
} satisfies Meta<typeof NotificationsScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

function Frame({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <View style={{ minHeight: 640 }}>{children}</View>;
}

export const Default: Story = {
  render: (args) => (
    <Frame>
      <NotificationsScreen {...args} />
    </Frame>
  )
};

export const Empty: Story = {
  args: {
    notifications: []
  },
  render: (args) => (
    <Frame>
      <NotificationsScreen {...args} />
    </Frame>
  )
};

export const Loading: Story = {
  args: {
    loading: true
  },
  render: (args) => (
    <Frame>
      <NotificationsScreen {...args} />
    </Frame>
  )
};

export const ErrorState: Story = {
  args: {
    errorMessage: "We could not load notifications."
  },
  render: (args) => (
    <Frame>
      <NotificationsScreen {...args} />
    </Frame>
  )
};

// One notification per event type across all three notification sources, so every icon/copy combo can be reviewed at once.
const ALL_EVENT_TYPES: NotificationFeedItem[] = [
  {
    id: "event-gift_tokens_received",
    source: "account",
    eventType: "gift_tokens_received",
    headline1: "Tokens received!",
    headline2: "Marie",
    description: "500 tokens sent your way",
    createdAt: "2026-09-05T09:00:00.000Z",
    readAt: null
  },
  {
    id: "event-campaign_airdrop_coming_soon",
    source: "account",
    eventType: "campaign_airdrop_coming_soon",
    headline1: "Airdrop coming soon",
    headline2: "Sustainable Mobility Week",
    description: "Lands in 48 hours",
    createdAt: "2026-09-05T07:00:00.000Z",
    readAt: null
  },
  {
    id: "event-campaign_airdrop_done",
    source: "account",
    eventType: "campaign_airdrop_done",
    headline1: "Airdrop received!",
    headline2: "Sustainable Mobility Week",
    description: "3000 tokens",
    createdAt: "2026-09-05T06:00:00.000Z",
    readAt: null
  },
  {
    id: "event-welcome_profile_reward",
    source: "account",
    eventType: "welcome_profile_reward",
    headline1: "Welcome to Mutuity!",
    headline2: "Complete your profile",
    description: "Earn tokens for a polished profile.",
    createdAt: "2026-09-05T05:00:00.000Z",
    readAt: null
  },
  {
    id: "event-campaign_approved",
    source: "account",
    eventType: "campaign_approved",
    headline1: "Campaign approved",
    headline2: "Neighborhood Tool Library",
    description: "Your campaign is now live.",
    createdAt: "2026-09-05T03:00:00.000Z",
    readAt: null
  },
  {
    id: "event-campaign_moderation_note_received",
    source: "account",
    eventType: "campaign_moderation_note_received",
    headline1: "Moderation note",
    headline2: "Neighborhood Tool Library",
    description: "Please add a cover photo before resubmitting.",
    createdAt: "2026-09-05T02:00:00.000Z",
    readAt: null
  },
  {
    id: "event-campaign_creator_adaptation_submitted",
    source: "account",
    eventType: "campaign_creator_adaptation_submitted",
    headline1: "Campaign updated",
    headline2: "Karim",
    description: "Neighborhood Tool Library",
    createdAt: "2026-09-05T01:00:00.000Z",
    readAt: null
  },
  {
    id: "event-resource_bid_expiring_soon",
    source: "resource-bid",
    eventType: "resource_bid_expiring_soon",
    headline1: "Bid expiring soon",
    headline2: "",
    description: "Cargo bike rental",
    createdAt: "2026-09-04T23:00:00.000Z",
    readAt: null
  },
  {
    id: "event-resource_bid_accepted",
    source: "resource-bid",
    eventType: "resource_bid_accepted",
    headline1: "Bid accepted",
    headline2: "Marie",
    description: "Cargo bike rental",
    createdAt: "2026-09-04T22:00:00.000Z",
    readAt: null
  },
  {
    id: "event-resource_bid_declined",
    source: "resource-bid",
    eventType: "resource_bid_declined",
    headline1: "Bid declined",
    headline2: "Marie",
    description: "Cargo bike rental",
    createdAt: "2026-09-04T21:00:00.000Z",
    readAt: null
  },
  {
    id: "event-resource_bid_expired",
    source: "resource-bid",
    eventType: "resource_bid_expired",
    headline1: "Bid expired",
    headline2: "",
    description: "Cargo bike rental",
    createdAt: "2026-09-04T20:00:00.000Z",
    readAt: null
  },
  {
    id: "event-resource_bid_cancelled",
    source: "resource-bid",
    eventType: "resource_bid_cancelled",
    headline1: "Bid cancelled",
    headline2: "",
    description: "Cargo bike rental",
    createdAt: "2026-09-04T19:00:00.000Z",
    readAt: null
  },
  {
    id: "event-resource_bid_created",
    source: "resource-bid",
    eventType: "resource_bid_created",
    headline1: "New bid",
    headline2: "Karim",
    description: "Cargo bike rental",
    createdAt: "2026-09-04T18:00:00.000Z",
    readAt: null
  },
  {
    id: "event-claim_created",
    source: "need-claim",
    eventType: "claim_created",
    headline1: "New claim",
    headline2: "Marie",
    description: "Bike repair workshop",
    createdAt: "2026-09-04T17:30:00.000Z",
    readAt: null
  },
  {
    id: "event-claim_declined",
    source: "need-claim",
    eventType: "claim_declined",
    headline1: "Claim declined",
    headline2: "",
    description: "",
    createdAt: "2026-09-04T17:15:00.000Z",
    readAt: null
  },
  {
    id: "event-claim_settled",
    source: "need-claim",
    eventType: "claim_settled",
    headline1: "Claim settled",
    headline2: "",
    description: "Bike repair workshop",
    createdAt: "2026-09-04T17:10:00.000Z",
    readAt: null
  },
  {
    id: "event-unknown",
    source: "account",
    eventType: "some_future_event_type",
    headline1: "some_future_event_type",
    headline2: "",
    description: "Fallback bell icon for any event type without a dedicated match.",
    createdAt: "2026-09-04T17:00:00.000Z",
    readAt: null
  }
];

export const AllEventTypes: Story = {
  args: {
    notifications: ALL_EVENT_TYPES
  },
  render: (args) => (
    <Frame>
      <NotificationsScreen {...args} />
    </Frame>
  )
};