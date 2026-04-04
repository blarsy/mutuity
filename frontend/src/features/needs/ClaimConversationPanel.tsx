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

import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";
import {
  CLAIM_CONVERSATION_QUERY,
  MARK_CLAIM_MESSAGES_READ_MUTATION,
  SEND_CLAIM_MESSAGE_MUTATION
} from "./claimConversation.queries";
import { NeedClaimStatusChip } from "./NeedClaimStatusChip";

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

type ClaimConversationQueryData = {
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
    claimConversationByNeedClaimId: {
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
                {message.readAt ? " • read" : ""}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
}

export function ClaimConversationPanel({ claimId, currentAccountId }: ClaimConversationPanelProps) {
  const [draftBody, setDraftBody] = useState("");
  const [draftImageUrls, setDraftImageUrls] = useState("");
  const { data, loading, error, refetch } = useQuery<ClaimConversationQueryData>(CLAIM_CONVERSATION_QUERY, {
    variables: { claimId }
  });
  const [sendClaimMessage, { loading: sendLoading, error: sendError }] = useMutation(
    SEND_CLAIM_MESSAGE_MUTATION
  );
  const [markClaimMessagesRead] = useMutation(MARK_CLAIM_MESSAGES_READ_MUTATION);

  const claim = data?.needClaimById ?? null;
  const conversation = claim?.claimConversationByNeedClaimId ?? null;
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
      .then(() => refetch())
      .catch(markReadError => {
        console.error("[needs] Failed to mark claim messages as read", markReadError);
      });
  }, [conversation?.id, markClaimMessagesRead, refetch, unreadCount]);

  const canSend = canSendClaimMessages(claimStatus, Boolean(conversation), isCreator);
  const errorMessage = getUserFacingGraphQLErrorMessage(error) ?? getUserFacingGraphQLErrorMessage(sendError);

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
    await refetch();
  };

  if (loading) {
    return <Alert severity="info">Loading claim conversation…</Alert>;
  }

  if (!claim) {
    return <Alert severity="warning">This claim could not be loaded.</Alert>;
  }

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
            <Box>
              <Typography variant="h6">Conversation for {claim.needByNeedId.title}</Typography>
              <Typography color="text.secondary" variant="body2">
                Claimer: {claim.accountByClaimerAccountId?.displayName ?? claim.accountByClaimerAccountId?.externalSubject ?? claim.claimerAccountId}
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
                ? "Send the first reply to open the private conversation."
                : "The creator has not replied yet. You will be able to continue once the conversation is started."}
            </Alert>
          ) : null}

          {!conversation && claim.message ? (
            <Box>
              <Typography variant="subtitle2">Initial claim note</Typography>
              <Typography color="text.secondary" variant="body2">
                {claim.message}
              </Typography>
            </Box>
          ) : null}

          {claimStatus === "SETTLED" ? (
            <Alert severity="success">
              This claim is settled. The conversation stays open for follow-up coordination between the two participants.
            </Alert>
          ) : null}

          {conversation ? <ClaimConversationThreadView currentAccountId={currentAccountId} messages={messages} /> : null}

          <Stack spacing={1.5}>
            <TextField
              fullWidth
              disabled={!canSend || sendLoading}
              label={conversation ? "Reply" : "First reply"}
              minRows={3}
              multiline
              placeholder={
                conversation
                  ? "Write your next coordination message"
                  : "Write the first message that will open the conversation"
              }
              value={draftBody}
              onChange={event => setDraftBody(event.target.value)}
            />
            <TextField
              fullWidth
              disabled={!canSend || sendLoading}
              helperText="Optional image URLs, separated by commas or new lines."
              label="Image metadata"
              minRows={2}
              multiline
              placeholder="https://example.com/photo-1.png"
              value={draftImageUrls}
              onChange={event => setDraftImageUrls(event.target.value)}
            />
            <Box>
              <Button disabled={!canSend || sendLoading || !draftBody.trim()} onClick={() => void handleSendMessage()} variant="contained">
                {sendLoading ? "Sending…" : conversation ? "Send message" : "Start conversation"}
              </Button>
            </Box>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
