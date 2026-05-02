import { useMemo, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useQuery } from "@apollo/client/react";
import { Alert, Box, Button, Chip, Container, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useAuth } from "../features/auth/AuthProvider";
import { useRequireAuth } from "../features/auth/requireAuth";
import { ClaimNotificationsPanel } from "../features/needs/ClaimNotificationsPanel";
import { VIEWER_CLAIM_OVERVIEW_QUERY } from "../features/needs/needClaims.queries";
import { NeedClaimStatusChip } from "../features/needs/NeedClaimStatusChip";
import { NeedCard } from "../features/ui/NeedCard";
import { getUserFacingGraphQLErrorMessage } from "../services/graphql/errorMessages";

type ClaimOverviewNode = {
  id: string;
  needId: string;
  claimerAccountId: string;
  message: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  settledAt: string | null;
  needByNeedId: {
    id: string;
    title: string;
    creatorAccountId: string;
    proposedTopesAmount: number | null;
  };
  accountByClaimerAccountId: {
    id: string;
    displayName: string | null;
    externalSubject: string;
  } | null;
};

type ClaimNotificationNode = {
  id: string;
  needClaimId: string;
  eventType: string;
  payload: {
    needId?: string;
    claimerAccountId?: string;
    status?: string;
  };
  createdAt: string;
  readAt: string | null;
};

type ViewerClaimOverviewData = {
  allNeedClaims: {
    nodes: ClaimOverviewNode[];
  };
  allNeedClaimNotifications: {
    nodes: ClaimNotificationNode[];
  };
};

function formatDate(value: string | null, noDateLabel: string) {
  if (!value) {
    return noDateLabel;
  }

  return new Date(value).toLocaleString();
}

