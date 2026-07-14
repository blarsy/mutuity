import React from "react";
import { ActivityIndicator, Image, StyleSheet, View, type ViewProps } from "react-native";

import { designTokens } from "../../theme/tokens";

export function Splash(props: ViewProps): React.JSX.Element {
  return (
    <View accessibilityRole="progressbar" style={styles.container} {...props}>
      <Image source={require("../../assets/img/logo.png")} style={styles.logo} resizeMode="contain" />
      <ActivityIndicator size="large" color="#ffffff" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: designTokens.colors.primary,
    gap: designTokens.spacing.lg
  },
  logo: {
    width: 200,
    height: 200
  }
});