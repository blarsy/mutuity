import type { Meta, StoryObj } from "@storybook/react-native";
import React, { useState } from "react";

import { AppTextField } from "../primitives";

const meta = {
  title: "Forms/PrimaryField",
  component: AppTextField,
  args: {
    label: "Title",
    placeholder: "Enter a title",
    value: "",
    onChangeText: () => undefined
  }
} satisfies Meta<typeof AppTextField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    value: ""
  },
  render: (args) => <AppTextField {...args} value="" onChangeText={() => undefined} />
};

export const Filled: Story = {
  args: {
    value: "Community bike"
  },
  render: (args) => (
    <AppTextField {...args} value="Community bike" onChangeText={() => undefined} />
  )
};

export const Interactive: Story = {
  args: {
    value: ""
  },
  render: (args) => {
    const [value, setValue] = useState("");

    return <AppTextField {...args} value={value} onChangeText={setValue} />;
  }
};
