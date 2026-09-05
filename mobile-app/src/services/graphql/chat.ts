import { apolloClient } from "./client";
import {
  type CreateResourceMessageImageInput,
  type CreateResourceMessageInput,
  type Mutation,
  type QueryListChatConversationsArgs,
  type QueryResourceConversationByIdArgs
} from "./generated";
import {
  CHAT_CONVERSATIONS_QUERY,
  CREATE_RESOURCE_MESSAGE_IMAGE_MUTATION,
  CREATE_RESOURCE_MESSAGE_MUTATION,
  MARK_RESOURCE_MESSAGES_READ_MUTATION,
  RESOURCE_CONVERSATION_LOOKUP_QUERY,
  RESOURCE_CONVERSATION_BY_ID_QUERY,
  RESOURCE_MESSAGES_QUERY,
  SEND_RESOURCE_MESSAGE_DIRECT_MUTATION
} from "./operations";
import type { ChatConversationItem } from "../../screens/chat/ChatListScreen";
import type { ChatDetailConversation, ChatMessageItem } from "../../screens/chat/ChatDetailScreen";

const DEFAULT_PAGE_SIZE = 50;

interface ChatConversationsQueryResult {
  listChatConversations: {
    nodes: Array<{
      conversationId: string | null;
      contextTitle: string | null;
      contextImageUrl: string | null;
      otherAccountDisplayName: string | null;
      otherAccountAvatarUrl: string | null;
      lastMessagePreview: string | null;
      lastActivityAt: string | null;
      unreadCount: number | null;
    }>;
  } | null;
}

interface ResourceConversationByIdQueryResult {
  resourceConversationById: {
    id: string;
    ownerAccountId: string;
    bidderAccountId: string;
    accountByOwnerAccountId: { id: string; displayName: string | null; avatarUrl: string | null } | null;
    accountByBidderAccountId: { id: string; displayName: string | null; avatarUrl: string | null } | null;
    resourceByResourceId: { id: string; title: string | null; imageUrls: Array<string | null> | null } | null;
  } | null;
}

interface ResourceMessagesQueryResult {
  allResourceMessages: {
    nodes: Array<{
      id: string;
      body: string;
      createdAt: string | null;
      senderAccountId: string;
      resourceMessageImagesByMessageId: { nodes: Array<{ imageUrl: string }> } | null;
    }>;
  } | null;
}

interface CreateResourceMessageMutationResult {
  createResourceMessage: Pick<Mutation, "createResourceMessage">["createResourceMessage"];
}

interface CreateResourceMessageImageMutationResult {
  createResourceMessageImage: Pick<Mutation, "createResourceMessageImage">["createResourceMessageImage"];
}

interface MarkResourceMessagesReadMutationResult {
  markResourceMessagesRead: Pick<Mutation, "markResourceMessagesRead">["markResourceMessagesRead"];
}

interface ResourceConversationLookupQueryResult {
  resourceConversationByResourceIdAndOwnerAccountIdAndBidderAccountId: {
    id: string;
  } | null;
}

interface SendResourceMessageDirectMutationResult {
  sendResourceMessageDirect: {
    resourceMessage: {
      id: string;
      conversationId: string;
    } | null;
    resourceConversationByConversationId: {
      id: string;
    } | null;
  } | null;
}

