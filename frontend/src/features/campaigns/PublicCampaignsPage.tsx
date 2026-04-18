import { useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import { Alert, Box, Card, CardContent, Chip, Container, Grid, Stack, Typography } from "@mui/material";

import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";
import { PUBLIC_CAMPAIGNS_QUERY } from "./campaigns.queries";

type CampaignNode = {
  id: string;
  title: string;
  theme: string;
  moderationStatus: string;
  startAt: string;
  airdropAt: string;
  endAt: string;
};

type PublicCampaignsData = {
  allCampaigns: {
    nodes: CampaignNode[];
  };
};

export function isCampaignActive(now: Date, startAtIso: string, endAtIso: string) {
  const startAt = new Date(startAtIso);
  const endAt = new Date(endAtIso);

  return now >= startAt && now <= endAt;
}

export default function PublicCampaignsPage() {
  const { data, loading, error } = useQuery<PublicCampaignsData>(PUBLIC_CAMPAIGNS_QUERY);
  const errorMessage = getUserFacingGraphQLErrorMessage(error);

  const activeCampaigns = useMemo(() => {
    const now = new Date();
    const nodes = data?.allCampaigns.nodes ?? [];

    return nodes.filter(node => isCampaignActive(now, node.startAt, node.endAt));
  }, [data?.allCampaigns.nodes]);

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Typography component="h1" gutterBottom variant="h4">
          Public campaigns
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Browse campaigns currently active on the platform.
        </Typography>

        {loading ? <Alert severity="info">Loading campaigns…</Alert> : null}
        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        {!loading && !errorMessage && activeCampaigns.length === 0 ? (
          <Alert severity="info">No active approved campaigns at the moment.</Alert>
        ) : null}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          {activeCampaigns.map(campaign => (
            <Grid item key={campaign.id} xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                    <Box>
                      <Typography variant="h6">{campaign.title}</Typography>
                      <Typography color="text.secondary">Theme: {campaign.theme}</Typography>
                    </Box>
                    <Chip color="success" label="Approved" size="small" />
                  </Stack>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ mt: 2 }}>
                    <Typography variant="body2">Start: {new Date(campaign.startAt).toLocaleString()}</Typography>
                    <Typography variant="body2">Airdrop: {new Date(campaign.airdropAt).toLocaleString()}</Typography>
                    <Typography variant="body2">End: {new Date(campaign.endAt).toLocaleString()}</Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
}
