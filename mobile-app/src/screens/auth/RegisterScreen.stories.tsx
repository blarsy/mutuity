import type { Meta, StoryObj } from "@storybook/react-native";
import React from "react";
import { View } from "react-native";

import { RegisterScreen } from "./RegisterScreen";

const meta = {
  title: "Screens/RegisterScreen",
  component: RegisterScreen,
  args: {
    onSubmit: async () => undefined,
    onSwitchToSignIn: () => undefined,
    onDismiss: () => undefined
  }
} satisfies Meta<typeof RegisterScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

function Frame({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <View style={{ minHeight: 720 }}>{children}</View>;
}

export const Default: Story = {
  render: (args) => (
    <Frame>
      <RegisterScreen {...args} />
    </Frame>
  )
};