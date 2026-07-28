import { useQuery } from "@apollo/client/react";
import { Alert, Box, CircularProgress, List, ListItem, ListItemText, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";
import { CAMPAIGN_MODERATION_HISTORY_QUERY } from "./campaignModeration.queries";
import type { CampaignModerationHistoryQuery, CampaignModerationHistoryQueryVariables } from "../../graphql/generated";

type CampaignModerationHistoryProps = {
  campaignId: string;
};

export function CampaignModerationHistory({ campaignId }: CampaignModerationHistoryProps) {
  const { t } = useTranslation("campaigns");
  const { data, loading, error } = useQuery<CampaignModerationHistoryQuery, CampaignModerationHistoryQueryVariables>(
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

  const events = data?.campaignModerationEvents?.nodes ?? [];

  if (events.length === 0) {
    return (
      <Box sx={{ p: 2, border: "1px dashed", borderColor: "divider", borderRadius: 1 }}>
        <Typography color="text.secondary">{t("moderationNotes.empty")}</Typography>
      </Box>
    );
  }

  return (
    <List sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
      {events.map((event, index) => (
        <ListItem key={`${event.eventType}-${event.createdAt}-${index}`} divider>
          <ListItemText
            primary={
              event.eventType === "campaign_created"
                ? t("moderationNotes.campaignCreatedEvent")
                : event.eventType === "moderation_note_received"
                  ? t("moderationNotes.noteReceivedEvent")
                  : event.eventType === "campaign_modified_by_creator"
                    ? t("moderationNotes.creatorModifiedEvent")
                    : event.eventType === "campaign_approved"
                      ? t("moderationNotes.approvedEvent")
                    : t("moderationNotes.unknownEvent")
            }
            secondary={
              <>
                {event.body ? (
                  <Typography component="div" sx={{ whiteSpace: "pre-wrap" }}>
                    {event.body}
                  </Typography>
                ) : null}
                <Typography color="text.secondary" variant="caption">
                  {t("moderationNotes.eventMeta", {
                    actorAccountId: event.actorAccountId ?? "-",
                    createdAt: new Date(event.createdAt).toLocaleString()
                  })}
                </Typography>
              </>
            }
          />
        </ListItem>
      ))}
    </List>
  );
}
