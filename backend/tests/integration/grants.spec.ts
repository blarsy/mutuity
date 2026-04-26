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

async function withClient<T>(callback: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: TEST_DATABASE_URL });
  await client.connect();
  try {
    return await callback(client);
  } finally {
    await client.end();
  }
}

type SeedGrantOptions = {
  adminAccountId: string;
  title?: string;
  awardedTokenAmount?: number;
  maxSuccessfulClaimCount?: number | null;
  expiresAt?: string | null;
  archivedAt?: string | null;
  linkedCampaignId?: string | null;
};

async function seedGrant(opts: SeedGrantOptions): Promise<string> {
  return withClient(async client => {
    const result = await client.query<{ id: string }>(
      `
        insert into app_public.grant_definition (
          title,
          awarded_token_amount,
          max_successful_claim_count,
          expires_at,
          archived_at,
          linked_campaign_id,
          created_by_account_id
        )
        values ($1, $2, $3, $4, $5, $6, $7)
        returning id
      `,
      [
        opts.title ?? "Test Grant",
        opts.awardedTokenAmount ?? 100,
        opts.maxSuccessfulClaimCount ?? null,
        opts.expiresAt ?? null,
        opts.archivedAt ?? null,
        opts.linkedCampaignId ?? null,
        opts.adminAccountId
      ]
    );

    return result.rows[0].id;
  });
}

async function targetGrantToAccount(grantId: string, accountId: string) {
  return withClient(async client => {
    await client.query(
      `insert into app_public.grant_target_account (grant_id, account_id) values ($1, $2) on conflict do nothing`,
      [grantId, accountId]
    );
  });
}

async function targetGrantToEmail(grantId: string, email: string) {
  return withClient(async client => {
    await client.query(
      `insert into app_public.grant_target_email (grant_id, target_email, target_email_normalized) values ($1, $2, lower($2)) on conflict do nothing`,
      [grantId, email]
    );
  });
}

async function seedApprovedCampaignWithContribution(creatorAccountId: string, contributorAccountId: string, stamp: number): Promise<string> {
  return withClient(async client => {
    const startAt = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const airdropAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const endAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const campaignResult = await client.query<{ id: string }>(
      `
        insert into app_public.campaign (
          creator_account_id, title, theme, rewards_multiplier, airdrop_amount,
          start_at, airdrop_at, end_at, moderation_status
        )
        values ($1, $2, 'mutual aid', 5, 3200, $3, $4, $5, 'approved')
        returning id
      `,
      [creatorAccountId, `Grant campaign ${stamp}`, startAt, airdropAt, endAt]
    );

    const campaignId = campaignResult.rows[0].id;

    // Create a need, then an accepted claim to create a contribution
    const needResult = await client.query<{ id: string }>(
      `
        insert into app_public.need (creator_account_id, title, location, intensity, object_required)
        values ($1, $2, 'Brussels', 'sharing', false)
        returning id
      `,
      [creatorAccountId, `Grant need ${stamp}`]
    );

    const needId = needResult.rows[0].id;

    // Join need to campaign
    await client.query(
      `insert into app_public.campaign_need (campaign_id, need_id, triage_status) values ($1, $2, 'accepted')`,
      [campaignId, needId]
    );

    // Create a need claim by the contributor
    const claimResult = await client.query<{ id: string }>(
      `
        insert into app_public.need_claim (need_id, claimer_account_id, message, status)
        values ($1, $2, 'I can help', 'pending')
        returning id
      `,
      [needId, contributorAccountId]
    );

    // Accept the claim
    await client.query(
      `update app_public.need_claim set status = 'accepted' where id = $1`,
      [claimResult.rows[0].id]
    );

    return campaignId;
  });
}

