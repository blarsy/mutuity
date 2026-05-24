import { Client } from "pg";

import {
  TEST_BACKEND_URL,
  TEST_DATABASE_URL,
  loginWithGraphqlSessionCookie,
  seedDemoAccount
} from "../integration/auth-test-helpers";

jest.setTimeout(30000);

async function withClient<T>(callback: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: TEST_DATABASE_URL });
  await client.connect();
  try {
    return await callback(client);
  } finally {
    await client.end();
  }
}

async function seedGrant(adminAccountId: string, stamp: number, overrides: {
  maxSuccessfulClaimCount?: number | null;
  expiresAt?: string;
  archivedAt?: string | null;
} = {}): Promise<string> {
  return withClient(async client => {
    const result = await client.query<{ id: string }>(
      `
        insert into app_public.grant_definition (
          title, awarded_token_amount, max_successful_claim_count,
          expires_at, archived_at, created_by_account_id
        )
        values ($1, $2, $3, $4, $5, $6)
        returning id
      `,
      [
        `E2E Grant ${stamp}`,
        75,
        overrides.maxSuccessfulClaimCount ?? null,
        overrides.expiresAt ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        overrides.archivedAt ?? null,
        adminAccountId
      ]
    );

    return result.rows[0].id;
  });
}

async function getGrantForClaim(grantId: string, sessionCookie: string) {
  const response = await fetch(`${TEST_BACKEND_URL}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: sessionCookie
    },
    body: JSON.stringify({
      query: `
        query GetGrantForClaim($grantId: UUID!) {
          getGrantForClaim(pGrantId: $grantId, first: 1) {
            nodes {
              id
              title
              description
              awardedTokenAmount
              maxSuccessfulClaimCount
              expiresAt
            }
          }
        }
      `,
      variables: { grantId }
    })
  });

  return response.json() as Promise<{
    data: {
      getGrantForClaim: {
        nodes: Array<{
          id: string;
          title: string;
          description: string;
          awardedTokenAmount: number;
          maxSuccessfulClaimCount: number | null;
          expiresAt: string | null;
        }>
      } | null
    }
  }>;
}

async function claimGrant(grantId: string, sessionCookie: string) {
  const response = await fetch(`${TEST_BACKEND_URL}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: sessionCookie
    },
    body: JSON.stringify({
      query: `
        mutation ClaimGrant($grantId: UUID!) {
          claimGrant(input: { pGrantId: $grantId }) {
            grantClaimResult {
              outcomeCode
              claimedAmount
              grantClaimId
            }
          }
        }
      `,
      variables: { grantId }
    })
  });

  return response.json() as Promise<{
    data: {
      claimGrant: {
        grantClaimResult: {
          outcomeCode: string;
          claimedAmount: number | null;
          grantClaimId: string | null;
        } | null
      } | null
    } | null;
    errors?: Array<{ message: string; extensions?: { code: string } }>
  }>;
}

describe("grant claim E2E contract", () => {
  it("exposes getGrantForClaim query with correct shape", async () => {
    const stamp = Date.now();
    const admin = await seedDemoAccount({ identifier: `e2e-admin-query-${stamp}@example.com`, role: "admin" });
    const user = await seedDemoAccount({ identifier: `e2e-user-query-${stamp}@example.com` });
    const grantId = await seedGrant(admin.accountId, stamp);

    const cookie = await loginWithGraphqlSessionCookie(user.identifier, user.password);
    const body = await getGrantForClaim(grantId, cookie);

    expect(body.data.getGrantForClaim?.nodes).toHaveLength(1);
    const node = body.data.getGrantForClaim?.nodes[0];
    expect(node).toMatchObject({
      id: grantId,
      title: `E2E Grant ${stamp}`,
      description: "",
      awardedTokenAmount: 75,
      maxSuccessfulClaimCount: null
    });
    expect(node?.expiresAt).toBeTruthy();
  });

  it("completes full claim flow and returns success outcome with claimedAmount and grantClaimId", async () => {
    const stamp = Date.now();
    const admin = await seedDemoAccount({ identifier: `e2e-admin-flow-${stamp}@example.com`, role: "admin" });
    const user = await seedDemoAccount({ identifier: `e2e-user-flow-${stamp}@example.com` });
    const grantId = await seedGrant(admin.accountId, stamp);

    const cookie = await loginWithGraphqlSessionCookie(user.identifier, user.password);
    const body = await claimGrant(grantId, cookie);

    expect(body.data?.claimGrant?.grantClaimResult).toMatchObject({
      outcomeCode: "success",
      claimedAmount: 75
    });
    expect(body.data?.claimGrant?.grantClaimResult?.grantClaimId).toBeTruthy();
  });

  it("returns denial outcome codes for user-safe display (expired, already_claimed, cap_reached, grant_unavailable)", async () => {
    const stamp = Date.now();
    const admin = await seedDemoAccount({ identifier: `e2e-admin-denial-${stamp}@example.com`, role: "admin" });
    const user = await seedDemoAccount({ identifier: `e2e-user-denial-${stamp}@example.com` });

    const cookie = await loginWithGraphqlSessionCookie(user.identifier, user.password);

    // Expired grant
    const expiredId = await seedGrant(admin.accountId, stamp + 1, {
      expiresAt: new Date(Date.now() - 1000).toISOString()
    });
    const expiredBody = await claimGrant(expiredId, cookie);
    expect(expiredBody.data?.claimGrant?.grantClaimResult?.outcomeCode).toBe("expired");

    // Archived grant
    const archivedId = await seedGrant(admin.accountId, stamp + 2, {
      archivedAt: new Date().toISOString()
    });
    const archivedBody = await claimGrant(archivedId, cookie);
    expect(archivedBody.data?.claimGrant?.grantClaimResult?.outcomeCode).toBe("grant_unavailable");

    // Cap reached (1 cap, user already claims it; then use another user to hit cap_reached)
    const capped = await seedDemoAccount({ identifier: `e2e-capped-${stamp}@example.com` });
    const cappedCookie = await loginWithGraphqlSessionCookie(capped.identifier, capped.password);
    const capId = await seedGrant(admin.accountId, stamp + 3, { maxSuccessfulClaimCount: 1 });
    await claimGrant(capId, cappedCookie);
    const capBody = await claimGrant(capId, cookie);
    expect(capBody.data?.claimGrant?.grantClaimResult?.outcomeCode).toBe("cap_reached");

    // Already claimed
    const openId = await seedGrant(admin.accountId, stamp + 4);
    await claimGrant(openId, cookie);
    const alreadyBody = await claimGrant(openId, cookie);
    expect(alreadyBody.data?.claimGrant?.grantClaimResult?.outcomeCode).toBe("already_claimed");
  });

  it("returns not_authenticated denial without a server error (safe for anonymous UX)", async () => {
    const stamp = Date.now();
    const admin = await seedDemoAccount({ identifier: `e2e-admin-anon-${stamp}@example.com`, role: "admin" });
    const grantId = await seedGrant(admin.accountId, stamp);

    const response = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          mutation ClaimGrant($grantId: UUID!) {
            claimGrant(input: { pGrantId: $grantId }) {
              grantClaimResult {
                outcomeCode
                claimedAmount
                grantClaimId
              }
            }
          }
        `,
        variables: { grantId }
      })
    });

    expect(response.status).toBe(200);
    const body = await response.json() as { data: { claimGrant: { grantClaimResult: { outcomeCode: string } } } };
    expect(body.data?.claimGrant?.grantClaimResult?.outcomeCode).toBe("not_authenticated");
  });
});
