import React from "react";
import { useFonts } from "expo-font";

import "./i18n";
import StorybookUI from "../.rnstorybook";
import { AppNavigator } from "./navigation/AppNavigator";
import { MutuityThemeProvider } from "./theme/MutuityThemeProvider";
import { appFontAssets } from "./theme/fonts";

const isStorybookEnabled = process.env.EXPO_PUBLIC_STORYBOOK_ENABLED === "true";

export default function App(): React.JSX.Element {
  if (isStorybookEnabled) {
    return <StorybookUI />;
  }

  const [fontsLoaded] = useFonts(appFontAssets);

  if (!fontsLoaded) {
    return <></>;
  }

  return (
    <MutuityThemeProvider>
      <AppNavigator />
    </MutuityThemeProvider>
  );
}
