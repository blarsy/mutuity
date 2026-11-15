import { randomUUID } from "node:crypto";
import { Client } from "pg";

// Owner/SET ROLE connection only; worker side effects (including effects on
// unrelated local campaigns) always roll back with the fixtures.
const databaseUrl = process.env.TEST_DATABASE_URL;
const describeDatabase = databaseUrl ? describe : describe.skip;

describeDatabase("campaign listing airdrop lifecycle (rollback isolated)", () => {
  let client: Client;
  let owner: string;
  let campaignOwner: string;
  let campaign: string;
  let cutoff: string;

  async function id(sql: string, values: unknown[] = []) {
    return (await client.query<{ id: string }>(sql, values)).rows[0].id;
  }
  async function root() { await client.query("reset role"); }
  async function identity(account: string) {
    await client.query("set local role identified_account");
    await client.query("select set_config('jwt.claims.account_id',$1,true),set_config('jwt.claims.role','identified_account',true)", [account]);
  }
  async function newCampaign() {
    return id(`insert into app_public.campaign(creator_account_id,title,theme,rewards_multiplier,airdrop_amount,
      start_at,airdrop_at,end_at,moderation_status) values($1,'Airdrop lifecycle','test',5,3000,
      now()-interval '3 days',now()-interval '1 day',now()+interval '3 days','approved') returning id`, [campaignOwner]);
  }
  async function listing(kind: "need" | "resource", target = campaign) {
    await root();
    const listingId = await id(`insert into app_public.${kind}(creator_account_id,title,location,intensity)
      values($1,'Airdrop fixture','Test','sharing') returning id`, [owner]);
    await identity(owner);
    const submission = (await client.query(`select * from app_public.link_campaign_${kind}($1,$2)`, [target, listingId])).rows[0];
    return { kind, id: listingId, submission: submission.submission_id, campaign: target };
  }
  type Listing = Awaited<ReturnType<typeof listing>>;
  async function accept(item: Listing, offset = "-1 second") {
    await identity(campaignOwner);
    await client.query(`select app_public.accept_campaign_${item.kind}($1,$2,$3)`, [item.campaign, item.id, item.submission]);
    await root();
    await client.query(`update app_public.campaign_${item.kind} as link
      set submitted_at=c.start_at+interval '1 minute', acted_at=c.airdrop_at+$3::interval
      from app_public.campaign c where link.campaign_id=c.id and link.campaign_id=$1 and ${item.kind}_id=$2`,
    [item.campaign, item.id, offset]);
  }
  async function payouts(now = cutoff) {
    await root();
    await client.query("select * from app_private.issue_campaign_airdrop_payouts($1)", [now]);
    return (await client.query(`select reference_id,amount_delta,payload from app_public.token_movement
      where account_id=$1 and event_type='campaign_airdrop_received' order by reference_id`, [owner])).rows;
  }
  async function notifications(event: string, target = campaign) {
    await root();
    return (await client.query(`select payload from app_public.account_notification
      where recipient_account_id=$1 and event_type=$2 and payload->>'campaignId'=$3`, [owner, event, target])).rows;
  }

  beforeEach(async () => {
    client = new Client({ connectionString: databaseUrl });
    await client.connect();
    await client.query("begin");
    owner = await id("insert into app_public.account(external_subject) values($1) returning id", [`airdrop-owner-${randomUUID()}@example.com`]);
    campaignOwner = await id("insert into app_public.account(external_subject) values($1) returning id", [`airdrop-campaign-${randomUUID()}@example.com`]);
    campaign = await newCampaign();
    cutoff = (await client.query("select airdrop_at::text as cutoff from app_public.campaign where id=$1", [campaign])).rows[0].cutoff;
  });
  afterEach(async () => {
    try { await client?.query("rollback"); } finally { await client?.end(); }
  });

  it.each(["need", "resource"] as const)("includes %s acceptance exactly at cutoff, excludes one microsecond after, even for a late worker", async kind => {
    const before = await listing(kind);
    const boundary = await listing(kind);
    const late = await listing(kind);
    await accept(before, "-1 microsecond");
    await accept(boundary, "0 seconds");
    await accept(late, "1 microsecond");
    expect(await payouts(new Date(Date.now() - 2 * 86400000).toISOString())).toEqual([]);
    const paid = await payouts(new Date(Date.now() + 10 * 86400000).toISOString());
    expect(paid).toEqual([expect.objectContaining({ reference_id: campaign, amount_delta: 3000,
      payload: expect.objectContaining({ approvedNeedCount: kind === "need" ? 2 : 0,
        approvedResourceCount: kind === "resource" ? 2 : 0, eligibleItemCount: 2 }) })]);
    await payouts();
    expect(await notifications("campaign_airdrop_done")).toHaveLength(1);
  });

  it.each(["need", "resource"] as const)("does not let a late %s acceptance supply the second eligible item", async kind => {
    await accept(await listing(kind), "0 seconds");
    await accept(await listing(kind), "1 microsecond");
    expect(await payouts(new Date(Date.now() + 10 * 86400000).toISOString())).toEqual([]);
    expect(await notifications("campaign_airdrop_done")).toEqual([]);
  });

  it("counts distinct listings, not resubmission history or need/resource join combinations, and never duplicates payouts", async () => {
    const need = await listing("need");
    await identity(campaignOwner);
    await client.query("select app_public.reject_campaign_need($1,$2,$3,'Revise')", [campaign, need.id, need.submission]);
    await identity(owner);
    need.submission = (await client.query("select submission_id from app_public.link_campaign_need($1,$2)", [campaign, need.id])).rows[0].submission_id;
    await accept(need);
    expect(await payouts()).toEqual([]); // Multiple history events still represent one item.
    await accept(await listing("need"));
    await accept(await listing("resource"));
    await accept(await listing("resource"));
    const first = await payouts();
    expect(first).toHaveLength(1);
    expect(first[0].payload).toMatchObject({ approvedNeedCount: 2, approvedResourceCount: 2, eligibleItemCount: 4 });
    expect(await payouts()).toEqual(first);
    const notices = await notifications("campaign_airdrop_done");
    expect(notices).toEqual([{ payload: expect.objectContaining({ approvedNeedCount: 2, approvedResourceCount: 2, eligibleItemCount: 4 }) }]);
  });

  it("pays historical accepted listings after lazy release into a second sequential campaign", async () => {
    const need = await listing("need");
    const resource = await listing("resource");
    await accept(need);
    await accept(resource);
    await root();
    await client.query("update app_public.campaign set end_at=now()-interval '1 hour' where id=$1", [campaign]);
    const second = await newCampaign();
    await client.query(`update app_public.campaign set start_at=now()-interval '30 minutes',
      airdrop_at=now()-interval '10 minutes' where id=$1`, [second]);
    for (const item of [need, resource]) {
      await identity(owner);
      item.submission = (await client.query(`select submission_id from app_public.link_campaign_${item.kind}($1,$2)`, [second, item.id])).rows[0].submission_id;
      item.campaign = second;
      await accept(item);
      await root();
      expect((await client.query(`select status,is_current from app_public.campaign_${item.kind}
        where campaign_id=$1 and ${item.kind}_id=$2`, [campaign, item.id])).rows).toEqual([{ status: "accepted", is_current: false }]);
    }
    const paid = await payouts(new Date(Date.now() + 86400000).toISOString());
    expect(paid).toHaveLength(2);
    expect(paid.map(row => row.reference_id).sort()).toEqual([campaign, second].sort());
    expect(paid.every(row => row.amount_delta === 3000 && row.payload.eligibleItemCount === 2)).toBe(true);
    expect(await payouts(new Date(Date.now() + 86400000).toISOString())).toEqual(paid);
    expect(await notifications("campaign_airdrop_done", campaign)).toHaveLength(1);
    expect(await notifications("campaign_airdrop_done", second)).toHaveLength(1);
  });

  it.each(["need", "resource"] as const)("excludes rejected and superseded %s applications from reminders and counts only current pending/accepted", async kind => {
    const rejected = await listing(kind);
    await identity(campaignOwner);
    await client.query(`select app_public.reject_campaign_${kind}($1,$2,$3)`, [campaign, rejected.id, rejected.submission]);
    const superseded = await listing(kind);
    await root();
    await client.query(`update app_public.campaign_${kind} set submitted_at=clock_timestamp()-interval '25 hours'
      where campaign_id=$1 and ${kind}_id=$2`, [campaign, superseded.id]);
    const second = await newCampaign();
    await identity(owner);
    await client.query(`select app_public.link_campaign_${kind}($1,$2)`, [second, superseded.id]);
    await root();
    // At this injected worker time, both campaigns are 24 hours from airdrop.
    const reminderTime = (await client.query("select (airdrop_at-interval '24 hours')::text as value from app_public.campaign where id=$1", [campaign])).rows[0].value;
    await client.query("select * from app_private.issue_campaign_airdrop_coming_soon($1)", [reminderTime]);
    expect(await notifications("campaign_airdrop_coming_soon")).toEqual([]);
    expect(await notifications("campaign_airdrop_coming_soon", second)).toHaveLength(1);
    await listing(kind); // Current pending counts.
    await accept(await listing(kind)); // Current accepted counts too.
    await root();
    await client.query("select * from app_private.issue_campaign_airdrop_coming_soon($1)", [reminderTime]);
    await client.query("select * from app_private.issue_campaign_airdrop_coming_soon($1)", [reminderTime]);
    expect(await notifications("campaign_airdrop_coming_soon")).toEqual([{ payload: expect.objectContaining({
      linkedNeedCount: kind === "need" ? 2 : 0, linkedResourceCount: kind === "resource" ? 2 : 0, linkedItemCount: 2
    }) }]);
  });
});