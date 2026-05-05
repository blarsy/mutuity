import { useMemo, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useMutation, useQuery } from "@apollo/client/react";
import { Alert, Box, Button, Chip, Container, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useAuth } from "../features/auth/AuthProvider";
import { conversationThreadUrl } from "../features/chat/chatRouting";
import { useRequireAuth } from "../features/auth/requireAuth";
import { ClaimNotificationsPanel } from "../features/needs/ClaimNotificationsPanel";
import {
  CANCEL_NEED_CLAIM_MUTATION,
  DECLINE_NEED_CLAIM_MUTATION,
  SETTLE_NEED_CLAIM_MUTATION,
  VIEWER_CLAIM_OVERVIEW_QUERY
} from "../features/needs/needClaims.queries";
import { NeedClaimStatusChip } from "../features/needs/NeedClaimStatusChip";
import { NeedCard } from "../features/ui/NeedCard";
import { useAccountEventSignal } from "../services/graphql/accountEvents";
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
  settledByAccountId: string | null;
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
  claimConversationsByNeedClaimId: {
    nodes: Array<{ id: string }>;
  };
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

function InactiveExplanation({ claim, t }: { claim: ClaimOverviewNode; t: (k: string, opts?: Record<string, unknown>) => string }) {
  const { status } = claim;
  const key = status.toLowerCase() as "settled" | "declined" | "withdrawn" | "expired";
  const decisionDate = claim.settledAt ?? claim.updatedAt;
  const severity = status === "SETTLED" ? "success" : status === "DECLINED" ? "error" : "warning";
  return <Alert severity={severity} sx={{ py: 0.5 }}>{t(`inactive.${key}`, { date: formatDate(decisionDate, "") })}</Alert>;
}

export default function ClaimsPage() {
  const router = useRouter();
  const { session } = useAuth();
  const { t } = useTranslation("claims");
  const { isAuthenticated, isChecking, isRedirecting } = useRequireAuth();
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [settleConfirmClaimId, setSettleConfirmClaimId] = useState<string | null>(null);
  const { data, loading, error, refetch } = useQuery<ViewerClaimOverviewData>(VIEWER_CLAIM_OVERVIEW_QUERY, {
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    skip: !isAuthenticated
  });

  const [cancelClaim, { loading: cancelling }] = useMutation(CANCEL_NEED_CLAIM_MUTATION, {
    onCompleted: () => { void refetch(); }
  });
  const [declineClaim, { loading: declining }] = useMutation(DECLINE_NEED_CLAIM_MUTATION, {
    onCompleted: () => { void refetch(); }
  });
  const [settleClaim, { loading: settling }] = useMutation(SETTLE_NEED_CLAIM_MUTATION, {
    onCompleted: () => {
      setSettleConfirmClaimId(null);
      void refetch();
    }
  });

  const handleSettleConfirm = () => {
    if (!settleConfirmClaimId) return;
    void settleClaim({ variables: { input: { needClaimId: settleConfirmClaimId } } });
  };

  useAccountEventSignal(() => {
    void refetch();
  }, isAuthenticated);

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

          {loading && !data ? <Alert severity="info">{t("loading")}</Alert> : null}
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
                  const claimConversationId = claim.claimConversationsByNeedClaimId.nodes[0]?.id ?? null;
                  const isOpen = claim.status === "OPEN";

                  return (
                    <NeedCard
                      actions={
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                          {isOpen ? (
                            <Button
                              color="error"
                              disabled={cancelling}
                              onClick={() => {
                                void cancelClaim({ variables: { input: { needClaimId: claim.id } } });
                              }}
                              variant="outlined"
                            >
                              {t("actions.cancel")}
                            </Button>
                          ) : null}
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
                          <Button component={NextLink} href={`/accounts/${need.creatorAccountId}`} variant="text">
                            {t("actions.viewNeedOwner")}
                          </Button>
                          {claimConversationId ? (
                            <Button component={NextLink} href={conversationThreadUrl("need", claimConversationId)} variant="text">
                              {t("actions.chat")}
                            </Button>
                          ) : null}
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
                          : isOpen ? t("openClaimHint") : null
                      }
                      footer={
                        <Stack spacing={0.5}>
                          {!isOpen ? <InactiveExplanation claim={claim} t={t} /> : null}
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
                  const claimConversationId = claim.claimConversationsByNeedClaimId.nodes[0]?.id ?? null;
                  const isOpen = claim.status === "OPEN";

                  return (
                    <NeedCard
                      actions={
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                          {isOpen ? (
                            <Button
                              color="success"
                              disabled={settling}
                              onClick={() => {
                                setSettleConfirmClaimId(claim.id);
                              }}
                              variant="contained"
                            >
                              {t("actions.settle")}
                            </Button>
                          ) : null}
                          {isOpen ? (
                            <Button
                              color="error"
                              disabled={declining}
                              onClick={() => {
                                void declineClaim({ variables: { input: { needClaimId: claim.id } } });
                              }}
                              variant="outlined"
                            >
                              {t("actions.decline")}
                            </Button>
                          ) : null}
                          <Button
                            onClick={() => {
                              setSelectedClaimId(claim.id);
                            }}
                            variant={isOpen ? "outlined" : "contained"}
                          >
                            {t("actions.reviewClaim")}
                          </Button>
                          <Button component={NextLink} href={`/accounts/${claim.claimerAccountId}`} variant="text">
                            {t("actions.viewClaimer")}
                          </Button>
                          <Button component={NextLink} href={`/needs/${need.id}`} variant="outlined">
                            {t("actions.viewNeed")}
                          </Button>
                          {claimConversationId ? (
                            <Button component={NextLink} href={conversationThreadUrl("need", claimConversationId)} variant="text">
                              {t("actions.chat")}
                            </Button>
                          ) : null}
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
                          : isOpen ? t("reviewClaimHint") : null
                      }
                      footer={
                        <Stack spacing={0.5}>
                          {!isOpen ? <InactiveExplanation claim={claim} t={t} /> : null}
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

      <Dialog maxWidth="xs" open={settleConfirmClaimId !== null} onClose={() => { setSettleConfirmClaimId(null); }}>
        <DialogTitle>{t("settleConfirm.title")}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t("settleConfirm.message")}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setSettleConfirmClaimId(null); }}>{t("settleConfirm.cancel")}</Button>
          <Button color="success" disabled={settling} onClick={handleSettleConfirm} variant="contained">{t("settleConfirm.confirm")}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
