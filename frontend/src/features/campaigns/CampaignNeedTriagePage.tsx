import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Container,
  Grid,
  Stack,
  Typography
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { CampaignNeedStatusChip, type CampaignNeedStatus } from "../../components/campaign/CampaignNeedStatusChip";
import { NeedSummaryFacts } from "../../components/need/NeedSummaryFacts";
import { useRequireAuth } from "../auth/requireAuth";
import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";
import {
  ACCEPT_CAMPAIGN_NEED_MUTATION,
  CAMPAIGN_NEED_TRIAGE_QUERY,
  REJECT_CAMPAIGN_NEED_MUTATION
} from "./campaignNeedTriage.queries";

type CampaignNeedNode = {
  campaignId: string;
  needId: string;
  status: CampaignNeedStatus;
  createdAt: string;
  actedAt: string | null;
  actedByAccountId: string | null;
  campaignByCampaignId: {
    id: string;
    title: string;
  } | null;
  needByNeedId: {
    id: string;
    title: string;
    location: string;
    intensity: string;
    proposedTopesAmount: number | null;
  } | null;
};

type CampaignNeedTriageData = {
  allCampaignNeeds: {
    nodes: CampaignNeedNode[];
  };
};

type CampaignNeedTriageVariables = {
  campaignId?: string;
};

type TriageMutationData = {
  acceptCampaignNeed?: {
    campaignNeed: {
      campaignId: string;
      needId: string;
      status: CampaignNeedStatus;
      actedAt: string | null;
      actedByAccountId: string | null;
    };
  };
  rejectCampaignNeed?: {
    campaignNeed: {
      campaignId: string;
      needId: string;
      status: CampaignNeedStatus;
      actedAt: string | null;
      actedByAccountId: string | null;
    };
  };
};

type TriageMutationVariables = {
  campaignId: string;
  needId: string;
};

function nodeKey(node: Pick<CampaignNeedNode, "campaignId" | "needId">) {
  return `${node.campaignId}:${node.needId}`;
}

