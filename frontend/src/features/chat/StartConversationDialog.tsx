import {
  Button,
  Stack,
  Typography
} from "@mui/material";
import NextLink from "next/link";
import { conversationDraftUrl, conversationThreadUrl } from "./chatRouting";

type StartConversationButtonProps = {
  kind: "need" | "resource";
  contextId: string;
  otherAccountId: string;
  title: string;
  buttonLabel: string;
  existingConversationId?: string | null;
  lookupLoading?: boolean;
  disabled?: boolean;
  disabledReason?: string | null;
};

export function StartConversationButton(props: StartConversationButtonProps) {
  const canOpenExistingConversation = Boolean(props.existingConversationId);
  const resolvedDisabled = Boolean(props.lookupLoading) || (Boolean(props.disabled) && !canOpenExistingConversation);
  const href = props.existingConversationId
    ? conversationThreadUrl(props.kind, props.existingConversationId)
    : conversationDraftUrl({
        kind: props.kind,
        contextId: props.contextId,
        otherAccountId: props.otherAccountId,
        title: props.title
      });

  return (
    <Stack alignItems={{ xs: "stretch", sm: "flex-start" }} spacing={1}>
      <Button component={NextLink} disabled={resolvedDisabled} href={href} variant="outlined">
        {props.buttonLabel}
      </Button>
      {resolvedDisabled && !props.lookupLoading && props.disabledReason ? (
        <Typography color="text.secondary" variant="caption">
          {props.disabledReason}
        </Typography>
      ) : null}
    </Stack>
  );
}