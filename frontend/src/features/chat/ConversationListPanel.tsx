import { useEffect, useState } from "react";
import NextLink from "next/link";
import { useQuery } from "@apollo/client/react";
import {
  Alert,
  Badge,
  Box,
  Chip,
  CircularProgress,
  Divider,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  TextField,
  Typography
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useTranslation } from "react-i18next";

import { LIST_CHAT_CONVERSATIONS_QUERY, COUNT_CHAT_CONVERSATIONS_QUERY } from "./chat.queries";
import { conversationDraftUrl, conversationThreadUrl } from "./chatRouting";
import { useAccountEventSignal } from "../../services/graphql/accountEvents";
import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";

type ConversationNode = {
  conversationKind: string;
  conversationId: string;
  contextId: string;
  contextTitle: string | null;
  otherAccountId: string;
  otherAccountDisplayName: string | null;
  lastMessagePreview: string | null;
  unreadCount: number;
  lastActivityAt: string | null;
};

type ListChatConversationsData = {
  listChatConversations: {
    nodes: ConversationNode[];
  };
};

type CountChatConversationsData = {
  countChatConversations: number | null;
};

const PAGE_SIZE = 25;

export function ConversationListPanel({
  draftThread,
  selectedConversationId,
  isAuthenticated,
  listRefreshToken,
  selectedDraft
}: {
  draftThread?: {
    kind: "need" | "resource";
    contextId: string;
    otherAccountId: string | null;
    title: string | null;
  } | null;
  selectedConversationId?: string | null;
  isAuthenticated: boolean;
  listRefreshToken?: number;
  selectedDraft?: boolean;
}) {
  const { t } = useTranslation("chat");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 300);

  const { data, loading, error, refetch } = useQuery<ListChatConversationsData>(
    LIST_CHAT_CONVERSATIONS_QUERY,
    {
      fetchPolicy: "cache-and-network",
      nextFetchPolicy: "cache-first",
      variables: { search: debouncedSearch || null, limit: PAGE_SIZE, offset: 0 },
      skip: !isAuthenticated
    }
  );

  const { data: countData, refetch: refetchCount } = useQuery<CountChatConversationsData>(
    COUNT_CHAT_CONVERSATIONS_QUERY,
    {
      fetchPolicy: "cache-and-network",
      nextFetchPolicy: "cache-first",
      variables: { search: debouncedSearch || null },
      skip: !isAuthenticated
    }
  );

  useAccountEventSignal(() => {
    void refetch();
    void refetchCount();
  }, isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !listRefreshToken) {
      return;
    }

    void refetch();
    void refetchCount();
  }, [isAuthenticated, listRefreshToken, refetch, refetchCount]);

  const draftConversation: ConversationNode | null =
    draftThread && !debouncedSearch
      ? {
          conversationKind: draftThread.kind,
          conversationId: `draft-${draftThread.kind}-${draftThread.contextId}-${draftThread.otherAccountId ?? "none"}`,
          contextId: draftThread.contextId,
          contextTitle: draftThread.title,
          otherAccountId: draftThread.otherAccountId ?? "",
          otherAccountDisplayName: null,
          lastMessagePreview: null,
          unreadCount: 0,
          lastActivityAt: null
        }
      : null;

  const conversations = draftConversation
    ? [draftConversation, ...(data?.listChatConversations.nodes ?? [])]
    : (data?.listChatConversations.nodes ?? []);
  const totalCount = countData?.countChatConversations ?? 0;
  const errorMessage = getUserFacingGraphQLErrorMessage(error);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          inputProps={{ "aria-label": t("search.label") }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            )
          }}
          onChange={e => setSearch(e.target.value)}
          placeholder={t("search.placeholder")}
          size="small"
          value={search}
        />
      </Box>

      <Divider />

      {errorMessage && (
        <Box sx={{ p: 2 }}>
          <Alert severity="error">{errorMessage}</Alert>
        </Box>
      )}

      {loading && conversations.length === 0 && (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress size={32} />
        </Box>
      )}

      {!loading && !errorMessage && conversations.length === 0 && (
        <Box sx={{ p: 3 }}>
          <Typography color="text.secondary" variant="body2">
            {debouncedSearch ? t("empty.noResults") : t("empty.noConversations")}
          </Typography>
          {!debouncedSearch && (
            <Typography color="text.secondary" sx={{ mt: 1 }} variant="caption">
              {t("empty.noConversationsHint")}
            </Typography>
          )}
        </Box>
      )}

      <List disablePadding sx={{ flex: 1, overflowY: "auto" }}>
        {conversations.map(conv => (
          <ConversationListItem
            key={conv.conversationId}
            conversation={conv}
            isDraft={Boolean(draftConversation && conv.conversationId === draftConversation.conversationId)}
            isSelected={Boolean(
              draftConversation && conv.conversationId === draftConversation.conversationId
                ? selectedDraft
                : conv.conversationId === selectedConversationId
            )}
          />
        ))}
      </List>

      {totalCount > PAGE_SIZE && (
        <Box sx={{ p: 1, textAlign: "center" }}>
          <Typography color="text.secondary" variant="caption">
            {totalCount} conversations
          </Typography>
        </Box>
      )}
    </Box>
  );
}

