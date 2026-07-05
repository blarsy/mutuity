import { MD3LightTheme, type MD3Theme, configureFonts } from "react-native-paper";

import { designTokens } from "./tokens";

const fontConfig = {
  displayLarge: { fontFamily: "System" },
  displayMedium: { fontFamily: "System" },
  displaySmall: { fontFamily: "System" },
  headlineLarge: { fontFamily: "System" },
  headlineMedium: { fontFamily: "System" },
  headlineSmall: { fontFamily: "System" },
  titleLarge: { fontFamily: "System" },
  titleMedium: { fontFamily: "System" },
  titleSmall: { fontFamily: "System" },
  bodyLarge: { fontFamily: "System" },
  bodyMedium: { fontFamily: "System" },
  bodySmall: { fontFamily: "System" },
  labelLarge: { fontFamily: "System" },
  labelMedium: { fontFamily: "System" },
  labelSmall: { fontFamily: "System" }
} as const;

export const mutuityTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: designTokens.radius.md,
  colors: {
    ...MD3LightTheme.colors,
    primary: designTokens.colors.primary,
    secondaryContainer: designTokens.colors.primaryContainer,
    surfaceVariant: designTokens.colors.primaryContainer,
    backdrop: designTokens.colors.backdrop
  },
  fonts: configureFonts({ config: fontConfig })
};
