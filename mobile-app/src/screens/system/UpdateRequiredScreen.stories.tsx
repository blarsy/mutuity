import type { Meta, StoryObj } from "@storybook/react-native";
import React from "react";
import { View } from "react-native";

import { UpdateRequiredScreen } from "./UpdateRequiredScreen";

const meta = {
  title: "Screens/UpdateRequiredScreen",
  component: UpdateRequiredScreen,
  args: {
    onDismiss: () => undefined
  }
} satisfies Meta<typeof UpdateRequiredScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

function Frame({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <View style={{ flex: 1 }}>{children}</View>;
}

export const Default: Story = {
  render: (args) => (
    <Frame>
      <UpdateRequiredScreen {...args} />
    </Frame>
  )
};

export const WithoutDismiss: Story = {
  render: ({ onDismiss: _onDismiss, ...args }) => (
    <Frame>
      <UpdateRequiredScreen {...args} />
    </Frame>
  )
};