import { gql } from "@apollo/client";

export const GET_GRANT_FOR_CLAIM_QUERY = gql`
  query GetGrantForClaim($grantId: UUID!) {
    getGrantForClaim(pGrantId: $grantId, first: 1) {
      nodes {
        id
        title
        description
        awardedTokenAmount
        maxSuccessfulClaimCount
        expiresAt
      }
    }
  }
`;

export const CLAIM_GRANT_MUTATION = gql`
  mutation ClaimGrant($grantId: UUID!) {
    claimGrant(input: { pGrantId: $grantId }) {
      grantClaimResult {
        outcomeCode
        claimedAmount
        grantClaimId
      }
    }
  }
`;
