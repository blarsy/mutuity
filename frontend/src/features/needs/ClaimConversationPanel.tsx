import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Link,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";
import { useAccountEventSignal } from "../../services/graphql/accountEvents";
import {
  NEED_CLAIM_DETAIL_QUERY,
  CLAIM_CONVERSATION_BY_PARTIES_QUERY,
  MARK_CLAIM_MESSAGES_READ_MUTATION,
  SEND_CLAIM_MESSAGE_MUTATION
} from "./claimConversation.queries";
import { NeedClaimStatusChip } from "./NeedClaimStatusChip";
import { logBackofficeError } from "../logging/operationalLogger";

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

type NeedClaimDetailQueryData = {
  needClaimById: {
    id: string;
    needId: string;
    claimerAccountId: string;
    message: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
    settledAt: string | null;
    needByNeedId: {
      id: string;
      title: string;
      creatorAccountId: string;
    };
    accountByClaimerAccountId: {
      id: string;
      displayName: string | null;
      externalSubject: string;
    } | null;
    needClaimSettlementEventByNeedClaimId: {
      id: string;
      topesAmount: number;
      createdAt: string;
      settledByAccountId: string;
    } | null;
  } | null;
};

type ClaimConversationByPartiesData = {
  claimConversationByNeedIdAndCreatorAccountIdAndClaimerAccountId: {
    id: string;
    claimMessagesByConversationId: {
      nodes: Array<{
        id: string;
        senderAccountId: string;
        body: string;
        createdAt: string;
        readAt: string | null;
        claimMessageImagesByMessageId: {
          nodes: Array<{
            id: string;
            imageUrl: string;
            sortOrder: number;
          }>;
        };
      }>;
    };
  } | null;
};

export function parseImageMetadataInput(value: string) {
  return value
    .split(/[\n,]/g)
    .map(entry => entry.trim())
    .filter(Boolean);
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
  const [draftBody, setDraftBody] = useState("");
  const [draftImageUrls, setDraftImageUrls] = useState("");

  const [sendClaimMessage, { loading: sendLoading, error: sendError }] = useMutation(
    SEND_CLAIM_MESSAGE_MUTATION
  );
  const [markClaimMessagesRead] = useMutation(MARK_CLAIM_MESSAGES_READ_MUTATION);

  const { data, loading, error, refetch } = useQuery<NeedClaimDetailQueryData>(NEED_CLAIM_DETAIL_QUERY, {
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    variables: { claimId }
  });

  const claim = data?.needClaimById ?? null;

  const { data: convData, refetch: refetchConv } = useQuery<ClaimConversationByPartiesData>(
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
  const isCreator = claim?.needByNeedId.creatorAccountId === currentAccountId;

  const messages = useMemo<ClaimConversationViewMessage[]>(() => {
    return sortConversationMessages(
      (conversation?.claimMessagesByConversationId.nodes ?? []).map(message => ({
        id: message.id,
        senderAccountId: message.senderAccountId,
        body: message.body,
        createdAt: message.createdAt,
        readAt: message.readAt,
        imageUrls: message.claimMessageImagesByMessageId.nodes
          .slice()
          .sort((left, right) => left.sortOrder - right.sortOrder)
          .map(image => image.imageUrl)
      }))
    );
  }, [conversation?.claimMessagesByConversationId.nodes]);

  const unreadCount = useMemo(
    () => messages.filter(message => message.senderAccountId !== currentAccountId && !message.readAt).length,
    [currentAccountId, messages]
  );

  useEffect(() => {
    if (!conversation?.id || unreadCount === 0) {
      return;
    }

    void markClaimMessagesRead({
      variables: {
        input: {
          conversationId: conversation.id
        }
      }
    })
      .then(() => refetchConv())
      .catch(markReadError => {
        console.error("[needs] Failed to mark claim messages as read", markReadError);
        void logBackofficeError("[needs] Failed to mark claim messages as read", markReadError, {
          context: "claim_conversation_mark_read",
          accountId: currentAccountId ?? undefined,
          metadata: {
            conversationId: conversation.id,
            unreadCount
          }
        });
      });
  }, [conversation?.id, currentAccountId, markClaimMessagesRead, refetch, unreadCount]);

  const canSend = canSendClaimMessages(claimStatus, Boolean(conversation), isCreator);
  const errorMessage = getUserFacingGraphQLErrorMessage(error) ?? getUserFacingGraphQLErrorMessage(sendError);

  useAccountEventSignal(() => {
    void refetch();
    void refetchConv();
  }, Boolean(currentAccountId));

  const handleSendMessage = async () => {
    if (!claim || !draftBody.trim()) {
      return;
    }

    await sendClaimMessage({
      variables: {
        input: {
          needClaimId: claim.id,
          body: draftBody.trim(),
          imageUrls: parseImageMetadataInput(draftImageUrls)
        }
      }
    });

    setDraftBody("");
    setDraftImageUrls("");
    await refetchConv();
  };

  if (loading && !claim) {
    return <Alert severity="info">{t("claimConversation.loading")}</Alert>;
  }

  if (!claim) {
    return <Alert severity="warning">{t("claimConversation.notFound")}</Alert>;
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
            <Box>
              <Typography variant="h6">{t("claimConversation.title", { needTitle: claim.needByNeedId.title })}</Typography>
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

          {!conversation ? (
            <Alert severity={isCreator ? "info" : "warning"}>
              {isCreator
                ? t("claimConversation.sendFirstReply")
                : t("claimConversation.creatorNotReplied")}
            </Alert>
          ) : null}

          {!conversation && claim.message ? (
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

          {conversation ? <ClaimConversationThreadView currentAccountId={currentAccountId} messages={messages} /> : null}

          <Stack spacing={1.5}>
            <TextField
              fullWidth
              disabled={!canSend || sendLoading}
              label={conversation ? t("claimConversation.reply") : t("claimConversation.firstReply")}
              minRows={3}
              multiline
              placeholder={
                conversation
                  ? t("claimConversation.replyPlaceholder")
                  : t("claimConversation.firstReplyPlaceholder")
              }
              value={draftBody}
              onChange={event => setDraftBody(event.target.value)}
            />
            <TextField
              fullWidth
              disabled={!canSend || sendLoading}
              helperText={t("claimConversation.imageHelper")}
              label={t("claimConversation.imageMetadata")}
              minRows={2}
              multiline
              placeholder={t("claimConversation.imagePlaceholder")}
              value={draftImageUrls}
              onChange={event => setDraftImageUrls(event.target.value)}
            />
            <Box>
              <Button disabled={!canSend || sendLoading || !draftBody.trim()} onClick={() => void handleSendMessage()} variant="contained">
                {sendLoading ? t("claimConversation.sending") : conversation ? t("claimConversation.sendMessage") : t("claimConversation.startConversation")}
              </Button>
            </Box>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
