import { gql } from "@apollo/client";

export const ACCOUNT_PROFILE_QUERY = gql`
  query AccountProfile($accountId: UUID!) {
    accountById(id: $accountId) {
      id
      displayName
      bio
      location
      latitude
      longitude
      avatarUrl
      preferredLanguage
      profileLinks
    }
  }
`;

export const UPDATE_ACCOUNT_PROFILE_MUTATION = gql`
  mutation UpdateAccountProfile($accountId: UUID!, $patch: AccountPatch!) {
    updateAccountById(input: { id: $accountId, accountPatch: $patch }) {
      account {
        id
        displayName
        bio
        location
        latitude
        longitude
        avatarUrl
        preferredLanguage
        profileLinks
      }
    }
  }
`;
