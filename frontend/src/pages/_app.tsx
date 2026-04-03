import type { AppProps } from "next/app";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { ApolloProvider } from "@apollo/client/react";

import { AuthProvider } from "../features/auth/AuthProvider";
import { apolloClient } from "../services/graphql/client";

const theme = createTheme();

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Component {...pageProps} />
        </ThemeProvider>
      </AuthProvider>
    </ApolloProvider>
  );
}
