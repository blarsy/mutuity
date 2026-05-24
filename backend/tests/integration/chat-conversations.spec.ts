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
  const json = await res.json() as { data?: { submitResourceBid: { resourceBid: { id: string } } } };
  return json.data!.submitResourceBid.resourceBid.id;
}

async function sendResourceMessage(
  cookie: string,
  resourceId: string,
  otherAccountId: string,
  body: string
) {
  const res = await fetch(`${TEST_BACKEND_URL}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      query: `
        mutation SendResourceMessageDirect($input: SendResourceMessageDirectInput!) {
          sendResourceMessageDirect(input: $input) { resourceMessage { id } }
        }
      `,
      variables: {
        input: {
          pResourceId: resourceId,
          pOtherAccountId: otherAccountId,
          pBody: body,
          pImageUrls: []
        }
      }
    })
  });
  const json = await res.json() as {
    data?: { sendResourceMessageDirect: { resourceMessage: { id: string } } };
    errors?: Array<{ message: string }>;
  };
  expect(json.errors).toBeUndefined();
  return json.data!.sendResourceMessageDirect.resourceMessage.id;
}

async function listConversations(
  cookie: string,
  search?: string
): Promise<Array<{
  conversationKind: string;
  conversationId: string;
  contextId: string;
  contextTitle: string;
  otherAccountId: string;
  otherAccountDisplayName: string;
  lastMessagePreview: string;
  unreadCount: number;
  lastActivityAt: string;
}>> {
  const res = await fetch(`${TEST_BACKEND_URL}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      query: `
        query ListChatConversations($search: String) {
          listChatConversations(pSearch: $search) {
            nodes {
              conversationKind
              conversationId
              contextId
              contextTitle
              otherAccountId
              otherAccountDisplayName
              lastMessagePreview
              unreadCount
              lastActivityAt
            }
          }
        }
      `,
      variables: { search: search ?? null }
    })
  });
  const json = await res.json() as {
    data?: { listChatConversations: { nodes: Array<{
      conversationKind: string;
      conversationId: string;
      contextId: string;
      contextTitle: string;
      otherAccountId: string;
      otherAccountDisplayName: string;
      lastMessagePreview: string;
      unreadCount: number;
      lastActivityAt: string;
    }> } };
    errors?: Array<{ message: string }>;
  };
  expect(json.errors).toBeUndefined();
  return json.data!.listChatConversations.nodes;
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
  const json = await res.json() as {
    data?: { sendClaimMessage: { claimMessage: { id: string; conversationId: string } } };
    errors?: Array<{ message: string }>;
  };
  expect(json.errors).toBeUndefined();
  return json.data!.sendClaimMessage.claimMessage;
}