export default function CampaignNeedTriagePage() {
  const { t } = useTranslation("campaigns");
  const router = useRouter();
  const { isAuthenticated, isChecking, isRedirecting } = useRequireAuth();
  const campaignIdFilter = typeof router.query.campaignId === "string" ? router.query.campaignId : undefined;

  const {
    data,
    loading: queryLoading,
    error: queryError,
    refetch
  } = useQuery<CampaignNeedTriageData, CampaignNeedTriageVariables>(CAMPAIGN_NEED_TRIAGE_QUERY, {
    skip: !isAuthenticated,
    variables: {
      campaignId: campaignIdFilter
    }
  });

  const [acceptCampaignNeed, { loading: acceptLoading, error: acceptError }] = useMutation<
    TriageMutationData,
    TriageMutationVariables
  >(ACCEPT_CAMPAIGN_NEED_MUTATION);

  const [rejectCampaignNeed, { loading: rejectLoading, error: rejectError }] = useMutation<
    TriageMutationData,
    TriageMutationVariables
  >(REJECT_CAMPAIGN_NEED_MUTATION);

  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [optimisticStatuses, setOptimisticStatuses] = useState<Record<string, CampaignNeedStatus>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  const queryErrorMessage = getUserFacingGraphQLErrorMessage(queryError);
  const acceptErrorMessage = getUserFacingGraphQLErrorMessage(acceptError);
  const rejectErrorMessage = getUserFacingGraphQLErrorMessage(rejectError);

  const nodes = useMemo(() => data?.allCampaignNeeds.nodes ?? [], [data?.allCampaignNeeds.nodes]);

  const pendingCount = useMemo(() => {
    return nodes.filter(node => (optimisticStatuses[nodeKey(node)] ?? node.status) === "PENDING").length;
  }, [nodes, optimisticStatuses]);

  const clearOptimistic = (key: string) => {
    setOptimisticStatuses(current => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const setRowError = (key: string, message?: string) => {
    setRowErrors(current => {
      const next = { ...current };
      if (!message) {
        delete next[key];
      } else {
        next[key] = message;
      }
      return next;
    });
  };

  const handleTriage = async (node: CampaignNeedNode, action: "accept" | "reject") => {
    const nextStatus: CampaignNeedStatus = action === "accept" ? "ACCEPTED" : "REJECTED";
    const key = nodeKey(node);

    setRowError(key);
    setBusyKey(key);
    setOptimisticStatuses(current => ({
      ...current,
      [key]: nextStatus
    }));

    try {
      if (action === "accept") {
        await acceptCampaignNeed({
          variables: {
            campaignId: node.campaignId,
            needId: node.needId
          }
        });
      } else {
        await rejectCampaignNeed({
          variables: {
            campaignId: node.campaignId,
            needId: node.needId
          }
        });
      }

      clearOptimistic(key);
      await refetch();
    } catch (error) {
      clearOptimistic(key);
      const fallbackMessage = error instanceof Error ? error.message : t("errors.genericRetry", { ns: "common" });
      setRowError(key, fallbackMessage);
    } finally {
      setBusyKey(current => (current === key ? null : current));
    }
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 6 }}>
          <Typography component="h1" gutterBottom variant="h4">
            {t("triage.title")}
          </Typography>
          <Alert severity="info">
            {isChecking ? t("authGuard.checking", { ns: "common" }) : isRedirecting ? t("authGuard.redirecting", { ns: "common" }) : t("authGuard.signInRequired", { ns: "common" })}
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Typography component="h1" gutterBottom variant="h4">
          {t("triage.title")}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {t("triage.subtitle")}
        </Typography>

        {campaignIdFilter ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            {t("triage.filteringByCampaignId", { campaignId: campaignIdFilter })}
          </Alert>
        ) : null}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
          <Chip label={t("triage.totalLinkedNeeds", { count: nodes.length })} variant="outlined" />
          <Chip color="warning" label={t("triage.pendingTriage", { count: pendingCount })} variant="outlined" />
        </Stack>

        {queryLoading ? <Alert severity="info">{t("triage.loading")}</Alert> : null}
        {queryErrorMessage ? <Alert severity="error">{queryErrorMessage}</Alert> : null}
        {acceptErrorMessage ? <Alert severity="error">{acceptErrorMessage}</Alert> : null}
        {rejectErrorMessage ? <Alert severity="error">{rejectErrorMessage}</Alert> : null}

        {!queryLoading && !queryErrorMessage && nodes.length === 0 ? (
          <Alert severity="success">{t("triage.empty")}</Alert>
        ) : null}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          {nodes.map(node => {
            const key = nodeKey(node);
            const status = optimisticStatuses[key] ?? node.status;
            const rowBusy = busyKey === key || acceptLoading || rejectLoading;
            const canTriage = status === "PENDING";

            return (
              <Grid item key={key} xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                      <Box>
                        <Typography variant="h6">{node.needByNeedId?.title ?? t("triage.needFallback", { needId: node.needId })}</Typography>
                        <Typography color="text.secondary">
                          {t("triage.campaignLabel")}: {node.campaignByCampaignId?.title ?? node.campaignId}
                        </Typography>
                      </Box>
                      <CampaignNeedStatusChip status={status} />
                    </Stack>

                    <NeedSummaryFacts
                      intensity={node.needByNeedId?.intensity}
                      joinedAt={node.createdAt}
                      location={node.needByNeedId?.location}
                      proposedTopesAmount={node.needByNeedId?.proposedTopesAmount}
                      triagedAt={node.actedAt}
                    />

                    {rowErrors[key] ? (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        {rowErrors[key]}
                      </Alert>
                    ) : null}
                  </CardContent>

                  {canTriage ? (
                    <CardActions>
                      <Button
                        disabled={rowBusy}
                        onClick={() => void handleTriage(node, "accept")}
                        size="small"
                        variant="contained"
                      >
                        {t("triage.accept")}
                      </Button>
                      <Button
                        color="error"
                        disabled={rowBusy}
                        onClick={() => void handleTriage(node, "reject")}
                        size="small"
                        variant="outlined"
                      >
                        {t("triage.reject")}
                      </Button>
                    </CardActions>
                  ) : null}
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Container>
  );
}
