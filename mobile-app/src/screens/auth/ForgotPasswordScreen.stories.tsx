import type { Meta, StoryObj } from "@storybook/react-native";
import React from "react";
import { View } from "react-native";

import { ForgotPasswordScreen } from "./ForgotPasswordScreen";

const meta = {
  title: "Screens/ForgotPasswordScreen",
  component: ForgotPasswordScreen,
  args: {
    onSubmit: async () => undefined,
    onSwitchToSignIn: () => undefined,
    onDismiss: () => undefined
  }
} satisfies Meta<typeof ForgotPasswordScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

function Frame({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <View style={{ minHeight: 640 }}>{children}</View>;
}

export const Default: Story = {
  render: (args) => (
    <Frame>
      <ForgotPasswordScreen {...args} />
    </Frame>
  )
};