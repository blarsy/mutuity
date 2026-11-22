import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { graphql, type GraphQLSchema } from "graphql";
import { Pool, type PoolClient } from "pg";
import { createPostGraphileSchema } from "postgraphile";

jest.setTimeout(30000);

// Requires a disposable/local owner connection; fixtures and DDL roll back.
const databaseUrl = process.env.TEST_DATABASE_URL;
const describeDatabase = databaseUrl ? describe : describe.skip;
const mutation = `mutation CreateCampaign($title: String!, $start: Datetime!, $airdrop: Datetime!, $end: Datetime!) {
  createCampaign(input: {title: $title, theme: "community", description: "  Description  ",
    managerNoteFromCreator: "Note", rewardsMultiplier: 5, airdropAmount: 3000,
    startAt: $start, airdropAt: $airdrop, endAt: $end, imageUrl: "  "}) {
    campaign { id title description imageUrl moderationStatus creatorAccountId }
  }
}`;

it("keeps the production migration synchronized with the canonical campaign trigger", () => {
  const database = path.resolve(__dirname, "../../../database");
  const canonical = readFileSync(path.join(database, "functions/campaign/notify_campaign_created.sql"), "utf8").trim();
  const migration = readFileSync(path.join(database, "migrations/176_campaign_created_pending_notification.sql"), "utf8");
  expect(migration).toContain(canonical);
});