describe("chat conversations integration", () => {
  it("lists resource conversations for both participants after the first message is sent", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `chat-resource-creator-${stamp}@example.com`,
      displayName: "Chat Resource Creator"
    });
    const bidder = await seedDemoAccount({
      identifier: `chat-resource-bidder-${stamp}@example.com`,
      displayName: "Chat Resource Bidder"
    });
    const resource = await seedResource({
      creatorAccount: creator,
      title: `Chat Resource ${stamp}`
    });

    const bidderCookie = await loginAs(bidder);
    const creatorCookie = await loginAs(creator);

    await submitResourceBid(bidderCookie, resource.id, "Interested in this!");

    // Conversation should NOT exist yet (no messages sent)
    const preMessageCreatorList = await listConversations(creatorCookie);
    const preMessageBidderList = await listConversations(bidderCookie);
    expect(preMessageCreatorList.every(c => c.contextId !== resource.id)).toBe(true);
    expect(preMessageBidderList.every(c => c.contextId !== resource.id)).toBe(true);

    // Creator sends the first message, which lazily creates the conversation
    await sendResourceMessage(creatorCookie, resource.id, bidder.accountId, "Thanks for your interest!");

    const creatorList = await listConversations(creatorCookie);
    const resourceConvForCreator = creatorList.find(c => c.contextId === resource.id);
    expect(resourceConvForCreator).toBeDefined();
    expect(resourceConvForCreator?.conversationKind).toBe("RESOURCE");
    expect(resourceConvForCreator?.contextTitle).toBe(resource.title);
    expect(resourceConvForCreator?.otherAccountId).toBe(bidder.accountId);
    expect(resourceConvForCreator?.lastMessagePreview).toBe("Thanks for your interest!");
    expect(resourceConvForCreator?.unreadCount).toBe(0);

    const bidderList = await listConversations(bidderCookie);
    const resourceConvForBidder = bidderList.find(c => c.contextId === resource.id);
    expect(resourceConvForBidder).toBeDefined();
    expect(resourceConvForBidder?.otherAccountId).toBe(creator.accountId);
    // Message was sent BY the creator, so bidder sees 1 unread
    expect(resourceConvForBidder?.unreadCount).toBe(1);
  });

  it("lists need (claim) conversations alongside resource conversations, ordered by last activity", async () => {
    const stamp = Date.now();
    const needCreator = await seedDemoAccount({
      identifier: `chat-need-creator-${stamp}@example.com`,
      displayName: "Need Creator Mixed"
    });
    const claimer = await seedDemoAccount({
      identifier: `chat-need-claimer-${stamp}@example.com`,
      displayName: "Need Claimer Mixed"
    });
    const resourceCreator = await seedDemoAccount({
      identifier: `chat-res-creator-${stamp}@example.com`,
      displayName: "Resource Creator Mixed"
    });

    const need = await seedNeed({
      creatorAccount: needCreator,
      title: `Mixed Chat Need ${stamp}`,
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
    });
    const claim = await seedNeedClaim({
      needId: need.id,
      claimerAccount: claimer,
      message: "I can help"
    });
    const resource = await seedResource({
      creatorAccount: resourceCreator,
      title: `Mixed Chat Resource ${stamp}`
    });

    const needCreatorCookie = await loginAs(needCreator);
    const claimerCookie = await loginAs(claimer);
    const resourceCreatorCookie = await loginAs(resourceCreator);

    await submitResourceBid(claimerCookie, resource.id, "Also interested in resource");

    // Seed need conversation (creator sends first reply)
    await sendClaimMessage(needCreatorCookie, claim.id, "Great, let's connect");

    // Small delay to ensure distinct timestamps
    await new Promise(r => setTimeout(r, 50));

    // Seed resource conversation (resource creator sends first message)
    await sendResourceMessage(resourceCreatorCookie, resource.id, claimer.accountId, "Thanks for the bid!");

    // The claimer/bidder should see both conversations: the need thread and the resource thread
    const claimerList = await listConversations(claimerCookie);
    const needConv = claimerList.find(c => c.conversationKind === "NEED" && c.contextId === need.id);
    const resourceConv = claimerList.find(c => c.conversationKind === "RESOURCE" && c.contextId === resource.id);

    expect(needConv).toBeDefined();
    expect(resourceConv).toBeDefined();

    // Resource conversation was more recent → should appear first
    const needIdx = claimerList.indexOf(needConv!);
    const resourceIdx = claimerList.indexOf(resourceConv!);
    expect(resourceIdx).toBeLessThan(needIdx);
  });

  it("filters conversations by text search across title, participant name, and message body", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `chat-search-creator-${stamp}@example.com`,
      displayName: "Searchable Creator"
    });
    const bidder = await seedDemoAccount({
      identifier: `chat-search-bidder-${stamp}@example.com`,
      displayName: "Searchable Bidder"
    });
    const resourceA = await seedResource({
      creatorAccount: creator,
      title: `Handmade Jam ${stamp}`
    });
    const resourceB = await seedResource({
      creatorAccount: creator,
      title: `Garden Tools ${stamp}`
    });

    const bidderCookie = await loginAs(bidder);
    const creatorCookie = await loginAs(creator);

    await submitResourceBid(bidderCookie, resourceA.id, "Want jam");
    await submitResourceBid(bidderCookie, resourceB.id, "Want tools");

    await sendResourceMessage(creatorCookie, resourceA.id, bidder.accountId, "Jam pickup available Saturday");
    await sendResourceMessage(creatorCookie, resourceB.id, bidder.accountId, "Tools can be picked up anytime");

    // Search by resource title substring
    const jamSearch = await listConversations(creatorCookie, "Handmade");
    expect(jamSearch.some(c => c.contextId === resourceA.id)).toBe(true);
    expect(jamSearch.every(c => c.contextId !== resourceB.id)).toBe(true);

    // Search by message body content
    const bodySearch = await listConversations(creatorCookie, "Saturday");
    expect(bodySearch.some(c => c.contextId === resourceA.id)).toBe(true);
    expect(bodySearch.every(c => c.contextId !== resourceB.id)).toBe(true);
  });

  it("marks messages as read and reduces the unread count to zero", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `chat-read-creator-${stamp}@example.com`,
      displayName: "Read Creator"
    });
    const bidder = await seedDemoAccount({
      identifier: `chat-read-bidder-${stamp}@example.com`,
      displayName: "Read Bidder"
    });
    const resource = await seedResource({
      creatorAccount: creator,
      title: `Read Receipt Resource ${stamp}`
    });

    const bidderCookie = await loginAs(bidder);
    const creatorCookie = await loginAs(creator);

    await submitResourceBid(bidderCookie, resource.id, "I want this");
    await sendResourceMessage(creatorCookie, resource.id, bidder.accountId, "Message 1 from creator");
    await sendResourceMessage(creatorCookie, resource.id, bidder.accountId, "Message 2 from creator");

    // Bidder should see 2 unread before marking read
    const beforeRead = await listConversations(bidderCookie);
    const conv = beforeRead.find(c => c.contextId === resource.id);
    expect(conv?.unreadCount).toBe(2);

    // Get the conversation ID to mark read
    const convId = conv!.conversationId;

    // Mark as read from bidder perspective
    const markRes = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: bidderCookie },
      body: JSON.stringify({
        query: `
          mutation MarkResourceMessagesRead($input: MarkResourceMessagesReadInput!) {
            markResourceMessagesRead(input: $input) { integer }
          }
        `,
        variables: { input: { pConversationId: convId } }
      })
    });
    const markJson = await markRes.json() as {
      data?: { markResourceMessagesRead: { integer: number } };
      errors?: Array<{ message: string }>;
    };
    expect(markJson.errors).toBeUndefined();
    expect(markJson.data?.markResourceMessagesRead.integer).toBe(2);

    // Bidder should now see 0 unread
    const afterRead = await listConversations(bidderCookie);
    const convAfter = afterRead.find(c => c.contextId === resource.id);
    expect(convAfter?.unreadCount).toBe(0);
  });

  it("blocks non-participants from sending messages to a resource conversation", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `chat-block-creator-${stamp}@example.com`,
      displayName: "Block Creator"
    });
    const bidder = await seedDemoAccount({
      identifier: `chat-block-bidder-${stamp}@example.com`,
      displayName: "Block Bidder"
    });
    const outsider = await seedDemoAccount({
      identifier: `chat-block-outsider-${stamp}@example.com`,
      displayName: "Block Outsider"
    });
    const resource = await seedResource({
      creatorAccount: creator,
      title: `Blocked Resource ${stamp}`
    });

    const bidderCookie = await loginAs(bidder);
    const creatorCookie = await loginAs(creator);
    const outsiderCookie = await loginAs(outsider);

    await submitResourceBid(bidderCookie, resource.id, "Want it");
    // Creator seeds the conversation
    await sendResourceMessage(creatorCookie, resource.id, bidder.accountId, "Hello bidder");

    // Outsider tries to send a message to this bid (which they're not part of)
    const outsiderRes = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: outsiderCookie },
      body: JSON.stringify({
        query: `
          mutation SendResourceMessageDirect($input: SendResourceMessageDirectInput!) {
            sendResourceMessageDirect(input: $input) { resourceMessage { id } }
          }
        `,
        variables: {
          input: {
            pResourceId: resource.id,
            pOtherAccountId: bidder.accountId,
            pBody: "Sneaky message",
            pImageUrls: []
          }
        }
      })
    });
    const outsiderJson = await outsiderRes.json() as { errors?: Array<{ message: string }> };
    expect(outsiderJson.errors).toBeDefined();
    expect(outsiderJson.errors![0].message).toMatch(/FORBIDDEN|participant/i);
  });
});
