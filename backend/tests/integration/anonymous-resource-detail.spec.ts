import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { graphql, type GraphQLSchema } from "graphql";
import { Pool, type PoolClient } from "pg";
import { createPostGraphileSchema } from "postgraphile";

// Explicit owner connection only; all fixtures and privilege changes roll back.
const databaseUrl = process.env.TEST_DATABASE_URL;
const describeDatabase = databaseUrl ? describe : describe.skip;
const operations = readFileSync(path.resolve(__dirname,
  "../../../mobile-app/src/services/graphql/operations/index.ts"), "utf8");
const resourceQuery = operations.match(/export const RESOURCE_BY_ID_QUERY = gql`([\s\S]*?)`;/)?.[1];
if (!resourceQuery) throw new Error("Mobile ResourceById operation not found");
const needQuery = operations.match(/export const NEED_BY_ID_QUERY = gql`([\s\S]*?)`;/)?.[1];
if (!needQuery) throw new Error("Mobile NeedById operation not found");

describeDatabase.each(["resource", "need"])("anonymous mobile %s details (rollback fixtures)", kind => {
  const campaignTable = `app_public.campaign_${kind}`;
  const rootField = `${kind}ById`;
  const relationship = kind === "resource" ? "campaignResourcesByResourceId" : "campaignNeedsByNeedId";
  let pool: Pool;
  let client: PoolClient;
  let schema: GraphQLSchema;
  let resourceId: string;
  let campaignId: string;
  let ownerId: string;
  let campaignOwnerId: string;
  let outsiderId: string;

  beforeAll(async () => {
    pool = new Pool({ connectionString: databaseUrl });
    client = await pool.connect();
    schema = await createPostGraphileSchema(client, ["app_public"], {
      ignoreRBAC: false,
      ignoreIndexes: false
    });
  });
  afterAll(async () => {
    client?.release();
    await pool?.end();
  });

  beforeEach(async () => {
    await client.query("begin");
    const accounts: string[] = [];
    for (let i = 0; i < 3; i++) {
      accounts.push((await client.query(
        `insert into app_public.account(external_subject,display_name,activation_verified_at)
         values($1,'Public resource creator',now()) returning id`,
        [`public-resource-${randomUUID()}@example.com`]
      )).rows[0].id);
    }
    [ownerId, campaignOwnerId, outsiderId] = accounts;
    resourceId = (await client.query(
      `insert into app_public.${kind}(creator_account_id,title,location,intensity)
       values($1,'Public resource detail fixture','Test','sharing') returning id`, [ownerId]
    )).rows[0].id;
    campaignId = (await client.query(
      `insert into app_public.campaign(creator_account_id,title,theme,rewards_multiplier,
         airdrop_amount,start_at,airdrop_at,end_at,moderation_status)
       values($1,'Public campaign','test',5,3000,now()-interval '3 days',
         now()-interval '2 days',now()+interval '2 days','approved') returning id`, [campaignOwnerId]
    )).rows[0].id;
    await client.query(
      `insert into ${campaignTable}(campaign_id,${kind}_id,status,rejection_note,is_current)
       values($1,$2,'rejected','Private submission feedback',false)`, [campaignId, resourceId]
    );
    if (kind === "need") {
      await client.query(`insert into app_public.need_claim(need_id,claimer_account_id,message)
        values($1,$2,'Private claim message')`, [resourceId, outsiderId]);
    }
  });
  afterEach(async () => { await client.query("rollback"); });

  async function identity(role: "anonymous" | "identified_account", accountId = "") {
    await client.query(`set local role ${role}`);
    await client.query(
      "select set_config('jwt.claims.role',$1,true),set_config('jwt.claims.account_id',$2,true)",
      [role, accountId]
    );
  }

  async function detail() {
    return graphql({ schema, source: kind === "resource" ? resourceQuery! : needQuery!, variableValues: { id: resourceId },
      contextValue: { pgClient: client } });
  }

  it("loads the actual mobile detail query anonymously without disclosing submission feedback", async () => {
    await identity("anonymous");
    const result = await detail();
    expect(result.errors).toBeUndefined();
    expect(result.data?.[rootField]).toMatchObject({
      id: resourceId,
      title: "Public resource detail fixture",
      accountByCreatorAccountId: kind === "resource" ? { id: ownerId } : { displayName: "Public resource creator" },
      [relationship]: { nodes: [] },
      ...(kind === "need" ? { needClaimsByNeedId: { nodes: [] } } : {})
    });
    expect((await client.query(
      `select rejection_note from ${campaignTable} where ${kind}_id=$1`, [resourceId]
    )).rows).toEqual([]);
  });

  it("reproduces the original error if the anonymous grant is removed", async () => {
    await client.query(`revoke select on ${campaignTable} from anonymous`);
    await identity("anonymous");
    const result = await detail();
    expect(result.errors?.map(error => error.message)).toContain(`permission denied for table campaign_${kind}`);
  });

  it.each(["resource owner", "campaign owner", "unrelated account"])(
    "preserves submission visibility for the %s", async viewer => {
      const accountId = viewer === "resource owner" ? ownerId
        : viewer === "campaign owner" ? campaignOwnerId : outsiderId;
      await identity("identified_account", accountId);
      const result = await detail();
      expect(result.errors).toBeUndefined();
      expect(result.data?.[rootField]).toMatchObject({
        id: resourceId,
        [relationship]: { nodes: viewer === "unrelated account" ? [] : [
          { campaignId, rejectionNote: "Private submission feedback", status: "REJECTED" }
        ] }
      });
    }
  );

  it("grants anonymous reads without granting writes or disabling RLS", async () => {
    const result = await client.query(`select
      has_table_privilege('anonymous','${campaignTable}','SELECT') as can_read,
      has_table_privilege('anonymous','${campaignTable}','INSERT') as can_insert,
      has_table_privilege('anonymous','${campaignTable}','UPDATE') as can_update,
      has_table_privilege('anonymous','${campaignTable}','DELETE') as can_delete,
      relrowsecurity from pg_class where oid='${campaignTable}'::regclass`);
    expect(result.rows).toEqual([{ can_read: true, can_insert: false,
      can_update: false, can_delete: false, relrowsecurity: true }]);
  });
});