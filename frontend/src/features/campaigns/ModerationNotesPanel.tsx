import { useMutation } from "@apollo/client/react";
import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";
import { ADD_CAMPAIGN_MODERATION_NOTE_MUTATION, CAMPAIGN_MODERATION_HISTORY_QUERY } from "./campaignModeration.queries";

type ModerationNotesPanelProps = {
  campaignId: string;
};

export function ModerationNotesPanel({ campaignId }: ModerationNotesPanelProps) {
  const { t } = useTranslation("campaigns");
  const [body, setBody] = useState("");
  const [createNote, { loading, error }] = useMutation(ADD_CAMPAIGN_MODERATION_NOTE_MUTATION, {
    refetchQueries: [{ query: CAMPAIGN_MODERATION_HISTORY_QUERY, variables: { campaignId } }]
  });
  const errorMessage = getUserFacingGraphQLErrorMessage(error);

  const onSubmit = async () => {
    if (!body.trim()) {
      return;
    }

    await createNote({
      variables: {
        campaignId,
        body: body.trim()
      }
    });

    setBody("");
  };

  return (
    <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
      <Typography variant="h6" gutterBottom>
        {t("moderationNotes.title")}
      </Typography>
      <Stack spacing={2}>
        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
        <TextField
          multiline
          minRows={3}
          value={body}
          onChange={event => setBody(event.target.value)}
          label={t("moderationNotes.noteLabel")}
          placeholder={t("moderationNotes.notePlaceholder")}
        />
        <Button variant="contained" onClick={onSubmit} disabled={loading || !body.trim()}>
          {t("moderationNotes.sendButton")}
        </Button>
      </Stack>
    </Box>
  );
}
