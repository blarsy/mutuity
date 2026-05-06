import {
  Button,
  Stack,
  Typography
} from "@mui/material";
import { useRouter } from "next/router";
import { conversationDraftNeedUrl, conversationDraftResourceUrl, conversationThreadUrl } from "./chatRouting";

type StartConversationDialogProps =
  | {
    kind: "need";
    title: string;
    buttonLabel: string;
    needId: string;
    existingConversationId?: string | null;
    disabled?: boolean;
    disabledReason?: string | null;
  }
  | {
    kind: "resource";
    title: string;
    buttonLabel: string;
    resourceId: string;
    creatorAccountId: string;
    existingConversationId?: string | null;
    disabled?: boolean;
    disabledReason?: string | null;
  };

export function StartConversationDialog(props: StartConversationDialogProps) {
  const router = useRouter();
  const canOpenExistingConversation = Boolean(props.existingConversationId);
  const resolvedDisabled = props.disabled && !canOpenExistingConversation;

  const handleOpen = async () => {
    if (props.existingConversationId) {
      await router.push(conversationThreadUrl(props.kind, props.existingConversationId));
      return;
    }

    if (props.kind === "resource") {
      await router.push(conversationDraftResourceUrl({
        resourceId: props.resourceId,
        otherAccountId: props.creatorAccountId,
        title: props.title
      }));
      return;
    }

    if (props.kind === "need") {
      await router.push(conversationDraftNeedUrl({
        needId: props.needId,
        title: props.title
      }));
      return;
    }
  };

  return (
    <>
      <Stack alignItems={{ xs: "stretch", sm: "flex-start" }} spacing={1}>
        <Button
          disabled={resolvedDisabled}
          onClick={() => {
            void handleOpen();
          }}
          variant="outlined"
        >
          {props.buttonLabel}
        </Button>
        {resolvedDisabled && props.disabledReason ? (
          <Typography color="text.secondary" variant="caption">
            {props.disabledReason}
          </Typography>
        ) : null}
      </Stack>
    </>
  );
}