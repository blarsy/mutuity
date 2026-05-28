import { useEffect } from "react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { Alert, Box, Button, Container, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useAuth } from "./AuthProvider";
import { resolveSocialCallbackOutcome } from "./socialCallback";
import type { SocialProvider } from "./socialAuth";

type SocialCallbackPageProps = {
  provider: SocialProvider;
};

export function SocialCallbackPage({ provider }: SocialCallbackPageProps) {
  const router = useRouter();
  const { refreshSession, session, status } = useAuth();
  const { t } = useTranslation("auth");
  const outcome = resolveSocialCallbackOutcome(provider, router.query);

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    if (outcome.errorMessage) {
      return;
    }

    if (status === "loading") {
      return;
    }

    const redirectAfterRefresh = async () => {
      await refreshSession();

      if (outcome.shouldRedirectToRegister && !session.authenticated) {
        await router.replace(outcome.registerPrefillHref);
        return;
      }

      await router.replace(session.authenticated ? outcome.nextDestination : `/login?next=${encodeURIComponent(outcome.nextDestination)}`);
    };

    void redirectAfterRefresh();
  }, [
    outcome.errorMessage,
    outcome.nextDestination,
    outcome.registerPrefillHref,
    outcome.shouldRedirectToRegister,
    refreshSession,
    router,
    router.isReady,
    session.authenticated,
    status
  ]);

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 6 }}>
        <Stack spacing={2}>
          <Typography component="h1" variant="h4">
            {t("socialCallback.title")}
          </Typography>

          {outcome.errorMessage ? (
            <>
              <Alert severity="error">{outcome.errorMessage}</Alert>
              <Stack direction="row" spacing={1}>
                <Button component={NextLink} href="/login" variant="contained">
                  {t("socialCallback.backToSignIn")}
                </Button>
                <Button component={NextLink} href={outcome.registerPrefillHref} variant="outlined">
                  {t("socialCallback.completeRegistration")}
                </Button>
              </Stack>
            </>
          ) : (
            <Alert severity="info">{t("socialCallback.processing")}</Alert>
          )}
        </Stack>
      </Box>
    </Container>
  );
}
