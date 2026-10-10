import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Client, Pool } from "pg";
import { createPostGraphileSchema } from "postgraphile";
import { GraphQLEnumType } from "graphql";

const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ??
  "postgres://postgres:postgres@localhost:5432/mutuity";
const root = path.join(__dirname, "../../../database");
const migration = readFileSync(path.join(root, "migrations/161_notification_realtime_foundation.sql"), "utf8");
const sources = ["account_notification", "need_claim_notification", "resource_bid_notification"] as const;
type Source = typeof sources[number];
type Signal = { channel: string; payload: { relatedNodeId: string | null } };

jest.setTimeout(30000);

// Local/disposable owner connection required (SET ROLE + transactional DDL).
// No fixture commits: capture the real helper's channel/payload arguments at
// pg_notify's boundary, still call pg_notify, and roll everything back.
describe("notification realtime foundation", () => {
  let client: Client;
  let recipient: string;
  let participant: string;
  let outsider: string;
  let claimId: string;
  let bidId: string;
  let received: unknown[];

  async function insertId(sql: string, values: unknown[] = []): Promise<string> {
    return (await client.query<{ id: string }>(sql, values)).rows[0].id;
  }

  async function asAccount(id: string, role = "identified_account") {
    await client.query(`set local role ${role}`);
    await client.query("select set_config('jwt.claims.account_id', $1, true)", [id]);
    await client.query("select set_config('jwt.claims.role', $1, true)", [role]);
  }

  async function clearSignals() {
    await client.query("reset role");
    await client.query("truncate pg_temp.realtime_signals");
  }

  async function signals(): Promise<Signal[]> {
    await client.query("reset role");
    return (await client.query<Signal>("select channel, payload from pg_temp.realtime_signals order by sequence")).rows;
  }

  function signal(accountId: string, id: string): Signal {
    return { channel: `account_events_${accountId}`, payload: { relatedNodeId: id } };
  }

  async function notification(source: Source, accountId = recipient, helper = false) {
    const linkedId = source === "need_claim_notification" ? claimId : bidId;
    if (helper) {
      return insertId(source === "account_notification"
        ? "select id from app_private.create_account_notification($1, 'test_realtime', null)"
        : `select id from app_private.create_${source}($1, $2, 'test_realtime', null)`,
      source === "account_notification" ? [accountId] : [accountId, linkedId]);
    }
    return insertId(source === "account_notification"
      ? `insert into app_public.${source} (recipient_account_id, event_type) values ($1, 'test_realtime') returning id`
      : `insert into app_public.${source} (recipient_account_id, ${source === "need_claim_notification" ? "need_claim_id" : "resource_bid_id"}, event_type)
         values ($1, $2, 'test_realtime') returning id`,
    source === "account_notification" ? [accountId] : [accountId, linkedId]);
  }

  beforeEach(async () => {
    client = new Client({ connectionString: databaseUrl });
    await client.connect();
    received = [];
    client.on("notification", value => received.push(value));
    await client.query("begin");
    const accounts: string[] = [];
    for (const role of ["admin", "identified_account", "identified_account"]) {
      accounts.push(await insertId(`insert into app_public.account (external_subject, display_name, role_name)
        values ($1, 'Realtime fixture', $2) returning id`, [`realtime-${randomUUID()}@example.com`, role]));
    }
    [recipient, participant, outsider] = accounts;
    const needId = await insertId(`insert into app_public.need (creator_account_id, title, location, intensity)
      values ($1, 'Realtime need', 'Test', 'sharing') returning id`, [recipient]);
    claimId = await insertId(`insert into app_public.need_claim (need_id, claimer_account_id)
      values ($1, $2) returning id`, [needId, participant]);
    const resourceId = await insertId(`insert into app_public.resource (creator_account_id, title, location, intensity)
      values ($1, 'Realtime resource', 'Test', 'sharing') returning id`, [recipient]);
    bidId = await insertId(`insert into app_public.resource_bid (resource_id, bidder_account_id)
      values ($1, $2) returning id`, [resourceId, participant]);

    await client.query(`create temporary table realtime_signals (
      sequence bigint generated always as identity, channel text, payload jsonb);
      create function pg_temp.capture_notify(channel text, payload text) returns void
      language plpgsql as $$ begin
        insert into pg_temp.realtime_signals (channel, payload) values (channel, payload::jsonb);
        perform pg_catalog.pg_notify(channel, payload);
      end; $$;`);
    const definition = (await client.query<{ definition: string }>(
      "select pg_get_functiondef('app_private.notify_account_event(uuid,uuid)'::regprocedure) as definition"
    )).rows[0].definition;
    expect(definition).toContain("perform pg_notify(");
    await client.query(definition.replace("perform pg_notify(", "perform pg_temp.capture_notify("));
  });

  afterEach(async () => {
    try {
      await client.query("rollback");
    } finally {
      await client.end();
    }
  });

  it.each(sources)("%s raw inserts and helper inserts emit exactly one recipient-only signal", async source => {
    for (const helper of [false, true]) {
      await clearSignals();
      const id = await notification(source, outsider, helper);
      expect(await signals()).toEqual([signal(outsider, id)]);
      expect((await client.query(`select payload from app_public.${source} where id = $1`, [id])).rows[0].payload).toEqual({});
    }
  });

  it.each(sources)("%s covers read/unread, payload edits, recipient moves and deletes without no-op signals", async source => {
    const id = await notification(source);
    await clearSignals();
    await client.query(`update app_public.${source} set read_at = now() where id = $1`, [id]);
    expect(await signals()).toEqual([signal(recipient, id)]);
    await clearSignals();
    await client.query(`update app_public.${source} set read_at = read_at where id = $1`, [id]);
    expect(await signals()).toEqual([]);
    await client.query(`update app_public.${source} set read_at = null where id = $1`, [id]);
    expect(await signals()).toEqual([signal(recipient, id)]);
    await clearSignals();
    await client.query(`update app_public.${source} set payload = '{"updated":true}' where id = $1`, [id]);
    expect(await signals()).toEqual([signal(recipient, id)]);
    await clearSignals();
    await client.query(`update app_public.${source} set recipient_account_id = $2 where id = $1`, [id, outsider]);
    expect(await signals()).toEqual([signal(recipient, id), signal(outsider, id)]);
    await clearSignals();
    await client.query(`delete from app_public.${source} where id = $1`, [id]);
    expect(await signals()).toEqual([signal(outsider, id)]);
  });

  it.each(sources)("%s mark-read mutation is recipient-scoped and has no redundant helper signal", async source => {
    const id = await notification(source);
    await clearSignals();
    await asAccount(outsider);
    await client.query("savepoint denied_read");
    await expect(client.query(`select app_public.mark_${source}_read($1)`, [id])).rejects.toThrow(/not found/);
    await client.query("rollback to savepoint denied_read");
    expect(await signals()).toEqual([]);
    await asAccount(recipient, "admin");
    await client.query(`select app_public.mark_${source}_read($1)`, [id]);
    await client.query(`select app_public.mark_${source}_read($1)`, [id]);
    expect(await signals()).toEqual([signal(recipient, id)]);
  });

  it.each(["identified_account", "admin"])("%s count and mark-all isolate recipients across all three sources", async role => {
    const accountId = role === "admin" ? recipient : participant;
    const ids: string[] = [];
    for (const source of sources) {
      ids.push(await notification(source, accountId));
      const readId = await notification(source, accountId);
      await client.query(`update app_public.${source} set read_at = now() where id = $1`, [readId]);
      await notification(source, outsider);
    }
    await clearSignals();
    await asAccount(accountId, role);
    expect((await client.query("select app_public.count_unread_notifications() as count")).rows[0].count).toBe(3);
    expect((await client.query("select app_public.mark_all_notifications_read() as count")).rows[0].count).toBe(3);
    expect((await client.query("select app_public.mark_all_notifications_read() as count")).rows[0].count).toBe(0);
    expect((await client.query("select app_public.count_unread_notifications() as count")).rows[0].count).toBe(0);
    expect(await signals()).toEqual(expect.arrayContaining(ids.map(id => signal(accountId, id))));
    expect(await signals()).toHaveLength(3);
    await asAccount(outsider);
    expect((await client.query("select app_public.count_unread_notifications() as count")).rows[0].count).toBe(3);
  });

  it.each(["identified_account", "admin", "anonymous"])("%s unread count rejects a missing account identity", async role => {
    await asAccount("", role);
    await client.query("savepoint unauthenticated");
    await expect(client.query("select app_public.count_unread_notifications()"))
      .rejects.toThrow(/Authentication required|permission denied/);
    await client.query("rollback to savepoint unauthenticated");
  });

  it("token movement inserts signal only the ledger account, not the counterparty", async () => {
    const id = await insertId(`insert into app_public.token_movement
      (account_id, counterparty_account_id, event_type, amount_delta)
      values ($1, $2, 'test_realtime', 1) returning id`, [recipient, outsider]);
    expect(await signals()).toEqual([signal(recipient, id)]);
    await clearSignals();
    await client.query("select app_private.notify_account_event(null, $1)", [id]);
    expect(await signals()).toEqual([]);
  });

  it.each(["need_claim_notification", "resource_bid_notification"] as const)(
    "%s cascaded deletes still invalidate the recipient inbox", async source => {
      const id = await notification(source, outsider);
      await clearSignals();
      const table = source === "need_claim_notification" ? "need_claim" : "resource_bid";
      await client.query(`delete from app_public.${table} where id = $1`, [table === "need_claim" ? claimId : bidId]);
      expect((await signals()).filter(row => row.payload.relatedNodeId === id)).toEqual([signal(outsider, id)]);
    }
  );

  it("rollback discards PostgreSQL notifications and all fixture writes", async () => {
    // LISTEN must commit before the writing transaction. It introduces no rows.
    const listener = new Client({ connectionString: databaseUrl });
    await listener.connect();
    listener.on("notification", value => received.push(value));
    try {
      await listener.query(`listen "account_events_${recipient}"`);
      const id = await notification("account_notification");
      expect(await signals()).toEqual([signal(recipient, id)]);
      await client.query("rollback");
      await listener.query("select 1");
      expect(received).toEqual([]);
      expect((await client.query("select id from app_public.account_notification where id = $1", [id])).rowCount).toBe(0);
    } finally {
      await listener.end();
    }
  });

  it("has exactly one enabled row trigger per source, correct token trigger, timestamp indexes and explicit grants", async () => {
    for (const source of [...sources, "token_movement"]) {
      const rows = (await client.query(`select tgtype::integer as type, tgenabled as enabled,
        p.proname, p.prosecdef from pg_trigger t join pg_proc p on p.oid = t.tgfoid
        where t.tgrelid = $1::regclass and not t.tgisinternal and p.proname like 'notify_%'`, [`app_public.${source}`])).rows;
      expect(rows).toEqual([{ type: source === "token_movement" ? 5 : 29, enabled: "O",
        proname: source === "token_movement" ? "notify_token_balance_changed" : "notify_notification_changed", prosecdef: true }]);
    }
    for (const source of sources) {
      const indexes = (await client.query(`select i.indisvalid, i.indisready, i.indnkeyatts,
        pg_get_indexdef(i.indexrelid) as definition from pg_index i
        where i.indexrelid = $1::regclass`, [`app_public.${source}_created_at_idx`])).rows;
      expect(indexes).toEqual([{ indisvalid: true, indisready: true, indnkeyatts: 1,
        // Migration059 already supplied the generic inbox's DESC index.
        // Both btree directions support ascending/descending scans and enums.
        definition: expect.stringMatching(/USING btree \(created_at(?: DESC)?\)$/) }]);
    }
    const grants = (await client.query(`select r.rolname from pg_proc p,
      lateral aclexplode(p.proacl) a join pg_roles r on r.oid = a.grantee
      where p.oid = 'app_public.count_unread_notifications()'::regprocedure
      and a.privilege_type = 'EXECUTE' and r.rolname in ('identified_account', 'admin')`)).rows;
    expect(grants.map(row => row.rolname).sort()).toEqual(["admin", "identified_account"]);
  });

  it("migration definitions match canonical sources and reapplication is safe", async () => {
    for (const file of ["notification/realtime.sql", "notification/create_account_notification.sql",
      ...sources.map(source => `notification/mark_${source}_read.sql`), "notification/mark_all_notifications_read.sql"]) {
      expect(migration).toContain(readFileSync(path.join(root, "functions", file), "utf8").trim());
    }
    for (const file of ["claim/claim_need.sql", "resource/create_resource_bid.sql"]) {
      const helper = readFileSync(path.join(root, "functions", file), "utf8").split("$$;")[0] + "$$;";
      expect(migration).toContain(helper);
    }
    const sql = migration.replace(/^begin;\s*/, "").replace(/commit;\s*$/, "");
    await client.query(sql);
    await client.query(sql);
    const row = await notification("account_notification");
    expect((await client.query("select id from app_public.account_notification where id = $1", [row])).rowCount).toBe(1);
  });
});

describe("notification GraphQL ordering contract", () => {
  it("exposes CREATED_AT_ASC/DESC and ID_DESC on all three notification order enums", async () => {
    const pool = new Pool({ connectionString: databaseUrl });
    try {
      const schema = await createPostGraphileSchema(pool, ["app_public"], { ignoreRBAC: false, ignoreIndexes: false });
      for (const name of ["AccountNotificationsOrderBy", "NeedClaimNotificationsOrderBy", "ResourceBidNotificationsOrderBy"]) {
        const type = schema.getType(name);
        expect(type).toBeInstanceOf(GraphQLEnumType);
        expect((type as GraphQLEnumType).getValues().map(value => value.name))
          .toEqual(expect.arrayContaining(["CREATED_AT_ASC", "CREATED_AT_DESC", "ID_DESC"]));
      }
    } finally {
      await pool.end();
    }
  });
});