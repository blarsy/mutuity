import { randomUUID } from "node:crypto";
import { Client } from "pg";

// Deliberately no development-DB fallback. Run with TEST_DATABASE_URL pointing
// to a disposable migrated database; all fixtures and function effects roll back.
const databaseUrl = process.env.TEST_DATABASE_URL;
const duplicateEmail = "An account with this email already exists";
const password = "Audit-regression-password-123!";

describe("database quality regressions (rollback fixtures)", () => {
  let client: Client;
  let passwordHash: string;

  beforeEach(async () => {
    if (!databaseUrl) throw new Error("TEST_DATABASE_URL must explicitly target a disposable database");
    client = new Client({ connectionString: databaseUrl });
    await client.connect();
    await client.query("begin");
    passwordHash = (await client.query("select app_private.hash_local_password($1) as hash", [password])).rows[0].hash;
  });

  afterEach(async () => {
    if (client) {
      try { await client.query("rollback"); }
      finally { await client.end(); }
    }
  });

  async function account(identifier = `quality-${randomUUID()}@example.com`) {
    return (await client.query(
      "insert into app_public.account(external_subject,display_name) values($1,'Quality fixture') returning id",
      [identifier]
    )).rows[0].id as string;
  }

  async function credential(accountId: string, identifier: string) {
    await client.query(
      "insert into app_private.account_credential(account_id,login_identifier,password_hash) values($1,$2,$3)",
      [accountId, identifier, passwordHash]
    );
  }

  async function socialIdentity(accountId: string, provider: string, email: string, subject = randomUUID()) {
    await client.query(
      "select app_private.upsert_account_identity($1,$2,$3,$4,true,'{}'::jsonb)",
      [accountId, provider, subject, email]
    );
    return subject;
  }

  async function identity(role: "anonymous" | "identified_account", accountId = "") {
    await client.query(`set local role ${role}`);
    await client.query(
      "select set_config('jwt.claims.role',$1,true),set_config('jwt.claims.account_id',$2,true)",
      [role, accountId]
    );
  }

  async function rejectsWithBusinessError(sql: string, values: unknown[], message: string) {
    await client.query("savepoint expected_error");
    try {
      // Exact message AND SQLSTATE distinguish business errors from 42702
      // (ambiguous column) and 42725 (ambiguous function).
      await expect(client.query(sql, values)).rejects.toMatchObject({ code: "P0001", message });
    } finally {
      await client.query("rollback to savepoint expected_error");
      await client.query("release savepoint expected_error");
    }
  }

  async function register(path: string, identifier: string) {
    if (path === "local") {
      return client.query(
        "select app_public.register_local_account(identifier => $1, display_name => 'Fresh local', password_hash => $2) as registered",
        [identifier, passwordHash]
      );
    }
    return client.query(
      `select app_public.register_local_account_with_social_identity(
        identifier => $1, display_name => 'Fresh social', password => $2,
        provider => 'google', provider_subject => $3, provider_email => $1,
        provider_email_verified => true) as registered`,
      [identifier, password, randomUUID()]
    );
  }

  describe.each(["local", "social-with-password"])("%s registration", path => {
    it.each(["local", "google", "apple"])("rejects an email already owned by a %s identity", async provider => {
      const email = `duplicate-${randomUUID()}@example.com`;
      const owner = await account();
      if (provider === "local") await credential(owner, email);
      else await socialIdentity(owner, provider, email);
      const before = (await client.query("select count(*)::int as count from app_public.account")).rows[0].count;
      await identity("anonymous");
      await client.query("savepoint registration_error");
      try {
        await expect(register(path, `  ${email.toUpperCase()}  `)).rejects.toMatchObject({
          code: "P0001", message: duplicateEmail
        });
      } finally {
        await client.query("rollback to savepoint registration_error");
        await client.query("release savepoint registration_error");
      }
      await client.query("reset role");
      expect((await client.query("select count(*)::int as count from app_public.account")).rows[0].count).toBe(before);
    });

    it("accepts a fresh normalized identifier and creates the expected identities", async () => {
      const email = `fresh-${randomUUID()}@example.com`;
      await identity("anonymous");
      expect((await register(path, `  ${email.toUpperCase()}  `)).rows[0].registered).toBe(true);
      await client.query("reset role");
      const credentials = await client.query(
        `select c.account_id,c.login_identifier,a.external_subject
         from app_private.account_credential c join app_public.account a on a.id=c.account_id
         where c.login_identifier=$1`, [email]
      );
      expect(credentials.rows).toHaveLength(1);
      expect(credentials.rows[0]).toMatchObject({ login_identifier: email, external_subject: email });
      const identities = await client.query(
        "select provider from app_private.account_identity where account_id=$1 order by provider",
        [credentials.rows[0].account_id]
      );
      expect(identities.rows.map(row => row.provider)).toEqual(path === "local" ? ["local"] : ["google", "local"]);
    });
  });

  it("still rejects a reused social provider subject", async () => {
    const owner = await account();
    const subject = await socialIdentity(owner, "google", `owned-${randomUUID()}@example.com`);
    await identity("anonymous");
    await rejectsWithBusinessError(
      `select app_public.register_local_account_with_social_identity(
        identifier => $1, display_name => 'Duplicate social', password => $2,
        provider => 'google', provider_subject => $3, provider_email => $1, provider_email_verified => true)`,
      [`fresh-${randomUUID()}@example.com`, password, subject],
      "Identity is already linked to another account"
    );
  });

  it("preserves credential/social self-exclusion through email request and confirmation", async () => {
    const oldEmail = `old-${randomUUID()}@example.com`;
    const newEmail = `linked-${randomUUID()}@example.com`;
    const owner = await account(oldEmail);
    const outsider = await account();
    await credential(owner, oldEmail);
    await socialIdentity(owner, "google", newEmail);
    await socialIdentity(owner, "apple", newEmail);
    for (const email of [oldEmail, newEmail]) {
      await client.query("select app_private.assert_local_identifier_available($1,$2)", [email, owner]);
      await rejectsWithBusinessError("select app_private.assert_local_identifier_available($1)", [email], duplicateEmail);
      await rejectsWithBusinessError("select app_private.assert_local_identifier_available($1,$2)", [email, outsider], duplicateEmail);
    }
    await identity("identified_account", owner);
    expect((await client.query("select app_public.request_account_email_change($1) as requested", [newEmail])).rows[0].requested).toBe(true);
    await client.query("reset role");
    const mail = await client.query(
      "select auth_token from app_private.mail_outbox where account_id=$1 and mail_kind='account_email_change_confirmation'",
      [owner]
    );
    expect(mail.rows).toHaveLength(1);
    await identity("identified_account", owner);
    expect((await client.query("select app_public.confirm_account_email_change($1) as confirmed", [mail.rows[0].auth_token])).rows[0].confirmed).toBe(true);
    await client.query("reset role");
    expect((await client.query("select login_identifier from app_private.account_credential where account_id=$1", [owner])).rows[0].login_identifier).toBe(newEmail);
    expect((await client.query(
      "select provider_subject from app_private.account_identity where account_id=$1 and provider='local'", [owner]
    )).rows).toEqual([{ provider_subject: newEmail }]);
  });

  it("keeps a single defaulted auth helper and the public response contract", async () => {
    const helpers = await client.query(
      `select p.proargnames,p.pronargdefaults from pg_proc p join pg_namespace n on n.oid=p.pronamespace
       where n.nspname='app_private' and p.proname='assert_local_identifier_available'`
    );
    expect(helpers.rows).toEqual([{ proargnames: ["p_identifier", "p_exclude_account_id"], pronargdefaults: 1 }]);
    const response = await client.query(
      `select proargnames,prosecdef,proconfig,obj_description(oid,'pg_proc') as comment
       from pg_proc where oid='app_public.respond_to_resource_bid(uuid,app_public.resource_bid_status)'::regprocedure`
    );
    expect(response.rows[0]).toEqual({
      proargnames: ["resource_bid_id", "status"], prosecdef: true,
      proconfig: ["search_path=app_public, app_private, public"], comment: "@name respondToResourceBid"
    });
  });

  it.each(["accepted", "declined"])("returns the typed bid on an idempotent %s response", async status => {
    const owner = await account();
    const bidder = await account();
    const resource = (await client.query(
      `insert into app_public.resource(creator_account_id,title,intensity,expires_at)
       values($1,'Active regression resource','sharing',now()+interval '1 day') returning id`, [owner]
    )).rows[0].id;
    const bid = (await client.query(
      "insert into app_public.resource_bid(resource_id,bidder_account_id) values($1,$2) returning id",
      [resource, bidder]
    )).rows[0].id;
    await identity("identified_account", owner);
    const sql = "select * from app_public.respond_to_resource_bid(resource_bid_id => $1, status => $2)";
    const first = await client.query(sql, [bid, status]);
    expect(first.rows[0]).toMatchObject({ id: bid, status, responded_by_account_id: owner });
    expect((await client.query(sql, [bid, status])).rows).toEqual(first.rows);
    await client.query("reset role");
    expect((await client.query(
      "select count(*)::int as count from app_public.resource_bid_notification where resource_bid_id=$1", [bid]
    )).rows[0].count).toBe(1);
  });

  it.each([
    ["open", "accepted"], ["open", "declined"], ["accepted", "accepted"], ["declined", "declined"]
  ])("expired resource with %s bid responding %s raises the business error", async (initialStatus, response) => {
    const owner = await account();
    const bidder = await account();
    const resource = (await client.query(
      `insert into app_public.resource(creator_account_id,title,intensity,expires_at)
       values($1,'Expired regression resource','sharing',now()-interval '1 day') returning id`, [owner]
    )).rows[0].id;
    const bid = (await client.query(
      `insert into app_public.resource_bid(resource_id,bidder_account_id,proposed_token_amount,status)
       values($1,$2,100,$3) returning id`, [resource, bidder, initialStatus]
    )).rows[0].id;
    await identity("identified_account", owner);
    await rejectsWithBusinessError(
      "select app_public.respond_to_resource_bid(resource_bid_id => $1, status => $2)",
      [bid, response], "Resource has expired"
    );
    await client.query("reset role");
    // Raising the business exception rolls back the attempted status/refund/
    // notification writes; this fix does not change that existing behavior.
    expect((await client.query("select status from app_public.resource_bid where id=$1", [bid])).rows[0].status).toBe(initialStatus);
    expect((await client.query(
      "select count(*)::int as count from app_public.token_movement where reference_id=$1 and event_type='resource_bid_refunded'", [bid]
    )).rows[0].count).toBe(0);
    expect((await client.query(
      "select count(*)::int as count from app_public.resource_bid_notification where resource_bid_id=$1", [bid]
    )).rows[0].count).toBe(0);
  });
});