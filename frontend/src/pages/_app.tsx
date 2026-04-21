import type { AppProps } from "next/app";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ApolloProvider } from "@apollo/client/react";
import { useEffect, useMemo, useState } from "react";

import { AuthProvider } from "../features/auth/AuthProvider";
import { AppShell } from "../features/layout/AppShell";
import { apolloClient } from "../services/graphql/client";
import { type AppColorMode, createAppTheme } from "../theme";

const COLOR_MODE_STORAGE_KEY = "mutuity-color-mode";

export default function App({ Component, pageProps }: AppProps) {
  const [colorMode, setColorMode] = useState<AppColorMode>("light");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedMode = window.localStorage.getItem(COLOR_MODE_STORAGE_KEY);

    if (storedMode === "light" || storedMode === "dark") {
      setColorMode(storedMode);
      return;
    }

    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;
    setColorMode(prefersDark ? "dark" : "light");
  }, []);

  const handleToggleColorMode = () => {
    setColorMode(currentMode => {
      const nextMode: AppColorMode = currentMode === "light" ? "dark" : "light";

      if (typeof window !== "undefined") {
        window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, nextMode);
      }

      return nextMode;
    });
  };

  const theme = useMemo(() => createAppTheme(colorMode), [colorMode]);

  return (
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AppShell colorMode={colorMode} onToggleColorMode={handleToggleColorMode}>
            <Component {...pageProps} />
          </AppShell>
        </ThemeProvider>
      </AuthProvider>
    </ApolloProvider>
  );
}
