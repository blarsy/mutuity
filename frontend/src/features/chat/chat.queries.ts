import { gql } from "@apollo/client";

/**
 * Load the paginated list of conversations (both need and resource context)
 * for the current account. The list function applies per-account filtering
 * server-side via SECURITY DEFINER + current_account_id().
 */
export const LIST_CHAT_CONVERSATIONS_QUERY = gql`
  query ListChatConversations($search: String, $limit: Int, $offset: Int) {
    listChatConversations(pSearch: $search, pLimit: $limit, pOffset: $offset) {
      nodes {
        conversationKind
        conversationId
        contextId
        contextTitle
        otherAccountId
        otherAccountDisplayName
        lastMessagePreview
        unreadCount
        lastActivityAt
      }
    }
  }
`;

export const COUNT_CHAT_CONVERSATIONS_QUERY = gql`
  query CountChatConversations($search: String) {
    countChatConversations(pSearch: $search)
  }
`;

/**
 * Load the full thread for a resource-bid-based conversation.
 * Messages are ordered by createdAt ascending so the oldest message
 * appears at the top of the UI thread.
 */
export const RESOURCE_CONVERSATION_QUERY = gql`
  query ResourceConversation($bidId: UUID!) {
    resourceConversationByResourceBidId(resourceBidId: $bidId) {
      id
      resourceBidId
      resourceId
      ownerAccountId
      bidderAccountId
      createdAt
      updatedAt
      resourceMessagesByConversationId(orderBy: CREATED_AT_ASC) {
        nodes {
          id
          conversationId
          senderAccountId
          body
          createdAt
          readAt
          resourceMessageImagesByMessageId(orderBy: SORT_ORDER_ASC) {
            nodes {
              id
              imageUrl
              sortOrder
            }
          }
        }
      }
    }
  }
`;

export const SEND_RESOURCE_MESSAGE_MUTATION = gql`
  mutation SendResourceMessage($input: SendResourceMessageInput!) {
    sendResourceMessage(input: $input) {
      uuid
    }
  }
`;

export const MARK_RESOURCE_MESSAGES_READ_MUTATION = gql`
  mutation MarkResourceMessagesRead($input: MarkResourceMessagesReadInput!) {
    markResourceMessagesRead(input: $input) {
      integer
    }
  }
`;

export const UPSERT_CHAT_TYPING_PRESENCE_MUTATION = gql`
  mutation UpsertChatTypingPresence($input: UpsertChatTypingPresenceInput!) {
    upsertChatTypingPresence(input: $input) {
      clientMutationId
    }
  }
`;
