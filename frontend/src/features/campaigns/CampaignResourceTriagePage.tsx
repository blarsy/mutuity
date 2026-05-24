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
import { useRequireAuth } from "../auth/requireAuth";
import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";
import {
  ACCEPT_CAMPAIGN_RESOURCE_MUTATION,
  CAMPAIGN_RESOURCE_TRIAGE_QUERY,
  REJECT_CAMPAIGN_RESOURCE_MUTATION
} from "./campaignResourceTriage.queries";

type CampaignResourceNode = {
  campaignId: string;
  resourceId: string;
  status: CampaignNeedStatus;
  createdAt: string;
  actedAt: string | null;
  actedByAccountId: string | null;
  campaignByCampaignId: {
    id: string;
    title: string;
  } | null;
  resourceByResourceId: {
    id: string;
    title: string;
    location: string | null;
    defaultTokenAmount: number | null;
  } | null;
};

type CampaignResourceTriageData = {
  allCampaignResources: {
    nodes: CampaignResourceNode[];
  } | null;
};

type CampaignResourceTriageVariables = {
  campaignId?: string;
};

type TriageMutationData = {
  acceptCampaignResource?: {
    campaignResource: {
      campaignId: string;
      resourceId: string;
      status: CampaignNeedStatus;
      actedAt: string | null;
      actedByAccountId: string | null;
    };
  };
  rejectCampaignResource?: {
    campaignResource: {
      campaignId: string;
      resourceId: string;
      status: CampaignNeedStatus;
      actedAt: string | null;
      actedByAccountId: string | null;
    };
  };
};

type TriageMutationVariables = {
  campaignId: string;
  resourceId: string;
};

function nodeKey(node: Pick<CampaignResourceNode, "campaignId" | "resourceId">) {
  return `${node.campaignId}:${node.resourceId}`;
}

export default function CampaignResourceTriagePage() {
  const { t } = useTranslation("campaigns");
  const router = useRouter();
  const { isAuthenticated, isChecking, isRedirecting } = useRequireAuth();
  const campaignIdFilter = typeof router.query.campaignId === "string" ? router.query.campaignId : undefined;

  const {
    data,
    loading: queryLoading,
    error: queryError,
    refetch
  } = useQuery<CampaignResourceTriageData, CampaignResourceTriageVariables>(CAMPAIGN_RESOURCE_TRIAGE_QUERY, {
    skip: !isAuthenticated,
    variables: {
      campaignId: campaignIdFilter
    }
  });

  const [acceptCampaignResource, { loading: acceptLoading, error: acceptError }] = useMutation<
    TriageMutationData,
    TriageMutationVariables
  >(ACCEPT_CAMPAIGN_RESOURCE_MUTATION);

  const [rejectCampaignResource, { loading: rejectLoading, error: rejectError }] = useMutation<
    TriageMutationData,
    TriageMutationVariables
  >(REJECT_CAMPAIGN_RESOURCE_MUTATION);

  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [optimisticStatuses, setOptimisticStatuses] = useState<Record<string, CampaignNeedStatus>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  const queryErrorMessage = getUserFacingGraphQLErrorMessage(queryError);
  const acceptErrorMessage = getUserFacingGraphQLErrorMessage(acceptError);
  const rejectErrorMessage = getUserFacingGraphQLErrorMessage(rejectError);

  const nodes = useMemo(() => data?.allCampaignResources?.nodes ?? [], [data?.allCampaignResources?.nodes]);

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

  const handleTriage = async (node: CampaignResourceNode, action: "accept" | "reject") => {
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
        await acceptCampaignResource({
          variables: {
            campaignId: node.campaignId,
            resourceId: node.resourceId
          }
        });
      } else {
        await rejectCampaignResource({
          variables: {
            campaignId: node.campaignId,
            resourceId: node.resourceId
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
            {t("resourceTriage.title")}
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
          {t("resourceTriage.title")}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {t("resourceTriage.subtitle")}
        </Typography>

        {campaignIdFilter ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            {t("resourceTriage.filteringByCampaignId", { campaignId: campaignIdFilter })}
          </Alert>
        ) : null}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
          <Chip label={t("resourceTriage.totalLinkedResources", { count: nodes.length })} variant="outlined" />
          <Chip color="warning" label={t("resourceTriage.pendingTriage", { count: pendingCount })} variant="outlined" />
        </Stack>

        {queryLoading ? <Alert severity="info">{t("resourceTriage.loading")}</Alert> : null}
        {queryErrorMessage ? <Alert severity="error">{queryErrorMessage}</Alert> : null}
        {acceptErrorMessage ? <Alert severity="error">{acceptErrorMessage}</Alert> : null}
        {rejectErrorMessage ? <Alert severity="error">{rejectErrorMessage}</Alert> : null}

        {!queryLoading && !queryErrorMessage && nodes.length === 0 ? (
          <Alert severity="success">{t("resourceTriage.empty")}</Alert>
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
                        <Typography variant="h6">
                          {node.resourceByResourceId?.title ?? t("resourceTriage.resourceFallback", { resourceId: node.resourceId })}
                        </Typography>
                        <Typography color="text.secondary">
                          {t("resourceTriage.campaignLabel")}: {node.campaignByCampaignId?.title ?? node.campaignId}
                        </Typography>
                      </Box>
                      <CampaignNeedStatusChip status={status} />
                    </Stack>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        {t("resourceTriage.location")}: {node.resourceByResourceId?.location ?? t("resourceTriage.na")}
                      </Typography>
                      <Typography variant="body2">
                        {t("resourceTriage.defaultTokens")}: {node.resourceByResourceId?.defaultTokenAmount ?? t("resourceTriage.na")}
                      </Typography>
                    </Stack>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 1 }}>
                      <Typography variant="caption">
                        {t("resourceTriage.joined")}: {new Date(node.createdAt).toLocaleString()}
                      </Typography>
                      {node.actedAt ? (
                        <Typography variant="caption">
                          {t("resourceTriage.triaged")}: {new Date(node.actedAt).toLocaleString()}
                        </Typography>
                      ) : null}
                    </Stack>

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
                        {t("resourceTriage.accept")}
                      </Button>
                      <Button
                        color="error"
                        disabled={rowBusy}
                        onClick={() => void handleTriage(node, "reject")}
                        size="small"
                        variant="outlined"
                      >
                        {t("resourceTriage.reject")}
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
