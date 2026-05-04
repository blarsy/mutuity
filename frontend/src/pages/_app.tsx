import type { AppProps } from "next/app";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { ApolloProvider } from "@apollo/client/react";
import { useEffect, useMemo, useState } from "react";
import { I18nextProvider } from "react-i18next";

import { AuthProvider } from "../features/auth/AuthProvider";
import { AppShell } from "../features/layout/AppShell";
import { AccountEventSubscriptionProvider } from "../services/graphql/accountEvents";
import { apolloClient } from "../services/graphql/client";
import { type AppColorMode, createAppTheme } from "../theme";
import i18n from "../i18n";

const COLOR_MODE_STORAGE_KEY = "mutuity-color-mode";
const LANGUAGE_STORAGE_KEY = "mutuity-language";
const SUPPORTED_LANGUAGES = new Set(["fr", "en"]);

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

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    const browserLanguage = window.navigator.language?.split("-")[0]?.toLowerCase();

    const nextLanguage =
      (storedLanguage && SUPPORTED_LANGUAGES.has(storedLanguage) && storedLanguage)
      || (browserLanguage && SUPPORTED_LANGUAGES.has(browserLanguage) && browserLanguage)
      || "fr";

    if (storedLanguage !== nextLanguage) {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    }

    if (i18n.language !== nextLanguage) {
      void i18n.changeLanguage(nextLanguage);
    }
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
    <I18nextProvider i18n={i18n}>
      <ApolloProvider client={apolloClient}>
        <AuthProvider>
          <AccountEventSubscriptionProvider>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <AppShell colorMode={colorMode} onToggleColorMode={handleToggleColorMode}>
                <Component {...pageProps} />
              </AppShell>
            </ThemeProvider>
          </AccountEventSubscriptionProvider>
        </AuthProvider>
      </ApolloProvider>
    </I18nextProvider>
  );
}
