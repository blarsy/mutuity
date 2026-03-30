import { useMutation } from "@apollo/client/react";
import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { ADD_CAMPAIGN_MODERATION_NOTE_MUTATION, CAMPAIGN_MODERATION_HISTORY_QUERY } from "./campaignModeration.queries";

type ModerationNotesPanelProps = {
  campaignId: string;
};

export function ModerationNotesPanel({ campaignId }: ModerationNotesPanelProps) {
  const [body, setBody] = useState("");
  const [createNote, { loading, error }] = useMutation(ADD_CAMPAIGN_MODERATION_NOTE_MUTATION, {
    refetchQueries: [{ query: CAMPAIGN_MODERATION_HISTORY_QUERY, variables: { campaignId } }]
  });

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
        Add Moderation Note
      </Typography>
      <Stack spacing={2}>
        {error ? <Alert severity="error">{error.message}</Alert> : null}
        <TextField
          multiline
          minRows={3}
          value={body}
          onChange={event => setBody(event.target.value)}
          label="Moderation note"
          placeholder="Explain what should be updated before approval"
        />
        <Button variant="contained" onClick={onSubmit} disabled={loading || !body.trim()}>
          Send Note
        </Button>
      </Stack>
    </Box>
  );
}
