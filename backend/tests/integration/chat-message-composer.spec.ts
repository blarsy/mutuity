import {
  TEST_BACKEND_URL,
  loginWithGraphqlSessionCookie,
  seedDemoAccount,
  type SeededAccount
} from "./auth-test-helpers";
import { seedNeed, seedNeedClaim } from "./need-test-helpers";
import { seedResource } from "./resource-test-helpers";

jest.setTimeout(30000);

async function loginAs(account: SeededAccount) {
  return loginWithGraphqlSessionCookie(account.identifier, account.password);
}

async function submitResourceBid(bidderCookie: string, resourceId: string, message: string) {
  const res = await fetch(`${TEST_BACKEND_URL}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: bidderCookie },
    body: JSON.stringify({
      query: `
        mutation SubmitResourceBid($input: SubmitResourceBidInput!) {
          submitResourceBid(input: $input) {
            resourceBid { id }
          }
        }
      `,
      variables: { input: { resourceId, message } }
    })
  });
  const json = await res.json() as {
    data?: { submitResourceBid: { resourceBid: { id: string } } };
    errors?: Array<{ message: string }>;
  };
  expect(json.errors).toBeUndefined();
  return json.data!.submitResourceBid.resourceBid.id;
}

async function sendResourceMessage(cookie: string, resourceBidId: string, body: string) {
  const res = await fetch(`${TEST_BACKEND_URL}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      query: `
        mutation SendResourceMessage($input: SendResourceMessageInput!) {
          sendResourceMessage(input: $input) { resourceMessage { id } }
        }
      `,
      variables: { input: { resourceBidId, body, imageUrls: [] } }
    })
  });
  return res.json() as Promise<{
    data?: { sendResourceMessage: { resourceMessage: { id: string } } };
    errors?: Array<{ message: string }>;
  }>;
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

describe("chat message composer – resource conversations", () => {
  it("rejects blank message bodies for resource conversations", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `resc-compose-blank-creator-${stamp}@example.com`,
      displayName: "Resc Compose Blank Creator"
    });
    const bidder = await seedDemoAccount({
      identifier: `resc-compose-blank-bidder-${stamp}@example.com`,
      displayName: "Resc Compose Blank Bidder"
    });

    const resource = await seedResource({
      creatorAccount: creator,
      title: `Resc Compose Blank Resource ${stamp}`,
      isActive: true
    });
    const bidderCookie = await loginAs(bidder);
    const bidId = await submitResourceBid(bidderCookie, resource.id, "Initial bid message");

    const blankPayload = await sendResourceMessage(bidderCookie, bidId, "   ");
    expect(blankPayload.errors).toBeDefined();
    expect(blankPayload.errors?.[0]?.message).toMatch(/message body is required/i);
  });

  it("blocks non-participants from sending resource messages", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `resc-compose-block-creator-${stamp}@example.com`,
      displayName: "Resc Compose Block Creator"
    });
    const bidder = await seedDemoAccount({
      identifier: `resc-compose-block-bidder-${stamp}@example.com`,
      displayName: "Resc Compose Block Bidder"
    });
    const outsider = await seedDemoAccount({
      identifier: `resc-compose-block-outsider-${stamp}@example.com`,
      displayName: "Resc Compose Block Outsider"
    });

    const resource = await seedResource({
      creatorAccount: creator,
      title: `Resc Compose Block Resource ${stamp}`,
      isActive: true
    });
    const bidderCookie = await loginAs(bidder);
    const bidId = await submitResourceBid(bidderCookie, resource.id, "Bid message");

    // Creator sends a first message to open the conversation.
    const creatorCookie = await loginAs(creator);
    await expect(
      sendResourceMessage(creatorCookie, bidId, "Creator opens resource thread")
    ).resolves.toMatchObject({
      data: { sendResourceMessage: { resourceMessage: { id: expect.any(String) } } }
    });

    // Outsider is not part of the bid and should be blocked.
    const outsiderCookie = await loginAs(outsider);
    const outsiderPayload = await sendResourceMessage(outsiderCookie, bidId, "Outsider intrusion");
    expect(outsiderPayload.errors).toBeDefined();
    expect(outsiderPayload.errors?.[0]?.message).toMatch(/forbidden|participant/i);
  });

  it("keeps one conversation per resource bid context", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `resc-compose-unique-creator-${stamp}@example.com`,
      displayName: "Resc Compose Unique Creator"
    });
    const bidder = await seedDemoAccount({
      identifier: `resc-compose-unique-bidder-${stamp}@example.com`,
      displayName: "Resc Compose Unique Bidder"
    });

    const resource = await seedResource({
      creatorAccount: creator,
      title: `Resc Compose Unique Resource ${stamp}`,
      isActive: true
    });
    const bidderCookie = await loginAs(bidder);
    const bidId = await submitResourceBid(bidderCookie, resource.id, "Bid seed message");

    const creatorCookie = await loginAs(creator);

    await expect(
      sendResourceMessage(creatorCookie, bidId, "Resource message one")
    ).resolves.toMatchObject({
      data: { sendResourceMessage: { resourceMessage: { id: expect.any(String) } } }
    });
    await expect(
      sendResourceMessage(bidderCookie, bidId, "Resource message two")
    ).resolves.toMatchObject({
      data: { sendResourceMessage: { resourceMessage: { id: expect.any(String) } } }
    });

    // Verify exactly one conversation exists for this bid.
    const countRes = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: creatorCookie },
      body: JSON.stringify({
        query: `
          query ResourceBidConversationCount($resourceBidId: UUID!) {
            resourceConversations: allResourceConversations(
              condition: { resourceBidId: $resourceBidId }
            ) {
              totalCount
            }
          }
        `,
        variables: { resourceBidId: bidId }
      })
    });

    const countPayload = (await countRes.json()) as {
      data?: { resourceConversations: { totalCount: number } };
      errors?: Array<{ message: string }>;
    };

    expect(countRes.status).toBe(200);
    expect(countPayload.errors).toBeUndefined();
    expect(countPayload.data?.resourceConversations.totalCount).toBe(1);
  });
});
