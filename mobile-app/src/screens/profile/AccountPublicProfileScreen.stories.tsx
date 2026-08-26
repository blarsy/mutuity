import type { Meta, StoryObj } from "@storybook/react-native";
import React from "react";
import { View } from "react-native";

import {
  AccountPublicProfileScreen
} from "./AccountPublicProfileScreen";
import type { MyProfileRecord } from "./MyProfileScreen";

const SAMPLE_PROFILE: MyProfileRecord = {
  accountId: "00000000-0000-0000-0000-000000000111",
  displayName: "Nora Ibrahim",
  email: "",
  avatarUrl: null,
  location: {
    label: "Lyon, France",
    latitude: 45.764,
    longitude: 4.8357
  },
  bio: "Community gardener and repair volunteer. I share tools and host beginner workshops.",
  profileLinks: [
    {
      type: "website",
      label: "Website",
      url: "https://example.com"
    }
  ]
};

const meta = {
  title: "Screens/AccountPublicProfileScreen",
  component: AccountPublicProfileScreen,
  args: {
    accountId: SAMPLE_PROFILE.accountId,
    profile: SAMPLE_PROFILE,
    loading: false,
    errorMessage: null,
    onBack: () => undefined,
    onRetry: () => undefined
  }
} satisfies Meta<typeof AccountPublicProfileScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

function Frame({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <View style={{ minHeight: 760 }}>{children}</View>;
}

export const Default: Story = {
  render: (args) => (
    <Frame>
      <AccountPublicProfileScreen {...args} />
    </Frame>
  )
};

export const Loading: Story = {
  args: {
    loading: true
  },
  render: (args) => (
    <Frame>
      <AccountPublicProfileScreen {...args} />
    </Frame>
  )
};

export const ErrorState: Story = {
  args: {
    profile: null,
    errorMessage: "Unable to load profile."
  },
  render: (args) => (
    <Frame>
      <AccountPublicProfileScreen {...args} />
    </Frame>
  )
};

export const EmptyBio: Story = {
  args: {
    profile: {
      ...SAMPLE_PROFILE,
      bio: "",
      location: null
    }
  },
  render: (args) => (
    <Frame>
      <AccountPublicProfileScreen {...args} />
    </Frame>
  )
};
