import {
  TEST_BACKEND_URL,
  loginWithGraphqlSessionCookie,
  seedDemoAccount,
  type SeededAccount
} from "./auth-test-helpers";
import { seedNeed, seedNeedClaim } from "./need-test-helpers";

jest.setTimeout(30000);

async function loginAs(account: SeededAccount) {
  return loginWithGraphqlSessionCookie(account.identifier, account.password);
}

async function sendClaimMessage(cookie: string, needClaimId: string, body: string) {
  const res = await fetch(`${TEST_BACKEND_URL}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      query: `
        mutation SendClaimMessage($input: SendClaimMessageInput!) {
          sendClaimMessage(input: $input) {
            claimMessage { id conversationId }
          }
        }
      `,
      variables: { input: { needClaimId, body, imageUrls: [] } }
    })
  });

  return res.json() as Promise<{
    data?: { sendClaimMessage: { claimMessage: { id: string; conversationId: string } } };
    errors?: Array<{ message: string }>;
  }>;
}

describe("chat message composer integration", () => {
  it("rejects blank message bodies for claim conversations", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `chat-compose-blank-creator-${stamp}@example.com`,
      displayName: "Chat Compose Blank Creator"
    });
    const claimer = await seedDemoAccount({
      identifier: `chat-compose-blank-claimer-${stamp}@example.com`,
      displayName: "Chat Compose Blank Claimer"
    });

    const need = await seedNeed({
      creatorAccount: creator,
      title: `Chat Compose Blank Need ${stamp}`,
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
    });
    const claim = await seedNeedClaim({
      needId: need.id,
      claimerAccount: claimer,
      message: "Initial claim message"
    });

    const creatorCookie = await loginAs(creator);

    const blankClaimPayload = await sendClaimMessage(creatorCookie, claim.id, "   ");
    expect(blankClaimPayload.errors).toBeDefined();
    expect(blankClaimPayload.errors?.[0]?.message).toMatch(/message body is required/i);
  });

  it("blocks non-participants from sending claim messages", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `chat-compose-block-creator-${stamp}@example.com`,
      displayName: "Chat Compose Block Creator"
    });
    const claimer = await seedDemoAccount({
      identifier: `chat-compose-block-claimer-${stamp}@example.com`,
      displayName: "Chat Compose Block Claimer"
    });
    const outsider = await seedDemoAccount({
      identifier: `chat-compose-block-outsider-${stamp}@example.com`,
      displayName: "Chat Compose Block Outsider"
    });

    const need = await seedNeed({
      creatorAccount: creator,
      title: `Chat Compose Block Need ${stamp}`,
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
    });
    const claim = await seedNeedClaim({
      needId: need.id,
      claimerAccount: claimer,
      message: "Claim starter"
    });

    const creatorCookie = await loginAs(creator);
    const outsiderCookie = await loginAs(outsider);

    // Seed conversation with a valid participant message first.
    await expect(sendClaimMessage(creatorCookie, claim.id, "Creator starts claim thread")).resolves.toMatchObject({
      data: { sendClaimMessage: { claimMessage: { conversationId: expect.any(String) } } }
    });

    const outsiderClaimPayload = await sendClaimMessage(outsiderCookie, claim.id, "Outsider claim message");
    expect(outsiderClaimPayload.errors).toBeDefined();
    expect(outsiderClaimPayload.errors?.[0]?.message).toMatch(/forbidden|participant/i);
  });

  it("keeps one conversation per need claim context", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `chat-compose-unique-creator-${stamp}@example.com`,
      displayName: "Chat Compose Unique Creator"
    });
    const claimer = await seedDemoAccount({
      identifier: `chat-compose-unique-claimer-${stamp}@example.com`,
      displayName: "Chat Compose Unique Claimer"
    });

    const need = await seedNeed({
      creatorAccount: creator,
      title: `Chat Compose Unique Need ${stamp}`,
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
    });
    const claim = await seedNeedClaim({
      needId: need.id,
      claimerAccount: claimer,
      message: "Seed claim message"
    });

    const creatorCookie = await loginAs(creator);
    const claimerCookie = await loginAs(claimer);

    await expect(sendClaimMessage(creatorCookie, claim.id, "Claim message one")).resolves.toMatchObject({
      data: { sendClaimMessage: { claimMessage: { conversationId: expect.any(String) } } }
    });
    await expect(sendClaimMessage(claimerCookie, claim.id, "Claim message two")).resolves.toMatchObject({
      data: { sendClaimMessage: { claimMessage: { conversationId: expect.any(String) } } }
    });

    const conversationCountRes = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: creatorCookie },
      body: JSON.stringify({
        query: `
          query ConversationCounts($needClaimId: UUID!) {
            claimConversations: allClaimConversations(condition: { needClaimId: $needClaimId }) {
              totalCount
            }
          }
        `,
        variables: {
          needClaimId: claim.id
        }
      })
    });

    const conversationCountPayload = (await conversationCountRes.json()) as {
      data?: {
        claimConversations: { totalCount: number };
      };
      errors?: Array<{ message: string }>;
    };

    expect(conversationCountRes.status).toBe(200);
    expect(conversationCountPayload.errors).toBeUndefined();
    expect(conversationCountPayload.data?.claimConversations.totalCount).toBe(1);
  });
});
