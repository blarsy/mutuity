import { useQuery } from "@apollo/client/react";
import { Alert, Box, CircularProgress, List, ListItem, ListItemText, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";
import { CAMPAIGN_MODERATION_HISTORY_QUERY } from "./campaignModeration.queries";

type CampaignModerationHistoryProps = {
  campaignId: string;
};

type ModerationHistoryData = {
  allCampaignModerationNotes: {
    nodes: Array<{
      id: string;
      managerAccountId: string;
      body: string;
      createdAt: string;
    }>;
  };
};

type ModerationHistoryVariables = {
  campaignId: string;
};

export function CampaignModerationHistory({ campaignId }: CampaignModerationHistoryProps) {
  const { t } = useTranslation("campaigns");
  const { data, loading, error } = useQuery<ModerationHistoryData, ModerationHistoryVariables>(
    CAMPAIGN_MODERATION_HISTORY_QUERY,
    {
      variables: { campaignId }
    }
  );
  const errorMessage = getUserFacingGraphQLErrorMessage(error);

  if (loading) {
    return <CircularProgress size={20} />;
  }

  if (errorMessage) {
    return <Alert severity="error">{errorMessage}</Alert>;
  }

  const notes = data?.allCampaignModerationNotes.nodes ?? [];

  if (notes.length === 0) {
    return (
      <Box sx={{ p: 2, border: "1px dashed", borderColor: "divider", borderRadius: 1 }}>
        <Typography color="text.secondary">{t("moderationNotes.empty")}</Typography>
      </Box>
    );
  }

  return (
    <List sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
      {notes.map(note => (
        <ListItem key={note.id} divider>
          <ListItemText
            primary={note.body}
            secondary={t("moderationNotes.noteMeta", {
              managerAccountId: note.managerAccountId,
              createdAt: new Date(note.createdAt).toLocaleString()
            })}
          />
        </ListItem>
      ))}
    </List>
  );
}
