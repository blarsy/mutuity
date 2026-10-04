import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Client } from "pg";

const sql = readFileSync(resolve(__dirname, "../../../database/verify_admin_privilege_boundaries.sql"), "utf8");
const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ??
  "postgres://postgres:postgres@localhost:5432/mutuity";

// The checker is read-only. Tests simulate regressions with transactional
// catalog changes, all rolled back; nothing is deployed or retained.
describe("authorization boundary verifier", () => {
  let client: Client;
  beforeEach(async () => {
    client = new Client({ connectionString: databaseUrl });
    await client.connect();
    await client.query("begin");
  });
  afterEach(async () => {
    try { await client.query("rollback"); } finally { await client.end(); }
  });

  it("passes the deployed effective-access contract", async () => {
    expect((await client.query(sql)).rows).toEqual([]);
  });

  it.each([
    ["PUBLIC raw write", "grant insert on app_public.claim_message to public", "raw_business_write"],
    ["missing read", "revoke select on app_public.resource_bid from admin", "admin_table_privilege"],
    ["disabled RLS", "alter table app_public.token_movement disable row level security", "unsafe_table_rls"],
    ["table-owner bypass", "alter table app_public.token_movement owner to admin", "table_owner_bypass"],
    ["summary leak", "grant select on app_public.chat_conversation_summary to identified_account", "summary_view_access"],
    ["permissive read bypass", "create policy test_admin_bypass on app_public.resource_message for select using (app_private.is_admin())", "role_policy_bypass"],
    ["obsolete write policy", "create policy test_raw_write on app_public.need_claim for insert with check (true)", "raw_write_policy"],
    ["missing function execution", "revoke execute on function app_public.send_claim_conversation_message(uuid,text,text[]) from admin", "required_function"],
    ["security invoker regression", "alter function app_public.send_claim_conversation_message(uuid,text,text[]) security invoker", "required_function"]
  ])("detects %s", async (_name, regression, category) => {
    await client.query(regression);
    expect((await client.query(sql)).rows).toEqual(expect.arrayContaining([expect.objectContaining({ category })]));
  });

  it("keeps administrative queries authorized only for administrators", async () => {
    await client.query("set local role admin");
    await client.query("select set_config('jwt.claims.role', 'admin', true)");
    expect((await client.query("select count(*) from app_public.admin_list_accounts(null, 1, 0)")).rowCount).toBe(1);
    await client.query("reset role");
    await client.query("set local role identified_account");
    await client.query("select set_config('jwt.claims.role', 'identified_account', true)");
    await expect(client.query("select * from app_public.admin_list_accounts(null, 1, 0)")).rejects.toThrow();
  });

  it("detects the exact additional access from proposed admin inheritance", async () => {
    const tableDifference = `
      select c.relname as table_name, v.privilege
      from pg_class c join pg_namespace n on n.oid=c.relnamespace
      cross join (values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'),
                         ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')) v(privilege)
      where n.nspname='app_public' and c.relkind in ('r','v','p','m')
        and has_table_privilege('identified_account',c.oid,v.privilege)
        and not has_table_privilege('admin',c.oid,v.privilege)
      order by c.relname, v.privilege`;
    expect((await client.query(tableDifference)).rows).toEqual([
      { table_name: 'campaign_resource', privilege: 'INSERT' },
      { table_name: 'campaign_resource', privilege: 'UPDATE' }
    ]);
    const functions = await client.query(`
      select p.oid::regprocedure::text as signature
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
      where n.nspname in ('app_public','app_private','audit')
        and has_function_privilege('identified_account',p.oid,'EXECUTE')
        and not has_function_privilege('admin',p.oid,'EXECUTE')
      order by signature`);
    expect(functions.rows).toEqual([
      { signature: 'app_public.confirm_account_email_change(text)' },
      { signature: 'app_public.request_account_email_change(text,bigint,bigint)' }
    ]);

    // PostgreSQL role membership changes are transactional. Never persist this
    // hypothetical membership: afterEach rolls it back even on assertion failure.
    await client.query("grant identified_account to admin with inherit true, set false");
    expect((await client.query(tableDifference)).rows).toEqual([]);
    expect((await client.query(sql)).rows).toEqual([
      { category: 'admin_table_privilege', object_name: 'app_public.campaign_resource', detail: 'INSERT' },
      { category: 'admin_table_privilege', object_name: 'app_public.campaign_resource', detail: 'UPDATE' },
      { category: 'unexpected_membership', object_name: 'admin/identified_account', detail: 'roles must remain separate' }
    ]);
    expect((await client.query("select pg_has_role('identified_account','admin','MEMBER') as reverse")).rows[0].reverse).toBe(false);
  });
});