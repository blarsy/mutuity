import NextLink from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Stack,
  Typography
} from "@mui/material";
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
    <Box
      sx={{
        background:
          "radial-gradient(circle at top right, rgba(255, 187, 117, 0.22), transparent 46%), linear-gradient(180deg, #f7f8f2 0%, #eef2e1 100%)",
        minHeight: "100vh",
        py: { xs: 4, md: 7 }
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={5}>
          <Box
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.75)",
              border: "1px solid rgba(31, 56, 38, 0.12)",
              borderRadius: 4,
              p: { xs: 3, md: 5 }
            }}
          >
            <Stack spacing={3}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Chip label={t("heroBadge")} sx={{ fontWeight: 700, width: "fit-content" }} />
                <Chip label={t("communityBadge")} sx={{ fontWeight: 700, width: "fit-content" }} />
              </Stack>

              <Typography
                component="h1"
                sx={{
                  color: "#17391f",
                  fontFamily: "Georgia, Times New Roman, serif",
                  fontSize: { xs: 34, md: 56 },
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.02
                }}
              >
                {t("title")}
              </Typography>

              <Typography color="text.secondary" sx={{ fontSize: { xs: 17, md: 21 }, maxWidth: 850 }}>
                {t("subtitle")}
              </Typography>

              <Typography sx={{ color: "#264f2f", fontWeight: 700 }}>
                {t("impactLine")}
              </Typography>

              {status === "loading" ? (
                <Alert severity="info">
                  {t("checkingSession")}
                </Alert>
              ) : null}

              {session.authenticated ? (
                <Alert severity="success">{t("welcomeBack", { name: accountName })}</Alert>
              ) : (
                <Box>
                  <Button onClick={() => setLoginDialogOpen(true)} variant="outlined">
                    {t("signIn")}
                  </Button>
                </Box>
              )}

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button component={NextLink} href="/app/needs" variant="contained">
                  {t("browseNeeds")}
                </Button>
                <Button component={NextLink} href="/app/resources" variant="contained">
                  {t("browseResources")}
                </Button>
                <Button component={NextLink} href="/app/campaigns" variant="outlined">
                  {t("browseCampaigns")}
                </Button>
              </Stack>
            </Stack>
          </Box>

          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <Card sx={{ borderRadius: 3, flex: 1 }}>
              <CardContent>
                <Typography gutterBottom sx={{ color: "#143818", fontWeight: 700, letterSpacing: 0.5 }}>
                  {t("featureOneTitle")}
                </Typography>
                <Typography color="text.secondary">{t("featureOneText")}</Typography>
              </CardContent>
            </Card>
            <Card sx={{ borderRadius: 3, flex: 1 }}>
              <CardContent>
                <Typography gutterBottom sx={{ color: "#143818", fontWeight: 700, letterSpacing: 0.5 }}>
                  {t("featureTwoTitle")}
                </Typography>
                <Typography color="text.secondary">{t("featureTwoText")}</Typography>
              </CardContent>
            </Card>
            <Card sx={{ borderRadius: 3, flex: 1 }}>
              <CardContent>
                <Typography gutterBottom sx={{ color: "#143818", fontWeight: 700, letterSpacing: 0.5 }}>
                  {t("featureThreeTitle")}
                </Typography>
                <Typography color="text.secondary">{t("featureThreeText")}</Typography>
              </CardContent>
            </Card>
          </Stack>

          <Box
            sx={{
              backgroundColor: "#17391f",
              borderRadius: 4,
              color: "#f5f6ed",
              p: { xs: 2.5, md: 3.5 }
            }}
          >
            <Typography sx={{ fontSize: { xs: 20, md: 26 }, fontWeight: 700 }}>
              {t("ctaTitle")}
            </Typography>
            <Typography sx={{ mt: 1.2, opacity: 0.92 }}>{t("ctaText")}</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 2.5 }}>
              <Button component={NextLink} href="/register" variant="contained" color="warning">
                {t("createAccount")}
              </Button>
              <Button component={NextLink} href="/app" variant="outlined" sx={{ color: "#f5f6ed", borderColor: "#f5f6ed" }}>
                {t("enterApp")}
              </Button>
            </Stack>
          </Box>

          <Divider />

          <Stack direction="row" spacing={2}>
            <Button component={NextLink} href="/privacy" size="small">
              {t("privacy")}
            </Button>
            <Button component={NextLink} href="/terms" size="small">
              {t("terms")}
            </Button>
          </Stack>
        </Stack>

        <LoginDialog
          nextDestination={router.asPath}
          onClose={() => setLoginDialogOpen(false)}
          open={loginDialogOpen}
          subtitle={t("loginDialogSubtitle")}
        />
      </Container>
    </Box>
  );
}
