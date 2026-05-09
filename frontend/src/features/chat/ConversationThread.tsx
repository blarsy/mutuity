import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  Alert,
  Box,
  CircularProgress,
  Collapse,
  Divider,
  Fab,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import SendIcon from "@mui/icons-material/Send";
import KeyboardDoubleArrowDownIcon from "@mui/icons-material/KeyboardDoubleArrowDown";
import { useTranslation } from "react-i18next";

import { useAuth } from "../auth/AuthProvider";
import {
  CLAIM_CONVERSATION_QUERY,
  RESOURCE_CONVERSATION_QUERY,
  SEND_CLAIM_MESSAGE_MUTATION,
  SEND_RESOURCE_MESSAGE_MUTATION,
  SEND_RESOURCE_MESSAGE_DIRECT_MUTATION,
  SEND_NEED_MESSAGE_MUTATION,
  MARK_RESOURCE_MESSAGES_READ_MUTATION,
  MARK_CLAIM_MESSAGES_READ_MUTATION
} from "./chat.queries";
import { ConversationHeader } from "./ConversationHeader";
import { useAccountEventSignal } from "../../services/graphql/accountEvents";
import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";

// ─── Pure helpers ─────────────────────────────────────────────────────────────

/** Returns true when the composer body is non-blank and a send can be attempted. */
export function isComposerBodyReady(body: string): boolean {
  return body.trim().length > 0;
}

/**
 * Parses a newline- or comma-separated image URL string into an ordered list.
 * Returns at most MAX_IMAGE_ATTACHMENTS entries.
 */
export const MAX_IMAGE_ATTACHMENTS = 5;

export function parseImageUrls(input: string): string[] {
  return input
    .split(/[\n,]/g)
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, MAX_IMAGE_ATTACHMENTS);
}

// ─── Types ───────────────────────────────────────────────────────────────────

type MessageImage = { id: string; imageUrl: string; sortOrder: number };

type Message = {
  id: string;
  conversationId: string;
  senderAccountId: string;
  body: string;
  createdAt: string;
  readAt?: string | null;
  images?: MessageImage[];
};

type ResourceConversationData = {
  resourceConversationById: {
    id: string;
    resourceBidId: string | null;
    resourceId: string;
    ownerAccountId: string;
    bidderAccountId: string;
    createdAt: string;
    resourceByResourceId?: { id: string; title: string } | null;
    resourceMessagesByConversationId: { nodes: (Message & { resourceMessageImagesByMessageId: { nodes: MessageImage[] } })[] };
  } | null;
};
type ClaimConversationData = {
  claimConversationById: {
    id: string;
    needClaimId: string | null;
    needId: string;
    creatorAccountId: string;
    claimerAccountId: string;
    createdAt: string;
    needByNeedId?: { id: string; title: string } | null;
    claimMessagesByConversationId: { nodes: (Message & { claimMessageImagesByMessageId: { nodes: MessageImage[] } })[] };
  } | null;
};

type SendResourceMessageDirectMutationData = {
  sendResourceMessageDirect: {
    resourceMessage: {
      conversationId: string;
    } | null;
  } | null;
};

