import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";

import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";

export interface FormFieldLabelProps {
  children: React.ReactNode;
  style?: object | object[];
  variant?: "titleSmall" | "bodySmall" | "bodyMedium" | "labelSmall" | "headlineSmall";
}

export function FormFieldLabel({ children, style, variant = "bodySmall" }: FormFieldLabelProps): React.JSX.Element {
  const resolvedStyle = Array.isArray(style) ? [styles.label, ...style] : [styles.label, style];

  return (
    <View style={styles.wrapper}>
      <Text variant={variant} style={resolvedStyle}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: -2,
    marginBottom: 2,
    marginLeft: 15,
  },
  label: {
    fontFamily: appFontFamilies.general,
    color: '#000',
    letterSpacing: 0.4,
    fontSize: 16,
    lineHeight: 16,
    textTransform: "none"
  }
});
