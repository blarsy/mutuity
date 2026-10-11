import { useEffect, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Link,
  Stack,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { useTranslation } from "react-i18next";

import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";
import { useAccountEventSignal } from "../../services/graphql/accountEvents";
import {
  NEED_CLAIM_DETAIL_QUERY,
  CLAIM_CONVERSATION_BY_PARTIES_QUERY,
  SEND_CLAIM_MESSAGE_MUTATION
} from "./claimConversation.queries";
import { NeedClaimStatusChip } from "./NeedClaimStatusChip";
import { conversationThreadUrl } from "../chat/chatRouting";
import { parseImageUrls, MAX_IMAGE_ATTACHMENTS } from "../chat/ConversationThread";
import { ChatImageUploadDialog } from "../chat/ChatImageUploadDialog";
import type { NeedClaimDetailQuery, ClaimConversationByPartiesQuery, SendClaimMessageMutation } from "../../graphql/generated";

export type ClaimConversationViewMessage = {
  id: string;
  senderAccountId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  imageUrls: string[];
};

type ClaimConversationPanelProps = {
  claimId: string;
  currentAccountId: string;
};

/** @deprecated Use parseImageUrls from ConversationThread for new code. */
export function parseImageMetadataInput(value: string) {
  return parseImageUrls(value);
}

export function sortConversationMessages(messages: ClaimConversationViewMessage[]) {
  return [...messages].sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
  );
}

export function canSendClaimMessages(
  claimStatus: string,
  hasConversation: boolean,
  isCreator: boolean
) {
  const allowsMessaging = claimStatus === "OPEN" || claimStatus === "SETTLED";
  return allowsMessaging && (hasConversation || isCreator);
}

