import React, { useMemo } from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import { SegmentedButtons, type SegmentedButtonsProps } from "react-native-paper";

import { designTokens } from "../../theme/tokens";

export function AppSegmentedButtons<T extends string = string>(
  props: SegmentedButtonsProps<T>
): React.JSX.Element {
  const buttons = useMemo(() => {
    return props.buttons.map((button) => {
      const checked = Array.isArray(props.value)
        ? props.value.includes(button.value)
        : props.value === button.value;

      const stateStyle: StyleProp<ViewStyle> = checked
        ? { backgroundColor: designTokens.colors.primary }
        : { backgroundColor: designTokens.colors.secondary };

      return {
        ...button,
        checkedColor: "#ffffff",
        uncheckedColor: "#000000",
        style: [button.style, stateStyle]
      };
    });
  }, [
    props.buttons,
    props.value
  ]);

  return <SegmentedButtons {...props} buttons={buttons} />;
}