function ConversationListItem({
  conversation: conv,
  isDraft = false,
  isSelected
}: {
  conversation: ConversationNode;
  isDraft?: boolean;
  isSelected: boolean;
}) {
  const { t } = useTranslation("chat");
  const threadUrl = isDraft
    ? conversationDraftUrl({
        kind: conv.conversationKind as "need" | "resource",
        contextId: conv.contextId,
        otherAccountId: conv.otherAccountId || null,
        title: conv.contextTitle
      })
    : conversationThreadUrl(
        conv.conversationKind as "need" | "resource",
        conv.conversationId
      );
  const displayName =
    conv.otherAccountDisplayName ||
    t("kind." + conv.conversationKind, { defaultValue: conv.conversationKind });

  return (
    <ListItem
      disablePadding
      secondaryAction={
        conv.unreadCount > 0 ? (
          <Badge badgeContent={conv.unreadCount} color="primary" max={99} />
        ) : null
      }
    >
      <ListItemButton
        component={NextLink}
        href={threadUrl}
        selected={isSelected}
        sx={{ pr: conv.unreadCount > 0 ? 6 : 2 }}
      >
        <ListItemText
          primary={
            <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
              <Chip
                label={isDraft ? t("list.draftChip", { kind: t("kind." + conv.conversationKind) }) : t("kind." + conv.conversationKind)}
                size="small"
                sx={{ fontSize: "0.65rem", height: 18 }}
                variant="outlined"
              />
              <Typography
                component="span"
                fontWeight={conv.unreadCount > 0 ? 700 : 400}
                noWrap
                variant="body2"
              >
                {conv.contextTitle || displayName}
              </Typography>
            </Box>
          }
          secondary={
            <Box>
              <Typography
                color="text.secondary"
                component="span"
                display="block"
                noWrap
                variant="caption"
              >
                {displayName}
              </Typography>
              {conv.lastMessagePreview && (
                <Typography
                  color="text.secondary"
                  component="span"
                  display="block"
                  noWrap
                  variant="caption"
                >
                  {conv.lastMessagePreview}
                </Typography>
              )}
              {isDraft && !conv.lastMessagePreview && (
                <Typography
                  color="text.secondary"
                  component="span"
                  display="block"
                  noWrap
                  variant="caption"
                >
                  {t("list.draftPreview")}
                </Typography>
              )}
              {conv.lastActivityAt && (
                <Typography
                  color="text.disabled"
                  component="span"
                  display="block"
                  variant="caption"
                >
                  {new Date(conv.lastActivityAt).toLocaleString()}
                </Typography>
              )}
            </Box>
          }
        />
      </ListItemButton>
    </ListItem>
  );
}

/** Simple debounce hook to avoid firing a query on every keystroke. */
function useDebounced<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
