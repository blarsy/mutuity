import { CssBaseline, ThemeProvider } from "@mui/material";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { I18nextProvider } from "react-i18next";

import { AppShell } from "../../features/layout/AppShell";
import { AccountEventSubscriptionProvider } from "../../services/graphql/accountEvents";
import i18n from "../../i18n";
import { type AppColorMode, createAppTheme } from "../../theme";
import { MockApolloProvider, type MockApolloParameters } from "./mockApollo";
import { MockAuthProvider, type MockAuthParameters } from "./mockAuth";

export type StoryHarnessParameters = {
  auth?: MockAuthParameters;
  apollo?: MockApolloParameters;
  /** Set to false to render the page without the top bar / activation banner. */
  appShell?: boolean;
};

export function StoryProviders({
  children,
  colorMode = "light",
  locale = "fr",
  auth,
  apollo,
  appShell = true
}: StoryHarnessParameters & {
  children: ReactNode;
  colorMode?: AppColorMode;
  locale?: string;
}) {
  const [mode, setMode] = useState<AppColorMode>(colorMode);
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  useEffect(() => {
    setMode(colorMode);
  }, [colorMode]);

  useEffect(() => {
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
  }, [locale]);

  const toggleColorMode = () => {
    setMode(current => (current === "light" ? "dark" : "light"));
  };

  return (
    <I18nextProvider i18n={i18n}>
      <MockApolloProvider parameters={apollo}>
        <MockAuthProvider parameters={auth}>
          <AccountEventSubscriptionProvider>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              {appShell ? (
                <AppShell colorMode={mode} onToggleColorMode={toggleColorMode}>
                  {children}
                </AppShell>
              ) : (
                children
              )}
            </ThemeProvider>
          </AccountEventSubscriptionProvider>
        </MockAuthProvider>
      </MockApolloProvider>
    </I18nextProvider>
  );
}
