import { gql } from "@apollo/client";

export const TOKEN_BALANCE_QUERY = gql`
  query TokenBalance {
    currentTokenBalance
  }
`;

export const CONTRIBUTION_OVERVIEW_QUERY = gql`
  query ContributionOverview($first: Int = 50) {
    currentTokenBalance
    allTokenMovements(first: $first) {
      nodes {
        id
        eventType
        amountDelta
        referenceType
        referenceId
        payload
        createdAt
      }
    }
  }
`;

export const GIFT_TOKENS_MUTATION = gql`
  mutation GiftTokens($input: GiftTokensInput!) {
    giftTokens(input: $input) {
      tokenMovement {
        id
        eventType
        amountDelta
        referenceType
        referenceId
        createdAt
      }
    }
  }
`;
