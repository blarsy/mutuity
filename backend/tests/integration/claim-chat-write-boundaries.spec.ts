import { randomUUID } from "node:crypto";
import { Client } from "pg";

const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ??
  "postgres://postgres:postgres@localhost:5432/mutuity";
const tables = ["need_claim", "claim_conversation", "claim_message", "claim_message_image",
  "resource_conversation", "resource_message", "resource_message_image", "chat_typing_presence"];

describe.each(["identified_account", "admin"])("function-only claim/chat writes (%s)", role => {
  let client: Client;
  let ownerId: string;
  let peerId: string;
  let outsiderId: string;
  let needId: string;
  let resourceId: string;
  let claimConversationId: string;
  let resourceConversationId: string;

  async function id(sql: string, values: unknown[] = []): Promise<string> {
    return (await client.query<{ id: string }>(sql, values)).rows[0].id;
  }
  async function identity(accountId: string) {
    await client.query(`set local role ${role}`);
    await client.query("select set_config('jwt.claims.role', $1, true)", [role]);
    await client.query("select set_config('jwt.claims.account_id', $1, true)", [accountId]);
  }
  async function reject(sql: string, values: unknown[], expected: object) {
    await client.query("savepoint rejected_write");
    try {
      await expect(client.query(sql, values)).rejects.toMatchObject(expected);
    } finally {
      await client.query("rollback to savepoint rejected_write");
      await client.query("release savepoint rejected_write");
    }
  }
  beforeEach(async () => {
    client = new Client({ connectionString: databaseUrl });
    await client.connect();
    await client.query("begin");
    const accounts: string[] = [];
    for (let i = 0; i < 3; i++) {
      accounts.push(await id(
        `insert into app_public.account (external_subject, role_name) values ($1, $2) returning id`,
        [`write-boundary-${randomUUID()}@example.com`, role]
      ));
    }
    [ownerId, peerId, outsiderId] = accounts;
    needId = await id(
      `insert into app_public.need (creator_account_id, title, location, intensity)
       values ($1, 'Write test need', 'Test', 'sharing') returning id`, [ownerId]
    );
    resourceId = await id(
      `insert into app_public.resource (creator_account_id, title, location, intensity)
       values ($1, 'Write test resource', 'Test', 'sharing') returning id`, [ownerId]
    );
    // Pre-claim/pre-bid threads ensure owners can reply before an exchange exists.
    claimConversationId = await id(
      `insert into app_public.claim_conversation (need_id, creator_account_id, claimer_account_id)
       values ($1, $2, $3) returning id`, [needId, ownerId, peerId]
    );
    resourceConversationId = await id(
      `insert into app_public.resource_conversation (resource_id, owner_account_id, bidder_account_id)
       values ($1, $2, $3) returning id`, [resourceId, ownerId, peerId]
    );
    await identity(ownerId);
  });
  afterEach(async () => {
    if (client) {
      try { await client.query("rollback"); } finally { await client.end(); }
    }
  });

  it("blocks raw writes on every claim/chat table, including own rows", async () => {
    for (const table of tables) {
      for (const privilege of ["INSERT", "UPDATE", "DELETE", "TRUNCATE", "REFERENCES", "TRIGGER"]) {
        const result = await client.query("select has_table_privilege(current_user, $1, $2) as allowed",
          [`app_public.${table}`, privilege]);
        expect({ table, privilege, allowed: result.rows[0].allowed }).toEqual({ table, privilege, allowed: false });
      }
      await reject(`insert into app_public.${table} default values`, [], { code: "42501" });
    }
    await reject("update app_public.claim_message set body = 'Forged'", [], { code: "42501" });
    await reject("update app_public.resource_message set body = 'Forged'", [], { code: "42501" });
    await reject("update app_public.need_claim set status = 'settled'", [], { code: "42501" });
  });

  it.each(["claim", "resource"])("allows both participants to send %s messages and images atomically", async kind => {
    const conversationId = kind === "claim" ? claimConversationId : resourceConversationId;
    const messages: string[] = [];
    for (const accountId of [ownerId, peerId]) {
      await identity(accountId);
      const result = await client.query(
        `select * from app_public.send_${kind}_conversation_message($1, $2, $3::text[])`,
        [conversationId, "  Hello  ", [" https://example.com/a.png ", "", "https://example.com/b.png"]]
      );
      expect(result.rows[0]).toMatchObject({ conversation_id: conversationId, sender_account_id: accountId, body: "Hello" });
      messages.push(result.rows[0].id);
      const images = await client.query(
        `select image_url, sort_order from app_public.${kind}_message_image where message_id = $1 order by sort_order`,
        [result.rows[0].id]
      );
      expect(images.rows).toEqual([
        { image_url: "https://example.com/a.png", sort_order: 0 },
        { image_url: "https://example.com/b.png", sort_order: 1 }
      ]);
      const typingKind = kind === "claim" ? "need" : "resource";
      expect((await client.query("select * from app_public.upsert_chat_typing_presence($1, $2)",
        [typingKind, conversationId])).rows[0].account_id).toBe(accountId);
    }
    const marked = await client.query(`select app_public.mark_${kind}_messages_read($1) as count`, [conversationId]);
    expect(marked.rows[0].count).toBe(1);
    const state = await client.query(`select id, read_at from app_public.${kind}_message where id = any($1::uuid[])`, [messages]);
    expect(state.rows.find(row => row.id === messages[0]).read_at).not.toBeNull();
    expect(state.rows.find(row => row.id === messages[1]).read_at).toBeNull();
  });

  it.each(["claim", "resource"])("rejects outsiders, missing identities and empty bodies for %s threads", async kind => {
    const conversationId = kind === "claim" ? claimConversationId : resourceConversationId;
    const send = `select * from app_public.send_${kind}_conversation_message($1, $2, $3::text[])`;
    await identity(outsiderId);
    await reject(send, [conversationId, "Intrusion", []], { code: "P0001", message: expect.stringContaining("participants") });
    await reject(`select app_public.mark_${kind}_messages_read($1)`, [conversationId],
      { code: "P0001", message: expect.stringContaining("participants") });
    await reject("select app_public.upsert_chat_typing_presence($1, $2)",
      [kind === "claim" ? "need" : "resource", conversationId], { code: "P0001", message: expect.stringContaining("participants") });
    await identity("");
    await reject(send, [conversationId, "No identity", []], { code: "P0001", message: "Authentication required" });
    await identity(ownerId);
    await reject(send, [conversationId, "  ", []], { code: "P0001", message: "Message body is required" });
    expect((await client.query(`select count(*)::int as count from app_public.${kind}_message where conversation_id=$1`,
      [conversationId])).rows[0].count).toBe(0);
  });

  it("keeps claim creation and owner-only settlement behind functions", async () => {
    await identity(peerId);
    const claimId = await id("select * from app_public.claim_need($1, 'Can help')", [needId]);
    const claim = await client.query("select * from app_public.need_claim where id=$1", [claimId]);
    expect(claim.rows[0].claimer_account_id).toBe(peerId);
    await identity(outsiderId);
    await reject("select app_public.settle_need_claim($1)", [claimId],
      { code: "P0001", message: "Only need creator can settle claims" });
    await identity(ownerId);
    expect((await client.query("select * from app_public.settle_need_claim($1)", [claimId])).rows[0].status).toBe("settled");
    expect((await client.query("select count(*)::int as count from app_public.need_claim_settlement_event where need_claim_id=$1",
      [claimId])).rows[0].count).toBe(1);
  });

  it.each(["cancel", "decline"])("keeps %s claim authorization intact without raw writes", async action => {
    await identity(peerId);
    const claimId = await id("select * from app_public.claim_need($1, 'Can help')", [needId]);
    await identity(outsiderId);
    await reject(`select app_public.${action}_need_claim($1)`, [claimId],
      { code: "P0001", message: expect.stringContaining(action === "cancel" ? "claimer" : "creator") });
    await identity(action === "cancel" ? peerId : ownerId);
    expect((await client.query(`select * from app_public.${action}_need_claim($1)`, [claimId])).rows[0].status)
      .toBe(action === "cancel" ? "withdrawn" : "declined");
    const reply = await client.query("select * from app_public.send_claim_conversation_message($1, 'Closed thread', array[]::text[])",
      [claimConversationId]);
    expect(reply.rows[0]).toMatchObject({ conversation_id: claimConversationId, body: "Closed thread" });
  });

  it("keeps existing entry-point and exchange messaging functions executable", async () => {
    await identity(peerId);
    expect((await client.query("select * from app_public.send_need_message($1, 'First contact', array[]::text[])",
      [needId])).rows[0].sender_account_id).toBe(peerId);
    expect((await client.query("select * from app_public.send_resource_message_direct($1, $2, 'First contact', array[]::text[])",
      [resourceId, ownerId])).rows[0].sender_account_id).toBe(peerId);
    const claimId = await id("select * from app_public.claim_need($1, null)", [needId]);
    expect((await client.query("select * from app_public.send_claim_message($1, 'Claim chat', array[]::text[])",
      [claimId])).rows[0].sender_account_id).toBe(peerId);
    await identity(outsiderId);
    await reject("select app_public.send_claim_message($1, 'Intrusion', array[]::text[])", [claimId],
      { code: "P0001", message: "Only claim participants can send messages" });
  });

  it("isolates thread, message, image and typing reads even for nonparticipant admins", async () => {
    for (const kind of ["claim", "resource"]) {
      const conversationId = kind === "claim" ? claimConversationId : resourceConversationId;
      const messageId = await id(`select * from app_public.send_${kind}_conversation_message($1, 'Private preview', $2::text[])`,
        [conversationId, ["https://example.com/private.png"]]);
      await client.query("select app_public.upsert_chat_typing_presence($1, $2)",
        [kind === "claim" ? "need" : "resource", conversationId]);
      for (const accountId of [ownerId, peerId, outsiderId, ""]) {
        await identity(accountId);
        const expected = accountId === ownerId || accountId === peerId ? 1 : 0;
        expect((await client.query(`select id from app_public.${kind}_conversation where id=$1`, [conversationId])).rowCount).toBe(expected);
        expect((await client.query(`select id from app_public.${kind}_message where conversation_id=$1`, [conversationId])).rowCount).toBe(expected);
        expect((await client.query(
          `select id from app_public.${kind}_message_image where message_id=$1`, [messageId])).rowCount).toBe(expected);
        expect((await client.query("select account_id from app_public.chat_typing_presence where conversation_id=$1",
          [conversationId])).rowCount).toBe(expected);
      }
      await identity(ownerId);
    }
  });

  it("blocks direct summary-view access but keeps listing, search and counts scoped", async () => {
    await client.query("select app_public.send_claim_conversation_message($1, 'Private preview', array[]::text[])", [claimConversationId]);
    await client.query("select app_public.send_resource_conversation_message($1, 'Private preview', array[]::text[])", [resourceConversationId]);
    for (const accountId of [ownerId, peerId, outsiderId]) {
      await identity(accountId);
      await reject("select * from app_public.chat_conversation_summary", [], { code: "42501" });
      const expected = accountId === outsiderId ? [] : [claimConversationId, resourceConversationId].sort();
      const listed = await client.query("select * from app_public.list_chat_conversations(null, 100, 0)");
      expect(listed.rows.map(row => row.conversation_id).sort()).toEqual(expected);
      const searched = await client.query("select * from app_public.list_chat_conversations('Private preview', 100, 0)");
      expect(searched.rows.map(row => row.conversation_id).sort()).toEqual(expected);
      expect((await client.query("select app_public.count_chat_conversations(null) as count")).rows[0].count).toBe(expected.length);
      expect((await client.query("select app_public.count_unread_chat_conversations() as count")).rows[0].count)
        .toBe(accountId === peerId ? 2 : 0);
    }
    await client.query("set local role anonymous");
    await client.query("select set_config('jwt.claims.role', 'anonymous', true)");
    await client.query("select set_config('jwt.claims.account_id', '', true)");
    await reject("select * from app_public.chat_conversation_summary", [], { code: "42501" });
  });

  it("fails closed under RLS if claim/chat write privileges are accidentally restored", async () => {
    // Transaction-local GRANTs only, rolled back in afterEach. This independently
    // exercises RLS rather than relying on migration 156's privilege denial.
    await client.query("reset role");
    await client.query(`grant insert, update on ${tables.map(table => `app_public.${table}`).join(", ")} to ${role}`);
    await identity(ownerId);
    await reject("insert into app_public.need_claim (need_id, claimer_account_id) values ($1, $2)",
      [needId, peerId], { code: "42501", message: expect.stringContaining("row-level security") });
    await reject("insert into app_public.claim_message (conversation_id, sender_account_id, body) values ($1, $2, 'Forged')",
      [claimConversationId, ownerId], { code: "42501", message: expect.stringContaining("row-level security") });
    await reject("insert into app_public.resource_message (conversation_id, sender_account_id, body) values ($1, $2, 'Forged')",
      [resourceConversationId, ownerId], { code: "42501", message: expect.stringContaining("row-level security") });
    const messageId = await id("select * from app_public.send_claim_conversation_message($1, 'Original', array[]::text[])",
      [claimConversationId]);
    expect((await client.query("update app_public.claim_message set body='Forged' where id=$1 returning id", [messageId])).rowCount).toBe(0);
    expect((await client.query("select body from app_public.claim_message where id=$1", [messageId])).rows[0].body).toBe("Original");
  });
});