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

export const COUNT_UNREAD_CHAT_CONVERSATIONS_QUERY = gql`
  query CountUnreadChatConversations {
    countUnreadChatConversations
  }
`;

/**
 * Load the full thread for a resource-bid-based conversation.
 * Messages are ordered by createdAt ascending so the oldest message
 * appears at the top of the UI thread.
 */
export const RESOURCE_CONVERSATION_QUERY = gql`
  query ChatResourceConversation($conversationId: UUID!) {
    resourceConversationById(id: $conversationId) {
      id
      resourceBidId
      resourceId
      ownerAccountId
      bidderAccountId
      createdAt
      updatedAt
      resourceByResourceId {
        id
        title
        imageUrls
      }
      accountByOwnerAccountId {
        id
        displayName
        externalSubject
        avatarUrl
      }
      accountByBidderAccountId {
        id
        displayName
        externalSubject
        avatarUrl
      }
      resourceMessagesByConversationId(orderBy: PRIMARY_KEY_ASC) {
        nodes {
          id
          conversationId
          senderAccountId
          body
          createdAt
          readAt
          resourceMessageImagesByMessageId(orderBy: PRIMARY_KEY_ASC) {
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

export const RESOURCE_CONVERSATION_LOOKUP_QUERY = gql`
  query ResourceConversationLookup($resourceId: UUID!, $ownerAccountId: UUID!, $bidderAccountId: UUID!) {
    resourceConversationByResourceIdAndOwnerAccountIdAndBidderAccountId(
      resourceId: $resourceId
      ownerAccountId: $ownerAccountId
      bidderAccountId: $bidderAccountId
    ) {
      id
    }
  }
`;

export const CLAIM_CONVERSATION_LOOKUP_QUERY = gql`
  query ClaimConversationLookup($needId: UUID!, $creatorAccountId: UUID!, $claimerAccountId: UUID!) {
    claimConversationByNeedIdAndCreatorAccountIdAndClaimerAccountId(
      needId: $needId
      creatorAccountId: $creatorAccountId
      claimerAccountId: $claimerAccountId
    ) {
      id
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

/**
 * Load the full thread for a claim-based (need) conversation.
 * Messages are ordered by createdAt ascending.
 */
export const CLAIM_CONVERSATION_QUERY = gql`
  query ChatClaimConversation($conversationId: UUID!) {
    claimConversationById(id: $conversationId) {
      id
      needClaimId
      needId
      creatorAccountId
      claimerAccountId
      createdAt
      needByNeedId {
        id
        title
        imageUrls
      }
      accountByCreatorAccountId {
        id
        displayName
        externalSubject
        avatarUrl
      }
      accountByClaimerAccountId {
        id
        displayName
        externalSubject
        avatarUrl
      }
      claimMessagesByConversationId(orderBy: PRIMARY_KEY_ASC) {
        nodes {
          id
          conversationId
          senderAccountId
          body
          createdAt
          readAt
          claimMessageImagesByMessageId(orderBy: PRIMARY_KEY_ASC) {
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

export const SEND_CLAIM_MESSAGE_MUTATION = gql`
  mutation ChatSendClaimMessage($input: SendClaimMessageInput!) {
    sendClaimMessage(input: $input) {
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

export const MARK_CLAIM_MESSAGES_READ_MUTATION = gql`
  mutation MarkClaimMessagesRead($input: MarkClaimMessagesReadInput!) {
    markClaimMessagesRead(input: $input) {
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
