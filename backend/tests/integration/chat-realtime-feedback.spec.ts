import { Client } from "pg";

import {
  TEST_BACKEND_URL,
  TEST_DATABASE_URL,
  loginWithGraphqlSessionCookie,
  seedDemoAccount,
  type SeededAccount
} from "./auth-test-helpers";
import { seedResource } from "./resource-test-helpers";

jest.setTimeout(30000);

function isTypingSignalActive(lastTypedAt: string, timeoutMs = 5000): boolean {
  const ageMs = Date.now() - new Date(lastTypedAt).getTime();
  return ageMs >= 0 && ageMs <= timeoutMs;
}

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
    data?: { submitResourceBid?: { resourceBid?: { id: string } } };
    errors?: Array<{ message: string }>;
  };

  expect(json.errors).toBeUndefined();
  expect(json.data?.submitResourceBid?.resourceBid?.id).toBeTruthy();
  return json.data!.submitResourceBid!.resourceBid!.id;
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

  const json = await res.json() as {
    data?: { sendResourceMessage?: { resourceMessage?: { id: string } } };
    errors?: Array<{ message: string }>;
  };

  expect(json.errors).toBeUndefined();
  expect(json.data?.sendResourceMessage?.resourceMessage?.id).toBeTruthy();
  return json.data!.sendResourceMessage!.resourceMessage!.id;
}

