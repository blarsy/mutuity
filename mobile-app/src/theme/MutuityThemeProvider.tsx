import React from "react";
import type { PropsWithChildren } from "react";
import { PaperProvider } from "react-native-paper";

import { mutuityTheme } from "./theme";

export function MutuityThemeProvider({ children }: PropsWithChildren): React.JSX.Element {
  return <PaperProvider theme={mutuityTheme}>{children}</PaperProvider>;
}
