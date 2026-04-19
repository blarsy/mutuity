import { TEST_BACKEND_URL, getSessionCookie, seedDemoAccount } from "./auth-test-helpers";

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
});