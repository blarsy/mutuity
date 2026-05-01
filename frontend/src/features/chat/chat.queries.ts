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
  query ResourceConversation($conversationId: UUID!) {
    resourceConversationById(id: $conversationId) {
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
      resourceMessage {
        id
        conversationId
        senderAccountId
        body
        createdAt
      }
    }
  }
`;

/**
 * Open-contact variant: start a resource conversation without a prior bid.
 * Used from the resource detail page.
 */
export const SEND_RESOURCE_MESSAGE_DIRECT_MUTATION = gql`
  mutation SendResourceMessageDirect($input: SendResourceMessageDirectInput!) {
    sendResourceMessageDirect(input: $input) {
      resourceMessage {
        id
        conversationId
        senderAccountId
        body
        createdAt
      }
    }
  }
`;

/**
 * Open-contact: start a need conversation without a prior claim.
 * Used from the need detail page.
 */
export const SEND_NEED_MESSAGE_MUTATION = gql`
  mutation SendNeedMessage($input: SendNeedMessageInput!) {
    sendNeedMessage(input: $input) {
      claimMessage {
        id
        conversationId
        senderAccountId
        body
        createdAt
      }
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
