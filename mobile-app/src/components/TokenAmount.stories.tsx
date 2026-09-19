import type { Meta, StoryObj } from "@storybook/react-native";
import React from "react";
import { View } from "react-native";

import { TokenAmount } from "./TokenAmount";

const meta = {
  title: "Components/TokenAmount",
  component: TokenAmount,
  args: {
    amount: 42,
    showExplainer: true
  }
} satisfies Meta<typeof TokenAmount>;

export default meta;

type Story = StoryObj<typeof meta>;

function Frame({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <View style={{ minHeight: 120, padding: 16 }}>{children}</View>;
}

export const Default: Story = {
  render: (args) => (
    <Frame>
      <TokenAmount {...args} />
    </Frame>
  )
};

export const WithoutExplainer: Story = {
  render: (args) => (
    <Frame>
      <TokenAmount {...args} showExplainer={false} />
    </Frame>
  )
};

export const SmallSize: Story = {
  render: (args) => (
    <Frame>
      <TokenAmount {...args} size={28} />
    </Frame>
  )
};

export const ZeroAmount: Story = {
  render: (args) => (
    <Frame>
      <TokenAmount {...args} amount={0} />
    </Frame>
  )
};

export const LargeAmount: Story = {
  render: (args) => (
    <Frame>
      <TokenAmount {...args} amount={123456} />
    </Frame>
  )
};
