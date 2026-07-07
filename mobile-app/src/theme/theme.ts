import { MD3LightTheme, type MD3Theme, configureFonts } from "react-native-paper";

import { designTokens } from "./tokens";
import { appFontFamilies } from "./fonts";

const fontConfig = {
  displayLarge: { fontFamily: appFontFamilies.title },
  displayMedium: { fontFamily: appFontFamilies.title },
  displaySmall: { fontFamily: appFontFamilies.title },
  headlineLarge: { fontFamily: appFontFamilies.title },
  headlineMedium: { fontFamily: appFontFamilies.title },
  headlineSmall: { fontFamily: appFontFamilies.title },
  titleLarge: { fontFamily: appFontFamilies.title },
  titleMedium: { fontFamily: appFontFamilies.title },
  titleSmall: { fontFamily: appFontFamilies.title },
  bodyLarge: { fontFamily: appFontFamilies.general },
  bodyMedium: { fontFamily: appFontFamilies.general },
  bodySmall: { fontFamily: appFontFamilies.sugar },
  labelLarge: { fontFamily: appFontFamilies.altGeneral },
  labelMedium: { fontFamily: appFontFamilies.altGeneral },
  labelSmall: { fontFamily: appFontFamilies.altGeneral }
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
