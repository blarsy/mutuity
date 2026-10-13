import { randomUUID } from "node:crypto";
import { Client } from "pg";

// Function replacement and fixture setup require an explicitly selected test DB.
const databaseUrl = process.env.TEST_DATABASE_URL;
const describeDatabase = databaseUrl ? describe : describe.skip;

describeDatabase.each(["identified_account", "admin"])("claim workspace chat (%s)", role => {
  let client: Client;
  let ownerId: string;
  let peerId: string;
  let outsiderId: string;
  let needId: string;
  let claimId: string;

  async function identity(accountId: string) {
    await client.query(`set local role ${role}`);
    await client.query("select set_config('jwt.claims.role', $1, true), set_config('jwt.claims.account_id', $2, true)", [role, accountId]);
  }

  beforeEach(async () => {
    client = new Client({ connectionString: databaseUrl! });
    await client.connect();
    await client.query("begin");
    const accounts: string[] = [];
    for (let i = 0; i < 3; i++) {
      const result = await client.query("insert into app_public.account (external_subject, role_name) values ($1, $2) returning id", [`workspace-chat-${randomUUID()}@example.com`, role]);
      accounts.push(result.rows[0].id);
    }
    [ownerId, peerId, outsiderId] = accounts;
    needId = (await client.query("insert into app_public.need (creator_account_id, title, location, intensity) values ($1, 'Chat need', 'Test', 'sharing') returning id", [ownerId])).rows[0].id;
    claimId = (await client.query("insert into app_public.need_claim (need_id, claimer_account_id, message) values ($1, $2, 'Can help') returning id", [needId, peerId])).rows[0].id;
  });

  afterEach(async () => {
    if (client) {
      try { await client.query("rollback"); } finally { await client.end(); }
    }
  });

  it.each(["open", "settled", "declined", "withdrawn", "expired"])("allows the owner to create and both participants to reply on %s claims", async status => {
    await client.query("update app_public.need_claim set status=$1 where id=$2", [status, claimId]);
    await identity(ownerId);
    const first = (await client.query("select * from app_public.send_claim_message($1, '  Hello  ', $2::text[])", [claimId, ["https://example.com/image.png"]])).rows[0];
    expect(first).toMatchObject({ sender_account_id: ownerId, body: "Hello" });
    const seeded = await client.query("select body, sender_account_id from app_public.claim_message where conversation_id=$1 order by created_at", [first.conversation_id]);
    expect(seeded.rows).toEqual(expect.arrayContaining([{ body: "Can help", sender_account_id: peerId }, { body: "Hello", sender_account_id: ownerId }]));
    expect((await client.query("select image_url from app_public.claim_message_image where message_id=$1", [first.id])).rows).toEqual([{ image_url: "https://example.com/image.png" }]);
    for (const accountId of [peerId, ownerId]) {
      await identity(accountId);
      const reply = await client.query("select * from app_public.send_claim_conversation_message($1, 'Reply', array[]::text[])", [first.conversation_id]);
      expect(reply.rows[0]).toMatchObject({ conversation_id: first.conversation_id, sender_account_id: accountId });
    }
  });

  it.each([false, true])("reuses participant-pair conversations independently of the claim FK (attached: %s)", async attached => {
    const linkedClaimId = attached ? claimId : null;
    const conversationId = (await client.query("insert into app_public.claim_conversation (need_id, creator_account_id, claimer_account_id, need_claim_id) values ($1, $2, $3, $4) returning id", [needId, ownerId, peerId, linkedClaimId])).rows[0].id;
    for (const accountId of [ownerId, peerId]) {
      await identity(accountId);
      const message = await client.query("select * from app_public.send_claim_message($1, 'Existing thread', array[]::text[])", [claimId]);
      expect(message.rows[0].conversation_id).toBe(conversationId);
    }
    expect((await client.query("select count(*)::int as count from app_public.claim_conversation where need_id=$1", [needId])).rows[0].count).toBe(1);
  });

  it("still denies outsiders, unauthenticated callers and empty messages", async () => {
    for (const [accountId, body, message] of [
      [outsiderId, "Intrusion", "Only claim participants can send messages"],
      ["", "Intrusion", "Authentication required"],
      [ownerId, "  ", "Message body is required"]
    ]) {
      await identity(accountId);
      await client.query("savepoint denied");
      await expect(client.query("select app_public.send_claim_message($1, $2, array[]::text[])", [claimId, body])).rejects.toMatchObject({ message });
      await client.query("rollback to savepoint denied");
      await client.query("release savepoint denied");
    }
    await identity(ownerId);
    expect((await client.query("select count(*)::int as count from app_public.claim_conversation where need_id=$1", [needId])).rows[0].count).toBe(0);
  });
});