import type { Meta, StoryObj } from "@storybook/react-native";
import React from "react";
import { View } from "react-native";

import { ChatListScreen, type ChatConversationItem } from "./ChatListScreen";

const SAMPLE_CONVERSATIONS: ChatConversationItem[] = [
  {
    id: "conv-001",
    otherAccountDisplayName: "Marie",
    linkedResourceTitle: "Cargo bike weekend rental",
    lastMessagePreview: "Yes, Saturday morning works perfectly!",
    lastMessageAt: "2026-07-29T14:30:00.000Z",
    unreadCount: 2
  },
  {
    id: "conv-002",
    otherAccountDisplayName: "Karim",
    linkedResourceTitle: null,
    lastMessagePreview: "Thanks for the tutoring session!",
    lastMessageAt: "2026-07-28T09:15:00.000Z",
    unreadCount: 0
  },
  {
    id: "conv-003",
    otherAccountDisplayName: "Samira",
    linkedResourceTitle: "School Starter Kit",
    lastMessagePreview: "I'll drop it off tomorrow morning.",
    lastMessageAt: "2026-07-27T18:00:00.000Z",
    unreadCount: 0
  }
];

const meta = {
  title: "Screens/ChatListScreen",
  component: ChatListScreen,
  args: {
    conversations: SAMPLE_CONVERSATIONS,
    onRetry: () => undefined,
    onOpenConversation: () => undefined,
    onOpenMyHub: () => undefined
  }
} satisfies Meta<typeof ChatListScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

function Frame({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <View style={{ minHeight: 640 }}>{children}</View>;
}

export const Default: Story = {
  render: (args) => (
    <Frame>
      <ChatListScreen {...args} />
    </Frame>
  )
};

export const Empty: Story = {
  args: {
    conversations: []
  },
  render: (args) => (
    <Frame>
      <ChatListScreen {...args} />
    </Frame>
  )
};

export const Loading: Story = {
  args: {
    loading: true
  },
  render: (args) => (
    <Frame>
      <ChatListScreen {...args} />
    </Frame>
  )
};

export const ErrorState: Story = {
  args: {
    errorMessage: "We could not load conversations."
  },
  render: (args) => (
    <Frame>
      <ChatListScreen {...args} />
    </Frame>
  )
};