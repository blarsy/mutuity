import { gql } from "@apollo/client";

export const CLAIM_NEED_MUTATION = gql`
  mutation ClaimNeed($input: ClaimNeedInput!) {
    claimNeed(input: $input) {
      needClaim {
        id
        needId
        claimerAccountId
        message
        status
        createdAt
        updatedAt
        settledAt
        claimConversationByNeedClaimId {
          id
        }
      }
    }
  }
`;

export const VIEWER_CLAIM_OVERVIEW_QUERY = gql`
  query ViewerClaimOverview {
    allNeedClaims(first: 100) {
      nodes {
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
          createdAt
        }
      }
    }
    allNeedClaimNotifications(first: 30) {
      nodes {
        id
        needClaimId
        eventType
        payload
        createdAt
        readAt
      }
    }
  }
`;
