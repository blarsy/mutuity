import { useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import { Alert, Box, Card, CardContent, Chip, Container, Grid, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";
import { PUBLIC_CAMPAIGNS_QUERY } from "./campaigns.queries";
import { RichTextContent } from "../../components/richText/RichTextContent";

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
  const { t } = useTranslation("campaigns");
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
          {t("public.title")}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {t("public.subtitle")}
        </Typography>

        {loading ? <Alert severity="info">{t("public.loading")}</Alert> : null}
        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        {!loading && !errorMessage && activeCampaigns.length === 0 ? (
          <Alert severity="info">{t("public.empty")}</Alert>
        ) : null}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          {activeCampaigns.map(campaign => (
            <Grid item key={campaign.id} xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                    <Box>
                      <Typography variant="h6">{campaign.title}</Typography>
                      <Typography color="text.secondary" variant="caption">{t("labels.theme")}</Typography>
                      <RichTextContent html={campaign.theme} />
                    </Box>
                    <Chip color="success" label={t("statuses.approved")} size="small" />
                  </Stack>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ mt: 2 }}>
                    <Typography variant="body2">{t("labels.start")}: {new Date(campaign.startAt).toLocaleString()}</Typography>
                    <Typography variant="body2">{t("labels.airdrop")}: {new Date(campaign.airdropAt).toLocaleString()}</Typography>
                    <Typography variant="body2">{t("labels.end")}: {new Date(campaign.endAt).toLocaleString()}</Typography>
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
