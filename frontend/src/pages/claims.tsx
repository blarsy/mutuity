import { useEffect, useMemo, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useMutation, useQuery } from "@apollo/client/react";
import { Alert, Box, Button, Chip, Container, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useAuth } from "../features/auth/AuthProvider";
import { conversationThreadUrl } from "../features/chat/chatRouting";
import { useRequireAuth } from "../features/auth/requireAuth";
import {
  CANCEL_NEED_CLAIM_MUTATION,
  DECLINE_NEED_CLAIM_MUTATION,
  SETTLE_NEED_CLAIM_MUTATION,
  VIEWER_CLAIM_OVERVIEW_QUERY
} from "../features/needs/needClaims.queries";
import { NeedClaimManagementPage } from "../features/needs/NeedClaimManagementPage";
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

type ViewerClaimOverviewData = {
  currentTokenBalance: number | null;
  sentNeedClaims: {
    nodes: ClaimOverviewNode[];
  };
  receivedNeedClaims: {
    nodes: ClaimOverviewNode[];
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
  const opts = key === "expired" ? {} : { date: formatDate(decisionDate, "") };
  return <Alert severity={severity} sx={{ py: 0.5 }}>{t(`inactive.${key}`, opts)}</Alert>;
}

export default function ClaimsPage() {
  const router = useRouter();
  const { session } = useAuth();
  const { t } = useTranslation("claims");
  const { isAuthenticated, isChecking, isRedirecting } = useRequireAuth();
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [settleConfirmClaimId, setSettleConfirmClaimId] = useState<string | null>(null);
  const [sentFilter, setSentFilter] = useState<"active" | "inactive" | "all">("active");
  const [receivedFilter, setReceivedFilter] = useState<"active" | "inactive" | "all">("active");
  const [sentPageSize, setSentPageSize] = useState(5);
  const [receivedPageSize, setReceivedPageSize] = useState(5);

  const selectClaim = (claimId: string) => {
    setSelectedClaimId(claimId);
    if (typeof window === "undefined") {
      return;
    }

    window.setTimeout(() => {
      const panel = document.getElementById("claim-management-panel");
      panel?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const { data, loading, error, refetch } = useQuery<ViewerClaimOverviewData>(VIEWER_CLAIM_OVERVIEW_QUERY, {
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    skip: !isAuthenticated,
    variables: { viewerId: session.account?.id ?? "" }
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
  const viewerBalance = data?.currentTokenBalance ?? null;
  const allClaims = useMemo(() => {
    const sent = data?.sentNeedClaims.nodes ?? [];
    const received = data?.receivedNeedClaims.nodes ?? [];
    return [...sent, ...received].sort(
      (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    );
  }, [data?.sentNeedClaims.nodes, data?.receivedNeedClaims.nodes]);

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const claimId = typeof router.query.claimId === "string" ? router.query.claimId : null;
    if (!claimId) {
      return;
    }

    if (allClaims.some(claim => claim.id === claimId)) {
      selectClaim(claimId);
    }
  }, [allClaims, router.isReady, router.query.claimId]);

  const applyFilter = (claims: ClaimOverviewNode[], filter: "active" | "inactive" | "all") => {
    if (filter === "active") return claims.filter(c => c.status === "OPEN");
    if (filter === "inactive") return claims.filter(c => c.status !== "OPEN");
    return claims;
  };

  const sentAll = allClaims.filter(claim => claim.claimerAccountId === currentAccountId);
  const receivedAll = allClaims.filter(claim => claim.needByNeedId.creatorAccountId === currentAccountId);
  const sentFiltered = applyFilter(sentAll, sentFilter);
  const receivedFiltered = applyFilter(receivedAll, receivedFilter);
  const sentClaims = sentFiltered.slice(0, sentPageSize);
  const receivedClaims = receivedFiltered.slice(0, receivedPageSize);
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
            <Chip color="primary" label={t("sentCount", { count: sentAll.length })} />
            <Chip color="secondary" label={t("receivedCount", { count: receivedAll.length })} />
          </Stack>

          {loading && !data ? <Alert severity="info">{t("loading")}</Alert> : null}
          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

          {selectedClaimId ? (
            <Box id="claim-management-panel" sx={{ scrollMarginTop: 24 }}>
              <NeedClaimManagementPage
                claimId={selectedClaimId}
                currentAccountId={currentAccountId ?? ""}
                onClaimsChanged={() => {
                  void refetch();
                }}
              />
            </Box>
          ) : null}

          <Stack spacing={2}>
            <Stack alignItems="center" direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
              <Typography variant="h5">{t("sentSection")}</Typography>
              <ToggleButtonGroup
                exclusive
                onChange={(_, val: "active" | "inactive" | "all" | null) => {
                  if (val) {
                    setSentFilter(val);
                    setSentPageSize(5);
                  }
                }}
                size="small"
                value={sentFilter}
              >
                <ToggleButton value="active">{t("filter.active")}</ToggleButton>
                <ToggleButton value="inactive">{t("filter.inactive")}</ToggleButton>
                <ToggleButton value="all">{t("filter.all")}</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
            {sentAll.length === 0 ? (
              <Alert severity="info">{t("sentEmpty")}</Alert>
            ) : sentFiltered.length === 0 ? (
              <Alert severity="info">{t("sentFilterEmpty")}</Alert>
            ) : (
              <>
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
                              selectClaim(claim.id);
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
                        selectClaim(claim.id);
                      }}
                      onCreatorClick={() => {
                        void router.push(`/accounts/${need.creatorAccountId}`);
                      }}
                      title={need.title}
                    />
                  );
                })}
              </Box>
              {sentFiltered.length > sentPageSize ? (
                <Button onClick={() => { setSentPageSize(n => n + 5); }} variant="text">
                  {t("loadMore")}
                </Button>
              ) : null}
            </>
            )}
          </Stack>

          <Stack spacing={2}>
            <Stack alignItems="center" direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
              <Typography variant="h5">{t("receivedSection")}</Typography>
              <ToggleButtonGroup
                exclusive
                onChange={(_, val: "active" | "inactive" | "all" | null) => {
                  if (val) {
                    setReceivedFilter(val);
                    setReceivedPageSize(5);
                  }
                }}
                size="small"
                value={receivedFilter}
              >
                <ToggleButton value="active">{t("filter.active")}</ToggleButton>
                <ToggleButton value="inactive">{t("filter.inactive")}</ToggleButton>
                <ToggleButton value="all">{t("filter.all")}</ToggleButton>
              </ToggleButtonGroup>
            </Stack>
            {receivedAll.length === 0 ? (
              <Alert severity="info">{t("receivedEmpty")}</Alert>
            ) : receivedFiltered.length === 0 ? (
              <Alert severity="info">{t("receivedFilterEmpty")}</Alert>
            ) : (
              <>
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
                    const requiredTopes = claim.needByNeedId.proposedTopesAmount ?? 0;
                    const canSettle = viewerBalance === null || viewerBalance >= requiredTopes;

                    return (
                    <NeedCard
                      actions={
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                          {isOpen ? (
                            <Button
                              color="success"
                              disabled={settling || !canSettle}
                              onClick={() => {
                                setSettleConfirmClaimId(claim.id);
                              }}
                              title={!canSettle ? t("settleDisabledHint", { amount: requiredTopes }) : undefined}
                              variant="contained"
                            >
                              {t("actions.settle")}
                            </Button>
                          ) : null}
                          {isOpen && !canSettle ? (
                            <Typography color="error" variant="caption">
                              {t("settleDisabledHint", { amount: requiredTopes })}
                            </Typography>
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
                              selectClaim(claim.id);
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
                        selectClaim(claim.id);
                      }}
                      onCreatorClick={() => {
                        void router.push(`/accounts/${claim.claimerAccountId}`);
                      }}
                      title={need.title}
                    />
                  );
                })}
              </Box>
              {receivedFiltered.length > receivedPageSize ? (
                <Button onClick={() => { setReceivedPageSize(n => n + 5); }} variant="text">
                  {t("loadMore")}
                </Button>
              ) : null}
            </>
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
