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

  it("prevents deleted credentials from authenticating again", async () => {
    const account = await seedDemoAccount({
      identifier: `account-delete-login-${Date.now()}@example.com`,
      displayName: "Delete Login"
    });

    const loginBeforeDelete = await graphQLRequest<{
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

    const sessionCookie = getSessionCookie(loginBeforeDelete.response);

    await graphQLRequest(
      `mutation DeleteMyAccount {
        deleteMyAccount(input: {}) {
          boolean
        }
      }`,
      undefined,
      sessionCookie
    );

    const loginAfterDelete = await graphQLRequest<{
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

    expect(loginAfterDelete.response.status).toBe(200);
    expect(loginAfterDelete.payload.data?.authLogin?.authSession?.authenticated ?? false).toBe(false);
  });

  it("stores an anonymized deleted account projection", async () => {
    const account = await seedDemoAccount({
      identifier: `account-delete-public-${Date.now()}@example.com`,
      displayName: "Public Delete"
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

    const sessionCookie = getSessionCookie(loginResult.response);

    await graphQLRequest(
      `mutation DeleteMyAccount {
        deleteMyAccount(input: {}) {
          boolean
        }
      }`,
      undefined,
      sessionCookie
    );

    await withDbClient(async client => {
      const result = await client.query<{
        id: string;
        display_name: string | null;
        external_subject: string;
        bio: string | null;
        location: string | null;
      }>(
        `
          select id, display_name, external_subject, bio, location
          from app_public.account
          where id = $1
        `,
        [account.accountId]
      );

      expect(result.rows[0]?.id).toBe(account.accountId);
      expect(result.rows[0]?.display_name).toBe("Deleted account");
      expect(result.rows[0]?.external_subject.startsWith("deleted-")).toBe(true);
      expect(result.rows[0]?.bio).toBeNull();
      expect(result.rows[0]?.location).toBeNull();
    });
  });

  it("keeps historical need and campaign links consultable after deletion", async () => {
    const account = await seedDemoAccount({
      identifier: `account-delete-history-${Date.now()}@example.com`,
      displayName: "History Owner"
    });

    const { needId, campaignId } = await withDbClient(async client => {
      const needInsert = await client.query<{ id: string }>(
        `
          insert into app_public.need (
            creator_account_id,
            title,
            description,
            location,
            latitude,
            longitude,
            intensity,
            proposed_topes_amount,
            object_required,
            competence_required,
            tooling_required,
            multiple_people_required,
            required_competence_text,
            required_tooling_text,
            required_people_count,
            is_active,
            expires_at
          )
          values (
            $1,
            $2,
            'Need owned by soon deleted account',
            'Tournai',
            50.6056,
            3.3878,
            'sharing',
            120,
            false,
            false,
            false,
            false,
            null,
            null,
            null,
            true,
            null
          )
          returning id
        `,
        [account.accountId, `Need continuity ${Date.now()}`]
      );

      const campaignInsert = await client.query<{ id: string }>(
        `
          insert into app_public.campaign (
            creator_account_id,
            title,
            description,
            theme,
            moderation_status,
            start_at,
            airdrop_at,
            end_at,
            airdrop_amount,
            rewards_multiplier
          )
          values (
            $1,
            $2,
            'Campaign owned by soon deleted account',
            '<p>community</p>',
            'approved',
            now() - interval '1 day',
            now() + interval '1 day',
            now() + interval '2 days',
            3200,
            5
          )
          returning id
        `,
        [account.accountId, `Campaign continuity ${Date.now()}`]
      );

      return {
        needId: needInsert.rows[0].id,
        campaignId: campaignInsert.rows[0].id
      };
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

    const sessionCookie = getSessionCookie(loginResult.response);

    await graphQLRequest(
      `mutation DeleteMyAccount {
        deleteMyAccount(input: {}) {
          boolean
        }
      }`,
      undefined,
      sessionCookie
    );

    await withDbClient(async client => {
      const needRow = await client.query<{ id: string; creator_account_id: string }>(
        `select id, creator_account_id from app_public.need where id = $1`,
        [needId]
      );
      const campaignRow = await client.query<{ id: string; creator_account_id: string }>(
        `select id, creator_account_id from app_public.campaign where id = $1`,
        [campaignId]
      );
      const accountRow = await client.query<{ display_name: string | null; external_subject: string }>(
        `select display_name, external_subject from app_public.account where id = $1`,
        [account.accountId]
      );

      expect(needRow.rows[0]?.id).toBe(needId);
      expect(needRow.rows[0]?.creator_account_id).toBe(account.accountId);

      expect(campaignRow.rows[0]?.id).toBe(campaignId);
      expect(campaignRow.rows[0]?.creator_account_id).toBe(account.accountId);

      expect(accountRow.rows[0]?.display_name).toBe("Deleted account");
      expect(accountRow.rows[0]?.external_subject.startsWith("deleted-")).toBe(true);
    });
  });

  it("emits deletion operational control events used by post-delete controls", async () => {
    const account = await seedDemoAccount({
      identifier: `account-delete-event-${Date.now()}@example.com`,
      displayName: "Deletion Event"
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

    const sessionCookie = getSessionCookie(loginResult.response);

    await graphQLRequest(
      `mutation DeleteMyAccount {
        deleteMyAccount(input: {}) {
          boolean
        }
      }`,
      undefined,
      sessionCookie
    );

    await withDbClient(async client => {
      const result = await client.query<{
        count: string;
      }>(
        `
          select count(*)::text as count
          from app_public.operational_log
          where account_id = $1
            and message = 'account_deletion_anonymized'
            and metadata ->> 'event' = 'account_deletion_anonymized'
        `,
        [account.accountId]
      );

      expect(Number(result.rows[0]?.count ?? "0")).toBeGreaterThan(0);
    });
  });

  it("keeps deletion control events within configured retention cleanup windows", async () => {
    const context = `account-delete-retention-${Date.now()}`;

    await withDbClient(async client => {
      await client.query(
        `
          insert into app_public.operational_log (
            level,
            component,
            message,
            metadata,
            created_at
          )
          values (
            'info',
            'web_api',
            'account_deletion_anonymized',
            jsonb_build_object('event', 'account_deletion_anonymized', 'context', $1::text),
            now() - interval '2 days'
          )
        `,
        [context]
      );

      await client.query(
        `
          insert into app_public.system_setting (key, value_text)
          values ('operational_log_retention_days', '1')
          on conflict (key) do update
          set value_text = excluded.value_text,
              updated_at = now()
        `
      );

      await client.query(`select app_public.cleanup_operational_logs(now())`);

      const remainingRows = await client.query<{ count: string }>(
        `
          select count(*)::text as count
          from app_public.operational_log
          where metadata ->> 'context' = $1
        `,
        [context]
      );

      expect(Number(remainingRows.rows[0]?.count ?? "1")).toBe(0);

      await client.query(
        `
          insert into app_public.system_setting (key, value_text)
          values ('operational_log_retention_days', '7')
          on conflict (key) do update
          set value_text = excluded.value_text,
              updated_at = now()
        `
      );
    });
  });
});
