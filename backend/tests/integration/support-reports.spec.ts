import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { graphql, type GraphQLSchema } from "graphql";
import { Pool, type PoolClient } from "pg";
import { createPostGraphileSchema } from "postgraphile";

// Requires a local/disposable owner database: fixtures and DDL roll back.
const databaseUrl = process.env.TEST_DATABASE_URL;
const describeDatabase = databaseUrl ? describe : describe.skip;
const root = path.resolve(__dirname, "../../../database");
jest.setTimeout(30000);

describeDatabase("support reports", () => {
  let pool: Pool;
  let client: PoolClient;
  let schema: GraphQLSchema;
  let user: string;
  let admin: string;
  let admin2: string;
  let tag: string;

  async function identity(role: "anonymous" | "identified_account" | "admin", id = "") {
    await client.query(`set local role ${role}`);
    await client.query("select set_config('jwt.claims.role',$1,true), set_config('jwt.claims.account_id',$2,true)", [role, id]);
  }
  async function owner() { await client.query("reset role"); }
  async function submit(summary: string, description: string | null = null, diagnostics: unknown = {}) {
    return (await client.query<{ id: string }>(
      "select app_public.submit_support_report($1,$2,$3::jsonb) as id", [summary, description, diagnostics === null ? null : JSON.stringify(diagnostics)]
    )).rows[0].id;
  }
  async function rejected(sql: string, values: unknown[] = [], message?: string) {
    await client.query("savepoint expected_error");
    try {
      await expect(client.query(sql, values)).rejects.toThrow(message);
    } finally {
      await client.query("rollback to savepoint expected_error");
      await client.query("release savepoint expected_error");
    }
  }

  beforeAll(async () => {
    pool = new Pool({ connectionString: databaseUrl });
    client = await pool.connect();
    schema = await createPostGraphileSchema(client, ["app_public"], { ignoreRBAC: false, ignoreIndexes: false, dynamicJson: true });
  });
  afterAll(async () => { client?.release(); await pool?.end(); });
  beforeEach(async () => {
    await client.query("begin");
    tag = `support-${randomUUID()}`;
    const accounts: string[] = [];
    for (const role of ["identified_account", "admin", "admin"]) {
      accounts.push((await client.query(`insert into app_public.account(external_subject,display_name,role_name)
        values ($1,$2,$3) returning id`, [`${tag}-${accounts.length}@example.com`, tag, role])).rows[0].id);
    }
    [user, admin, admin2] = accounts;
  });
  afterEach(async () => { await client.query("rollback"); });

  it("keeps migration and canonical function snapshots synchronized", () => {
    const migration = readFileSync(path.join(root, "migrations/175_support_reports.sql"), "utf8");
    expect(migration).toContain(readFileSync(path.join(root, "functions/support/support_reports.sql"), "utf8").trim());
  });

  it("deploys the complete migration from the preceding schema", async () => {
    const migration = readFileSync(path.join(root, "migrations/175_support_reports.sql"), "utf8")
      .replace(/^begin;\s*/i, "").replace(/commit;\s*$/i, "");
    await client.query(`drop function app_public.submit_support_report(text,text,jsonb);
      drop function app_public.admin_list_support_reports(text,integer,integer);
      drop table app_private.support_report_rate_lock;
      drop table app_private.support_report`);
    await client.query(migration);
    await identity("identified_account", user);
    const id = await submit(tag);
    await identity("admin", admin);
    expect((await client.query("select id from app_public.admin_list_support_reports($1)", [tag])).rows).toEqual([{ id }]);
  });

  it("enforces function grants, private tables, RLS and authenticated account context", async () => {
    const privileges = (await client.query(`select
      has_function_privilege('anonymous','app_public.submit_support_report(text,text,jsonb)','execute') anon_submit,
      has_function_privilege('identified_account','app_public.submit_support_report(text,text,jsonb)','execute') user_submit,
      has_function_privilege('admin','app_public.submit_support_report(text,text,jsonb)','execute') admin_submit,
      has_function_privilege('identified_account','app_public.admin_list_support_reports(text,integer,integer)','execute') user_list,
      has_function_privilege('admin','app_public.admin_list_support_reports(text,integer,integer)','execute') admin_list,
      has_table_privilege('admin','app_private.support_report','select') admin_table,
      has_table_privilege('identified_account','app_private.support_report_rate_lock','update') user_lock,
      (select bool_and(relrowsecurity) from pg_class where oid in ('app_private.support_report'::regclass, 'app_private.support_report_rate_lock'::regclass)) rls`)).rows[0];
    expect(privileges).toEqual({ anon_submit: false, user_submit: true, admin_submit: true, user_list: false,
      admin_list: true, admin_table: false, user_lock: false, rls: true });
    await identity("anonymous");
    await rejected("select app_public.submit_support_report('x')", [], "permission denied");
    await identity("identified_account", user);
    await rejected("select * from app_private.support_report", [], "permission denied");
    await rejected("select * from app_public.admin_list_support_reports()", [], "permission denied");
    await identity("identified_account");
    await rejected("select app_public.submit_support_report('x')", [], "Authentication required");
    await identity("admin", user); // Role claim alone cannot promote a regular account.
    await rejected("select * from app_public.admin_list_support_reports()", [], "Only administrators");
    await identity("admin");
    await rejected("select * from app_public.admin_list_support_reports()", [], "Only administrators");
  });

  it("validates inputs and normalizes optional fields without writing invalid reports", async () => {
    await identity("identified_account", user);
    for (const summary of [null, "", " \t\n", "x".repeat(201)]) {
      await rejected("select app_public.submit_support_report($1)", [summary], "summary");
    }
    await rejected("select app_public.submit_support_report('valid',$1)", ["x".repeat(8001)], "description");
    for (const diagnostics of ["null", "[]", '"text"', JSON.stringify({ value: "x".repeat(16384) })]) {
      await rejected("select app_public.submit_support_report('valid',null,$1::jsonb)", [diagnostics], "diagnostics");
    }
    const id = await submit("  Valid summary  ", "   ", null);
    await owner();
    expect((await client.query("select account_id,summary,description,diagnostics from app_private.support_report where id=$1", [id])).rows[0])
      .toEqual({ account_id: user, summary: "Valid summary", description: null, diagnostics: {} });
    expect((await client.query("select count(*)::int as n from app_private.support_report where account_id=$1", [user])).rows[0].n).toBe(1);
  });

  it("notifies every admin including the submitter with only reportId and rolls back if notification creation fails", async () => {
    await identity("admin", admin);
    const id = await submit(tag, "private description", { secret: "private" });
    await owner();
    const notifications = (await client.query(`select recipient_account_id,payload from app_public.account_notification
      where event_type='support_report_created' and payload->>'reportId'=$1`, [id])).rows;
    const admins = (await client.query("select id from app_public.account where role_name='admin'")).rows.map(row => row.id).sort();
    expect(notifications.map(row => row.recipient_account_id).sort()).toEqual(admins);
    expect(notifications).toEqual(expect.arrayContaining([
      { recipient_account_id: admin, payload: { reportId: id } },
      { recipient_account_id: admin2, payload: { reportId: id } }
    ]));
    expect(notifications.every(row => JSON.stringify(row.payload) === JSON.stringify({ reportId: id }))).toBe(true);
    await client.query(`create function pg_temp.reject_support_notification() returns trigger language plpgsql as $$
      begin if new.event_type='support_report_created' then raise exception 'test notification failure'; end if; return new; end $$;
      create trigger test_reject_support before insert on app_public.account_notification
      for each row execute function pg_temp.reject_support_notification()`);
    await identity("identified_account", user);
    await rejected("select app_public.submit_support_report($1)", [tag], "test notification failure");
    await owner();
    expect((await client.query("select count(*)::int as n from app_private.support_report where account_id=$1", [user])).rows[0].n).toBe(0);
    expect((await client.query("select count(*)::int as n from app_private.support_report_rate_lock where account_id=$1", [user])).rows[0].n).toBe(0);
  });

  it("lists newest first with literal search, filtered totals and bounded pagination", async () => {
    await identity("identified_account", user);
    const ids = [await submit(`${tag} first`), await submit(`${tag} second`, "unique detail"), await submit(`${tag} third`)];
    await owner();
    await client.query("update app_private.support_report set created_at='2025-01-01' where id=any($1::uuid[])", [ids]);
    const sorted = [...ids].sort().reverse();
    await identity("admin", admin);
    const rows = (await client.query("select * from app_public.admin_list_support_reports($1,2,1)", [tag])).rows;
    expect(rows.map(row => row.id)).toEqual(sorted.slice(1));
    expect(rows.every(row => row.total_count === "3" && row.account_id === user && row.account_name === tag)).toBe(true);
    expect((await client.query("select * from app_public.admin_list_support_reports($1)", ["unique DETAIL"])).rows.map(row => row.id)).toEqual([ids[1]]);
    expect((await client.query("select * from app_public.admin_list_support_reports($1)", [ids[0]])).rows.map(row => row.id)).toEqual([ids[0]]);
    expect((await client.query("select * from app_public.admin_list_support_reports($1)", [`${tag}%`])).rows).toEqual([]);
    expect((await client.query("select * from app_public.admin_list_support_reports($1,0,-1)", [tag])).rows).toHaveLength(1);
    expect((await client.query("select * from app_public.admin_list_support_reports($1,50,100)", [tag])).rows).toEqual([]);
  });

  it("enforces a rolling five-per-hour limit independently per account", async () => {
    await identity("identified_account", user);
    const ids: string[] = [];
    for (let i = 0; i < 5; i++) ids.push(await submit(`${tag} ${i}`));
    await rejected("select app_public.submit_support_report($1)", [tag], "rate limit exceeded");
    await identity("admin", admin);
    await submit(`${tag} admin`);
    await owner();
    await client.query("update app_private.support_report set created_at=clock_timestamp()-interval '61 minutes' where id=$1", [ids[0]]);
    await identity("identified_account", user);
    await submit(`${tag} allowed again`);
  });

  it("deletes report content and rate-limit state when its account is anonymized", async () => {
    await identity("identified_account", user);
    const id = await submit(tag, "private report contents");
    const result = await client.query("select app_public.delete_my_account() as deleted");
    expect(result.rows[0].deleted).toBe(true);
    await owner();
    expect((await client.query("select id from app_private.support_report where id=$1", [id])).rows).toEqual([]);
    expect((await client.query("select account_id from app_private.support_report_rate_lock where account_id=$1", [user])).rows).toEqual([]);
  });

  it("executes the coordinated GraphQL mutation and admin query with actual role permissions", async () => {
    const mutation = `mutation($input: SubmitSupportReportInput!) { submitSupportReport(input:$input) { uuid } }`;
    const query = `query($s:String) { adminListSupportReports(pSearch:$s,pLimit:50,pOffset:0) {
      nodes { id createdAt accountId accountName summary description diagnostics totalCount } } }`;
    await identity("identified_account", user);
    const result = await graphql({ schema, source: mutation, variableValues: { input: { pSummary: tag, pDescription: "details", pDiagnostics: { platform: "ios" } } }, contextValue: { pgClient: client } });
    expect(result.errors).toBeUndefined();
    const id = (result.data?.submitSupportReport as { uuid: string }).uuid;
    expect(id).toMatch(/^[a-f0-9-]{36}$/);
    await identity("admin", admin);
    const listed = await graphql({ schema, source: query, variableValues: { s: tag }, contextValue: { pgClient: client } });
    expect(listed.errors).toBeUndefined();
    expect(listed.data?.adminListSupportReports).toMatchObject({ nodes: [{ id, accountId: user, accountName: tag,
      summary: tag, description: "details", diagnostics: { platform: "ios" }, totalCount: "1" }] });
    await identity("identified_account", user);
    const forbidden = await graphql({ schema, source: query, variableValues: { s: tag }, contextValue: { pgClient: client } });
    expect(forbidden.errors).toBeDefined();
  });
});

