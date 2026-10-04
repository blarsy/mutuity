import { randomUUID } from "node:crypto";
import { Client } from "pg";

const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ??
  "postgres://postgres:postgres@localhost:5432/mutuity";

// The fixture connection must be a migration/test owner able to SET ROLE.
// All fixtures, preference writes, trigger effects and NOTIFYs are rolled back.
describe("admin scoped ordinary-user access", () => {
  let client: Client;
  let adminId: string;
  let otherId: string;
  let outsiderId: string;
  let ids: Record<string, string[]>;

  async function insertId(sql: string, values: unknown[] = []): Promise<string> {
    const result = await client.query<{ id: string }>(sql, values);
    return result.rows[0].id;
  }

  async function denied(sql: string, values: unknown[] = []) {
    await client.query("savepoint denied_operation");
    try {
      await expect(client.query(sql, values)).rejects.toMatchObject({ code: "42501" });
    } finally {
      await client.query("rollback to savepoint denied_operation");
      await client.query("release savepoint denied_operation");
    }
  }

  beforeEach(async () => {
    client = new Client({ connectionString: databaseUrl });
    await client.connect();
    await client.query("begin");
    ids = {};
    const accounts: string[] = [];
    for (const role of ["admin", "identified_account", "identified_account"]) {
      accounts.push(await insertId(
        `insert into app_public.account (external_subject, display_name, role_name)
         values ($1, 'Scoped access fixture', $2) returning id`,
        [`scoped-${randomUUID()}@example.com`, role]
      ));
    }
    [adminId, otherId, outsiderId] = accounts;

    // Admin is the creator in exchange 1, the counterpart in exchange 2,
    // and unrelated to exchange 3. Every SELECT asserts both directions.
    for (const [creatorId, participantId] of [
      [adminId, otherId], [otherId, adminId], [otherId, outsiderId]
    ]) {
      const resourceId = await insertId(
        `insert into app_public.resource (creator_account_id, title, location, intensity)
         values ($1, 'Scoped resource', 'Test', 'sharing') returning id`, [creatorId]
      );
      const bidId = await insertId(
        `insert into app_public.resource_bid (resource_id, bidder_account_id)
         values ($1, $2) returning id`, [resourceId, participantId]
      );
      const campaignId = await insertId(
        `insert into app_public.campaign
           (creator_account_id, title, theme, rewards_multiplier, airdrop_amount, start_at, airdrop_at, end_at)
          values ($1, 'Scoped campaign', 'test', 5, 3000, now(), now(), now() + interval '2 days')
         returning id`, [participantId]
      );
      await client.query(
        `insert into app_public.campaign_resource (campaign_id, resource_id) values ($1, $2)`,
        [campaignId, resourceId]
      );
      const needId = await insertId(
        `insert into app_public.need (creator_account_id, title, location, intensity)
         values ($1, 'Scoped need', 'Test', 'sharing') returning id`, [creatorId]
      );
      const claimId = await insertId(
        `insert into app_public.need_claim (need_id, claimer_account_id)
         values ($1, $2) returning id`, [needId, participantId]
      );
      const conversationId = await insertId(
        `insert into app_public.claim_conversation
           (need_claim_id, need_id, creator_account_id, claimer_account_id)
         values ($1, $2, $3, $4) returning id`, [claimId, needId, creatorId, participantId]
      );
      const messageId = await insertId(
        `insert into app_public.claim_message (conversation_id, sender_account_id, body)
         values ($1, $2, 'Scoped message') returning id`, [conversationId, participantId]
      );
      const imageId = await insertId(
        `insert into app_public.claim_message_image (message_id, image_url)
         values ($1, 'https://example.com/test.png') returning id`, [messageId]
      );
      const settlementId = await insertId(
        `insert into app_public.need_claim_settlement_event
           (need_claim_id, need_id, settled_by_account_id, claimer_account_id)
         values ($1, $2, $3, $4) returning id`, [claimId, needId, creatorId, participantId]
      );
      for (const [table, id] of Object.entries({
        resource_bid: bidId, campaign_resource: resourceId, need_claim: claimId,
        claim_conversation: conversationId, claim_message: messageId,
        claim_message_image: imageId, need_claim_settlement_event: settlementId
      })) {
        (ids[table] ??= []).push(id);
      }
    }
    for (const accountId of accounts) {
      (ids.token_movement ??= []).push(await insertId(
        `insert into app_public.token_movement (account_id, event_type, amount_delta)
         values ($1, 'test_scoped_access', 1) returning id`, [accountId]
      ));
      await client.query(
        `insert into app_public.account_delivery_preference (account_id, event_category)
         values ($1, 'new_resource_added')`, [accountId]
      );
      (ids.account_notification ??= []).push(await insertId(
        `insert into app_public.account_notification (recipient_account_id, event_type)
         values ($1, 'test_scoped_access') returning id`, [accountId]
      ));
      (ids.need_claim_notification ??= []).push(await insertId(
        `insert into app_public.need_claim_notification (recipient_account_id, need_claim_id, event_type)
         values ($1, $2, 'claim_created') returning id`, [accountId, ids.need_claim[0]]
      ));
      (ids.resource_bid_notification ??= []).push(await insertId(
        `insert into app_public.resource_bid_notification (recipient_account_id, resource_bid_id, event_type)
         values ($1, $2, 'resource_bid_created') returning id`, [accountId, ids.resource_bid[0]]
      ));
    }
    await client.query("set local role admin");
    await client.query("select set_config('jwt.claims.role', 'admin', true)");
    await client.query("select set_config('jwt.claims.account_id', $1, true)", [adminId]);
  });

  afterEach(async () => {
    if (client) {
      try {
        await client.query("rollback");
      } finally {
        await client.end();
      }
    }
  });

  it.each([
    "resource_bid", "campaign_resource", "need_claim", "claim_conversation",
    "claim_message", "claim_message_image", "need_claim_settlement_event"
  ])("reads %s only when the admin is a participant", async table => {
    const key = table === "campaign_resource" ? "resource_id" : "id";
    const result = await client.query<{ id: string }>(
      `select ${key} as id from app_public.${table} where ${key} = any($1::uuid[])`, [ids[table]]
    );
    expect(result.rows.map(row => row.id).sort()).toEqual(ids[table].slice(0, 2).sort());
    // No account identity must not make the admin role a blanket read bypass.
    await client.query("select set_config('jwt.claims.account_id', '', true)");
    expect((await client.query(
      `select ${key} from app_public.${table} where ${key} = any($1::uuid[])`, [ids[table]]
    )).rowCount).toBe(0);
  });

  it("reads only the admin's own ledger", async () => {
    const result = await client.query<{ id: string }>(
      "select id from app_public.token_movement where id = any($1::uuid[])", [ids.token_movement]
    );
    expect(result.rows.map(row => row.id)).toEqual([ids.token_movement[0]]);
    await client.query("select set_config('jwt.claims.account_id', '', true)");
    expect((await client.query("select id from app_public.token_movement where id=any($1::uuid[])",
      [ids.token_movement])).rowCount).toBe(0);
  });

  it.each(["account_notification", "need_claim_notification", "resource_bid_notification"])(
    "isolates %s reads and writes to the recipient, including WITH CHECK", async table => {
      const result = await client.query<{ id: string }>(
        `select id from app_public.${table} where id=any($1::uuid[])`, [ids[table]]
      );
      expect(result.rows.map(row => row.id)).toEqual([ids[table][0]]);
      expect((await client.query(`update app_public.${table} set read_at=now() where id=$1 returning id`,
        [ids[table][0]])).rowCount).toBe(1);
      expect((await client.query(`update app_public.${table} set read_at=now() where id=$1 returning id`,
        [ids[table][1]])).rowCount).toBe(0);
      await denied(`update app_public.${table} set recipient_account_id=$1 where id=$2`, [otherId, ids[table][0]]);
      await client.query("select set_config('jwt.claims.account_id', '', true)");
      expect((await client.query(`select id from app_public.${table} where id=any($1::uuid[])`, [ids[table]])).rowCount).toBe(0);
      expect((await client.query(`update app_public.${table} set read_at=now() where id=$1 returning id`,
        [ids[table][0]])).rowCount).toBe(0);
    }
  );

  it("reads, inserts and updates own preferences, but cannot access or transfer another account's", async () => {
    const visible = await client.query<{ account_id: string }>(
      "select account_id from app_public.account_delivery_preference where account_id = any($1::uuid[])",
      [[adminId, otherId, outsiderId]]
    );
    expect(visible.rows.map(row => row.account_id)).toEqual([adminId]);
    expect((await client.query(
      `insert into app_public.account_delivery_preference (account_id, event_category)
       values ($1, 'new_need_added') returning account_id`, [adminId]
    )).rowCount).toBe(1);
    expect((await client.query(
      `update app_public.account_delivery_preference set delivery_strategy = 'email_summary'
       where account_id = $1 returning account_id`, [adminId]
    )).rowCount).toBe(2);
    expect((await client.query(
      `update app_public.account_delivery_preference set delivery_strategy = 'email_summary'
       where account_id = $1 returning account_id`, [otherId]
    )).rowCount).toBe(0);
    await denied(
      `insert into app_public.account_delivery_preference (account_id, event_category)
       values ($1, 'new_need_added')`, [otherId]
    );
    await denied(
      `update app_public.account_delivery_preference set account_id = $1
       where account_id = $2 and event_category = 'new_need_added'`, [otherId, adminId]
    );
  });

  it("does not add role inheritance or raw claim/chat/ledger/link writes", async () => {
    const roles = await client.query(
      `select pg_has_role('admin', 'identified_account', 'MEMBER') as inherits,
              pg_has_role('identified_account', 'admin', 'MEMBER') as reverse`
    );
    expect(roles.rows[0]).toEqual({ inherits: false, reverse: false });
    for (const table of [
      "resource_bid", "token_movement", "campaign_resource", "need_claim",
      "claim_conversation", "claim_message", "claim_message_image", "need_claim_settlement_event"
    ]) {
      for (const privilege of ["INSERT", "UPDATE", "TRUNCATE", "REFERENCES", "TRIGGER"]) {
        const result = await client.query(
          "select has_table_privilege('admin', $1, $2) as allowed", [`app_public.${table}`, privilege]
        );
        expect({ table, privilege, allowed: result.rows[0].allowed }).toEqual({ table, privilege, allowed: false });
      }
    }
    await denied("update app_public.claim_message set body = 'Not allowed' where id = $1", [ids.claim_message[0]]);
    await denied("update app_public.need_claim set status = 'settled' where id = $1", [ids.need_claim[0]]);
    await denied("delete from app_public.campaign_resource where resource_id=$1", [ids.campaign_resource[0]]);
    await denied("delete from app_public.account_delivery_preference where account_id = $1", [adminId]);
  });

  it("keeps campaign-resource triage protected even under hypothetical inheritance", async () => {
    await client.query("reset role");
    await client.query("grant identified_account to admin with inherit true, set false");
    await client.query("set local role admin");

    // Private participant reads stay isolated under hypothetical inheritance.
    const bids = await client.query<{ id: string }>(
      "select id from app_public.resource_bid where id=any($1::uuid[])", [ids.resource_bid]
    );
    expect(bids.rows.map(row => row.id).sort()).toEqual(ids.resource_bid.slice(0, 2).sort());
    await denied("update app_public.claim_message set body='Forged' where id=$1", [ids.claim_message[0]]);

    // The formerly reproduced decision-reversal bypass must now be denied.
    const link = await client.query(
      "select campaign_id from app_public.campaign_resource where resource_id=$1", [ids.campaign_resource[1]]
    );
    await client.query("select app_public.accept_campaign_resource($1, $2)",
      [link.rows[0].campaign_id, ids.campaign_resource[1]]);
    await denied(
      `update app_public.campaign_resource set status='rejected'
       where campaign_id=$1 and resource_id=$2`,
      [link.rows[0].campaign_id, ids.campaign_resource[1]]
    );
    const state = await client.query("select status,acted_by_account_id from app_public.campaign_resource where resource_id=$1",
      [ids.campaign_resource[1]]);
    expect(state.rows[0]).toEqual({ status: 'accepted', acted_by_account_id: adminId });
  });
});