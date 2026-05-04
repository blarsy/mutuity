import { useEffect, useRef, useState, useCallback } from "react";
import NextLink from "next/link";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  Alert,
  Box,
  CircularProgress,
  Divider,
  Fab,
  IconButton,
  Link,
  Stack,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
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
import { conversationContextUrl } from "./chatRouting";
import { useAccountEventSignal } from "../../services/graphql/accountEvents";
import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";

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

// ─── Constants ───────────────────────────────────────────────────────────────

const NEAR_BOTTOM_THRESHOLD_PX = 80;
// ─── Main component ──────────────────────────────────────────────────────────

export function ConversationThread({
  kind,
  conversationId,
  onBack
}: {
  kind: "need" | "resource";
  conversationId: string;
  onBack?: () => void;
}) {
  const { t } = useTranslation("chat");
  const { session } = useAuth();
  const myAccountId = session?.account?.id ?? null;

  const isResource = kind === "resource";

  const { data: resourceData, loading: resourceLoading, error: resourceError, refetch: resourceRefetch } =
    useQuery<ResourceConversationData>(RESOURCE_CONVERSATION_QUERY, {
      fetchPolicy: "cache-and-network",
      nextFetchPolicy: "cache-first",
      variables: { conversationId },
      skip: !isResource
    });

  const { data: claimData, loading: claimLoading, error: claimError, refetch: claimRefetch } =
    useQuery<ClaimConversationData>(CLAIM_CONVERSATION_QUERY, {
      fetchPolicy: "cache-and-network",
      nextFetchPolicy: "cache-first",
      variables: { conversationId },
      skip: isResource
    });

  const [markResourceRead] = useMutation(MARK_RESOURCE_MESSAGES_READ_MUTATION);
  const [markClaimRead] = useMutation(MARK_CLAIM_MESSAGES_READ_MUTATION);

  const loading = isResource ? resourceLoading : claimLoading;
  const queryError = isResource ? resourceError : claimError;
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

  const contextId = isResource ? (resourceConv?.resourceId ?? null) : (claimConv?.needId ?? null);
  const contextTitle = isResource
    ? (resourceConv?.resourceByResourceId?.title ?? null)
    : claimConv?.needByNeedId?.title ?? null;

  const otherAccountId: string | null = isResource
    ? myAccountId === resourceConv?.ownerAccountId
      ? (resourceConv?.bidderAccountId ?? null)
      : (resourceConv?.ownerAccountId ?? null)
    : myAccountId === claimConv?.creatorAccountId
      ? (claimConv?.claimerAccountId ?? null)
      : (claimConv?.creatorAccountId ?? null);

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
    if (!conversationId) return;
    if (isResource) {
      markResourceRead({ variables: { input: { pConversationId: conversationId } } }).catch(() => {});
    } else {
      markClaimRead({ variables: { input: { conversationId } } }).catch(() => {});
    }
  }, [conversationId, isResource, markResourceRead, markClaimRead]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <ThreadHeader
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
      {(resourceConv || claimConv) && (
        <MessageComposer
          claimConv={claimConv}
          isResource={isResource}
          myAccountId={myAccountId}
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

// ─── Thread header ────────────────────────────────────────────────────────────

function ThreadHeader({
  kind,
  contextId,
  contextTitle,
  onBack,
  t
}: {
  kind: "need" | "resource";
  contextId: string | null;
  contextTitle: string | null;
  onBack?: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const contextUrl = contextId ? conversationContextUrl(kind, contextId) : null;

  return (
    <Box sx={{ alignItems: "center", display: "flex", gap: 1, minHeight: 56, px: 1.5, py: 1 }}>
      {onBack && (
        <Tooltip title={t("thread.back")}>
          <IconButton onClick={onBack} size="small" sx={{ display: { sm: "none" } }}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
      )}
      <Box sx={{ flex: 1, overflow: "hidden" }}>
        {contextTitle && contextUrl ? (
          <Link
            color="text.primary"
            component={NextLink}
            href={contextUrl}
            noWrap
            sx={{ display: "block", fontWeight: 600 }}
            underline="hover"
            variant="subtitle2"
          >
            {contextTitle}
          </Link>
        ) : (
          <Typography fontWeight={600} noWrap variant="subtitle2">
            {contextTitle ?? t("thread.loadingHeader")}
          </Typography>
        )}
        <Typography color="text.secondary" noWrap variant="caption">
          {t("kind." + kind)}
        </Typography>
      </Box>
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
  myAccountId,
  onSent,
  t
}: {
  isResource: boolean;
  resourceConv: ResourceConv;
  claimConv: ClaimConv;
  myAccountId: string | null;
  onSent: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const [sendResourceMessage] = useMutation(SEND_RESOURCE_MESSAGE_MUTATION);
  const [sendResourceMessageDirect] = useMutation(SEND_RESOURCE_MESSAGE_DIRECT_MUTATION);
  const [sendNeedMessage] = useMutation(SEND_NEED_MESSAGE_MUTATION);
  const [sendClaimMessage] = useMutation(SEND_CLAIM_MESSAGE_MUTATION);

  const handleSend = async () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    setSending(true);
    setSendError(null);
    try {
      if (isResource && resourceConv) {
        if (resourceConv.resourceBidId) {
          await sendResourceMessage({
            variables: { input: { resourceBidId: resourceConv.resourceBidId, body: trimmed, imageUrls: [] } }
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
                pImageUrls: []
              }
            }
          });
        }
      } else if (!isResource && claimConv) {
        if (claimConv.needClaimId) {
          await sendClaimMessage({
            variables: { input: { needClaimId: claimConv.needClaimId, body: trimmed, imageUrls: [] } }
          });
        } else {
          await sendNeedMessage({
            variables: { input: { pNeedId: claimConv.needId, pBody: trimmed, pImageUrls: [] } }
          });
        }
      }
      setBody("");
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
      handleSend();
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
        <Tooltip title={t("thread.send")}>
          <span>
            <IconButton
              color="primary"
              disabled={sending || !body.trim()}
              onClick={handleSend}
              size="small"
            >
              {sending ? <CircularProgress size={20} /> : <SendIcon />}
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
      <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="caption">
        {t("thread.sendHint")}
      </Typography>
    </Box>
  );
}