async function claimGrant(grantId: string, sessionCookie?: string) {
  return fetch(`${TEST_BACKEND_URL}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(sessionCookie ? { Cookie: sessionCookie } : {})
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
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("grant claim integration", () => {
  it("returns not_authenticated for anonymous users", async () => {
    const stamp = Date.now();
    const admin = await seedDemoAccount({
      identifier: `admin-anon-${stamp}@example.com`,
      role: "admin"
    });
    const grantId = await seedGrant({ adminAccountId: admin.accountId });

    const response = await claimGrant(grantId);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        claimGrant: {
          grantClaimResult: { outcomeCode: "not_authenticated" }
        }
      }
    });
  });

  it("succeeds for open grant (no targeting)", async () => {
    const stamp = Date.now();
    const admin = await seedDemoAccount({ identifier: `admin-open-${stamp}@example.com`, role: "admin" });
    const user = await seedDemoAccount({ identifier: `user-open-${stamp}@example.com` });
    const grantId = await seedGrant({ adminAccountId: admin.accountId, awardedTokenAmount: 50 });

    const cookie = await loginWithGraphqlSessionCookie(user.identifier, user.password);
    const response = await claimGrant(grantId, cookie);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        claimGrant: {
          grantClaimResult: {
            outcomeCode: "success",
            claimedAmount: 50
          }
        }
      }
    });
  });

  it("returns already_claimed on duplicate attempt", async () => {
    const stamp = Date.now();
    const admin = await seedDemoAccount({ identifier: `admin-dup-${stamp}@example.com`, role: "admin" });
    const user = await seedDemoAccount({ identifier: `user-dup-${stamp}@example.com` });
    const grantId = await seedGrant({ adminAccountId: admin.accountId });

    const cookie = await loginWithGraphqlSessionCookie(user.identifier, user.password);

    await claimGrant(grantId, cookie);
    const response = await claimGrant(grantId, cookie);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        claimGrant: {
          grantClaimResult: { outcomeCode: "already_claimed" }
        }
      }
    });
  });

  it("returns grant_unavailable for archived grant", async () => {
    const stamp = Date.now();
    const admin = await seedDemoAccount({ identifier: `admin-arch-${stamp}@example.com`, role: "admin" });
    const user = await seedDemoAccount({ identifier: `user-arch-${stamp}@example.com` });
    const grantId = await seedGrant({
      adminAccountId: admin.accountId,
      archivedAt: new Date().toISOString()
    });

    const cookie = await loginWithGraphqlSessionCookie(user.identifier, user.password);
    const response = await claimGrant(grantId, cookie);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        claimGrant: {
          grantClaimResult: { outcomeCode: "grant_unavailable" }
        }
      }
    });
  });

  it("returns expired for past expiry date", async () => {
    const stamp = Date.now();
    const admin = await seedDemoAccount({ identifier: `admin-exp-${stamp}@example.com`, role: "admin" });
    const user = await seedDemoAccount({ identifier: `user-exp-${stamp}@example.com` });
    const grantId = await seedGrant({
      adminAccountId: admin.accountId,
      expiresAt: new Date(Date.now() - 1000).toISOString()
    });

    const cookie = await loginWithGraphqlSessionCookie(user.identifier, user.password);
    const response = await claimGrant(grantId, cookie);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        claimGrant: {
          grantClaimResult: { outcomeCode: "expired" }
        }
      }
    });
  });

  it("returns cap_reached when max claims exhausted", async () => {
    const stamp = Date.now();
    const admin = await seedDemoAccount({ identifier: `admin-cap-${stamp}@example.com`, role: "admin" });
    const user1 = await seedDemoAccount({ identifier: `user-cap1-${stamp}@example.com` });
    const user2 = await seedDemoAccount({ identifier: `user-cap2-${stamp}@example.com` });
    const grantId = await seedGrant({
      adminAccountId: admin.accountId,
      maxSuccessfulClaimCount: 1
    });

    const cookie1 = await loginWithGraphqlSessionCookie(user1.identifier, user1.password);
    const cookie2 = await loginWithGraphqlSessionCookie(user2.identifier, user2.password);

    await claimGrant(grantId, cookie1);
    const response = await claimGrant(grantId, cookie2);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        claimGrant: {
          grantClaimResult: { outcomeCode: "cap_reached" }
        }
      }
    });
  });

  it("returns success for account-id targeted user and not_targeted for others", async () => {
    const stamp = Date.now();
    const admin = await seedDemoAccount({ identifier: `admin-tgt-${stamp}@example.com`, role: "admin" });
    const targeted = await seedDemoAccount({ identifier: `targeted-${stamp}@example.com` });
    const other = await seedDemoAccount({ identifier: `other-tgt-${stamp}@example.com` });
    const grantId = await seedGrant({ adminAccountId: admin.accountId });

    await targetGrantToAccount(grantId, targeted.accountId);

    const targetedCookie = await loginWithGraphqlSessionCookie(targeted.identifier, targeted.password);
    const otherCookie = await loginWithGraphqlSessionCookie(other.identifier, other.password);

    const successResponse = await claimGrant(grantId, targetedCookie);
    const deniedResponse = await claimGrant(grantId, otherCookie);

    expect(successResponse.status).toBe(200);
    await expect(successResponse.json()).resolves.toMatchObject({
      data: { claimGrant: { grantClaimResult: { outcomeCode: "success" } } }
    });

    expect(deniedResponse.status).toBe(200);
    await expect(deniedResponse.json()).resolves.toMatchObject({
      data: { claimGrant: { grantClaimResult: { outcomeCode: "not_targeted" } } }
    });
  });

  it("returns success for email-targeted user and not_targeted for others", async () => {
    const stamp = Date.now();
    const admin = await seedDemoAccount({ identifier: `admin-email-${stamp}@example.com`, role: "admin" });
    const targeted = await seedDemoAccount({ identifier: `email-match-${stamp}@example.com` });
    const other = await seedDemoAccount({ identifier: `email-miss-${stamp}@example.com` });
    const grantId = await seedGrant({ adminAccountId: admin.accountId });

    // Target by the email that is the targeted user's identifier
    await targetGrantToEmail(grantId, targeted.identifier);

    const targetedCookie = await loginWithGraphqlSessionCookie(targeted.identifier, targeted.password);
    const otherCookie = await loginWithGraphqlSessionCookie(other.identifier, other.password);

    const successResponse = await claimGrant(grantId, targetedCookie);
    const deniedResponse = await claimGrant(grantId, otherCookie);

    expect(successResponse.status).toBe(200);
    await expect(successResponse.json()).resolves.toMatchObject({
      data: { claimGrant: { grantClaimResult: { outcomeCode: "success" } } }
    });

    expect(deniedResponse.status).toBe(200);
    await expect(deniedResponse.json()).resolves.toMatchObject({
      data: { claimGrant: { grantClaimResult: { outcomeCode: "not_targeted" } } }
    });
  });

  it("returns campaign_criterion_not_satisfied for user without campaign contribution, success with contribution", async () => {
    const stamp = Date.now();
    const admin = await seedDemoAccount({ identifier: `admin-camp-${stamp}@example.com`, role: "admin" });
    const contributor = await seedDemoAccount({ identifier: `contributor-${stamp}@example.com` });
    const nonContributor = await seedDemoAccount({ identifier: `non-contrib-${stamp}@example.com` });

    const campaignId = await seedApprovedCampaignWithContribution(admin.accountId, contributor.accountId, stamp);

    const grantId = await seedGrant({
      adminAccountId: admin.accountId,
      linkedCampaignId: campaignId
    });

    const contributorCookie = await loginWithGraphqlSessionCookie(contributor.identifier, contributor.password);
    const nonContributorCookie = await loginWithGraphqlSessionCookie(nonContributor.identifier, nonContributor.password);

    const successResponse = await claimGrant(grantId, contributorCookie);
    const deniedResponse = await claimGrant(grantId, nonContributorCookie);

    expect(successResponse.status).toBe(200);
    await expect(successResponse.json()).resolves.toMatchObject({
      data: { claimGrant: { grantClaimResult: { outcomeCode: "success" } } }
    });

    expect(deniedResponse.status).toBe(200);
    await expect(deniedResponse.json()).resolves.toMatchObject({
      data: { claimGrant: { grantClaimResult: { outcomeCode: "campaign_criterion_not_satisfied" } } }
    });
  });

  it("does not exceed cap under concurrent claims", async () => {
    const stamp = Date.now();
    const admin = await seedDemoAccount({ identifier: `admin-conc-${stamp}@example.com`, role: "admin" });
    const users = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        seedDemoAccount({ identifier: `conc-user${i}-${stamp}@example.com` })
      )
    );
    const grantId = await seedGrant({
      adminAccountId: admin.accountId,
      maxSuccessfulClaimCount: 2
    });

    const cookies = await Promise.all(
      users.map(u => loginWithGraphqlSessionCookie(u.identifier, u.password))
    );

    const responses = await Promise.all(cookies.map(c => claimGrant(grantId, c)));
    const bodies = await Promise.all(responses.map(r => r.json() as Promise<{ data: { claimGrant: { grantClaimResult: { outcomeCode: string } } } }>));

    const outcomeCodes = bodies.map(b => b.data.claimGrant.grantClaimResult.outcomeCode);
    const successCount = outcomeCodes.filter(c => c === "success").length;
    const capCount = outcomeCodes.filter(c => c === "cap_reached").length;

    expect(successCount).toBe(2);
    expect(capCount).toBe(3);
  });
});