export default function ClaimsPage() {
  const router = useRouter();
  const { session } = useAuth();
  const { t } = useTranslation("claims");
  const { isAuthenticated, isChecking, isRedirecting } = useRequireAuth();
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const { data, loading, error, refetch } = useQuery<ViewerClaimOverviewData>(VIEWER_CLAIM_OVERVIEW_QUERY, {
    pollInterval: isAuthenticated ? 15000 : 0,
    skip: !isAuthenticated
  });

  const currentAccountId = session.account?.id ?? null;
  const allClaims = useMemo(() => {
    return [...(data?.allNeedClaims.nodes ?? [])].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );
  }, [data?.allNeedClaims.nodes]);
  const notifications = data?.allNeedClaimNotifications.nodes ?? [];
  const sentClaims = allClaims.filter(claim => claim.claimerAccountId === currentAccountId);
  const receivedClaims = allClaims.filter(claim => claim.needByNeedId.creatorAccountId === currentAccountId);
  const errorMessage = getUserFacingGraphQLErrorMessage(error);

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 6 }}>
          <Typography component="h1" gutterBottom variant="h4">
            {t("title")}
          </Typography>
          <Alert severity="info">
            {isChecking ? t("authGuard.checking", { ns: "common" }) : isRedirecting ? t("authGuard.redirecting", { ns: "common" }) : t("authGuard.signInRequired", { ns: "common" })}
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 6 }}>
        <Stack spacing={3}>
          <Box>
            <Typography component="h1" gutterBottom variant="h4">
              {t("workspaceTitle")}
            </Typography>
            <Typography color="text.secondary">
              {t("workspaceSubtitle")}
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Chip color="primary" label={t("sentCount", { count: sentClaims.length })} />
            <Chip color="secondary" label={t("receivedCount", { count: receivedClaims.length })} />
            <Chip color="info" label={t("notificationsCount", { count: notifications.length })} />
          </Stack>

          {loading ? <Alert severity="info">{t("loading")}</Alert> : null}
          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

          <ClaimNotificationsPanel
            claims={allClaims}
            currentAccountId={currentAccountId ?? ""}
            notifications={notifications}
            onClaimsChanged={() => {
              void refetch();
            }}
            onSelectClaim={claimId => {
              setSelectedClaimId(claimId);
            }}
            selectedClaimId={selectedClaimId}
          />

          <Stack spacing={2}>
            <Typography variant="h5">{t("sentSection")}</Typography>
            {sentClaims.length === 0 ? (
              <Alert severity="info">{t("sentEmpty")}</Alert>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))"
                }}
              >
                {sentClaims.map(claim => {
                  const need = claim.needByNeedId;

                  return (
                    <NeedCard
                      actions={
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                          <Button
                            onClick={() => {
                              setSelectedClaimId(claim.id);
                            }}
                            variant="contained"
                          >
                            {t("actions.viewClaim")}
                          </Button>
                          <Button component={NextLink} href={`/needs/${need.id}`} variant="outlined">
                            {t("actions.viewNeed")}
                          </Button>
                        </Stack>
                      }
                      chips={
                        <>
                          <NeedClaimStatusChip settledAt={claim.settledAt} showSummary={false} status={claim.status} />
                          <Chip
                            label={need.proposedTopesAmount ? t("topesAmount", { amount: need.proposedTopesAmount }) : t("noTopes")}
                            size="small"
                            variant="outlined"
                          />

                        </>
                      }
                      creatorName={need.creatorAccountId === currentAccountId ? t("you") : t("needOwner")}
                      description={
                        claim.message?.trim()
                          ? t("yourNote", { message: claim.message })
                          : t("openClaimHint")
                      }
                      footer={
                        <Stack spacing={0.5}>
                          <Typography color="text.secondary" variant="body2">
                            {t("sent")}: {formatDate(claim.createdAt, t("noDateYet"))}
                            {claim.updatedAt !== claim.createdAt ? ` • ${t("updated")}: ${formatDate(claim.updatedAt, t("noDateYet"))}` : ""}
                          </Typography>
                        </Stack>
                      }
                      key={claim.id}
                      onClick={() => {
                        setSelectedClaimId(claim.id);
                      }}
                      onCreatorClick={() => {
                        void router.push(`/accounts/${need.creatorAccountId}`);
                      }}
                      title={need.title}
                    />
                  );
                })}
              </Box>
            )}
          </Stack>

          <Stack spacing={2}>
            <Typography variant="h5">{t("receivedSection")}</Typography>
            {receivedClaims.length === 0 ? (
              <Alert severity="info">{t("receivedEmpty")}</Alert>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))"
                }}
              >
                {receivedClaims.map(claim => {
                  const need = claim.needByNeedId;
                  const claimerLabel = claim.accountByClaimerAccountId?.displayName
                    ?? claim.accountByClaimerAccountId?.externalSubject
                    ?? claim.claimerAccountId;

                  return (
                    <NeedCard
                      actions={
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                          <Button
                            onClick={() => {
                              setSelectedClaimId(claim.id);
                            }}
                            variant="contained"
                          >
                            {t("actions.reviewClaim")}
                          </Button>
                          <Button component={NextLink} href={`/accounts/${claim.claimerAccountId}`} variant="text">
                            {t("actions.viewClaimer")}
                          </Button>
                        </Stack>
                      }
                      chips={
                        <>
                          <NeedClaimStatusChip settledAt={claim.settledAt} showSummary={false} status={claim.status} />
                          <Chip label={claimerLabel} size="small" variant="outlined" />
                          <Chip
                            label={need.proposedTopesAmount ? t("topesAmount", { amount: need.proposedTopesAmount }) : t("noTopes")}
                            size="small"
                            variant="outlined"
                          />
                        </>
                      }
                      creatorName={claimerLabel}
                      description={
                        claim.message?.trim()
                          ? t("helperNote", { message: claim.message })
                          : t("reviewClaimHint")
                      }
                      footer={
                        <Stack spacing={0.5}>
                          <Typography color="text.secondary" variant="body2">
                            {t("received")}: {formatDate(claim.createdAt, t("noDateYet"))}
                            {claim.updatedAt !== claim.createdAt ? ` • ${t("updated")}: ${formatDate(claim.updatedAt, t("noDateYet"))}` : ""}
                          </Typography>
                        </Stack>
                      }
                      key={claim.id}
                      onClick={() => {
                        setSelectedClaimId(claim.id);
                      }}
                      onCreatorClick={() => {
                        void router.push(`/accounts/${claim.claimerAccountId}`);
                      }}
                      title={need.title}
                    />
                  );
                })}
              </Box>
            )}
          </Stack>
        </Stack>
      </Box>
    </Container>
  );
}
