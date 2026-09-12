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

export const DELETE_MY_ACCOUNT_MUTATION = gql`
  mutation DeleteMyAccount {
    deleteMyAccount(input: {}) {
      boolean
    }
  }
`;

export const CURRENT_ACCOUNT_EMAIL_QUERY = gql`
  query CurrentAccountEmail {
    currentAccountEmail
  }
`;

export const REQUEST_ACCOUNT_EMAIL_CHANGE_MUTATION = gql`
  mutation RequestAccountEmailChange($newIdentifier: String!) {
    requestAccountEmailChange(input: { newIdentifier: $newIdentifier }) {
      boolean
    }
  }
`;