export function ClaimConversationThreadView({
  currentAccountId,
  messages
}: {
  currentAccountId: string;
  messages: ClaimConversationViewMessage[];
}) {
  const { t } = useTranslation("needs");

  return (
    <Stack spacing={1.5}>
      {messages.map(message => {
        const isOwnMessage = message.senderAccountId === currentAccountId;

        return (
          <Box key={message.id} sx={{ display: "flex", justifyContent: isOwnMessage ? "flex-end" : "flex-start" }}>
            <Box
              sx={{
                bgcolor: isOwnMessage ? "primary.light" : "grey.100",
                borderRadius: 2,
                maxWidth: "90%",
                px: 1.5,
                py: 1
              }}
            >
              <Typography variant="body2">{message.body}</Typography>
              {message.imageUrls.length > 0 ? (
                <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
                  {message.imageUrls.map((imageUrl, index) => (
                    <Link href={imageUrl} key={`${message.id}-${imageUrl}`} target="_blank" rel="noreferrer" variant="caption">
                      Attachment {index + 1}
                    </Link>
                  ))}
                </Stack>
              ) : null}
              <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="caption">
                {new Date(message.createdAt).toLocaleString()}
                {message.readAt ? ` • ${t("claimConversation.read")}` : ""}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
}

export function ClaimConversationPanel({ claimId, currentAccountId }: ClaimConversationPanelProps) {
  const { t } = useTranslation("needs");
  const router = useRouter();
  const [draftBody, setDraftBody] = useState("");
  const [draftImageUrls, setDraftImageUrls] = useState<string[]>([]);
  const [showImageDialog, setShowImageDialog] = useState(false);

  const [sendClaimMessage, { loading: sendLoading, error: sendError }] = useMutation<SendClaimMessageMutation>(
    SEND_CLAIM_MESSAGE_MUTATION
  );

  useEffect(() => {
    setDraftBody("");
    setDraftImageUrls([]);
    setShowImageDialog(false);
  }, [claimId, currentAccountId]);

  const { data, loading, error, refetch } = useQuery<NeedClaimDetailQuery>(NEED_CLAIM_DETAIL_QUERY, {
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    variables: { claimId }
  });

  const claim = data?.needClaimById ?? null;

  const { data: convData, loading: conversationLoading, error: conversationError, refetch: refetchConv } = useQuery<ClaimConversationByPartiesQuery>(
    CLAIM_CONVERSATION_BY_PARTIES_QUERY,
    {
      fetchPolicy: "cache-and-network",
      nextFetchPolicy: "cache-first",
      variables: {
        needId: claim?.needId ?? "",
        creatorAccountId: claim?.needByNeedId?.creatorAccountId ?? "",
        claimerAccountId: claim?.claimerAccountId ?? ""
      },
      skip: !claim?.needId || !claim?.needByNeedId?.creatorAccountId || !claim?.claimerAccountId
    }
  );

  const conversation =
    convData?.claimConversationByNeedIdAndCreatorAccountIdAndClaimerAccountId ?? null;
  const claimStatus = claim?.status ?? "OPEN";
  const isCreator = claim?.needByNeedId?.creatorAccountId === currentAccountId;

  const canSend = !conversation && !conversationLoading && !conversationError && canSendClaimMessages(claimStatus, false, isCreator);
  const errorMessage = getUserFacingGraphQLErrorMessage(error) ?? getUserFacingGraphQLErrorMessage(conversationError) ?? getUserFacingGraphQLErrorMessage(sendError);

  useAccountEventSignal(() => Promise.all([refetch(), refetchConv()]), Boolean(currentAccountId));

  const handleSendMessage = async () => {
    if (!claim || !canSend || sendLoading || !draftBody.trim() || draftImageUrls.length > MAX_IMAGE_ATTACHMENTS) {
      return;
    }

    try {
      const result = await sendClaimMessage({
        variables: {
          input: {
            needClaimId: claim.id,
            body: draftBody.trim(),
            imageUrls: draftImageUrls
          }
        }
      });

      const conversationId = result.data?.sendClaimMessage?.claimMessage?.conversationId;
      if (conversationId) {
        setDraftBody("");
        setDraftImageUrls([]);
        await router.push(conversationThreadUrl("need", conversationId));
      }
    } catch {
      // Apollo exposes send failures above; preserve the draft for retry.
    }
  };

  if (loading && !claim) {
    return <Alert severity="info">{t("claimConversation.loading")}</Alert>;
  }

  if (!claim) {
    return <Alert severity="warning">{t("claimConversation.notFound")}</Alert>;
  }

  if (conversation) {
    return (
      <Button component={NextLink} href={conversationThreadUrl("need", conversation.id)} variant="contained">
        {t("claimConversation.openConversation")}
      </Button>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
            <Box>
              <Typography variant="h6">{t("claimConversation.title", { needTitle: claim.needByNeedId?.title })}</Typography>
              <Typography color="text.secondary" variant="body2">
                {t("claimConversation.claimer")}: {claim.accountByClaimerAccountId?.displayName ?? claim.accountByClaimerAccountId?.externalSubject ?? claim.claimerAccountId}
              </Typography>
            </Box>
            <NeedClaimStatusChip
              settledAt={claim.settledAt}
              status={claim.status}
              topesAmount={claim.needClaimSettlementEventByNeedClaimId?.topesAmount ?? null}
            />
          </Stack>

          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

          {!conversationLoading ? (
            <Alert severity={isCreator ? "info" : "warning"}>
              {isCreator
                ? t("claimConversation.sendFirstReply")
                : t("claimConversation.creatorNotReplied")}
            </Alert>
          ) : null}

          {claim.message ? (
            <Box>
              <Typography variant="subtitle2">{t("claimConversation.initialClaimNote")}</Typography>
              <Typography color="text.secondary" variant="body2">
                {claim.message}
              </Typography>
            </Box>
          ) : null}

          {claimStatus === "SETTLED" ? (
            <Alert severity="success">
              {t("claimConversation.settledInfo")}
            </Alert>
          ) : null}

          <Stack spacing={1.5}>
            <TextField
              fullWidth
              disabled={!canSend || sendLoading}
              label={t("claimConversation.firstReply")}
              minRows={3}
              multiline
              placeholder={t("claimConversation.firstReplyPlaceholder")}
              value={draftBody}
              onChange={event => setDraftBody(event.target.value)}
            />
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Tooltip title={t("claimConversation.attachImages")}>
                <IconButton
                  disabled={!canSend || sendLoading}
                  color={draftImageUrls.length > 0 ? "primary" : "default"}
                  onClick={() => setShowImageDialog(true)}
                  size="small"
                >
                  <AttachFileIcon />
                </IconButton>
              </Tooltip>
              {draftImageUrls.length > 0 && (
                <Typography color="text.secondary" variant="caption">
                  {t("claimConversation.imagesAttached", { count: draftImageUrls.length, max: MAX_IMAGE_ATTACHMENTS })}
                </Typography>
              )}
            </Stack>
            <Box>
              <Button disabled={!canSend || sendLoading || !draftBody.trim() || draftImageUrls.length > MAX_IMAGE_ATTACHMENTS} onClick={() => void handleSendMessage()} variant="contained">
                {sendLoading ? t("claimConversation.sending") : t("claimConversation.startConversation")}
              </Button>
            </Box>
          </Stack>

          <ChatImageUploadDialog
            open={showImageDialog}
            onClose={() => setShowImageDialog(false)}
            onImagesAdded={(newUrls) => setDraftImageUrls([...draftImageUrls, ...newUrls])}
            maxImages={MAX_IMAGE_ATTACHMENTS}
            currentImageUrls={draftImageUrls}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
