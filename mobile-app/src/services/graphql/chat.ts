import { apolloClient } from "./client";
import {
  type CreateResourceMessageInput,
  type Mutation,
  type QueryAllChatConversationSummariesArgs,
  type QueryAllResourceMessagesArgs,
  type QueryResourceConversationByIdArgs
} from "./generated";
import {
  CHAT_CONVERSATIONS_QUERY,
  CREATE_RESOURCE_MESSAGE_MUTATION,
  MARK_RESOURCE_MESSAGES_READ_MUTATION,
  RESOURCE_CONVERSATION_BY_ID_QUERY,
  RESOURCE_MESSAGES_QUERY
} from "./operations";
import type { ChatConversationItem } from "../../screens/chat/ChatListScreen";
import type { ChatDetailConversation, ChatMessageItem } from "../../screens/chat/ChatDetailScreen";

const DEFAULT_PAGE_SIZE = 50;

interface ChatConversationsQueryResult {
  allChatConversationSummaries: {
    nodes: Array<{
      conversationId: string | null;
      contextTitle: string | null;
      lastMessagePreview: string | null;
      lastActivityAt: string | null;
      unreadCount: number | null;
    }>;
  } | null;
}

interface ResourceConversationByIdQueryResult {
  resourceConversationById: {
    id: string;
    accountByOwnerAccountId: { id: string; displayName: string | null } | null;
    accountByBidderAccountId: { id: string; displayName: string | null } | null;
    resourceByResourceId: { id: string; title: string | null } | null;
  } | null;
}

interface ResourceMessagesQueryResult {
  allResourceMessages: {
    nodes: Array<{
      id: string;
      body: string;
      createdAt: string | null;
      senderAccountId: string;
    }>;
  } | null;
}

interface CreateResourceMessageMutationResult {
  createResourceMessage: Pick<Mutation, "createResourceMessage">["createResourceMessage"];
}

interface MarkResourceMessagesReadMutationResult {
  markResourceMessagesRead: Pick<Mutation, "markResourceMessagesRead">["markResourceMessagesRead"];
}

export async function fetchChatConversations(): Promise<ChatConversationItem[]> {
  const variables: QueryAllChatConversationSummariesArgs = {
    first: DEFAULT_PAGE_SIZE
  };

  const { data } = await apolloClient.query<ChatConversationsQueryResult, QueryAllChatConversationSummariesArgs>({
    query: CHAT_CONVERSATIONS_QUERY,
    variables,
    fetchPolicy: "network-only"
  });

  return (data?.allChatConversationSummaries?.nodes ?? [])
    .map((node) => {
      if (!node.conversationId) {
        return null;
      }

      return {
        id: node.conversationId,
        otherAccountDisplayName: "Conversation",
        linkedResourceTitle: node.contextTitle,
        lastMessagePreview: node.lastMessagePreview ?? "",
        lastMessageAt: node.lastActivityAt,
        unreadCount: node.unreadCount ?? 0
      } satisfies ChatConversationItem;
    })
    .filter((node): node is ChatConversationItem => node !== null)
    .sort((a, b) => (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""));
}

export async function fetchChatConversationDetail(
  conversationId: string,
  currentAccountId: string
): Promise<{ conversation: ChatDetailConversation; messages: ChatMessageItem[] }> {
  const [conversationResult, messagesResult] = await Promise.all([
    apolloClient.query<ResourceConversationByIdQueryResult, QueryResourceConversationByIdArgs>({
      query: RESOURCE_CONVERSATION_BY_ID_QUERY,
      variables: { id: conversationId },
      fetchPolicy: "network-only"
    }),
    apolloClient.query<ResourceMessagesQueryResult, QueryAllResourceMessagesArgs>({
      query: RESOURCE_MESSAGES_QUERY,
      variables: { condition: { conversationId }, first: DEFAULT_PAGE_SIZE },
      fetchPolicy: "network-only"
    })
  ]);

  const conversationNode = conversationResult.data?.resourceConversationById;
  if (!conversationNode) {
    throw new Error("Missing conversation");
  }

  const owner = conversationNode.accountByOwnerAccountId;
  const bidder = conversationNode.accountByBidderAccountId;
  const otherAccountDisplayName = owner?.id === currentAccountId ? bidder?.displayName : owner?.displayName;

  const conversation: ChatDetailConversation = {
    id: conversationNode.id,
    otherAccountDisplayName: otherAccountDisplayName ?? "Conversation",
    linkedResourceTitle: conversationNode.resourceByResourceId?.title ?? null
  };

  const messages = (messagesResult.data?.allResourceMessages?.nodes ?? []).map((node) => ({
    id: node.id,
    direction: node.senderAccountId === currentAccountId ? "outgoing" : "incoming",
    body: node.body,
    createdAt: node.createdAt
  })) as ChatMessageItem[];

  return {
    conversation,
    messages
  };
}

export async function sendResourceMessage(
  conversationId: string,
  senderAccountId: string,
  messageText: string
): Promise<void> {
  const variables: { input: CreateResourceMessageInput } = {
    input: {
      resourceMessage: {
        conversationId,
        senderAccountId,
        body: messageText.trim()
      }
    }
  };

  await apolloClient.mutate<CreateResourceMessageMutationResult, { input: CreateResourceMessageInput }>({
    mutation: CREATE_RESOURCE_MESSAGE_MUTATION,
    variables
  });
}

export async function markConversationMessagesRead(conversationId: string): Promise<void> {
  await apolloClient.mutate<MarkResourceMessagesReadMutationResult, { input: { pConversationId: string } }>({
    mutation: MARK_RESOURCE_MESSAGES_READ_MUTATION,
    variables: {
      input: {
        pConversationId: conversationId
      }
    }
  });
}
