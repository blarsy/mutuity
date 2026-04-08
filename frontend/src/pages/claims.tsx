import { useMemo, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useQuery } from "@apollo/client/react";
import { Alert, Box, Button, Chip, Container, Stack, Typography } from "@mui/material";

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
  claimConversationByNeedClaimId: {
    id: string;
    createdAt: string;
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

function formatDate(value: string | null) {
  if (!value) {
    return "No update yet";
  }

  return new Date(value).toLocaleString();
}

export default function ClaimsPage() {
  const router = useRouter();
  const { session } = useAuth();
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
            Claims
          </Typography>
          <Alert severity="info">
            {isChecking ? "Checking your session…" : isRedirecting ? "Redirecting to sign in…" : "Please sign in to continue."}
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
              Claims workspace
            </Typography>
            <Typography color="text.secondary">
              Follow the needs you claimed, review incoming helpers on your own needs, and continue each related conversation.
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Chip color="primary" label={`${sentClaims.length} sent`} />
            <Chip color="secondary" label={`${receivedClaims.length} received`} />
            <Chip color="info" label={`${notifications.length} notifications`} />
          </Stack>

          {loading ? <Alert severity="info">Loading your claims…</Alert> : null}
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
            <Typography variant="h5">Claims you sent</Typography>
            {sentClaims.length === 0 ? (
              <Alert severity="info">You have not claimed any needs yet.</Alert>
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
                            {claim.claimConversationByNeedClaimId ? "Open thread" : "View claim"}
                          </Button>
                          <Button component={NextLink} href={`/needs/${need.id}`} variant="outlined">
                            View need
                          </Button>
                        </Stack>
                      }
                      chips={
                        <>
                          <NeedClaimStatusChip settledAt={claim.settledAt} showSummary={false} status={claim.status} />
                          <Chip
                            label={need.proposedTopesAmount ? `${need.proposedTopesAmount} Topes` : "No Topes"}
                            size="small"
                            variant="outlined"
                          />
                          {claim.claimConversationByNeedClaimId ? (
                            <Chip label="thread open" size="small" variant="outlined" />
                          ) : null}
                        </>
                      }
                      creatorName={need.creatorAccountId === currentAccountId ? "You" : "Need owner"}
                      description={
                        claim.message?.trim()
                          ? `Your note: ${claim.message}`
                          : "Open this claim to continue the conversation and review the latest status."
                      }
                      footer={
                        <Stack spacing={0.5}>
                          <Typography color="text.secondary" variant="body2">
                            Sent: {formatDate(claim.createdAt)}
                            {claim.updatedAt !== claim.createdAt ? ` • Updated: ${formatDate(claim.updatedAt)}` : ""}
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
            <Typography variant="h5">Claims received on your needs</Typography>
            {receivedClaims.length === 0 ? (
              <Alert severity="info">No helpers have claimed your needs yet.</Alert>
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
                            {claim.claimConversationByNeedClaimId ? "Manage thread" : "Review claim"}
                          </Button>
                          <Button component={NextLink} href={`/accounts/${claim.claimerAccountId}`} variant="text">
                            View claimer
                          </Button>
                        </Stack>
                      }
                      chips={
                        <>
                          <NeedClaimStatusChip settledAt={claim.settledAt} showSummary={false} status={claim.status} />
                          <Chip label={claimerLabel} size="small" variant="outlined" />
                          <Chip
                            label={need.proposedTopesAmount ? `${need.proposedTopesAmount} Topes` : "No Topes"}
                            size="small"
                            variant="outlined"
                          />
                        </>
                      }
                      creatorName={claimerLabel}
                      description={
                        claim.message?.trim()
                          ? `Helper note: ${claim.message}`
                          : "Open this claim to reply, continue the thread, or settle the need when fulfilled."
                      }
                      footer={
                        <Stack spacing={0.5}>
                          <Typography color="text.secondary" variant="body2">
                            Received: {formatDate(claim.createdAt)}
                            {claim.updatedAt !== claim.createdAt ? ` • Updated: ${formatDate(claim.updatedAt)}` : ""}
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