describeDatabase("support report concurrent rate limit", () => {
  it("serializes simultaneous submissions so only one consumes the last slot", async () => {
    const pool = new Pool({ connectionString: databaseUrl, max: 3 });
    const setup = await pool.connect();
    let account = "";
    let id = "";
    try {
      account = (await setup.query("insert into app_public.account(external_subject) values($1) returning id", [`support-race-${randomUUID()}@example.com`])).rows[0].id;
      await setup.query(`insert into app_private.support_report(account_id,summary)
        select $1,'race fixture' from generate_series(1,4)`, [account]);
      const a = await pool.connect();
      const b = await pool.connect();
      try {
        for (const c of [a, b]) {
          await c.query("begin");
          await c.query("set local role identified_account");
          await c.query("select set_config('jwt.claims.account_id',$1,true),set_config('jwt.claims.role','identified_account',true)", [account]);
        }
        id = (await a.query("select app_public.submit_support_report('race winner') as id")).rows[0].id;
        const second = b.query("select app_public.submit_support_report('race loser')").then(() => null, error => error as Error);
        await a.query("commit");
        expect((await second)?.message).toContain("rate limit exceeded");
        await b.query("rollback");
        expect((await setup.query("select count(*)::int n from app_private.support_report where account_id=$1", [account])).rows[0].n).toBe(5);
      } finally {
        await a.query("rollback"); await b.query("rollback"); a.release(); b.release();
      }
    } finally {
      if (id) await setup.query("delete from app_public.account_notification where event_type='support_report_created' and payload->>'reportId'=$1", [id]);
      if (account) {
        await setup.query("delete from app_private.support_report where account_id=$1", [account]);
        await setup.query("delete from app_public.account where id=$1", [account]);
      }
      setup.release(); await pool.end();
    }
  });
});