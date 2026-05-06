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
        }
    }
  }
`;

// Viewer's sent claims (where viewer is the claimer)
export const VIEWER_SENT_CLAIMS_QUERY = gql`
  query ViewerSentClaims($viewerId: UUID!) {
    currentTokenBalance
    allNeedClaims(first: 100, condition: { claimerAccountId: $viewerId }) {
      nodes {
        id
        needId
        claimerAccountId
        message
        status
        createdAt
        updatedAt
        settledAt
        settledByAccountId
        needByNeedId {
          id
          title
          creatorAccountId
          proposedTopesAmount
        }
        accountByClaimerAccountId {
          id
          displayName
          externalSubject
        }
        claimConversationsByNeedClaimId(first: 1) {
          nodes {
            id
          }
        }
        needClaimSettlementEventByNeedClaimId {
          id
          topesAmount
          createdAt
          settledByAccountId
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

// Viewer's received claims (where viewer is the need creator)
// Note: We query all claims and filter by creator client-side since PostGraphile doesn't support nested relationship filters
export const VIEWER_RECEIVED_CLAIMS_QUERY = gql`
  query ViewerReceivedClaims($viewerId: UUID!) {
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
        settledByAccountId
        needByNeedId {
          id
          title
          creatorAccountId
          proposedTopesAmount
        }
        accountByClaimerAccountId {
          id
          displayName
          externalSubject
        }
        claimConversationsByNeedClaimId(first: 1) {
          nodes {
            id
          }
        }
        needClaimSettlementEventByNeedClaimId {
          id
          topesAmount
          createdAt
          settledByAccountId
        }
      }
    }
  }
`;

// Combined query for backward compatibility (but uses both sent and received separately)
export const VIEWER_CLAIM_OVERVIEW_QUERY = gql`
  query ViewerClaimOverview($viewerId: UUID!) {
    currentTokenBalance
    sentNeedClaims: allNeedClaims(first: 100, condition: { claimerAccountId: $viewerId }) {
      nodes {
        id
        needId
        claimerAccountId
        message
        status
        createdAt
        updatedAt
        settledAt
        settledByAccountId
        needByNeedId {
          id
          title
          creatorAccountId
          proposedTopesAmount
        }
        accountByClaimerAccountId {
          id
          displayName
          externalSubject
        }
        claimConversationsByNeedClaimId(first: 1) {
          nodes {
            id
          }
        }
        needClaimSettlementEventByNeedClaimId {
          id
          topesAmount
          createdAt
          settledByAccountId
        }
      }
    }
    receivedNeedClaims: allNeedClaims(first: 100) {
      nodes {
        id
        needId
        claimerAccountId
        message
        status
        createdAt
        updatedAt
        settledAt
        settledByAccountId
        needByNeedId {
          id
          title
          creatorAccountId
          proposedTopesAmount
        }
        accountByClaimerAccountId {
          id
          displayName
          externalSubject
        }
        claimConversationsByNeedClaimId(first: 1) {
          nodes {
            id
          }
        }
        needClaimSettlementEventByNeedClaimId {
          id
          topesAmount
          createdAt
          settledByAccountId
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

export const NEED_CLAIM_MANAGEMENT_QUERY = gql`
  query NeedClaimManagement($claimId: UUID!) {
    needClaimById(id: $claimId) {
      id
      needId
      claimerAccountId
      message
      status
      createdAt
      updatedAt
      settledAt
      settledByAccountId
      needByNeedId {
        id
        title
        creatorAccountId
        proposedTopesAmount
      }
      accountByClaimerAccountId {
        id
        displayName
        externalSubject
      }
      needClaimSettlementEventByNeedClaimId {
        id
        needClaimId
        needId
        settledByAccountId
        claimerAccountId
        topesAmount
        createdAt
      }
    }
  }
`;

export const SETTLE_NEED_CLAIM_MUTATION = gql`
  mutation SettleNeedClaim($input: SettleNeedClaimInput!) {
    settleNeedClaim(input: $input) {
      needClaim {
        id
        status
        settledAt
        settledByAccountId
        needClaimSettlementEventByNeedClaimId {
          id
          topesAmount
          createdAt
          settledByAccountId
        }
      }
    }
  }
`;

export const CANCEL_NEED_CLAIM_MUTATION = gql`
  mutation CancelNeedClaim($input: CancelNeedClaimInput!) {
    cancelNeedClaim(input: $input) {
      needClaim {
        id
        status
        updatedAt
      }
    }
  }
`;

export const DECLINE_NEED_CLAIM_MUTATION = gql`
  mutation DeclineNeedClaim($input: DeclineNeedClaimInput!) {
    declineNeedClaim(input: $input) {
      needClaim {
        id
        status
        updatedAt
      }
    }
  }
`;
