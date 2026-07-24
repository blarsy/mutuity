import React from "react";
import type { PropsWithChildren } from "react";
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from "react-native";

import { designTokens } from "../../theme/tokens";

export interface ScreenContainerProps extends PropsWithChildren, ViewProps {
  style?: StyleProp<ViewStyle>;
}

export function ScreenContainer({ children, style, ...rest }: ScreenContainerProps): React.JSX.Element {
  return (
    <View style={[styles.container, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: designTokens.spacing.sm,
    gap: designTokens.spacing.md
  }
});
