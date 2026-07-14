import type { Meta, StoryObj } from "@storybook/react-native";

import { Splash } from "./Splash";

const meta = {
  title: "State/Splash",
  component: Splash
} satisfies Meta<typeof Splash>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};