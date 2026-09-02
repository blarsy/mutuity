import type { Meta, StoryObj } from "@storybook/react-native";
import React from "react";
import { View } from "react-native";

import { ChatDetailScreen, type ChatDetailConversation, type ChatMessageItem } from "./ChatDetailScreen";

const CONVERSATION: ChatDetailConversation = {
  id: "conv-001",
  otherAccountId: "account-marie",
  otherAccountDisplayName: "Marie",
  linkedResourceId: "resource-001",
  linkedResourceTitle: "Cargo bike weekend rental"
};

const SAMPLE_MESSAGES: ChatMessageItem[] = [
  {
    id: "msg-001",
    direction: "incoming",
    body: "Hi! Is the cargo bike still available this Saturday?",
    createdAt: "2026-07-29T10:00:00.000Z"
  },
  {
    id: "msg-002",
    direction: "outgoing",
    body: "Yes, it is! What time would work for you?",
    createdAt: "2026-07-29T10:05:00.000Z"
  },
  {
    id: "msg-003",
    direction: "incoming",
    body: "Saturday morning around 9am would be perfect.",
    createdAt: "2026-07-29T10:10:00.000Z"
  },
  {
    id: "msg-004",
    direction: "outgoing",
    body: "Great, I'll have it ready for you. The rental is 45 tokens for the weekend.",
    createdAt: "2026-07-29T10:12:00.000Z"
  },
  {
    id: "msg-005",
    direction: "incoming",
    body: "Perfect, thanks!",
    createdAt: "2026-07-29T10:15:00.000Z"
  }
];

const meta = {
  title: "Screens/ChatDetailScreen",
  component: ChatDetailScreen,
  args: {
    conversation: CONVERSATION,
    messages: SAMPLE_MESSAGES,
    onBackToList: () => undefined,
    onOpenLinkedResource: () => undefined,
    onOpenLinkedAccount: () => undefined,
    onSendMessage: () => undefined,
    onRetry: () => undefined
  }
} satisfies Meta<typeof ChatDetailScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

function Frame({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <View style={{ minHeight: 640 }}>{children}</View>;
}

export const Default: Story = {
  render: (args) => (
    <Frame>
      <ChatDetailScreen {...args} />
    </Frame>
  )
};

export const Loading: Story = {
  args: {
    loading: true
  },
  render: (args) => (
    <Frame>
      <ChatDetailScreen {...args} />
    </Frame>
  )
};

export const Sending: Story = {
  args: {
    sending: true
  },
  render: (args) => (
    <Frame>
      <ChatDetailScreen {...args} />
    </Frame>
  )
};

export const ErrorState: Story = {
  args: {
    errorMessage: "We could not load this conversation."
  },
  render: (args) => (
    <Frame>
      <ChatDetailScreen {...args} />
    </Frame>
  )
};