async function listConversations(cookie: string) {
  const res = await fetch(`${TEST_BACKEND_URL}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      query: `
        query ListChatConversations {
          listChatConversations {
            nodes {
              conversationKind
              conversationId
              contextId
              unreadCount
            }
          }
        }
      `
    })
  });

  const json = await res.json() as {
    data?: {
      listChatConversations?: {
        nodes: Array<{
          conversationKind: string;
          conversationId: string;
          contextId: string;
          unreadCount: number;
        }>;
      };
    };
    errors?: Array<{ message: string }>;
  };

  expect(json.errors).toBeUndefined();
  return json.data?.listChatConversations?.nodes ?? [];
}

describe("chat realtime feedback", () => {
  it("marks resource messages as read and reduces unread count", async () => {
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
      title: `Realtime read resource ${stamp}`
    });

    const bidderCookie = await loginAs(bidder);
    const creatorCookie = await loginAs(creator);

    const bidId = await submitResourceBid(bidderCookie, resource.id, "I want this");
    await sendResourceMessage(creatorCookie, bidId, "Message 1 from creator");
    await sendResourceMessage(creatorCookie, bidId, "Message 2 from creator");

    const beforeRead = await listConversations(bidderCookie);
    const conv = beforeRead.find(c => c.contextId === resource.id);
    expect(conv?.unreadCount).toBe(2);

    const markRes = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: bidderCookie },
      body: JSON.stringify({
        query: `
          mutation MarkResourceMessagesRead($input: MarkResourceMessagesReadInput!) {
            markResourceMessagesRead(input: $input) { integer }
          }
        `,
        variables: { input: { pConversationId: conv?.conversationId } }
      })
    });

    const markJson = await markRes.json() as {
      data?: { markResourceMessagesRead?: { integer: number } };
      errors?: Array<{ message: string }>;
    };

    expect(markJson.errors).toBeUndefined();
    expect(markJson.data?.markResourceMessagesRead?.integer).toBe(2);

    const afterRead = await listConversations(bidderCookie);
    const convAfter = afterRead.find(c => c.contextId === resource.id);
    expect(convAfter?.unreadCount).toBe(0);
  });

  it("stores typing presence and allows client timeout behavior based on lastTypedAt", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `chat-typing-creator-${stamp}@example.com`,
      displayName: "Typing Creator"
    });
    const bidder = await seedDemoAccount({
      identifier: `chat-typing-bidder-${stamp}@example.com`,
      displayName: "Typing Bidder"
    });
    const resource = await seedResource({
      creatorAccount: creator,
      title: `Realtime typing resource ${stamp}`
    });

    const bidderCookie = await loginAs(bidder);
    const creatorCookie = await loginAs(creator);

    const bidId = await submitResourceBid(bidderCookie, resource.id, "Initial bid message");
    await sendResourceMessage(creatorCookie, bidId, "Thread setup message");

    const creatorConversations = await listConversations(creatorCookie);
    const conversation = creatorConversations.find(c => c.contextId === resource.id);
    expect(conversation?.conversationId).toBeTruthy();

    const upsertRes = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: bidderCookie },
      body: JSON.stringify({
        query: `
          mutation UpsertChatTypingPresence($input: UpsertChatTypingPresenceInput!) {
            upsertChatTypingPresence(input: $input) {
              chatTypingPresence {
                conversationKind
                conversationId
                accountId
                lastTypedAt
              }
            }
          }
        `,
        variables: {
          input: {
            pConversationKind: "RESOURCE",
            pConversationId: conversation?.conversationId
          }
        }
      })
    });

    const upsertJson = await upsertRes.json() as {
      data?: {
        upsertChatTypingPresence?: {
          chatTypingPresence?: {
            conversationKind: string;
            conversationId: string;
            accountId: string;
            lastTypedAt: string;
          };
        };
      };
      errors?: Array<{ message: string }>;
    };

    expect(upsertJson.errors).toBeUndefined();
    const presence = upsertJson.data?.upsertChatTypingPresence?.chatTypingPresence;
    expect(presence?.accountId).toBe(bidder.accountId);
    expect(presence?.conversationKind).toBe("RESOURCE");
    expect(isTypingSignalActive(presence?.lastTypedAt ?? "", 5000)).toBe(true);

    const db = new Client({ connectionString: TEST_DATABASE_URL });
    await db.connect();
    try {
      await db.query(
        `
          update app_public.chat_typing_presence
          set last_typed_at = now() - interval '8 seconds'
          where conversation_kind = 'resource'
            and conversation_id = $1::uuid
            and account_id = $2::uuid
        `,
        [conversation?.conversationId, bidder.accountId]
      );
    } finally {
      await db.end();
    }

    const verifyDb = new Client({ connectionString: TEST_DATABASE_URL });
    await verifyDb.connect();
    try {
      const staleResult = await verifyDb.query<{ last_typed_at: string }>(
        `
          select last_typed_at::text
          from app_public.chat_typing_presence
          where conversation_kind = 'resource'
            and conversation_id = $1::uuid
            and account_id = $2::uuid
          limit 1
        `,
        [conversation?.conversationId, bidder.accountId]
      );

      const staleLastTypedAt = staleResult.rows[0]?.last_typed_at;
      expect(staleLastTypedAt).toBeTruthy();
      expect(isTypingSignalActive(staleLastTypedAt ?? "", 5000)).toBe(false);
    } finally {
      await verifyDb.end();
    }
  });

  it("creates a chat notification payload for the recipient on incoming resource messages", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `chat-notif-creator-${stamp}@example.com`,
      displayName: "Notif Creator"
    });
    const bidder = await seedDemoAccount({
      identifier: `chat-notif-bidder-${stamp}@example.com`,
      displayName: "Notif Bidder"
    });
    const resource = await seedResource({
      creatorAccount: creator,
      title: `Realtime notif resource ${stamp}`
    });

    const bidderCookie = await loginAs(bidder);
    const creatorCookie = await loginAs(creator);

    const bidId = await submitResourceBid(bidderCookie, resource.id, "Initial bid message");
    const longBody = `${"a".repeat(120)} with trailing context`;
    await sendResourceMessage(creatorCookie, bidId, longBody);

    const db = new Client({ connectionString: TEST_DATABASE_URL });
    await db.connect();
    try {
      const notifResult = await db.query<{
        event_type: string;
        payload: {
          conversationKind?: string;
          conversationId?: string;
          contextId?: string;
          senderAccountId?: string;
          senderDisplayName?: string;
          messagePreview?: string;
        };
      }>(
        `
          select event_type, payload
          from app_public.account_notification
          where recipient_account_id = $1::uuid
            and event_type = 'chat_message_received'
          order by created_at desc
          limit 1
        `,
        [bidder.accountId]
      );

      const row = notifResult.rows[0];
      expect(row).toBeTruthy();
      expect(row.event_type).toBe("chat_message_received");
      expect(row.payload.conversationKind).toBe("resource");
      expect(row.payload.contextId).toBe(resource.id);
      expect(row.payload.senderAccountId).toBe(creator.accountId);
      expect(row.payload.senderDisplayName).toBe(creator.displayName);
      expect(row.payload.conversationId).toBeTruthy();
      expect(row.payload.messagePreview).toBe(`${"a".repeat(100)}...`);
    } finally {
      await db.end();
    }
  });
});
