import { gql } from "@apollo/client";

export const TOKEN_BALANCE_QUERY = gql`
  query TokenBalance {
    currentTokenBalance
  }
`;

export const CONTRIBUTION_OVERVIEW_QUERY = gql`
  query ContributionOverview($viewerId: UUID!, $first: Int = 10, $after: Cursor) {
    currentTokenBalance
    allTokenMovements(first: $first, after: $after, condition: { accountId: $viewerId }) {
      edges {
        cursor
        node {
          id
          eventType
          amountDelta
          referenceType
          referenceId
          payload
          createdAt
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
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
