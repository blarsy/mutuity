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