type SendNeedMessageMutationData = {
  sendNeedMessage: {
    claimMessage: {
      conversationId: string;
    } | null;
  } | null;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const NEAR_BOTTOM_THRESHOLD_PX = 80;
// ─── Main component ──────────────────────────────────────────────────────────

export function ConversationThread({
  kind,
  conversationId,
  draftThread,
  onConversationCreated,
  onBack
}: {
  kind: "need" | "resource";
  conversationId: string | null;
  draftThread?: {
    kind: "need" | "resource";
    contextId: string;
    otherAccountId: string | null;
    title: string | null;
  } | null;
  onConversationCreated?: (kind: "need" | "resource", conversationId: string) => void | Promise<void>;
  onBack?: () => void;
}) {
  const { t } = useTranslation("chat");
  const { session } = useAuth();
  const myAccountId = session?.account?.id ?? null;

  const isResource = kind === "resource";
  const isDraftThread = Boolean(draftThread) && !conversationId;

  const { data: resourceData, loading: resourceLoading, error: resourceError, refetch: resourceRefetch } =
    useQuery<ResourceConversationData>(RESOURCE_CONVERSATION_QUERY, {
      fetchPolicy: "cache-and-network",
      nextFetchPolicy: "cache-first",
      variables: { conversationId },
      skip: !isResource || !conversationId
    });

  const { data: claimData, loading: claimLoading, error: claimError, refetch: claimRefetch } =
    useQuery<ClaimConversationData>(CLAIM_CONVERSATION_QUERY, {
      fetchPolicy: "cache-and-network",
      nextFetchPolicy: "cache-first",
      variables: { conversationId },
      skip: isResource || !conversationId
    });

  const [markResourceRead] = useMutation(MARK_RESOURCE_MESSAGES_READ_MUTATION);
  const [markClaimRead] = useMutation(MARK_CLAIM_MESSAGES_READ_MUTATION);

  const loading = isDraftThread ? false : (isResource ? resourceLoading : claimLoading);
  const queryError = isDraftThread ? null : (isResource ? resourceError : claimError);
  const errorMessage = getUserFacingGraphQLErrorMessage(queryError);

  // Extract data from whichever conversation type is active
  const resourceConv = resourceData?.resourceConversationById ?? null;
  const claimConv = claimData?.claimConversationById ?? null;

  const messages: Message[] = isResource
    ? (resourceConv?.resourceMessagesByConversationId.nodes ?? []).map(m => ({
        ...m,
        images: m.resourceMessageImagesByMessageId.nodes
      }))
    : (claimConv?.claimMessagesByConversationId.nodes ?? []).map(m => ({
        ...m,
        images: m.claimMessageImagesByMessageId.nodes
      }));

  const contextId = isResource
    ? (resourceConv?.resourceId ?? (draftThread?.kind === "resource" ? draftThread.contextId : null) ?? null)
    : (claimConv?.needId ?? (draftThread?.kind === "need" ? draftThread.contextId : null) ?? null);
  const contextTitle = isResource
    ? (resourceConv?.resourceByResourceId?.title ?? draftThread?.title ?? null)
    : claimConv?.needByNeedId?.title ?? draftThread?.title ?? null;

  const otherAccountId: string | null = isResource
    ? myAccountId === resourceConv?.ownerAccountId
      ? (resourceConv?.bidderAccountId ?? null)
      : (resourceConv?.ownerAccountId ?? draftThread?.otherAccountId ?? null)
    : myAccountId === claimConv?.creatorAccountId
      ? (claimConv?.claimerAccountId ?? null)
      : (claimConv?.creatorAccountId ?? draftThread?.otherAccountId ?? null);

  useAccountEventSignal(() => {
    if (isResource) {
      void resourceRefetch();
      return;
    }

    void claimRefetch();
  }, Boolean(conversationId) && Boolean(myAccountId));

  // ─── Scroll management ─────────────────────────────────────────────────────

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const isInitialLoad = useRef(true);
  const prevMessageCount = useRef(0);

  const isNearBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight <= NEAR_BOTTOM_THRESHOLD_PX;
  }, []);

  const scrollToBottom = useCallback((smooth = false) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "instant" });
  }, []);

  const handleScroll = useCallback(() => {
    setShowScrollDown(!isNearBottom());
  }, [isNearBottom]);

  // Scroll on initial load; conditionally on new messages
  useEffect(() => {
    if (messages.length === 0) return;
    if (isInitialLoad.current) {
      scrollToBottom(false);
      isInitialLoad.current = false;
      prevMessageCount.current = messages.length;
      return;
    }
    if (messages.length > prevMessageCount.current) {
      prevMessageCount.current = messages.length;
      if (isNearBottom()) {
        scrollToBottom(true);
      } else {
        setShowScrollDown(true);
      }
    }
  }, [messages.length, scrollToBottom, isNearBottom]);

  // Reset on conversation change
  useEffect(() => {
    isInitialLoad.current = true;
    prevMessageCount.current = 0;
    setShowScrollDown(false);
  }, [conversationId]);

  // ─── Read receipts ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!conversationId || isDraftThread) return;
    if (isResource) {
      markResourceRead({ variables: { input: { pConversationId: conversationId } } }).catch(() => {});
    } else {
      markClaimRead({ variables: { input: { conversationId } } }).catch(() => {});
    }
  }, [conversationId, isResource, isDraftThread, markResourceRead, markClaimRead]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <ConversationHeader
        contextId={contextId}
        contextTitle={contextTitle}
        kind={kind}
        onBack={onBack}
        t={t}
      />
      <Divider />

      {/* Message area */}
      <Box
        onScroll={handleScroll}
        ref={scrollRef}
        sx={{ flex: 1, overflowY: "auto", position: "relative", px: 2, py: 1 }}
      >
        {loading && messages.length === 0 && (
          <Box sx={{ display: "flex", justifyContent: "center", pt: 4 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {errorMessage && (
          <Box sx={{ pt: 2 }}>
            <Alert severity="error">{errorMessage}</Alert>
          </Box>
        )}

        {!loading && !errorMessage && messages.length === 0 && (
          <Box sx={{ pt: 4, textAlign: "center" }}>
            <Typography color="text.secondary" variant="body2">
              {t("thread.empty")}
            </Typography>
          </Box>
        )}

        <Stack spacing={0.5} sx={{ pb: 1 }}>
          {messages.map(msg => (
            <MessageBubble
              isMine={msg.senderAccountId === myAccountId}
              key={msg.id}
              message={msg}
            />
          ))}
        </Stack>
      </Box>

      {/* Jump-to-bottom FAB */}
      {showScrollDown && (
        <Box sx={{ bottom: 80, position: "absolute", right: 16, zIndex: 10 }}>
          <Fab
            color="primary"
            onClick={() => scrollToBottom(true)}
            size="small"
          >
            <KeyboardDoubleArrowDownIcon />
          </Fab>
        </Box>
      )}

      <Divider />

      {/* Composer */}
      {(resourceConv || claimConv || isDraftThread) && (
        <MessageComposer
          claimConv={claimConv}
          draftThread={isDraftThread ? draftThread ?? null : null}
          isResource={isResource}
          myAccountId={myAccountId}
          onConversationCreated={onConversationCreated}
          onSent={() => {
            if (isResource) resourceRefetch();
            else claimRefetch();
            // After sending, scroll to bottom
            setTimeout(() => scrollToBottom(true), 100);
          }}
          resourceConv={resourceConv}
          t={t}
        />
      )}
    </Box>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message, isMine }: { message: Message; isMine: boolean }) {
  const dateStr = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isMine ? "flex-end" : "flex-start",
        py: 0.25
      }}
    >
      <Box
        sx={{
          backgroundColor: isMine ? "primary.main" : "grey.200",
          borderRadius: 2,
          color: isMine ? "primary.contrastText" : "text.primary",
          maxWidth: "65%",
          px: 1.5,
          py: 0.75
        }}
      >
        <Typography sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }} variant="body2">
          {message.body}
        </Typography>
        {message.images && message.images.length > 0 && (
          <Stack spacing={0.5} sx={{ mt: 0.75 }}>
            {message.images.map(img => (
              // eslint-disable-next-line @next/next/no-img-element
              <Box
                alt=""
                component="img"
                key={img.id}
                src={img.imageUrl}
                sx={{ borderRadius: 1, maxWidth: "100%", width: "100%" }}
              />
            ))}
          </Stack>
        )}
        <Typography
          sx={{ display: "block", mt: 0.25, opacity: 0.7, textAlign: isMine ? "right" : "left" }}
          variant="caption"
        >
          {dateStr}
        </Typography>
      </Box>
    </Box>
  );
}