export async function fetchChatConversations(): Promise<ChatConversationItem[]> {
  const variables: QueryListChatConversationsArgs = {
    pLimit: DEFAULT_PAGE_SIZE
  };

  const { data } = await apolloClient.query<ChatConversationsQueryResult, QueryListChatConversationsArgs>({
    query: CHAT_CONVERSATIONS_QUERY,
    variables,
    fetchPolicy: "network-only"
  });

  return (data?.listChatConversations?.nodes ?? [])
    .map((node) => {
      if (!node.conversationId) {
        return null;
      }

      return {
        id: node.conversationId,
        otherAccountDisplayName: node.otherAccountDisplayName ?? "Conversation",
        otherAccountAvatarUrl: node.otherAccountAvatarUrl,
        linkedResourceTitle: node.contextTitle,
        linkedResourceImageUrl: node.contextImageUrl,
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
    apolloClient.query<ResourceMessagesQueryResult, { conversationId: string; first: number }>({
      query: RESOURCE_MESSAGES_QUERY,
      variables: { conversationId, first: DEFAULT_PAGE_SIZE },
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
  const otherAccountAvatarUrl = owner?.id === currentAccountId ? bidder?.avatarUrl : owner?.avatarUrl;
  const otherAccountId = conversationNode.ownerAccountId === currentAccountId
    ? conversationNode.bidderAccountId
    : conversationNode.ownerAccountId;

  const conversation: ChatDetailConversation = {
    id: conversationNode.id,
    otherAccountId: otherAccountId ?? null,
    otherAccountDisplayName: otherAccountDisplayName ?? "Conversation",
    otherAccountAvatarUrl: otherAccountAvatarUrl ?? null,
    linkedResourceId: conversationNode.resourceByResourceId?.id ?? null,
    linkedResourceTitle: conversationNode.resourceByResourceId?.title ?? null,
    linkedResourceImageUrl: conversationNode.resourceByResourceId?.imageUrls?.[0] ?? null
  };

  const messages = (messagesResult.data?.allResourceMessages?.nodes ?? []).map((node) => ({
    id: node.id,
    direction: node.senderAccountId === currentAccountId ? "outgoing" : "incoming",
    body: node.body,
    createdAt: node.createdAt,
    imageUrls: (node.resourceMessageImagesByMessageId?.nodes ?? []).map((image) => image.imageUrl)
  })) as ChatMessageItem[];

  return {
    conversation,
    messages
  };
}

export async function sendResourceMessage(
  conversationId: string,
  senderAccountId: string,
  messageText: string,
  imageUrl?: string | null
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

  const result = await apolloClient.mutate<CreateResourceMessageMutationResult, { input: CreateResourceMessageInput }>({
    mutation: CREATE_RESOURCE_MESSAGE_MUTATION,
    variables
  });

  const messageId = result.data?.createResourceMessage?.resourceMessage?.id;
  if (imageUrl && messageId) {
    await apolloClient.mutate<CreateResourceMessageImageMutationResult, { input: CreateResourceMessageImageInput }>({
      mutation: CREATE_RESOURCE_MESSAGE_IMAGE_MUTATION,
      variables: {
        input: {
          resourceMessageImage: {
            messageId,
            imageUrl
          }
        }
      }
    });
  }
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

export async function openOrCreateResourceConversation(params: {
  resourceId: string;
  ownerAccountId: string;
  bidderAccountId: string;
  initialMessage?: string;
}): Promise<string> {
  const lookupResult = await apolloClient.query<
    ResourceConversationLookupQueryResult,
    { resourceId: string; ownerAccountId: string; bidderAccountId: string }
  >({
    query: RESOURCE_CONVERSATION_LOOKUP_QUERY,
    variables: {
      resourceId: params.resourceId,
      ownerAccountId: params.ownerAccountId,
      bidderAccountId: params.bidderAccountId
    },
    fetchPolicy: "network-only"
  });

  const existingConversationId =
    lookupResult.data?.resourceConversationByResourceIdAndOwnerAccountIdAndBidderAccountId?.id;
  if (existingConversationId) {
    return existingConversationId;
  }

  const createResult = await apolloClient.mutate<
    SendResourceMessageDirectMutationResult,
    { input: { pResourceId: string; pOtherAccountId: string; pBody: string } }
  >({
    mutation: SEND_RESOURCE_MESSAGE_DIRECT_MUTATION,
    variables: {
      input: {
        pResourceId: params.resourceId,
        pOtherAccountId: params.ownerAccountId,
        pBody: params.initialMessage?.trim() || "Hello"
      }
    }
  });

  const createdConversationId =
    createResult.data?.sendResourceMessageDirect?.resourceConversationByConversationId?.id
    ?? createResult.data?.sendResourceMessageDirect?.resourceMessage?.conversationId;

  if (!createdConversationId) {
    throw new Error("Unable to open or create conversation");
  }

  return createdConversationId;
}
