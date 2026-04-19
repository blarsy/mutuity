import { TEST_BACKEND_URL, getSessionCookie, seedDemoAccount } from "../integration/auth-test-helpers";

jest.setTimeout(30000);

type GraphQLResponse<TData> = {
  data?: TData;
  errors?: Array<{
    message: string;
  }>;
};

describe("auth GraphQL contract", () => {
  it("exposes the expected authLogin and authSession response shape", async () => {
    const account = await seedDemoAccount();

    const sessionResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: `query { authSession { authenticated account { id } role expiresAt } }`
      })
    });

    const sessionPayload = (await sessionResponse.json()) as GraphQLResponse<{
      authSession: {
        authenticated: boolean;
        account: null;
        role: string;
        expiresAt: string | null;
      };
    }>;

    expect(sessionResponse.status).toBe(200);
    expect(sessionPayload.errors).toBeUndefined();
    expect(sessionPayload.data?.authSession).toEqual({
      authenticated: false,
      account: null,
      role: "anonymous",
      expiresAt: null
    });

    const loginResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: `
          mutation AuthLogin($identifier: String!, $password: String!) {
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
          }
        `,
        variables: {
          identifier: account.identifier,
          password: account.password
        }
      })
    });

    expect(loginResponse.status).toBe(200);
    const sessionCookie = getSessionCookie(loginResponse);
    expect(sessionCookie).toContain("mutuity_session=");

    const loginPayload = (await loginResponse.json()) as GraphQLResponse<{
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
    }>;

    expect(loginPayload.errors).toBeUndefined();
    expect(loginPayload.data?.authLogin.authSession).toMatchObject({
      authenticated: true,
      role: account.role,
      account: {
        id: account.accountId,
        externalSubject: account.identifier,
        displayName: account.displayName
      }
    });
  });
});