// ─── Message composer ─────────────────────────────────────────────────────────

type ResourceConv = ResourceConversationData["resourceConversationById"];
type ClaimConv = ClaimConversationData["claimConversationById"];

function MessageComposer({
  isResource,
  resourceConv,
  claimConv,
  draftThread,
  myAccountId,
  onConversationCreated,
  onSent,
  t
}: {
  isResource: boolean;
  resourceConv: ResourceConv;
  claimConv: ClaimConv;
  draftThread?: { kind: "need" | "resource"; contextId: string; otherAccountId: string | null } | null;
  myAccountId: string | null;
  onConversationCreated?: (kind: "need" | "resource", conversationId: string) => void | Promise<void>;
  onSent: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const [body, setBody] = useState("");
  const [imageUrlsInput, setImageUrlsInput] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const [sendResourceMessage] = useMutation(SEND_RESOURCE_MESSAGE_MUTATION);
  const [sendResourceMessageDirect] = useMutation<SendResourceMessageDirectMutationData>(SEND_RESOURCE_MESSAGE_DIRECT_MUTATION);
  const [sendNeedMessage] = useMutation<SendNeedMessageMutationData>(SEND_NEED_MESSAGE_MUTATION);
  const [sendClaimMessage] = useMutation(SEND_CLAIM_MESSAGE_MUTATION);

  const parsedImageUrls = parseImageUrls(imageUrlsInput);
  const tooManyImages = parsedImageUrls.length > MAX_IMAGE_ATTACHMENTS;
  const canSend = isComposerBodyReady(body) && !tooManyImages;

  const handleSend = async () => {
    const trimmed = body.trim();
    if (!trimmed || tooManyImages) return;
    const imageUrls = parsedImageUrls;
    setSending(true);
    setSendError(null);
    try {
      if (isResource && resourceConv) {
        if (resourceConv.resourceBidId) {
          await sendResourceMessage({
            variables: { input: { resourceBidId: resourceConv.resourceBidId, body: trimmed, imageUrls } }
          });
        } else {
          const otherAccountId =
            myAccountId === resourceConv.ownerAccountId
              ? resourceConv.bidderAccountId
              : resourceConv.ownerAccountId;
          await sendResourceMessageDirect({
            variables: {
              input: {
                pResourceId: resourceConv.resourceId,
                pOtherAccountId: otherAccountId,
                pBody: trimmed,
                pImageUrls: imageUrls
              }
            }
          });
        }
      } else if (isResource && draftThread?.kind === "resource" && draftThread.otherAccountId) {
        const result = await sendResourceMessageDirect({
          variables: {
            input: {
              pResourceId: draftThread.contextId,
              pOtherAccountId: draftThread.otherAccountId,
              pBody: trimmed,
              pImageUrls: imageUrls
            }
          }
        });

        const conversationId = result.data?.sendResourceMessageDirect?.resourceMessage?.conversationId;
        if (conversationId && onConversationCreated) {
          await onConversationCreated("resource", conversationId);
        }
      } else if (!isResource && draftThread?.kind === "need") {
        const result = await sendNeedMessage({
          variables: {
            input: {
              pNeedId: draftThread.contextId,
              pBody: trimmed,
              pImageUrls: imageUrls
            }
          }
        });

        const conversationId = result.data?.sendNeedMessage?.claimMessage?.conversationId;
        if (conversationId && onConversationCreated) {
          await onConversationCreated("need", conversationId);
        }
      } else if (!isResource && claimConv) {
        if (claimConv.needClaimId) {
          await sendClaimMessage({
            variables: { input: { needClaimId: claimConv.needClaimId, body: trimmed, imageUrls } }
          });
        } else {
          await sendNeedMessage({
            variables: { input: { pNeedId: claimConv.needId, pBody: trimmed, pImageUrls: imageUrls } }
          });
        }
      }
      setBody("");
      setImageUrlsInput("");
      setShowImageInput(false);
      onSent();
    } catch (err: unknown) {
      setSendError(getUserFacingGraphQLErrorMessage(err as Error) ?? t("thread.sendError"));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <Box sx={{ p: 1.5 }}>
      {sendError && (
        <Alert onClose={() => setSendError(null)} severity="error" sx={{ mb: 1 }}>
          {sendError}
        </Alert>
      )}
      <Stack direction="row" spacing={1} sx={{ alignItems: "flex-end" }}>
        <TextField
          disabled={sending}
          fullWidth
          maxRows={5}
          multiline
          onChange={e => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("thread.messagePlaceholder")}
          size="small"
          value={body}
        />
        <Tooltip title={t("thread.attachImages")}>
          <IconButton
            color={showImageInput ? "primary" : "default"}
            onClick={() => setShowImageInput(v => !v)}
            size="small"
          >
            <AttachFileIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title={t("thread.send")}>
          <span>
            <IconButton
              color="primary"
              disabled={sending || !canSend}
              onClick={() => void handleSend()}
              size="small"
            >
              {sending ? <CircularProgress size={20} /> : <SendIcon />}
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
      <Collapse in={showImageInput}>
        <Box sx={{ mt: 1 }}>
          <TextField
            disabled={sending}
            error={tooManyImages}
            fullWidth
            helperText={
              tooManyImages
                ? t("thread.tooManyImages", { max: MAX_IMAGE_ATTACHMENTS })
                : t("thread.imageUrlsHint", { max: MAX_IMAGE_ATTACHMENTS })
            }
            maxRows={3}
            multiline
            onChange={e => setImageUrlsInput(e.target.value)}
            placeholder={t("thread.imageUrlsPlaceholder")}
            size="small"
            value={imageUrlsInput}
          />
        </Box>
      </Collapse>
      <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="caption">
        {t("thread.sendHint")}
      </Typography>
    </Box>
  );
}
