import type { Meta, StoryObj } from "@storybook/react-native";
import React from "react";
import { View } from "react-native";

import { SupportScreen } from "./SupportScreen";

const meta = {
  title: "Screens/SupportScreen",
  component: SupportScreen,
  args: {
    appVersion: "1.2.3",
    buildNumber: "42",
    onBack: () => undefined
  }
} satisfies Meta<typeof SupportScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

function Frame({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <View style={{ minHeight: 640 }}>{children}</View>;
}

export const Default: Story = {
  render: (args) => (
    <Frame>
      <SupportScreen {...args} />
    </Frame>
  )
};