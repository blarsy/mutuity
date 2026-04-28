import { Client } from "pg";

import {
  TEST_BACKEND_URL,
  TEST_DATABASE_URL,
  loginWithGraphqlSessionCookie,
  seedDemoAccount
} from "./auth-test-helpers";

jest.setTimeout(30000);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function withDbClient<T>(callback: (client: Client) => Promise<T>) {
  const client = new Client({ connectionString: TEST_DATABASE_URL });
  await client.connect();

  try {
    return await callback(client);
  } finally {
    await client.end();
  }
}

async function postGraphql(body: Record<string, unknown>, cookie?: string) {
  return fetch(`${TEST_BACKEND_URL}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {})
    },
    body: JSON.stringify(body)
  });
}

async function seedMailOutboxRow(
  accountId: string,
  status: string = "sent"
): Promise<string> {
  return withDbClient(async client => {
    const result = await client.query<{ id: string }>(
      `
        insert into app_private.mail_outbox (
          account_id, recipient_email, mail_kind, status,
          subject, text_body, html_body, sent_at
        )
        values ($1, 'test@example.com', 'auth_email_verification', $2,
                'Test Subject', 'Plain text body', '<p>HTML body</p>',
                case when $2 = 'sent' then now() else null end)
        returning id
      `,
      [accountId, status]
    );

    return result.rows[0].id;
  });
}

async function getMailOutboxStatus(mailId: string): Promise<string | null> {
  return withDbClient(async client => {
    const result = await client.query<{ status: string }>(
      "select status from app_private.mail_outbox where id = $1",
      [mailId]
    );

    return result.rows[0]?.status ?? null;
  });
}

async function seedCampaignForAccount(creatorAccountId: string, stamp: number): Promise<string> {
  return withDbClient(async client => {
    const result = await client.query<{ id: string }>(
      `
        insert into app_public.campaign (
          creator_account_id, title, theme, start_at, airdrop_at, end_at,
          airdrop_amount, rewards_multiplier
        )
        values ($1, $2, 'community', now() + interval '1 day', now() + interval '2 days',
                now() + interval '3 days', 3200, 1)
        returning id
      `,
      [creatorAccountId, `Admin test campaign ${stamp}`]
    );

    return result.rows[0].id;
  });
}

async function countAuditLogsForContext(context: string): Promise<number> {
  return withDbClient(async client => {
    const result = await client.query<{ count: string }>(
      "select count(*)::text as count from app_public.operational_log where context = $1",
      [context]
    );

    return parseInt(result.rows[0].count, 10);
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("admin support authorization", () => {
  it("denies non-admin access to adminListAccounts", async () => {
    const stamp = Date.now();
    const user = await seedDemoAccount({
      identifier: `regular-${stamp}@example.com`,
      role: "identified_account"
    });
    const cookie = await loginWithGraphqlSessionCookie(user.identifier, user.password);

    const response = await postGraphql(
      {
        query: `
          query {
            adminListAccounts(pLimit: 5) {
              totalCount
              nodes { id }
            }
          }
        `
      },
      cookie
    );

    const body = await response.json() as { errors?: { message: string }[] };
    expect(body.errors).toBeDefined();
    expect(body.errors![0].message).toMatch(/administrator/i);
  });

  it("denies non-admin access to adminGetMailContent", async () => {
    const stamp = Date.now();
    const user = await seedDemoAccount({
      identifier: `regular2-${stamp}@example.com`,
      role: "identified_account"
    });
    const cookie = await loginWithGraphqlSessionCookie(user.identifier, user.password);
    const fakeMailId = "00000000-0000-0000-0000-000000000001";

    const response = await postGraphql(
      {
        query: `
          query($pMailId: UUID!) {
            adminGetMailContent(pMailId: $pMailId)
          }
        `,
        variables: { pMailId: fakeMailId }
      },
      cookie
    );

    const body = await response.json() as { errors?: { message: string }[] };
    expect(body.errors).toBeDefined();
    expect(body.errors![0].message).toMatch(/administrator/i);
  });

  it("denies non-admin access to adminResendMail", async () => {
    const stamp = Date.now();
    const user = await seedDemoAccount({
      identifier: `regular3-${stamp}@example.com`,
      role: "identified_account"
    });
    const cookie = await loginWithGraphqlSessionCookie(user.identifier, user.password);
    const fakeMailId = "00000000-0000-0000-0000-000000000001";

    const response = await postGraphql(
      {
        query: `
          mutation($pMailId: UUID!) {
            adminResendMail(input: { pMailId: $pMailId }) {
              clientMutationId
            }
          }
        `,
        variables: { pMailId: fakeMailId }
      },
      cookie
    );

    const body = await response.json() as { errors?: { message: string }[] };
    expect(body.errors).toBeDefined();
    expect(body.errors![0].message).toMatch(/administrator/i);
  });

  it("denies unauthenticated access to adminListGrants", async () => {
    const response = await postGraphql({
      query: `
        query {
          adminListGrants(pLimit: 5) {
            totalCount
            nodes { id }
          }
        }
      `
    });

    const body = await response.json() as { errors?: { message: string }[] };
    expect(body.errors).toBeDefined();
  });
});

describe("admin mail actions", () => {
  it("adminGetMailContent returns stored HTML body for admin", async () => {
    const stamp = Date.now();
    const admin = await seedDemoAccount({
      identifier: `admin-mail-${stamp}@example.com`,
      role: "admin",
      displayName: "Admin Mail Tester"
    });
    const mailId = await seedMailOutboxRow(admin.accountId, "sent");
    const cookie = await loginWithGraphqlSessionCookie(admin.identifier, admin.password);

    const response = await postGraphql(
      {
        query: `
          query($pMailId: UUID!) {
            adminGetMailContent(pMailId: $pMailId)
          }
        `,
        variables: { pMailId: mailId }
      },
      cookie
    );

    const body = await response.json() as { data?: { adminGetMailContent: string | null } };
    expect(body.data?.adminGetMailContent).toBe("<p>HTML body</p>");
  });

  it("adminResendMail resets mail status to pending", async () => {
    const stamp = Date.now();
    const admin = await seedDemoAccount({
      identifier: `admin-resend-${stamp}@example.com`,
      role: "admin",
      displayName: "Admin Resend Tester"
    });
    const mailId = await seedMailOutboxRow(admin.accountId, "sent");
    const cookie = await loginWithGraphqlSessionCookie(admin.identifier, admin.password);

    const statusBefore = await getMailOutboxStatus(mailId);
    expect(statusBefore).toBe("sent");

    const response = await postGraphql(
      {
        query: `
          mutation($pMailId: UUID!) {
            adminResendMail(input: { pMailId: $pMailId }) {
              clientMutationId
            }
          }
        `,
        variables: { pMailId: mailId }
      },
      cookie
    );

    const body = await response.json() as { errors?: unknown[] };
    expect(body.errors).toBeUndefined();

    const statusAfter = await getMailOutboxStatus(mailId);
    expect(statusAfter).toBe("pending");
  });

  it("adminResendMail emits an audit log entry", async () => {
    const stamp = Date.now();
    const admin = await seedDemoAccount({
      identifier: `admin-resend-log-${stamp}@example.com`,
      role: "admin",
      displayName: "Admin Resend Log Tester"
    });
    const mailId = await seedMailOutboxRow(admin.accountId, "failed");
    const cookie = await loginWithGraphqlSessionCookie(admin.identifier, admin.password);

    const logsBefore = await countAuditLogsForContext("admin_resend_mail");

    await postGraphql(
      {
        query: `
          mutation($pMailId: UUID!) {
            adminResendMail(input: { pMailId: $pMailId }) {
              clientMutationId
            }
          }
        `,
        variables: { pMailId: mailId }
      },
      cookie
    );

    const logsAfter = await countAuditLogsForContext("admin_resend_mail");
    expect(logsAfter).toBe(logsBefore + 1);
  });
});

describe("admin search and filter", () => {
  it("adminListAccounts filters by name search term", async () => {
    const stamp = Date.now();
    const admin = await seedDemoAccount({
      identifier: `admin-search-${stamp}@example.com`,
      role: "admin",
      displayName: "Admin Search Tester"
    });
    await seedDemoAccount({
      identifier: `searchable-user-${stamp}@example.com`,
      displayName: `UniqueName${stamp}`
    });
    await seedDemoAccount({
      identifier: `other-user-${stamp}@example.com`,
      displayName: `OtherAccount${stamp}`
    });
    const cookie = await loginWithGraphqlSessionCookie(admin.identifier, admin.password);

    const response = await postGraphql(
      {
        query: `
          query($pSearch: String) {
            adminListAccounts(pSearch: $pSearch, pLimit: 25) {
              totalCount
              nodes {
                name
              }
            }
          }
        `,
        variables: { pSearch: `UniqueName${stamp}` }
      },
      cookie
    );

    const body = await response.json() as {
      data?: { adminListAccounts: { totalCount: number; nodes: { name: string }[] } };
    };
    const nodes = body.data?.adminListAccounts.nodes ?? [];
    expect(nodes.some(n => n.name === `UniqueName${stamp}`)).toBe(true);
    expect(nodes.every(n => n.name !== `OtherAccount${stamp}`)).toBe(true);
  });
});

describe("admin grant creation with audit log", () => {
  it("upsertGrant creates a grant and emits an audit log entry for admin", async () => {
    const stamp = Date.now();
    const admin = await seedDemoAccount({
      identifier: `admin-grant-${stamp}@example.com`,
      role: "admin",
      displayName: "Admin Grant Tester"
    });
    const cookie = await loginWithGraphqlSessionCookie(admin.identifier, admin.password);
    const logsBefore = await countAuditLogsForContext("upsert_grant");

    const response = await postGraphql(
      {
        query: `
          mutation($pTitle: String!, $pAwardedTokenAmount: Int!, $pMaxSuccessfulClaimCount: Int!, $pExpiresAt: Datetime!) {
            upsertGrant(input: {
              pTitle: $pTitle
              pAwardedTokenAmount: $pAwardedTokenAmount
              pMaxSuccessfulClaimCount: $pMaxSuccessfulClaimCount
              pExpiresAt: $pExpiresAt
            }) {
              grantDefinition {
                id
                title
              }
            }
          }
        `,
        variables: {
          pTitle: `Test grant ${stamp}`,
          pAwardedTokenAmount: 50,
          pMaxSuccessfulClaimCount: 3,
          pExpiresAt: "2032-12-31T23:59:59.000Z"
        }
      },
      cookie
    );

    const body = await response.json() as {
      data?: { upsertGrant: { grantDefinition: { id: string; title: string } | null } | null };
      errors?: unknown[];
    };
    expect(body.errors).toBeUndefined();
    expect(body.data?.upsertGrant?.grantDefinition?.title).toBe(`Test grant ${stamp}`);

    const logsAfter = await countAuditLogsForContext("upsert_grant");
    expect(logsAfter).toBe(logsBefore + 1);
  });

  it("upsertGrant requires grant expiration datetime", async () => {
    const stamp = Date.now();
    const admin = await seedDemoAccount({
      identifier: `admin-grant-exp-${stamp}@example.com`,
      role: "admin",
      displayName: "Admin Grant Expiration Tester"
    });
    const cookie = await loginWithGraphqlSessionCookie(admin.identifier, admin.password);

    const response = await postGraphql(
      {
        query: `
          mutation {
            upsertGrant(input: {
              pTitle: "Grant without expiry"
              pAwardedTokenAmount: 50
              pMaxSuccessfulClaimCount: 1
            }) {
              grantDefinition { id }
            }
          }
        `
      },
      cookie
    );

    const body = await response.json() as { errors?: { message: string }[] };
    expect(body.errors).toBeDefined();
    expect(body.errors?.[0]?.message).toMatch(/expiration datetime is required/i);
  });

  it("upsertGrant requires at least one claim constraint", async () => {
    const stamp = Date.now();
    const admin = await seedDemoAccount({
      identifier: `admin-grant-constraint-${stamp}@example.com`,
      role: "admin",
      displayName: "Admin Grant Constraint Tester"
    });
    const cookie = await loginWithGraphqlSessionCookie(admin.identifier, admin.password);

    const response = await postGraphql(
      {
        query: `
          mutation {
            upsertGrant(input: {
              pTitle: "Grant without constraints"
              pAwardedTokenAmount: 50
              pExpiresAt: "2032-12-31T23:59:59.000Z"
            }) {
              grantDefinition { id }
            }
          }
        `
      },
      cookie
    );

    const body = await response.json() as { errors?: { message: string }[] };
    expect(body.errors).toBeDefined();
    expect(body.errors?.[0]?.message).toMatch(/at least one constraint/i);
  });

  it("upsertGrant is denied for non-admin", async () => {
    const stamp = Date.now();
    const user = await seedDemoAccount({
      identifier: `noadmin-grant-${stamp}@example.com`,
      role: "identified_account"
    });
    const cookie = await loginWithGraphqlSessionCookie(user.identifier, user.password);

    const response = await postGraphql(
      {
        query: `
          mutation {
            upsertGrant(input: { pTitle: "Hack", pAwardedTokenAmount: 9999 }) {
              grantDefinition { id }
            }
          }
        `
      },
      cookie
    );

    const body = await response.json() as { errors?: unknown[] };
    expect(body.errors).toBeDefined();
  });
});

describe("admin campaign moderation note audit log", () => {
  it("addCampaignModerationNote emits an audit log entry", async () => {
    const stamp = Date.now();
    const manager = await seedDemoAccount({
      identifier: `manager-note-log-${stamp}@example.com`,
      role: "manager",
      displayName: "Manager Note Log Tester"
    });
    const creator = await seedDemoAccount({
      identifier: `campaign-creator-${stamp}@example.com`,
      role: "identified_account",
      displayName: "Campaign Creator"
    });

    const campaignId = await seedCampaignForAccount(creator.accountId, stamp);
    const cookie = await loginWithGraphqlSessionCookie(manager.identifier, manager.password);
    const logsBefore = await countAuditLogsForContext("add_campaign_moderation_note");

    const response = await postGraphql(
      {
        query: `
          mutation($campaignId: UUID!, $body: String!) {
            addCampaignModerationNote(input: { campaignId: $campaignId, body: $body }) {
              campaignModerationNote {
                id
                body
              }
            }
          }
        `,
        variables: { campaignId, body: "Needs revision." }
      },
      cookie
    );

    const body = await response.json() as { errors?: unknown[] };
    expect(body.errors).toBeUndefined();

    const logsAfter = await countAuditLogsForContext("add_campaign_moderation_note");
    expect(logsAfter).toBe(logsBefore + 1);
  });
});
