import { useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { Alert, Box, Container, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useAuth } from "../features/auth/AuthProvider";
import { LoginForm } from "../features/auth/LoginForm";

export function resolveNextDestination(candidate: unknown): string {
  return typeof candidate === "string" && candidate.startsWith("/") ? candidate : "/";
}

function resolveSocialProviderLabel(provider: unknown) {
  if (provider === "apple") {
    return "Apple";
  }

  return "Google";
}

export default function LoginPage() {
  const router = useRouter();
  const { status, session } = useAuth();
  const { t } = useTranslation("auth");

  const nextDestination = useMemo(() => resolveNextDestination(router.query.next), [router.query.next]);
  const isProtectedRedirect = nextDestination !== "/";
  const socialLinkRequired = router.query.social_link_required === "1";
  const socialEmail = typeof router.query.email === "string" ? router.query.email : "";
  const socialProviderLabel = resolveSocialProviderLabel(router.query.provider);

  useEffect(() => {
    if (status === "authenticated") {
      void router.replace(nextDestination);
    }
  }, [nextDestination, router, status]);

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 6 }}>
        <Typography component="h1" gutterBottom variant="h4">
          {t("signIn.title")}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {t("signIn.subtitle")}
        </Typography>

        {isProtectedRedirect && !session.authenticated ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            {t("signIn.protectedRedirectHint")}
          </Alert>
        ) : null}

        {socialLinkRequired && !session.authenticated ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {t("signIn.socialLinkRequiredHint", {
              provider: socialProviderLabel,
              email: socialEmail || t("signIn.socialLinkRequiredNoEmail")
            })}
          </Alert>
        ) : null}

        {status === "loading" ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            {t("signIn.sessionRestoring")}
          </Alert>
        ) : null}

        {session.authenticated ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            {t("signIn.alreadySignedIn")}
          </Alert>
        ) : null}

        <LoginForm nextDestination={nextDestination} showSecondaryActions />
      </Box>
    </Container>
  );
}
