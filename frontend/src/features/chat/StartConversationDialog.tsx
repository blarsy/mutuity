import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";

import {
  SEND_NEED_MESSAGE_MUTATION,
  SEND_RESOURCE_MESSAGE_DIRECT_MUTATION
} from "./chat.queries";
import { conversationThreadUrl } from "./chatRouting";
import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";

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

type SendNeedMessageMutationData = {
  sendNeedMessage: {
    claimMessage: {
      conversationId: string;
    } | null;
  } | null;
};

type SendResourceMessageDirectMutationData = {
  sendResourceMessageDirect: {
    resourceMessage: {
      conversationId: string;
    } | null;
  } | null;
};

export function StartConversationDialog(props: StartConversationDialogProps) {
  const router = useRouter();
  const { t } = useTranslation("chat");
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sendNeedMessage, { loading: needLoading, error: needError }] =
    useMutation<SendNeedMessageMutationData>(SEND_NEED_MESSAGE_MUTATION);
  const [sendResourceMessageDirect, { loading: resourceLoading, error: resourceError }] =
    useMutation<SendResourceMessageDirectMutationData>(SEND_RESOURCE_MESSAGE_DIRECT_MUTATION);

  const loading = needLoading || resourceLoading;
  const errorMessage = getUserFacingGraphQLErrorMessage(needError)
    ?? getUserFacingGraphQLErrorMessage(resourceError);
  const canOpenExistingConversation = Boolean(props.existingConversationId);
  const resolvedDisabled = props.disabled && !canOpenExistingConversation;

  const handleOpen = async () => {
    if (props.existingConversationId) {
      await router.push(conversationThreadUrl(props.kind, props.existingConversationId));
      return;
    }

    setOpen(true);
  };

  const handleSubmit = async () => {
    const trimmed = message.trim();

    if (!trimmed) {
      return;
    }

    if (props.kind === "need") {
      const result = await sendNeedMessage({
        variables: {
          input: {
            pNeedId: props.needId,
            pBody: trimmed,
            pImageUrls: []
          }
        }
      });

      const conversationId = result.data?.sendNeedMessage?.claimMessage?.conversationId;
      if (conversationId) {
        setOpen(false);
        setMessage("");
        await router.push(conversationThreadUrl("need", conversationId));
      }

      return;
    }

    const result = await sendResourceMessageDirect({
      variables: {
        input: {
          pResourceId: props.resourceId,
          pOtherAccountId: props.creatorAccountId,
          pBody: trimmed,
          pImageUrls: []
        }
      }
    });

    const conversationId = result.data?.sendResourceMessageDirect?.resourceMessage?.conversationId;
    if (conversationId) {
      setOpen(false);
      setMessage("");
      await router.push(conversationThreadUrl("resource", conversationId));
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

      <Dialog fullWidth maxWidth="sm" onClose={() => setOpen(false)} open={open}>
        <DialogTitle>{t("composer.startTitle", { title: props.title })}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography color="text.secondary" variant="body2">
              {t("composer.startHint")}
            </Typography>

            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

            <TextField
              autoFocus
              fullWidth
              label={t("composer.messageLabel")}
              minRows={4}
              multiline
              onChange={event => setMessage(event.target.value)}
              placeholder={t("composer.messagePlaceholder")}
              value={message}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={loading} onClick={() => setOpen(false)}>
            {t("actions.cancel", { ns: "common" })}
          </Button>
          <Button disabled={loading || !message.trim()} onClick={() => void handleSubmit()} variant="contained">
            {loading ? t("composer.sending") : t("composer.sendAndOpen")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}