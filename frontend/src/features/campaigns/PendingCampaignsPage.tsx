import { useMemo } from "react";
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

import { useAuth } from "../auth/AuthProvider";
import { useRequireAuth } from "../auth/requireAuth";
import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";
import { APPROVE_CAMPAIGN_MUTATION, PENDING_CAMPAIGNS_QUERY } from "./campaigns.queries";

type PendingCampaignNode = {
  id: string;
  title: string;
  theme: string;
  moderationStatus: string;
  startAt: string;
  airdropAt: string;
  endAt: string;
  createdAt: string;
};

type PendingCampaignsData = {
  allCampaigns: {
    nodes: PendingCampaignNode[];
  };
};

type ApproveCampaignData = {
  approveCampaign: {
    campaign: {
      id: string;
      moderationStatus: string;
    };
  };
};

type ApproveCampaignVariables = {
  campaignId: string;
};

export default function PendingCampaignsPage() {
  const { session } = useAuth();
  const { isAuthenticated, isChecking, isRedirecting } = useRequireAuth();

  const {
    data,
    loading: pendingLoading,
    error: pendingError
  } = useQuery<PendingCampaignsData>(PENDING_CAMPAIGNS_QUERY, {
    skip: !isAuthenticated
  });

  const [approveCampaign, { loading: approveLoading, error: approveError }] = useMutation<
    ApproveCampaignData,
    ApproveCampaignVariables
  >(APPROVE_CAMPAIGN_MUTATION, {
    refetchQueries: [{ query: PENDING_CAMPAIGNS_QUERY }]
  });

  const canApprove = session.role === "manager" || session.role === "admin";

  const pendingCampaigns = useMemo(() => {
    return data?.allCampaigns.nodes ?? [];
  }, [data?.allCampaigns.nodes]);

  const pendingErrorMessage = getUserFacingGraphQLErrorMessage(pendingError);
  const approveErrorMessage = getUserFacingGraphQLErrorMessage(approveError);

  const handleApprove = async (campaignId: string) => {
    await approveCampaign({
      variables: {
        campaignId
      }
    });
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 6 }}>
          <Typography component="h1" gutterBottom variant="h4">
            Pending campaigns
          </Typography>
          <Alert severity="info">
            {isChecking ? "Checking your session…" : isRedirecting ? "Redirecting to sign in…" : "Please sign in to continue."}
          </Alert>
        </Box>
      </Container>
    );
  }

  if (!canApprove) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 6 }}>
          <Typography component="h1" gutterBottom variant="h4">
            Pending campaigns
          </Typography>
          <Alert severity="warning">Only manager accounts can approve campaigns.</Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Typography component="h1" gutterBottom variant="h4">
          Pending campaigns
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Review pending campaigns and approve those that should be publicly listed.
        </Typography>

        {pendingLoading ? <Alert severity="info">Loading pending campaigns…</Alert> : null}
        {pendingErrorMessage ? <Alert severity="error">{pendingErrorMessage}</Alert> : null}
        {approveErrorMessage ? <Alert severity="error">{approveErrorMessage}</Alert> : null}

        {!pendingLoading && !pendingErrorMessage && pendingCampaigns.length === 0 ? (
          <Alert severity="success">No campaigns are waiting for approval.</Alert>
        ) : null}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          {pendingCampaigns.map(campaign => (
            <Grid item key={campaign.id} xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                    <Box>
                      <Typography variant="h6">{campaign.title}</Typography>
                      <Typography color="text.secondary">Theme: {campaign.theme}</Typography>
                    </Box>
                    <Chip color="warning" label="Pending" size="small" />
                  </Stack>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ mt: 2 }}>
                    <Typography variant="body2">Submitted: {new Date(campaign.createdAt).toLocaleString()}</Typography>
                    <Typography variant="body2">Start: {new Date(campaign.startAt).toLocaleString()}</Typography>
                    <Typography variant="body2">Airdrop: {new Date(campaign.airdropAt).toLocaleString()}</Typography>
                    <Typography variant="body2">End: {new Date(campaign.endAt).toLocaleString()}</Typography>
                  </Stack>
                </CardContent>
                <CardActions>
                  <Button
                    disabled={approveLoading}
                    onClick={() => void handleApprove(campaign.id)}
                    size="small"
                    variant="contained"
                  >
                    Approve campaign
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
}
