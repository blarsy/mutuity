import type { Meta, StoryObj } from "@storybook/react-native";

import { EmptyState } from "./EmptyState";

const meta = {
  title: "State/EmptyState",
  component: EmptyState,
  args: {
    message: "No resources match your filters",
    actionLabel: "Reset filters"
  }
} satisfies Meta<typeof EmptyState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAction: Story = {
  args: {
    onActionPress: () => undefined
  }
};
