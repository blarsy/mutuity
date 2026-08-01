import type { Meta, StoryObj } from "@storybook/react-native";
import React from "react";
import { View } from "react-native";

import { ReceivedBidsScreen } from "./ReceivedBidsScreen";

const meta = {
  title: "Screens/ReceivedBidsScreen",
  component: ReceivedBidsScreen
} satisfies Meta<typeof ReceivedBidsScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

function Frame({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <View style={{ minHeight: 640 }}>{children}</View>;
}

export const Default: Story = {
  render: () => (
    <Frame>
      <ReceivedBidsScreen />
    </Frame>
  )
};