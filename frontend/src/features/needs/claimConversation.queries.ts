import { gql } from "@apollo/client";

/**
 * Load claim detail. Use CLAIM_CONVERSATION_BY_PARTIES_QUERY in a second
 * hook to load the conversation once needId/creatorAccountId/claimerAccountId
 * are known from this result.
 */
export const NEED_CLAIM_DETAIL_QUERY = gql`
  query NeedClaimDetail($claimId: UUID!) {
    needClaimById(id: $claimId) {
      id
      needId
      claimerAccountId
      message
      status
      createdAt
      updatedAt
      settledAt
      needClaimSettlementEventByNeedClaimId {
        id
        topesAmount
        createdAt
        settledByAccountId
      }
      needByNeedId {
        id
        title
        creatorAccountId
      }
      accountByClaimerAccountId {
        id
        displayName
        externalSubject
      }
    }
  }
`;

/**
 * Look up the ClaimConversation by its three-party unique key.
 * Run this after NEED_CLAIM_DETAIL_QUERY provides needId, creatorAccountId,
 * and claimerAccountId.
 */
export const CLAIM_CONVERSATION_BY_PARTIES_QUERY = gql`
  query ClaimConversationByParties($needId: UUID!, $creatorAccountId: UUID!, $claimerAccountId: UUID!) {
    claimConversationByNeedIdAndCreatorAccountIdAndClaimerAccountId(
      needId: $needId
      creatorAccountId: $creatorAccountId
      claimerAccountId: $claimerAccountId
    ) {
      id
      claimMessagesByConversationId(orderBy: PRIMARY_KEY_ASC) {
        nodes {
          id
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
  mutation SendClaimMessage($input: SendClaimMessageInput!) {
    sendClaimMessage(input: $input) {
      claimMessage {
        id
        conversationId
        senderAccountId
        body
        createdAt
        readAt
        claimMessageImagesByMessageId {
          nodes {
            id
            imageUrl
            sortOrder
          }
        }
      }
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
