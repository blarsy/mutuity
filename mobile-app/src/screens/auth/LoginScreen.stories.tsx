import type { Meta, StoryObj } from "@storybook/react-native";
import React from "react";
import { View } from "react-native";

import { LoginScreen } from "./LoginScreen";

const meta = {
  title: "Screens/LoginScreen",
  component: LoginScreen,
  args: {
    onSubmit: async () => undefined,
    onSocialSignIn: async () => undefined,
    onSwitchToRegister: () => undefined,
    onSwitchToForgotPassword: () => undefined,
    onDismiss: () => undefined
  }
} satisfies Meta<typeof LoginScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

function Frame({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <View style={{ minHeight: 640 }}>{children}</View>;
}

export const Default: Story = {
  render: (args) => (
    <Frame>
      <LoginScreen {...args} />
    </Frame>
  )
};