describeDatabase("campaign creation administrator notifications", () => {
  let pool: Pool;
  let client: PoolClient;
  let schema: GraphQLSchema;
  let creator: string;
  let localAdmin: string;
  let socialAdmin: string;
  let inactiveAdmin: string;
  let deletedAdmin: string;
  let nonAdmin: string;

  async function account(role: string, subject = `campaign-notify-${randomUUID()}@example.com`) {
    return (await client.query<{ id: string }>(
      "insert into app_public.account(external_subject, role_name) values ($1,$2) returning id", [subject, role]
    )).rows[0].id;
  }
  async function credential(id: string, active: boolean) {
    await client.query(`insert into app_private.account_credential(account_id, login_identifier, password_hash, is_active)
      values ($1,$2,'test',$3)`, [id, `campaign-notify-${randomUUID()}@example.com`, active]);
  }
  async function identity(role: "identified_account" | "admin", id: string) {
    await client.query(`set local role ${role}`);
    await client.query("select set_config('jwt.claims.role',$1,true), set_config('jwt.claims.account_id',$2,true)", [role, id]);
  }
  async function create(title: string, invalidDates = false) {
    const now = Date.now();
    return graphql({ schema, source: mutation, contextValue: { pgClient: client }, variableValues: {
      title, start: new Date(now + 3600000).toISOString(),
      airdrop: new Date(now + (invalidDates ? 0 : 7200000)).toISOString(),
      end: new Date(now + 10800000).toISOString()
    } });
  }
  async function notifications(campaignId: string) {
    await client.query("reset role");
    return (await client.query<{ recipient_account_id: string; event_type: string; payload: unknown }>(
      `select recipient_account_id,event_type,payload from app_public.account_notification
       where event_type='campaign_created_pending' and payload->>'campaignId'=$1`, [campaignId]
    )).rows;
  }

  beforeAll(async () => {
    pool = new Pool({ connectionString: databaseUrl });
    client = await pool.connect();
    schema = await createPostGraphileSchema(client, ["app_public"], { ignoreRBAC: false, ignoreIndexes: false });
  });
  afterAll(async () => { client?.release(); await pool?.end(); });
  beforeEach(async () => {
    await client.query("begin");
    creator = await account("identified_account");
    localAdmin = await account("admin");
    socialAdmin = await account("admin");
    inactiveAdmin = await account("admin");
    deletedAdmin = await account("admin", `deleted-${randomUUID()}`);
    nonAdmin = await account("identified_account");
    await credential(localAdmin, true);
    await credential(inactiveAdmin, false);
    await credential(deletedAdmin, true);
    await credential(nonAdmin, true);
    await client.query(`insert into app_private.account_identity(account_id,provider,provider_subject)
      values ($1,'google',$2),($1,'apple',$3),($4,'google',$5)`,
    [socialAdmin, randomUUID(), randomUUID(), deletedAdmin, randomUUID()]);
  });
  afterEach(async () => { await client.query("rollback"); });

  it.each(["identified_account", "admin"] as const)("notifies each admin once for a %s creator, never the creator", async role => {
    if (role === "admin") {
      await client.query("update app_public.account set role_name='admin' where id=$1", [creator]);
      await credential(creator, true);
    }
    await identity(role, creator);
    const title = `Pending campaign ${randomUUID()}`;
    const result = await create(title);
    expect(result.errors).toBeUndefined();
    const campaign = (result.data?.createCampaign as { campaign: { id: string } }).campaign;
    expect(campaign).toMatchObject({ title, creatorAccountId: creator, description: "Description", imageUrl: null, moderationStatus: "PENDING" });
    const rows = await notifications(campaign.id);
    const recipients = rows.map(row => row.recipient_account_id);
    expect(recipients).toEqual(expect.arrayContaining([localAdmin, socialAdmin, inactiveAdmin, deletedAdmin]));
    expect(recipients).not.toEqual(expect.arrayContaining([creator]));
    expect(recipients).not.toContain(nonAdmin);
    expect(new Set(recipients).size).toBe(recipients.length);
    for (const row of rows) expect(row.payload).toEqual({ campaignId: campaign.id, campaignName: title });

    // Administrator inboxes remain recipient-scoped despite the definer trigger.
    await identity("admin", localAdmin);
    const visible = await client.query(`select recipient_account_id from app_public.account_notification
      where event_type='campaign_created_pending' and payload->>'campaignId'=$1`, [campaign.id]);
    expect(visible.rows).toEqual([{ recipient_account_id: localAdmin }]);
  });

  it("does not emit initial-creation notifications on edits, status changes, or approved inserts", async () => {
    await identity("identified_account", creator);
    const result = await create(`Original ${randomUUID()}`);
    expect(result.errors).toBeUndefined();
    const id = (result.data?.createCampaign as { campaign: { id: string } }).campaign.id;
    const before = await notifications(id);
    await identity("identified_account", creator);
    await client.query(`select app_public.update_campaign_for_moderation(
      $1,'Edited','community','Description','Note',5,3000,
      now()+interval '1 hour',now()+interval '2 hours',now()+interval '3 hours',null)`, [id]);
    expect(await notifications(id)).toEqual(before);
    await client.query("update app_public.campaign set title='Updated', moderation_status='approved' where id=$1", [id]);
    await client.query("update app_public.campaign set moderation_status='pending' where id=$1", [id]);
    expect(await notifications(id)).toEqual(before);
    const inserted = await client.query<{ id: string }>(`insert into app_public.campaign
      (creator_account_id,title,theme,rewards_multiplier,airdrop_amount,start_at,airdrop_at,end_at,moderation_status)
      values ($1,'Already approved','test',5,3000,now(),now()+interval '1 hour',now()+interval '2 hours','approved') returning id`, [creator]);
    expect(await notifications(inserted.rows[0].id)).toEqual([]);
  });

  it("rolls back campaign and earlier notifications if a later notification fails", async () => {
    const title = `Failed notification ${randomUUID()}`;
    await client.query(`create function pg_temp.fail_second_campaign_notification() returns trigger language plpgsql as $$
      begin
        if new.event_type='campaign_created_pending' and
          (select count(*) from app_public.account_notification where event_type=new.event_type
            and payload->>'campaignId'=new.payload->>'campaignId') > 1 then
          raise exception 'notification failure';
        end if;
        return new;
      end $$`);
    await client.query(`create trigger test_fail_campaign_notification after insert on app_public.account_notification
      for each row execute function pg_temp.fail_second_campaign_notification()`);
    await identity("identified_account", creator);
    await client.query("savepoint before_create");
    const result = await create(title);
    expect(result.errors?.[0]?.message).toContain("notification failure");
    await client.query("rollback to savepoint before_create");
    await client.query("reset role");
    expect((await client.query("select id from app_public.campaign where title=$1", [title])).rows).toEqual([]);
    expect((await client.query("select id from app_public.account_notification where payload->>'campaignName'=$1", [title])).rows).toEqual([]);
  });

  it("rolls back a successful creation and its notifications together", async () => {
    const title = `Rolled back campaign ${randomUUID()}`;
    await identity("identified_account", creator);
    await client.query("savepoint before_create");
    const result = await create(title);
    expect(result.errors).toBeUndefined();
    const id = (result.data?.createCampaign as { campaign: { id: string } }).campaign.id;
    expect((await notifications(id)).length).toBeGreaterThanOrEqual(2);
    await client.query("rollback to savepoint before_create");
    await client.query("reset role");
    expect((await client.query("select id from app_public.campaign where id=$1", [id])).rows).toEqual([]);
    expect(await notifications(id)).toEqual([]);
  });

  it("does not grant application roles direct execution of the trigger function", async () => {
    const result = await client.query<{ role: string; allowed: boolean }>(`select role,
      has_function_privilege(role, 'app_private.notify_campaign_created_pending()', 'execute') as allowed
      from unnest(array['anonymous','identified_account','admin']) as role`);
    expect(result.rows).toEqual([
      { role: "anonymous", allowed: false }, { role: "identified_account", allowed: false },
      { role: "admin", allowed: false }
    ]);
  });

  it("does not create campaigns or notifications when validation fails", async () => {
    const title = `Invalid campaign ${randomUUID()}`;
    await identity("identified_account", creator);
    await client.query("savepoint before_create");
    const result = await create(title, true);
    expect(result.errors?.length).toBeGreaterThan(0);
    await client.query("rollback to savepoint before_create");
    await client.query("reset role");
    expect((await client.query("select id from app_public.campaign where title=$1", [title])).rows).toEqual([]);
    expect((await client.query("select id from app_public.account_notification where payload->>'campaignName'=$1", [title])).rows).toEqual([]);
  });
});