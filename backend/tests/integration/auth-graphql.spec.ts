import { createHash } from "node:crypto";

import { Client } from "pg";

import {
  TEST_BACKEND_URL,
  TEST_DATABASE_URL,
  getSessionCookie,
  seedDemoAccount
} from "./auth-test-helpers";

jest.setTimeout(30000);

type GraphQLResponse<TData> = {
  data?: TData;
  errors?: Array<{
    message: string;
    extensions?: {
      code?: string;
    };
  }>;
};

async function graphQLRequest<TData>(
  query: string,
  variables?: Record<string, unknown>,
  cookie?: string
) {
  const response = await fetch(`${TEST_BACKEND_URL}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {})
    },
    body: JSON.stringify({
      query,
      variables: variables ?? {}
    })
  });

  const payload = (await response.json()) as GraphQLResponse<TData>;
  return { response, payload };
}

async function withDbClient<T>(callback: (client: Client) => Promise<T>) {
  const client = new Client({
    connectionString: TEST_DATABASE_URL
  });

  await client.connect();

  try {
    return await callback(client);
  } finally {
    await client.end();
  }
}

async function readLatestOutboxToken(identifier: string, mailKind: string) {
  return withDbClient(async client => {
    const result = await client.query<{ auth_token: string | null }>(
      `
        select auth_token
        from app_private.mail_outbox
        where recipient_email = lower($1)
          and mail_kind = $2
        order by created_at desc
        limit 1
      `,
      [identifier, mailKind]
    );

    return result.rows[0]?.auth_token ?? null;
  });
}

async function countOutboxRows(identifier: string, mailKind: string) {
  return withDbClient(async client => {
    const result = await client.query<{ count: string }>(
      `
        select count(*)::text as count
        from app_private.mail_outbox
        where recipient_email = lower($1)
          and mail_kind = $2
      `,
      [identifier, mailKind]
    );

    return Number(result.rows[0]?.count ?? "0");
  });
}

async function expireAuthToken(rawToken: string, tokenKind: string) {
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  await withDbClient(async client => {
    await client.query(
      `
        update app_private.account_auth_token
        set expires_at = now() - interval '1 second'
        where token_hash = $1
          and token_kind = $2
      `,
      [tokenHash, tokenKind]
    );
  });
}

describe("auth graphql operations", () => {
  it("supports authSession, authLogin, and authLogout with cookie-backed session state", async () => {
    const account = await seedDemoAccount({
      identifier: `graphql-auth-${Date.now()}@example.com`
    });

    const sessionBeforeLogin = await graphQLRequest<{
      authSession: {
        authenticated: boolean;
        role: string;
        account: null;
      };
    }>(`query { authSession { authenticated role account { id } } }`);

    expect(sessionBeforeLogin.response.status).toBe(200);
    expect(sessionBeforeLogin.payload.errors).toBeUndefined();
    expect(sessionBeforeLogin.payload.data?.authSession).toMatchObject({
      authenticated: false,
      role: "anonymous",
      account: null
    });

    const loginResult = await graphQLRequest<{
      authLogin: {
        authSession: {
          authenticated: boolean;
          role: string;
          account: {
            id: string;
            externalSubject: string;
            displayName: string;
          };
        };
      };
    }>(
      `mutation AuthLogin($identifier: String!, $password: String!) {
        authLogin(input: { identifier: $identifier, password: $password }) {
          authSession {
            authenticated
            role
            account {
              id
              externalSubject
              displayName
            }
          }
        }
      }`,
      {
        identifier: account.identifier,
        password: account.password
      }
    );

    expect(loginResult.response.status).toBe(200);
    expect(loginResult.payload.errors).toBeUndefined();
    expect(loginResult.payload.data?.authLogin.authSession).toMatchObject({
      authenticated: true,
      role: account.role,
      account: {
        id: account.accountId,
        externalSubject: account.identifier,
        displayName: account.displayName
      }
    });

    const sessionCookie = getSessionCookie(loginResult.response);

    const sessionAfterLogin = await graphQLRequest<{
      authSession: {
        authenticated: boolean;
        role: string;
        account: {
          id: string;
          externalSubject: string;
        };
      };
    }>(
      `query {
        authSession {
          authenticated
          role
          account {
            id
            externalSubject
          }
        }
      }`,
      undefined,
      sessionCookie
    );

    expect(sessionAfterLogin.payload.errors).toBeUndefined();
    expect(sessionAfterLogin.payload.data?.authSession).toMatchObject({
      authenticated: true,
      role: account.role,
      account: {
        id: account.accountId,
        externalSubject: account.identifier
      }
    });

    const logoutResult = await graphQLRequest<{
      authLogout: {
        authSession: {
          authenticated: boolean;
          role: string;
          account: null;
        };
      };
    }>(
      `mutation { authLogout(input: {}) { authSession { authenticated role account { id } } } }`,
      undefined,
      sessionCookie
    );

    expect(logoutResult.response.status).toBe(200);
    expect(logoutResult.payload.errors).toBeUndefined();
    expect(logoutResult.payload.data?.authLogout.authSession).toMatchObject({
      authenticated: false,
      role: "anonymous",
      account: null
    });
  });

  it("supports authenticated authChangePassword and invalidates old credentials", async () => {
    const account = await seedDemoAccount({
      identifier: `graphql-change-${Date.now()}@example.com`
    });

    const loginResult = await graphQLRequest<{
      authLogin: {
        authSession: {
          authenticated: boolean;
        };
      };
    }>(
      `mutation AuthLogin($identifier: String!, $password: String!) {
        authLogin(input: { identifier: $identifier, password: $password }) {
          authSession {
            authenticated
          }
        }
      }`,
      {
        identifier: account.identifier,
        password: account.password
      }
    );

    expect(loginResult.payload.errors).toBeUndefined();
    expect(loginResult.payload.data?.authLogin.authSession.authenticated).toBe(true);
    const sessionCookie = getSessionCookie(loginResult.response);

    const wrongCurrentPassword = await graphQLRequest(
      `mutation AuthChangePassword($currentPassword: String!, $newPassword: String!) {
        authChangePassword(
          input: { currentPassword: $currentPassword, newPassword: $newPassword }
        ) {
          authSession {
            authenticated
          }
        }
      }`,
      {
        currentPassword: "wrong-current-password",
        newPassword: "graphql-next-password123"
      },
      sessionCookie
    );

    expect(wrongCurrentPassword.response.status).toBe(200);
    expect(wrongCurrentPassword.payload.errors?.[0]?.message).toBe("Something went wrong. Please try again.");

    const nextPassword = "graphql-next-password123";
    const changedPassword = await graphQLRequest<{
      authChangePassword: {
        authSession: {
          authenticated: boolean;
          role: string;
          account: {
            externalSubject: string;
          };
        };
      };
    }>(
      `mutation AuthChangePassword($currentPassword: String!, $newPassword: String!) {
        authChangePassword(
          input: { currentPassword: $currentPassword, newPassword: $newPassword }
        ) {
          authSession {
            authenticated
            role
            account {
              externalSubject
            }
          }
        }
      }`,
      {
        currentPassword: account.password,
        newPassword: nextPassword
      },
      sessionCookie
    );

    expect(changedPassword.response.status).toBe(200);
    expect(changedPassword.payload.errors).toBeUndefined();
    expect(changedPassword.payload.data?.authChangePassword.authSession).toMatchObject({
      authenticated: true,
      role: account.role,
      account: {
        externalSubject: account.identifier
      }
    });

    const oldPasswordLogin = await graphQLRequest(
      `mutation AuthLogin($identifier: String!, $password: String!) {
        authLogin(input: { identifier: $identifier, password: $password }) {
          authSession {
            authenticated
          }
        }
      }`,
      {
        identifier: account.identifier,
        password: account.password
      }
    );

    expect(oldPasswordLogin.payload.errors?.[0]?.message).toBe("Something went wrong. Please try again.");

    const nextPasswordLogin = await graphQLRequest<{
      authLogin: {
        authSession: {
          authenticated: boolean;
        };
      };
    }>(
      `mutation AuthLogin($identifier: String!, $password: String!) {
        authLogin(input: { identifier: $identifier, password: $password }) {
          authSession {
            authenticated
          }
        }
      }`,
      {
        identifier: account.identifier,
        password: nextPassword
      }
    );

    expect(nextPasswordLogin.payload.errors).toBeUndefined();
    expect(nextPasswordLogin.payload.data?.authLogin.authSession.authenticated).toBe(true);
  });

  it("supports local registration, immediate login, and one-time verification token usage", async () => {
    const identifier = `graphql-local-${Date.now()}@example.com`;
    const password = "graphql-local-password123";

    const registerResult = await graphQLRequest<{
      registerLocalAccountWithPassword: {
        boolean: boolean;
      };
    }>(
      `mutation RegisterLocalAccountWithPassword($identifier: String!, $displayName: String!, $password: String!, $verificationTtlMs: BigInt) {
        registerLocalAccountWithPassword(
          input: {
            identifier: $identifier
            displayName: $displayName
            password: $password
            verificationTtlMs: $verificationTtlMs
          }
        ) {
          boolean
        }
      }`,
      {
        identifier,
        displayName: "GraphQL Local User",
        password,
        verificationTtlMs: 3600000
      }
    );

    expect(registerResult.response.status).toBe(200);
    expect(registerResult.payload.errors).toBeUndefined();
    expect(registerResult.payload.data?.registerLocalAccountWithPassword.boolean).toBe(true);

    const loginResult = await graphQLRequest<{
      authLogin: {
        authSession: {
          authenticated: boolean;
          account: {
            externalSubject: string;
            emailVerified: boolean;
          };
        };
      };
    }>(
      `mutation AuthLogin($identifier: String!, $password: String!) {
        authLogin(input: { identifier: $identifier, password: $password }) {
          authSession {
            authenticated
            account {
              externalSubject
              emailVerified
            }
          }
        }
      }`,
      {
        identifier,
        password
      }
    );

    expect(loginResult.payload.errors).toBeUndefined();
    expect(loginResult.payload.data?.authLogin.authSession).toMatchObject({
      authenticated: true,
      account: {
        externalSubject: identifier,
        emailVerified: false
      }
    });

    const sessionCookie = getSessionCookie(loginResult.response);

    const verificationToken = await readLatestOutboxToken(identifier, "auth_email_verification");

    expect(verificationToken).toBeTruthy();

    const confirmVerification = await graphQLRequest<{
      confirmEmailVerification: {
        boolean: boolean;
      };
    }>(
      `mutation ConfirmEmailVerification($token: String!) {
        confirmEmailVerification(input: { token: $token }) {
          boolean
        }
      }`,
      {
        token: verificationToken
      }
    );

    expect(confirmVerification.payload.errors).toBeUndefined();
    expect(confirmVerification.payload.data?.confirmEmailVerification.boolean).toBe(true);

    const replayVerification = await graphQLRequest(
      `mutation ConfirmEmailVerification($token: String!) {
        confirmEmailVerification(input: { token: $token }) {
          boolean
        }
      }`,
      {
        token: verificationToken
      }
    );

    expect(replayVerification.response.status).toBe(200);
    expect(replayVerification.payload.errors).toBeDefined();

    const verifiedSession = await graphQLRequest<{
      authSession: {
        authenticated: boolean;
        account: {
          emailVerified: boolean;
        };
      };
    }>(
      `query {
        authSession {
          authenticated
          account {
            emailVerified
          }
        }
      }`,
      undefined,
      sessionCookie
    );

    expect(verifiedSession.payload.errors).toBeUndefined();
    expect(verifiedSession.payload.data?.authSession).toMatchObject({
      authenticated: true,
      account: {
        emailVerified: true
      }
    });
  });

  it("throttles verification resend without leaking account state", async () => {
    const identifier = `graphql-resend-${Date.now()}@example.com`;

    const registerResult = await graphQLRequest<{
      registerLocalAccountWithPassword: {
        boolean: boolean;
      };
    }>(
      `mutation RegisterLocalAccountWithPassword($identifier: String!, $displayName: String!, $password: String!) {
        registerLocalAccountWithPassword(
          input: {
            identifier: $identifier
            displayName: $displayName
            password: $password
          }
        ) {
          boolean
        }
      }`,
      {
        identifier,
        displayName: "GraphQL Resend User",
        password: "graphql-resend-password123"
      }
    );

    expect(registerResult.payload.errors).toBeUndefined();

    const baseCount = await countOutboxRows(identifier, "auth_email_verification");

    const unthrottledResend = await graphQLRequest<{
      requestEmailVerification: {
        boolean: boolean;
      };
    }>(
      `mutation RequestEmailVerification($identifier: String!, $verificationTtlMs: BigInt, $throttleMs: BigInt) {
        requestEmailVerification(
          input: {
            identifier: $identifier
            verificationTtlMs: $verificationTtlMs
            throttleMs: $throttleMs
          }
        ) {
          boolean
        }
      }`,
      {
        identifier,
        verificationTtlMs: 3600000,
        throttleMs: 0
      }
    );

    expect(unthrottledResend.payload.errors).toBeUndefined();
    expect(unthrottledResend.payload.data?.requestEmailVerification.boolean).toBe(true);

    const afterUnthrottledCount = await countOutboxRows(identifier, "auth_email_verification");
    expect(afterUnthrottledCount).toBe(baseCount + 1);

    const throttledResend = await graphQLRequest<{
      requestEmailVerification: {
        boolean: boolean;
      };
    }>(
      `mutation RequestEmailVerification($identifier: String!, $verificationTtlMs: BigInt, $throttleMs: BigInt) {
        requestEmailVerification(
          input: {
            identifier: $identifier
            verificationTtlMs: $verificationTtlMs
            throttleMs: $throttleMs
          }
        ) {
          boolean
        }
      }`,
      {
        identifier,
        verificationTtlMs: 3600000,
        throttleMs: 600000
      }
    );

    expect(throttledResend.payload.errors).toBeUndefined();
    expect(throttledResend.payload.data?.requestEmailVerification.boolean).toBe(true);

    const afterThrottledCount = await countOutboxRows(identifier, "auth_email_verification");
    expect(afterThrottledCount).toBe(afterUnthrottledCount);
  });

  it("enforces password-reset token one-time use and rejects forced-expired tokens", async () => {
    const identifier = `graphql-reset-${Date.now()}@example.com`;
    const initialPassword = "graphql-reset-password123";
    const nextPassword = "graphql-reset-next-password123";

    const registerResult = await graphQLRequest<{
      registerLocalAccountWithPassword: {
        boolean: boolean;
      };
    }>(
      `mutation RegisterLocalAccountWithPassword($identifier: String!, $displayName: String!, $password: String!) {
        registerLocalAccountWithPassword(
          input: {
            identifier: $identifier
            displayName: $displayName
            password: $password
          }
        ) {
          boolean
        }
      }`,
      {
        identifier,
        displayName: "GraphQL Reset User",
        password: initialPassword
      }
    );

    expect(registerResult.payload.errors).toBeUndefined();

    const verificationToken = await readLatestOutboxToken(identifier, "auth_email_verification");
    expect(verificationToken).toBeTruthy();

    const confirmVerification = await graphQLRequest<{
      confirmEmailVerification: {
        boolean: boolean;
      };
    }>(
      `mutation ConfirmEmailVerification($token: String!) {
        confirmEmailVerification(input: { token: $token }) {
          boolean
        }
      }`,
      {
        token: verificationToken
      }
    );

    expect(confirmVerification.payload.errors).toBeUndefined();

    const requestReset = await graphQLRequest<{
      requestPasswordReset: {
        boolean: boolean;
      };
    }>(
      `mutation RequestPasswordReset($identifier: String!, $resetTtlMs: BigInt, $throttleMs: BigInt) {
        requestPasswordReset(
          input: {
            identifier: $identifier
            resetTtlMs: $resetTtlMs
            throttleMs: $throttleMs
          }
        ) {
          boolean
        }
      }`,
      {
        identifier,
        resetTtlMs: 3600000,
        throttleMs: 0
      }
    );

    expect(requestReset.payload.errors).toBeUndefined();
    expect(requestReset.payload.data?.requestPasswordReset.boolean).toBe(true);

    const resetToken = await readLatestOutboxToken(identifier, "auth_password_reset");
    expect(resetToken).toBeTruthy();

    const confirmReset = await graphQLRequest<{
      confirmPasswordResetWithPassword: {
        boolean: boolean;
      };
    }>(
      `mutation ConfirmPasswordResetWithPassword($token: String!, $nextPassword: String!) {
        confirmPasswordResetWithPassword(input: { token: $token, nextPassword: $nextPassword }) {
          boolean
        }
      }`,
      {
        token: resetToken,
        nextPassword
      }
    );

    expect(confirmReset.payload.errors).toBeUndefined();
    expect(confirmReset.payload.data?.confirmPasswordResetWithPassword.boolean).toBe(true);

    const replayReset = await graphQLRequest(
      `mutation ConfirmPasswordResetWithPassword($token: String!, $nextPassword: String!) {
        confirmPasswordResetWithPassword(input: { token: $token, nextPassword: $nextPassword }) {
          boolean
        }
      }`,
      {
        token: resetToken,
        nextPassword: "graphql-reset-third-password123"
      }
    );

    expect(replayReset.response.status).toBe(200);
    expect(replayReset.payload.errors).toBeDefined();

    const oldPasswordLogin = await graphQLRequest(
      `mutation AuthLogin($identifier: String!, $password: String!) {
        authLogin(input: { identifier: $identifier, password: $password }) {
          authSession {
            authenticated
          }
        }
      }`,
      {
        identifier,
        password: initialPassword
      }
    );

    expect(oldPasswordLogin.payload.errors).toBeDefined();

    const nextPasswordLogin = await graphQLRequest<{
      authLogin: {
        authSession: {
          authenticated: boolean;
        };
      };
    }>(
      `mutation AuthLogin($identifier: String!, $password: String!) {
        authLogin(input: { identifier: $identifier, password: $password }) {
          authSession {
            authenticated
          }
        }
      }`,
      {
        identifier,
        password: nextPassword
      }
    );

    expect(nextPasswordLogin.payload.errors).toBeUndefined();
    expect(nextPasswordLogin.payload.data?.authLogin.authSession.authenticated).toBe(true);

    const expiringResetRequest = await graphQLRequest<{
      requestPasswordReset: {
        boolean: boolean;
      };
    }>(
      `mutation RequestPasswordReset($identifier: String!, $resetTtlMs: BigInt, $throttleMs: BigInt) {
        requestPasswordReset(
          input: {
            identifier: $identifier
            resetTtlMs: $resetTtlMs
            throttleMs: $throttleMs
          }
        ) {
          boolean
        }
      }`,
      {
        identifier,
        resetTtlMs: 3600000,
        throttleMs: 0
      }
    );

    expect(expiringResetRequest.payload.errors).toBeUndefined();

    const forcedExpiredToken = await readLatestOutboxToken(identifier, "auth_password_reset");
    expect(forcedExpiredToken).toBeTruthy();

    await expireAuthToken(forcedExpiredToken as string, "password_reset");

    const expiredResetAttempt = await graphQLRequest(
      `mutation ConfirmPasswordResetWithPassword($token: String!, $nextPassword: String!) {
        confirmPasswordResetWithPassword(input: { token: $token, nextPassword: $nextPassword }) {
          boolean
        }
      }`,
      {
        token: forcedExpiredToken,
        nextPassword: "graphql-reset-expired-password123"
      }
    );

    expect(expiredResetAttempt.response.status).toBe(200);
    expect(expiredResetAttempt.payload.errors).toBeDefined();
  });

  it("enforces external-identity link safety and blocks duplicate local registration on verified provider email", async () => {
    const primaryAccount = await seedDemoAccount({
      identifier: `graphql-social-primary-${Date.now()}@example.com`
    });
    const secondaryAccount = await seedDemoAccount({
      identifier: `graphql-social-secondary-${Date.now()}@example.com`
    });
    const sharedProviderEmail = `graphql-social-shared-${Date.now()}@example.com`;
    const linkedProviderSubject = `google-sub-${Date.now()}`;

    const primaryLogin = await graphQLRequest<{
      authLogin: {
        authSession: {
          authenticated: boolean;
        };
      };
    }>(
      `mutation AuthLogin($identifier: String!, $password: String!) {
        authLogin(input: { identifier: $identifier, password: $password }) {
          authSession {
            authenticated
          }
        }
      }`,
      {
        identifier: primaryAccount.identifier,
        password: primaryAccount.password
      }
    );

    expect(primaryLogin.payload.errors).toBeUndefined();
    expect(primaryLogin.payload.data?.authLogin.authSession.authenticated).toBe(true);
    const primaryCookie = getSessionCookie(primaryLogin.response);

    const linkPrimaryIdentity = await graphQLRequest<{
      linkAccountExternalIdentity: {
        string: string;
      };
    }>(
      `mutation LinkAccountExternalIdentity(
        $provider: String!
        $providerSubject: String!
        $providerEmail: String!
        $providerEmailVerified: Boolean!
      ) {
        linkAccountExternalIdentity(
          input: {
            pProvider: $provider
            pProviderSubject: $providerSubject
            pProviderEmail: $providerEmail
            pProviderEmailVerified: $providerEmailVerified
          }
        ) {
          string
        }
      }`,
      {
        provider: "google",
        providerSubject: linkedProviderSubject,
        providerEmail: sharedProviderEmail,
        providerEmailVerified: true
      },
      primaryCookie
    );

    expect(linkPrimaryIdentity.response.status).toBe(200);
    expect(linkPrimaryIdentity.payload.errors).toBeUndefined();
    expect(linkPrimaryIdentity.payload.data?.linkAccountExternalIdentity.string).toBe("linked");

    const secondaryLogin = await graphQLRequest<{
      authLogin: {
        authSession: {
          authenticated: boolean;
        };
      };
    }>(
      `mutation AuthLogin($identifier: String!, $password: String!) {
        authLogin(input: { identifier: $identifier, password: $password }) {
          authSession {
            authenticated
          }
        }
      }`,
      {
        identifier: secondaryAccount.identifier,
        password: secondaryAccount.password
      }
    );

    expect(secondaryLogin.payload.errors).toBeUndefined();
    expect(secondaryLogin.payload.data?.authLogin.authSession.authenticated).toBe(true);
    const secondaryCookie = getSessionCookie(secondaryLogin.response);

    const duplicateSubjectLink = await graphQLRequest(
      `mutation LinkAccountExternalIdentity(
        $provider: String!
        $providerSubject: String!
        $providerEmail: String!
        $providerEmailVerified: Boolean!
      ) {
        linkAccountExternalIdentity(
          input: {
            pProvider: $provider
            pProviderSubject: $providerSubject
            pProviderEmail: $providerEmail
            pProviderEmailVerified: $providerEmailVerified
          }
        ) {
          string
        }
      }`,
      {
        provider: "google",
        providerSubject: linkedProviderSubject,
        providerEmail: sharedProviderEmail,
        providerEmailVerified: true
      },
      secondaryCookie
    );

    expect(duplicateSubjectLink.response.status).toBe(200);
    expect(duplicateSubjectLink.payload.errors).toBeDefined();

    const sameEmailDifferentSubjectLink = await graphQLRequest(
      `mutation LinkAccountExternalIdentity(
        $provider: String!
        $providerSubject: String!
        $providerEmail: String!
        $providerEmailVerified: Boolean!
      ) {
        linkAccountExternalIdentity(
          input: {
            pProvider: $provider
            pProviderSubject: $providerSubject
            pProviderEmail: $providerEmail
            pProviderEmailVerified: $providerEmailVerified
          }
        ) {
          string
        }
      }`,
      {
        provider: "google",
        providerSubject: `google-different-sub-${Date.now()}`,
        providerEmail: sharedProviderEmail,
        providerEmailVerified: true
      },
      secondaryCookie
    );

    expect(sameEmailDifferentSubjectLink.response.status).toBe(200);
    expect(sameEmailDifferentSubjectLink.payload.errors).toBeDefined();

    const duplicateLocalRegistration = await graphQLRequest(
      `mutation RegisterLocalAccountWithPassword($identifier: String!, $displayName: String!, $password: String!) {
        registerLocalAccountWithPassword(
          input: {
            identifier: $identifier
            displayName: $displayName
            password: $password
          }
        ) {
          boolean
        }
      }`,
      {
        identifier: sharedProviderEmail,
        displayName: "Duplicate Identity Blocked",
        password: "duplicate-password123"
      }
    );

    expect(duplicateLocalRegistration.response.status).toBe(200);
    expect(duplicateLocalRegistration.payload.errors).toBeDefined();
    expect(duplicateLocalRegistration.payload.errors?.[0]?.message).toBe(
      "Something went wrong. Please try again."
    );
  });
});