import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";

const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ??
  "postgres://postgres:postgres@localhost:5432/mutuity";
const migration = readFileSync(path.join(__dirname, "../../../database/migrations/160_claim_lifecycle_notification_payloads.sql"), "utf8");
const events = ["claim_created", "claim_settled", "claim_declined", "claim_withdrawn", "claim_expired",
  "claim_need_deactivated", "need_expired_claims_declined"];

// Owner connection required for fixtures/SET ROLE. Every test rolls back all changes.
describe("claim notification title payloads", () => {
  let client: Client;
  let creator: string;
  let claimer: string;
  let otherClaimer: string;
  let outsider: string;
  let needId: string;
  let claimId: string;
  const title = "Réparer le jardin partagé";

  async function insertId(sql: string, values: unknown[]): Promise<string> {
    return (await client.query<{ id: string }>(sql, values)).rows[0].id;
  }

  async function asAccount(accountId: string) {
    await client.query("set local role identified_account");
    await client.query("select set_config('jwt.claims.account_id', $1, true)", [accountId]);
    await client.query("select set_config('jwt.claims.role', 'identified_account', true)");
  }

  async function notifications() {
    await client.query("reset role");
    return (await client.query<{
      recipient_account_id: string; need_claim_id: string; event_type: string; payload: Record<string, unknown>;
    }>(`select recipient_account_id, need_claim_id, event_type, payload
        from app_public.need_claim_notification where need_claim_id in
        (select id from app_public.need_claim where need_id = $1)`, [needId])).rows;
  }

  beforeEach(async () => {
    client = new Client({ connectionString: databaseUrl });
    await client.connect();
    await client.query("begin");
    const accounts: string[] = [];
    for (let i = 0; i < 4; i++) {
      accounts.push(await insertId(`insert into app_public.account (external_subject, display_name)
        values ($1, 'Notification fixture') returning id`, [`notification-${randomUUID()}@example.com`]));
    }
    [creator, claimer, otherClaimer, outsider] = accounts;
    needId = await insertId(`insert into app_public.need
      (creator_account_id, title, location, intensity, proposed_topes_amount)
      values ($1, $2, 'Test', 'sharing', 0) returning id`, [creator, title]);
    claimId = await insertId(`insert into app_public.need_claim (need_id, claimer_account_id)
      values ($1, $2) returning id`, [needId, claimer]);
  });

  afterEach(async () => {
    try {
      await client.query("rollback");
    } finally {
      await client.end();
    }
  });

  it.each([
    ["cancel_need_claim", "claim_withdrawn", "claimer"],
    ["decline_need_claim", "claim_declined", "creator"]
  ])("%s includes the title, keeps the recipient and remains idempotent", async (fn, event, actor) => {
    await asAccount(actor === "claimer" ? claimer : creator);
    await client.query(`select app_public.${fn}($1)`, [claimId]);
    await client.query(`select app_public.${fn}($1)`, [claimId]);
    const rows = await notifications();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      event_type: event, recipient_account_id: actor === "claimer" ? creator : claimer,
      payload: { needId, needName: title }
    });
    if (event === "claim_withdrawn") expect(rows[0].payload.claimerAccountId).toBe(claimer);
  });

  it("includes the title for both the settled and sibling-declined claim", async () => {
    const sibling = await insertId(`insert into app_public.need_claim (need_id, claimer_account_id)
      values ($1, $2) returning id`, [needId, otherClaimer]);
    await asAccount(creator);
    await client.query("select app_public.settle_need_claim($1)", [claimId]);
    await client.query("select app_public.settle_need_claim($1)", [claimId]);
    const rows = await notifications();
    expect(rows).toHaveLength(2);
    expect(rows).toEqual(expect.arrayContaining([
      expect.objectContaining({ event_type: "claim_settled", recipient_account_id: claimer,
        payload: { needId, needName: title, topesAmount: 0 } }),
      expect.objectContaining({ event_type: "claim_declined", need_claim_id: sibling,
        recipient_account_id: otherClaimer, payload: { needId, needName: title, settledClaimId: claimId } })
    ]));
  });

  it("includes the title when creating a claim", async () => {
    await asAccount(otherClaimer);
    await client.query("select app_public.claim_need($1, 'I can help')", [needId]);
    expect(await notifications()).toEqual(expect.arrayContaining([
      expect.objectContaining({ event_type: "claim_created", recipient_account_id: creator,
        payload: expect.objectContaining({ needId, needName: title }) })
    ]));
  });

  it.each(["need_expired", "need_deactivated"])("includes titles for %s notifications without duplicate summaries", async reason => {
    await insertId(`insert into app_public.need_claim (need_id, claimer_account_id)
      values ($1, $2) returning id`, [needId, otherClaimer]);
    expect((await client.query("select app_private.decline_open_claims_on_need($1, $2) as count", [needId, reason])).rows[0].count).toBe(2);
    expect((await client.query("select app_private.decline_open_claims_on_need($1, $2) as count", [needId, reason])).rows[0].count).toBe(0);
    const rows = await notifications();
    expect(rows).toHaveLength(reason === "need_expired" ? 3 : 2);
    const individual = rows.filter(row => row.event_type !== "need_expired_claims_declined");
    expect(individual.map(row => row.recipient_account_id).sort()).toEqual([claimer, otherClaimer].sort());
    for (const row of individual) {
      expect(row.event_type).toBe(reason === "need_expired" ? "claim_expired" : "claim_need_deactivated");
      expect(row.payload).toEqual({ needId, needName: title, reason });
    }
    if (reason === "need_expired") expect(rows.find(row => row.event_type === "need_expired_claims_declined"))
      .toMatchObject({ recipient_account_id: creator, payload: { needId, needName: title, declinedCount: 2 } });
  });

  it("includes the title through the actual need-deactivation trigger", async () => {
    await client.query("update app_public.need set is_active = false where id = $1", [needId]);
    expect(await notifications()).toEqual([
      expect.objectContaining({ event_type: "claim_need_deactivated", recipient_account_id: claimer,
        payload: { needId, needName: title, reason: "need_deactivated" } })
    ]);
  });

  it.each(["cancel_need_claim", "decline_need_claim", "settle_need_claim"])(
    "%s still rejects nonparticipants without creating notifications", async fn => {
      await asAccount(outsider);
      await client.query("savepoint denied_action");
      await expect(client.query(`select app_public.${fn}($1)`, [claimId])).rejects.toThrow(/Only/);
      await client.query("rollback to savepoint denied_action");
      expect(await notifications()).toHaveLength(0);
    }
  );

  it("migration backfills existing rows safely, preserves snapshot titles/fields/read state and is repeatable", async () => {
    const ids: string[] = [];
    for (const event of events) {
      for (const missing of [{}, { needName: null }, { needName: " \t " }]) {
        ids.push(await insertId(`insert into app_public.need_claim_notification
          (recipient_account_id, need_claim_id, event_type, payload, read_at)
          values ($1, $2, $3, $4::jsonb, now()) returning id`,
        [claimer, claimId, event, JSON.stringify({ ...missing, needId: "not-a-uuid", retained: 42 })]));
      }
    }
    const snapshotId = await insertId(`insert into app_public.need_claim_notification
      (recipient_account_id, need_claim_id, event_type, payload) values ($1, $2, 'claim_created', $3::jsonb) returning id`,
    [claimer, claimId, JSON.stringify({ needName: "Original title", retained: 7 })]);
    const unknownId = await insertId(`insert into app_public.need_claim_notification
      (recipient_account_id, need_claim_id, event_type, payload) values ($1, $2, 'future_event', '{}'::jsonb) returning id`, [claimer, claimId]);
    const arrayId = await insertId(`insert into app_public.need_claim_notification
      (recipient_account_id, need_claim_id, event_type, payload) values ($1, $2, 'claim_declined', '[]'::jsonb) returning id`, [claimer, claimId]);
    // Strip only the transaction wrapper so the migration runs within this test's rollback transaction.
    const sql = migration.replace(/^begin;\s*/, "").replace(/commit;\s*$/, "");
    await client.query(sql);
    await client.query(sql);
    const rows = (await client.query(`select id, payload, recipient_account_id, read_at
      from app_public.need_claim_notification where need_claim_id = $1`, [claimId])).rows;
    for (const id of ids) {
      expect(rows.find(row => row.id === id)).toMatchObject({ recipient_account_id: claimer,
        payload: { needId: "not-a-uuid", retained: 42, needName: title }, read_at: expect.any(Date) });
    }
    expect(rows.find(row => row.id === snapshotId).payload).toEqual({ needName: "Original title", retained: 7 });
    expect(rows.find(row => row.id === unknownId).payload).toEqual({});
    expect(rows.find(row => row.id === arrayId).payload).toEqual([]);
  });

  it("migration definitions match the canonical sources", () => {
    for (const fn of ["cancel_need_claim", "decline_need_claim", "decline_open_claims_on_need", "settle_need_claim"]) {
      const canonical = readFileSync(path.join(__dirname, `../../../database/functions/claim/${fn}.sql`), "utf8").trim();
      expect(migration).toContain(canonical);
    }
  });
});