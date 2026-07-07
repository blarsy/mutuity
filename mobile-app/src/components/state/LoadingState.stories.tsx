import type { Meta, StoryObj } from "@storybook/react-native";

import { LoadingState } from "./LoadingState";

const meta = {
  title: "State/LoadingState",
  component: LoadingState,
  args: {
    label: "Loading resources..."
  }
} satisfies Meta<typeof LoadingState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomLabel: Story = {
  args: {
    label: "Syncing your data..."
  }
};
