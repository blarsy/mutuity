import type { Meta, StoryObj } from "@storybook/react-native";
import React from "react";
import { View } from "react-native";

import { MyPreferencesScreen } from "./MyPreferencesScreen";

const meta = {
  title: "Screens/MyPreferencesScreen",
  component: MyPreferencesScreen,
  args: {
    accountId: "00000000-0000-0000-0000-000000000111",
    onBack: () => undefined
  }
} satisfies Meta<typeof MyPreferencesScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

function Frame({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <View style={{ minHeight: 640 }}>{children}</View>;
}

export const Default: Story = {
  render: (args) => (
    <Frame>
      <MyPreferencesScreen {...args} />
    </Frame>
  )
};