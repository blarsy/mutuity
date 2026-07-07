import type { Meta, StoryObj } from "@storybook/react-native";

import { ErrorState } from "./ErrorState";

const meta = {
  title: "State/ErrorState",
  component: ErrorState,
  args: {
    message: "Network request failed"
  }
} satisfies Meta<typeof ErrorState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithRetry: Story = {
  args: {
    onRetry: () => undefined
  }
};
