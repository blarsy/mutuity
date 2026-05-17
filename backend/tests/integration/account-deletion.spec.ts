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
  const client = new Client({ connectionString: TEST_DATABASE_URL });
  await client.connect();

  try {
    return await callback(client);
  } finally {
    await client.end();
  }
}

describe("account deletion anonymization", () => {
  it("anonymizes account fields and revokes active sessions", async () => {
    const account = await seedDemoAccount({
      identifier: `account-delete-${Date.now()}@example.com`,
      displayName: "Delete Me"
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

    expect(loginResult.response.status).toBe(200);
    expect(loginResult.payload.errors).toBeUndefined();
    expect(loginResult.payload.data?.authLogin.authSession.authenticated).toBe(true);

    const sessionCookie = getSessionCookie(loginResult.response);

    const deleteResult = await graphQLRequest<{
      deleteMyAccount: {
        boolean: boolean;
      };
    }>(
      `mutation DeleteMyAccount {
        deleteMyAccount(input: {}) {
          boolean
        }
      }`,
      undefined,
      sessionCookie
    );

    expect(deleteResult.response.status).toBe(200);
    expect(deleteResult.payload.errors).toBeUndefined();
    expect(deleteResult.payload.data?.deleteMyAccount.boolean).toBe(true);

    const sessionAfterDelete = await graphQLRequest<{
      authSession: {
        authenticated: boolean;
        role: string;
      };
    }>(
      `query AuthSessionAfterDelete {
        authSession {
          authenticated
          role
        }
      }`,
      undefined,
      sessionCookie
    );

    expect(sessionAfterDelete.response.status).toBe(200);
    expect(sessionAfterDelete.payload.errors).toBeUndefined();
    expect(sessionAfterDelete.payload.data?.authSession).toMatchObject({
      authenticated: false,
      role: "anonymous"
    });

    await withDbClient(async client => {
      const accountRow = await client.query<{
        external_subject: string;
        display_name: string | null;
        bio: string | null;
        location: string | null;
        avatar_url: string | null;
        profile_links: unknown;
      }>(
        `
          select external_subject, display_name, bio, location, avatar_url, profile_links
          from app_public.account
          where id = $1
        `,
        [account.accountId]
      );

      const credentialRow = await client.query<{
        login_identifier: string;
        is_active: boolean;
        email_verified_at: string | null;
      }>(
        `
          select login_identifier, is_active, email_verified_at
          from app_private.account_credential
          where account_id = $1
        `,
        [account.accountId]
      );

      const activeSessionsCount = await client.query<{ count: string }>(
        `
          select count(*)::text as count
          from app_private.account_session
          where account_id = $1
            and revoked_at is null
        `,
        [account.accountId]
      );

      expect(accountRow.rows[0]?.display_name).toBe("Deleted account");
      expect(accountRow.rows[0]?.external_subject.startsWith("deleted-")).toBe(true);
      expect(accountRow.rows[0]?.bio).toBeNull();
      expect(accountRow.rows[0]?.location).toBeNull();
      expect(accountRow.rows[0]?.avatar_url).toBeNull();
      expect(accountRow.rows[0]?.profile_links).toEqual([]);

      expect(credentialRow.rows[0]?.is_active).toBe(false);
      expect(credentialRow.rows[0]?.email_verified_at).toBeNull();
      expect(credentialRow.rows[0]?.login_identifier).toContain("@mutuity.invalid");

      expect(Number(activeSessionsCount.rows[0]?.count ?? "1")).toBe(0);
    });
  });
});
