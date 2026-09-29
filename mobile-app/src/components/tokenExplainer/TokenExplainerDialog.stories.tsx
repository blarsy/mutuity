import type { Meta, StoryObj } from "@storybook/react-native";
import React, { useState } from "react";
import { View } from "react-native";
import { Button } from "react-native-paper";

import { TokenExplainerDialog } from "./TokenExplainerDialog";

const meta = {
  title: "Components/TokenExplainerDialog",
  component: TokenExplainerDialog,
  args: {
    visible: true,
    onClose: () => undefined
  }
} satisfies Meta<typeof TokenExplainerDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

function Frame({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <View style={{ minHeight: 480, padding: 16 }}>{children}</View>;
}

export const Default: Story = {
  render: (args) => (
    <Frame>
      <TokenExplainerDialog {...args} />
    </Frame>
  )
};

export const Hidden: Story = {
  args: {
    visible: false
  },
  render: (args) => (
    <Frame>
      <TokenExplainerDialog {...args} />
    </Frame>
  )
};

export const Interactive: Story = {
  args: {
    visible: false
  },
  render: (args) => {
    const [visible, setVisible] = useState(false);

    return (
      <Frame>
        <Button mode="contained" onPress={() => setVisible(true)}>
          Open token guide
        </Button>
        <TokenExplainerDialog {...args} visible={visible} onClose={() => setVisible(false)} />
      </Frame>
    );
  }
};