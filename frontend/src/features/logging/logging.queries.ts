import { gql } from "@apollo/client";

export const WRITE_OPERATIONAL_LOG_MUTATION = gql`
  mutation WriteOperationalLog(
    $level: String!
    $component: String!
    $message: String!
    $context: String
    $accountId: UUID
    $metadata: JSON
  ) {
    writeOperationalLog(
      input: {
        pLevel: $level
        pComponent: $component
        pMessage: $message
        pContext: $context
        pAccountId: $accountId
        pMetadata: $metadata
      }
    ) {
      uuid
    }
  }
`;
