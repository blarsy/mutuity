import { gql } from "@apollo/client";

export const AUTH_SESSION_QUERY = gql`
  query AuthSession {
    authSession {
      authenticated
      role
      expiresAt
      account {
        id
        displayName
        externalSubject
        avatarUrl
        emailVerified
        preferredLanguage
      }
    }
  }
`;

export const AUTH_LOGIN_MUTATION = gql`
  mutation AuthLogin($identifier: String!, $password: String!) {
    authLogin(input: { identifier: $identifier, password: $password }) {
      authSession {
        authenticated
        role
        expiresAt
        account {
          id
          displayName
          externalSubject
          avatarUrl
          emailVerified
          preferredLanguage
        }
      }
    }
  }
`;

export const AUTH_LOGOUT_MUTATION = gql`
  mutation AuthLogout {
    authLogout(input: {}) {
      authSession {
        authenticated
        role
        expiresAt
        account {
          id
          displayName
          externalSubject
          avatarUrl
          emailVerified
          preferredLanguage
        }
      }
    }
  }
`;

export const AUTH_CHANGE_PASSWORD_MUTATION = gql`
  mutation AuthChangePassword($currentPassword: String!, $newPassword: String!) {
    authChangePassword(input: { currentPassword: $currentPassword, newPassword: $newPassword }) {
      authSession {
        authenticated
        role
        expiresAt
        account {
          id
          displayName
          externalSubject
          avatarUrl
          emailVerified
        }
      }
    }
  }
`;

export const REGISTER_LOCAL_ACCOUNT_WITH_PASSWORD_MUTATION = gql`
  mutation RegisterLocalAccountWithPassword(
    $identifier: String!
    $displayName: String!
    $password: String!
    $verificationTtlMs: BigInt
    $preferredLanguage: String
  ) {
    registerLocalAccountWithPassword(
      input: {
        identifier: $identifier
        displayName: $displayName
        password: $password
        verificationTtlMs: $verificationTtlMs
        preferredLanguage: $preferredLanguage
      }
    ) {
      boolean
    }
  }
`;

export const REQUEST_EMAIL_VERIFICATION_MUTATION = gql`
  mutation RequestEmailVerification(
    $identifier: String!
    $verificationTtlMs: BigInt
    $throttleMs: BigInt
  ) {
    requestEmailVerification(
      input: {
        identifier: $identifier
        verificationTtlMs: $verificationTtlMs
        throttleMs: $throttleMs
      }
    ) {
      boolean
    }
  }
`;

export const CONFIRM_EMAIL_VERIFICATION_MUTATION = gql`
  mutation ConfirmEmailVerification($token: String!) {
    confirmEmailVerification(input: { token: $token }) {
      boolean
    }
  }
`;

export const REQUEST_PASSWORD_RESET_MUTATION = gql`
  mutation RequestPasswordReset($identifier: String!, $resetTtlMs: BigInt, $throttleMs: BigInt) {
    requestPasswordReset(
      input: {
        identifier: $identifier
        resetTtlMs: $resetTtlMs
        throttleMs: $throttleMs
      }
    ) {
      boolean
    }
  }
`;

export const CONFIRM_PASSWORD_RESET_WITH_PASSWORD_MUTATION = gql`
  mutation ConfirmPasswordResetWithPassword($token: String!, $nextPassword: String!) {
    confirmPasswordResetWithPassword(input: { token: $token, nextPassword: $nextPassword }) {
      boolean
    }
  }
`;
