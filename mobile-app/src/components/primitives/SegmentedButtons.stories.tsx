import type { Meta, StoryObj } from "@storybook/react-native";
import React, { useState } from "react";
import { View } from "react-native";
import { SegmentedButtons } from "react-native-paper";

type SegmentedButtonOption = {
  value: string;
  label: string;
  accessibilityLabel: string;
  disabled?: boolean;
};

const TRANSPORT_BUTTONS: SegmentedButtonOption[] = [
  {
    value: "walk",
    label: "Walking",
    accessibilityLabel: "Walking"
  },
  {
    value: "train",
    label: "Transit",
    accessibilityLabel: "Transit"
  },
  {
    value: "drive",
    label: "Driving",
    accessibilityLabel: "Driving"
  }
];

const FILTER_BUTTONS: SegmentedButtonOption[] = [
  {
    value: "products",
    label: "Products",
    accessibilityLabel: "Products"
  },
  {
    value: "services",
    label: "Services",
    accessibilityLabel: "Services"
  },
  {
    value: "gifts",
    label: "Gifts",
    accessibilityLabel: "Gifts"
  }
];

const meta = {
  title: "Primitives/SegmentedButtons",
  component: SegmentedButtons,
  args: {
    value: "walk",
    onValueChange: () => undefined,
    buttons: TRANSPORT_BUTTONS
  }
} satisfies Meta<typeof SegmentedButtons>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SingleSelect: Story = {
  render: () => {
    const [value, setValue] = useState("walk");

    return (
      <View style={{ padding: 16 }}>
        <SegmentedButtons value={value} onValueChange={setValue} buttons={TRANSPORT_BUTTONS} />
      </View>
    );
  }
};

export const MultiSelect: Story = {
  render: () => {
    const [value, setValue] = useState<string[]>(["products"]);

    return (
      <View style={{ padding: 16 }}>
        <SegmentedButtons
          multiSelect
          value={value}
          onValueChange={setValue}
          buttons={FILTER_BUTTONS}
        />
      </View>
    );
  }
};

export const WithDisabledOption: Story = {
  render: () => {
    const [value, setValue] = useState("resources");

    return (
      <View style={{ padding: 16 }}>
        <SegmentedButtons
          value={value}
          onValueChange={setValue}
          buttons={[
            { value: "resources", label: "Resources", accessibilityLabel: "Resources" },
            { value: "needs", label: "Needs", accessibilityLabel: "Needs" },
            { value: "claims", label: "Claims", accessibilityLabel: "Claims", disabled: true }
          ]}
        />
      </View>
    );
  }
};