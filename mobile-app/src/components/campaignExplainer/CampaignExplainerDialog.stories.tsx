import type { Meta, StoryObj } from "@storybook/react-native";
import React, { useState } from "react";
import { View } from "react-native";
import { Button } from "react-native-paper";

import { CampaignExplainerDialog } from "./CampaignExplainerDialog";

const meta = {
  title: "Components/CampaignExplainerDialog",
  component: CampaignExplainerDialog,
  args: {
    visible: true,
    onClose: () => undefined
  }
} satisfies Meta<typeof CampaignExplainerDialog>;

export default meta;

type Story = StoryObj<typeof meta>;

function Frame({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <View style={{ minHeight: 480, padding: 16 }}>{children}</View>;
}

export const Default: Story = {
  render: (args) => (
    <Frame>
      <CampaignExplainerDialog {...args} />
    </Frame>
  )
};

export const Hidden: Story = {
  args: {
    visible: false
  },
  render: (args) => (
    <Frame>
      <CampaignExplainerDialog {...args} />
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
          Open campaigns guide
        </Button>
        <CampaignExplainerDialog {...args} visible={visible} onClose={() => setVisible(false)} />
      </Frame>
    );
  }
};