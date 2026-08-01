import type { Meta, StoryObj } from "@storybook/react-native";
import React from "react";
import { View } from "react-native";

import { MyProfileScreen, type MyProfileRecord } from "./MyProfileScreen";

const SAMPLE_PROFILE: MyProfileRecord = {
  accountId: "00000000-0000-0000-0000-000000000111",
  displayName: "Alex Durand",
  email: "alex.durand@example.com",
  avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200",
  location: {
    label: "12 Rue des Fleurs, Lyon",
    latitude: 45.7640,
    longitude: 4.8357
  },
  bio: "Community organizer and bike enthusiast. Happy to help with repairs and mobility projects."
};

const meta = {
  title: "Screens/MyProfileScreen",
  component: MyProfileScreen,
  args: {
    accountId: "00000000-0000-0000-0000-000000000111",
    profile: SAMPLE_PROFILE,
    onRetry: () => undefined,
    onBack: () => undefined,
    onSaveProfile: () => undefined,
    onOpenChangePassword: () => undefined,
    onOpenPreferences: () => undefined,
    onOpenContribution: () => undefined,
    onLogout: () => undefined,
    onDeleteAccount: () => undefined
  }
} satisfies Meta<typeof MyProfileScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

function Frame({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <View style={{ minHeight: 720 }}>{children}</View>;
}

export const Default: Story = {
  render: (args) => (
    <Frame>
      <MyProfileScreen {...args} />
    </Frame>
  )
};

export const Loading: Story = {
  args: {
    loading: true
  },
  render: (args) => (
    <Frame>
      <MyProfileScreen {...args} />
    </Frame>
  )
};

export const Saving: Story = {
  args: {
    saving: true
  },
  render: (args) => (
    <Frame>
      <MyProfileScreen {...args} />
    </Frame>
  )
};

export const ErrorState: Story = {
  args: {
    errorMessage: "We could not load your profile."
  },
  render: (args) => (
    <Frame>
      <MyProfileScreen {...args} />
    </Frame>
  )
};