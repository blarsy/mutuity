import NextLink from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Alert, Box, Button, Container, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useAuth } from "../features/auth/AuthProvider";
import { LoginDialog } from "../features/auth/LoginDialog";

export default function HomePage() {
  const router = useRouter();
  const { session, status } = useAuth();
  const { t } = useTranslation("home");
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const accountName = session.account?.displayName ?? session.account?.externalSubject ?? "account";

  useEffect(() => {
    if (status !== "loading" && session.authenticated) {
      void router.replace("/app");
    }
  }, [router, session.authenticated, status]);

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Typography component="h1" gutterBottom variant="h4">
          {t("title")}
        </Typography>
        <Typography sx={{ mb: 3 }}>
          {t("subtitle")}
        </Typography>

        {status === "loading" ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            {t("checkingSession")}
          </Alert>
        ) : null}

        {session.authenticated ? (
          <Typography sx={{ mb: 3 }} variant="h5">
            {t("welcomeBack", { name: accountName })}
          </Typography>
        ) : (
          <Box sx={{ mb: 3 }}>
            <Button onClick={() => setLoginDialogOpen(true)} variant="outlined">
              {t("signIn")}
            </Button>
          </Box>
        )}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Button component={NextLink} href="/app/needs" variant="contained">
            {t("browseNeeds")}
          </Button>
          <Button component={NextLink} href="/app/resources" variant="contained">
            {t("browseResources")}
          </Button>
        </Stack>

        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Button component={NextLink} href="/privacy" size="small">
            Privacy
          </Button>
          <Button component={NextLink} href="/terms" size="small">
            Terms
          </Button>
        </Stack>

        <LoginDialog
          nextDestination={router.asPath}
          onClose={() => setLoginDialogOpen(false)}
          open={loginDialogOpen}
          subtitle={t("loginDialogSubtitle")}
        />
      </Box>
    </Container>
  );
}
