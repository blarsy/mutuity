import React, { useEffect } from "react";
import { useFonts } from "expo-font";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import "./i18n";
import { AppNavigator } from "./navigation/AppNavigator";
import { MutuityThemeProvider } from "./theme/MutuityThemeProvider";
import { appFontAssets } from "./theme/fonts";

const isStorybookEnabled = process.env.EXPO_PUBLIC_STORYBOOK_ENABLED === "true";

export default function App(): React.JSX.Element {
  if (isStorybookEnabled) {
    const StorybookUI = require("../.rnstorybook").default as React.ComponentType;
    return <StorybookUI />;
  }

  const [fontsLoaded, fontsLoadError] = useFonts({
    ...appFontAssets,
    ...MaterialCommunityIcons.font
  });

  useEffect(() => {
    if (fontsLoadError) {
      console.warn("[boot:font-load-fallback]", fontsLoadError);
    }
  }, [fontsLoadError]);

  if (!fontsLoaded && !fontsLoadError) {
    return (
      <View accessibilityRole="progressbar" style={styles.bootScreen}>
        <ActivityIndicator size="small" />
        <Text style={styles.bootLabel}>Loading Mutuity...</Text>
      </View>
    );
  }

  return (
    <MutuityThemeProvider>
      <AppNavigator />
    </MutuityThemeProvider>
  );
}

const styles = StyleSheet.create({
  bootScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8
  },
  bootLabel: {
    color: "#111"
  }
});
