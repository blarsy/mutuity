import React from "react";

import "./i18n";
import { AppNavigator } from "./navigation/AppNavigator";
import { MutuityThemeProvider } from "./theme/MutuityThemeProvider";

export default function App(): React.JSX.Element {
  return (
    <MutuityThemeProvider>
      <AppNavigator />
    </MutuityThemeProvider>
  );
}
