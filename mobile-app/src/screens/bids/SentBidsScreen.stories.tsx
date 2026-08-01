import type { Meta, StoryObj } from "@storybook/react-native";
import React from "react";
import { View } from "react-native";

import { SentBidsScreen } from "./SentBidsScreen";

const meta = {
  title: "Screens/SentBidsScreen",
  component: SentBidsScreen
} satisfies Meta<typeof SentBidsScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

function Frame({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <View style={{ minHeight: 640 }}>{children}</View>;
}

export const Default: Story = {
  render: () => (
    <Frame>
      <SentBidsScreen />
    </Frame>
  )
};