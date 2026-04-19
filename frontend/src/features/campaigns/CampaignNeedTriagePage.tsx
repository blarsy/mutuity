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

import { useRequireAuth } from "../auth/requireAuth";
import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";
import {
  ACCEPT_CAMPAIGN_NEED_MUTATION,
  CAMPAIGN_NEED_TRIAGE_QUERY,
  REJECT_CAMPAIGN_NEED_MUTATION
} from "./campaignNeedTriage.queries";

type CampaignNeedStatus = "PENDING" | "ACCEPTED" | "REJECTED";

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

function statusChipColor(status: CampaignNeedStatus): "warning" | "success" | "default" {
  if (status === "PENDING") {
    return "warning";
  }

  if (status === "ACCEPTED") {
    return "success";
  }

  return "default";
}

export default function CampaignNeedTriagePage() {
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
      const fallbackMessage = error instanceof Error ? error.message : "Something went wrong";
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
            Campaign need triage
          </Typography>
          <Alert severity="info">
            {isChecking ? "Checking your session…" : isRedirecting ? "Redirecting to sign in…" : "Please sign in to continue."}
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Typography component="h1" gutterBottom variant="h4">
          Campaign need triage
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Review needs joined to campaigns you created and accept or reject pending requests.
        </Typography>

        {campaignIdFilter ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Filtering by campaign ID: {campaignIdFilter}
          </Alert>
        ) : null}

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
          <Chip label={`Total linked needs: ${nodes.length}`} variant="outlined" />
          <Chip color="warning" label={`Pending triage: ${pendingCount}`} variant="outlined" />
        </Stack>

        {queryLoading ? <Alert severity="info">Loading joined needs…</Alert> : null}
        {queryErrorMessage ? <Alert severity="error">{queryErrorMessage}</Alert> : null}
        {acceptErrorMessage ? <Alert severity="error">{acceptErrorMessage}</Alert> : null}
        {rejectErrorMessage ? <Alert severity="error">{rejectErrorMessage}</Alert> : null}

        {!queryLoading && !queryErrorMessage && nodes.length === 0 ? (
          <Alert severity="success">No joined needs available for triage.</Alert>
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
                        <Typography variant="h6">{node.needByNeedId?.title ?? `Need ${node.needId}`}</Typography>
                        <Typography color="text.secondary">
                          Campaign: {node.campaignByCampaignId?.title ?? node.campaignId}
                        </Typography>
                      </Box>
                      <Chip color={statusChipColor(status)} label={status} size="small" />
                    </Stack>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2 }}>
                      <Typography variant="body2">Location: {node.needByNeedId?.location ?? "N/A"}</Typography>
                      <Typography variant="body2">Intensity: {node.needByNeedId?.intensity ?? "N/A"}</Typography>
                      <Typography variant="body2">
                        Proposed Topes: {node.needByNeedId?.proposedTopesAmount ?? "N/A"}
                      </Typography>
                    </Stack>

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 1 }}>
                      <Typography variant="caption">Joined: {new Date(node.createdAt).toLocaleString()}</Typography>
                      {node.actedAt ? (
                        <Typography variant="caption">Triaged: {new Date(node.actedAt).toLocaleString()}</Typography>
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
                        Accept
                      </Button>
                      <Button
                        color="error"
                        disabled={rowBusy}
                        onClick={() => void handleTriage(node, "reject")}
                        size="small"
                        variant="outlined"
                      >
                        Reject
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
