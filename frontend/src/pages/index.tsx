import NextLink from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import {
  Alert,
  Avatar,
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
import type { AuthStatus } from "../features/auth/AuthProvider";

import { useAuth } from "../features/auth/AuthProvider";
import { LoginDialog } from "../features/auth/LoginDialog";

const LANDING_LATEST_RESOURCES_QUERY = gql`
  query LandingLatestResources($first: Int = 6) {
    allResources(
      condition: { isActive: true }
      orderBy: ID_DESC
      first: $first
    ) {
      nodes {
        id
        title
        description
        location
        imageUrls
        createdAt
        accountByCreatorAccountId {
          id
          displayName
          externalSubject
        }
      }
    }
  }
`;

const LANDING_LATEST_ACCOUNTS_QUERY = gql`
  query LandingLatestAccounts($first: Int = 6) {
    allAccounts(orderBy: ID_DESC, first: $first) {
      nodes {
        id
        displayName
        externalSubject
        avatarUrl
        bio
      }
    }
  }
`;

type LandingLatestResourcesData = {
  allResources: {
    nodes: Array<{
      id: string;
      title: string;
      description: string | null;
      location: string | null;
      imageUrls: Array<string | null>;
      createdAt: string;
      accountByCreatorAccountId: {
        displayName: string | null;
        externalSubject: string;
      } | null;
    }>;
  } | null;
};

type LandingLatestAccountsData = {
  allAccounts: {
    nodes: Array<{
      id: string;
      displayName: string | null;
      externalSubject: string;
      avatarUrl: string | null;
      bio: string | null;
    }>;
  } | null;
};

function shortText(value: string | null | undefined, fallback: string, maxLength = 120) {
  const normalized = value?.trim();

  if (!normalized) {
    return fallback;
  }

  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}…` : normalized;
}

function initialsFromName(name: string) {
  const chunks = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(value => value[0]?.toUpperCase() ?? "");

  return chunks.join("") || "A";
}

export function shouldRedirectFromRoot(status: AuthStatus, isAuthenticated: boolean) {
  return status !== "loading" && isAuthenticated;
}

export function shouldRenderGuestActions(status: AuthStatus, isAuthenticated: boolean) {
  return status !== "loading" && !isAuthenticated;
}

export default function HomePage() {
  const router = useRouter();
  const { session, status } = useAuth();
  const { t } = useTranslation("home");
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const accountName = session.account?.displayName ?? session.account?.externalSubject ?? "account";
  const {
    data: latestResourcesData,
    loading: latestResourcesLoading,
    error: latestResourcesError
  } = useQuery<LandingLatestResourcesData>(LANDING_LATEST_RESOURCES_QUERY);
  const {
    data: latestAccountsData,
    loading: latestAccountsLoading,
    error: latestAccountsError
  } = useQuery<LandingLatestAccountsData>(LANDING_LATEST_ACCOUNTS_QUERY);

  const latestResources = latestResourcesData?.allResources?.nodes ?? [];
  const latestAccounts = (latestAccountsData?.allAccounts?.nodes ?? []).filter(
    account => !account.externalSubject.startsWith("deleted-")
  );

  useEffect(() => {
    if (shouldRedirectFromRoot(status, session.authenticated)) {
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
              ) : shouldRenderGuestActions(status, session.authenticated) ? (
                <Box>
                  <Button onClick={() => setLoginDialogOpen(true)} variant="outlined">
                    {t("signIn")}
                  </Button>
                </Box>
              ) : null}

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

          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" spacing={2}>
              <Typography sx={{ color: "#143818", fontSize: { xs: 22, md: 28 }, fontWeight: 700 }}>
                {t("latestResourcesTitle")}
              </Typography>
              <Button component={NextLink} href="/app/resources" size="small" variant="text">
                {t("seeAllResources")}
              </Button>
            </Stack>

            {latestResourcesLoading ? (
              <Alert severity="info">{t("loadingLatestResources")}</Alert>
            ) : null}

            {!latestResourcesLoading && latestResourcesError ? (
              <Alert severity="warning">{t("latestResourcesUnavailable")}</Alert>
            ) : null}

            {!latestResourcesLoading && !latestResourcesError && latestResources.length === 0 ? (
              <Alert severity="info">{t("noLatestResources")}</Alert>
            ) : null}

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              {latestResources.slice(0, 3).map(resource => {
                const creatorLabel =
                  resource.accountByCreatorAccountId?.displayName
                  ?? resource.accountByCreatorAccountId?.externalSubject
                  ?? t("unknownAccount");
                const imageUrl = resource.imageUrls.find(Boolean) || null;

                return (
                  <Card key={resource.id} sx={{ borderRadius: 3, flex: 1 }} variant="outlined">
                    <CardContent>
                      <Stack spacing={1.2}>
                        <Box
                          sx={{
                            aspectRatio: "16/9",
                            backgroundColor: "#ecf2de",
                            backgroundImage: imageUrl ? `url(${imageUrl})` : "none",
                            backgroundPosition: "center",
                            backgroundSize: "cover",
                            borderRadius: 2
                          }}
                        />
                        <Typography sx={{ fontWeight: 700 }}>{resource.title}</Typography>
                        <Typography color="text.secondary" variant="body2">
                          {shortText(resource.description, t("resourceDescriptionFallback"), 95)}
                        </Typography>
                        <Typography color="text.secondary" variant="caption">
                          {t("byAccount", { account: creatorLabel })}
                        </Typography>
                        <Button component={NextLink} href={`/app/resources/${resource.id}`} size="small" variant="outlined">
                          {t("openResource")}
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          </Stack>

          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" spacing={2}>
              <Typography sx={{ color: "#143818", fontSize: { xs: 22, md: 28 }, fontWeight: 700 }}>
                {t("latestAccountsTitle")}
              </Typography>
              <Button component={NextLink} href="/app/resources" size="small" variant="text">
                {t("meetContributors")}
              </Button>
            </Stack>

            {latestAccountsLoading ? (
              <Alert severity="info">{t("loadingLatestAccounts")}</Alert>
            ) : null}

            {!latestAccountsLoading && latestAccountsError ? (
              <Alert severity="warning">{t("latestAccountsUnavailable")}</Alert>
            ) : null}

            {!latestAccountsLoading && !latestAccountsError && latestAccounts.length === 0 ? (
              <Alert severity="info">{t("noLatestAccounts")}</Alert>
            ) : null}

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              {latestAccounts.slice(0, 3).map(account => {
                const name = account.displayName || account.externalSubject;

                return (
                  <Card key={account.id} sx={{ borderRadius: 3, flex: 1 }} variant="outlined">
                    <CardContent>
                      <Stack spacing={1.2}>
                        <Stack alignItems="center" direction="row" spacing={1.2}>
                          <Avatar src={account.avatarUrl || undefined}>{initialsFromName(name)}</Avatar>
                          <Typography sx={{ fontWeight: 700 }}>{name}</Typography>
                        </Stack>
                        <Typography color="text.secondary" variant="body2">
                          {shortText(account.bio, t("accountBioFallback"), 100)}
                        </Typography>
                        <Button component={NextLink} href={`/app/accounts/${account.id}`} size="small" variant="outlined">
                          {t("openProfile")}
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
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
