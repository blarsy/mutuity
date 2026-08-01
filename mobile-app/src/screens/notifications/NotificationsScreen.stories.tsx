import type { Meta, StoryObj } from "@storybook/react-native";
import React from "react";
import { View } from "react-native";

import { NotificationsScreen, type NotificationFeedItem } from "./NotificationsScreen";

const SAMPLE_NOTIFICATIONS: NotificationFeedItem[] = [
  {
    id: "notif-001",
    title: "New bid received",
    body: "Marie placed a bid on your cargo bike rental.",
    createdAt: "2026-07-29T14:30:00.000Z",
    readAt: null
  },
  {
    id: "notif-002",
    title: "Claim accepted",
    body: "Your claim on 'Bike repair workshop' has been accepted.",
    createdAt: "2026-07-28T09:15:00.000Z",
    readAt: null
  },
  {
    id: "notif-003",
    title: "Campaign airdrop",
    body: "You received 3000 tokens from the Sustainable Mobility Week campaign.",
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