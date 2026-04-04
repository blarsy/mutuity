import { gql } from "@apollo/client";

export const CLAIM_CONVERSATION_QUERY = gql`
  query ClaimConversation($claimId: UUID!) {
    needClaimById(id: $claimId) {
      id
      needId
      claimerAccountId
      message
      status
      createdAt
      updatedAt
      settledAt
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
      claimConversationByNeedClaimId {
        id
        needClaimId
        needId
        creatorAccountId
        claimerAccountId
        createdAt
        claimMessagesByConversationId {
          nodes {
            id
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
