import React, { useEffect, useState } from "react";
import { useFonts } from "expo-font";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import "./i18n";
import { Splash } from "./components/state/Splash";
import { AppNavigator } from "./navigation/AppNavigator";
import { MutuityThemeProvider } from "./theme/MutuityThemeProvider";
import { appFontAssets } from "./theme/fonts";

const isStorybookEnabled = process.env.EXPO_PUBLIC_STORYBOOK_ENABLED === "true";
const MINIMUM_SPLASH_DURATION_MS = 2000;

export default function App(): React.JSX.Element {
  if (isStorybookEnabled) {
    const StorybookUI = require("../.rnstorybook").default as React.ComponentType;
    return <StorybookUI />;
  }

  const [fontsLoaded, fontsLoadError] = useFonts({
    ...appFontAssets,
    ...MaterialCommunityIcons.font
  });
  const [minimumSplashElapsed, setMinimumSplashElapsed] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setMinimumSplashElapsed(true);
    }, MINIMUM_SPLASH_DURATION_MS);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (fontsLoadError) {
      console.warn("[boot:font-load-fallback]", fontsLoadError);
    }
  }, [fontsLoadError]);

  const isBootReady = fontsLoaded || Boolean(fontsLoadError);

  if (!isBootReady || !minimumSplashElapsed) {
    return <Splash />;
  }

  return (
    <MutuityThemeProvider>
      <AppNavigator />
    </MutuityThemeProvider>
  );
}
