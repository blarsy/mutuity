import { randomUUID } from "node:crypto";
import { Client } from "pg";

const databaseUrl = process.env.TEST_DATABASE_URL;
const describeDatabase = databaseUrl ? describe : describe.skip;

describeDatabase("campaign listing token rewards (rollback isolated)", () => {
  let client: Client;
  let creator: string;
  let campaignCreator: string;
  let campaign: string;
  let campaignStart: Date;
  let campaignEnd: Date;

  async function id(sql: string, values: unknown[] = []) {
    return (await client.query<{ id: string }>(sql, values)).rows[0].id;
  }

  async function createListing(kind: "resource" | "need", values: {
    images?: string[];
    amount?: number | null;
    expiresAt?: Date | null;
    createdAt?: Date;
  } = {}) {
    if (kind === "resource") {
      return id(`insert into app_public.resource(
        creator_account_id,title,location,intensity,default_token_amount,image_urls,is_active,expires_at,created_at
      ) values($1,$2,'test','sharing',$3,$4,true,$5,$6) returning id`, [
        creator, `Reward resource ${randomUUID()}`, values.amount ?? null, values.images ?? [],
        values.expiresAt ?? new Date(Date.now() + 72 * 60 * 60 * 1000), values.createdAt ?? new Date()
      ]);
    }
    return id(`insert into app_public.need(
      creator_account_id,title,location,intensity,proposed_topes_amount,image_urls,is_active,expires_at,created_at
    ) values($1,$2,'test','sharing',$3,$4,true,$5,$6) returning id`, [
      creator, `Reward need ${randomUUID()}`, values.amount ?? null, values.images ?? [],
      values.expiresAt ?? new Date(Date.now() + 72 * 60 * 60 * 1000), values.createdAt ?? new Date()
    ]);
  }

  async function submit(kind: "resource" | "need", listingId: string) {
    const relationTable = `campaign_${kind}`;
    const listingColumn = `${kind}_id`;
    await client.query(`insert into app_public.${relationTable}(
      campaign_id,${listingColumn},status,submission_id,submitted_at,is_current
    ) values($1,$2,'pending',$3,clock_timestamp(),true)`, [campaign, listingId, randomUUID()]);
    await client.query(`update app_public.${relationTable}
      set status='accepted',acted_at=clock_timestamp(),acted_by_account_id=$3
      where campaign_id=$1 and ${listingColumn}=$2`, [campaign, listingId, campaignCreator]);
  }

  async function rewards(kind: "resource" | "need", listingId: string) {
    return (await client.query<{ event_type: string; amount_delta: number }>(`
      select event_type, amount_delta from app_public.token_movement
      where reference_type=$1 and reference_id=$2
      order by event_type`, [kind, listingId])).rows;
  }

  beforeEach(async () => {
    client = new Client({ connectionString: databaseUrl });
    await client.connect();
    await client.query("begin");
    creator = await id("insert into app_public.account(external_subject) values($1) returning id", [`reward-owner-${randomUUID()}@example.com`]);
    campaignCreator = await id("insert into app_public.account(external_subject) values($1) returning id", [`reward-campaign-${randomUUID()}@example.com`]);
    campaignStart = new Date(Date.now() - 48 * 60 * 60 * 1000);
    campaignEnd = new Date(Date.now() + 48 * 60 * 60 * 1000);
    campaign = await id(`insert into app_public.campaign(
      creator_account_id,title,theme,rewards_multiplier,airdrop_amount,start_at,airdrop_at,end_at,moderation_status
    ) values($1,'Reward campaign','test',5,3000,$2,$3,$4,'approved') returning id`, [
      campaignCreator, campaignStart, new Date(Date.now() + 24 * 60 * 60 * 1000), campaignEnd
    ]);
  });

  afterEach(async () => {
    try { await client?.query("rollback"); } finally { await client?.end(); }
  });

  it("awards age and pre-checkpoint milestones together at 24h using an accepted campaign multiplier", async () => {
    const resourceId = await createListing("resource", { images: ["https://example.com/r.png"], amount: 100 });
    const needId = await createListing("need", { images: ["https://example.com/n.png"], amount: 50 });
    await submit("resource", resourceId);
    await submit("need", needId);

    const future = new Date(Date.now() + 25 * 60 * 60 * 1000);
    await client.query("select * from app_private.issue_delayed_token_rewards($1)", [future]);
    await client.query("select * from app_private.issue_delayed_token_rewards($1)", [future]);

    expect(await rewards("resource", resourceId)).toEqual([
      { event_type: "resource_age_24h_reward", amount_delta: 100 },
      { event_type: "resource_first_default_token_amount_reward", amount_delta: 100 },
      { event_type: "resource_first_image_reward", amount_delta: 100 }
    ]);
    expect(await rewards("need", needId)).toEqual([
      { event_type: "need_age_24h_reward", amount_delta: 50 },
      { event_type: "need_first_default_token_amount_reward", amount_delta: 50 },
      { event_type: "need_first_image_reward", amount_delta: 50 }
    ]);
  });

  it("does not award checkpoint rewards when a new listing is inactive or expired", async () => {
    const expiredResourceId = await createListing("resource", {
      images: ["https://example.com/expired.png"],
      expiresAt: new Date(Date.now() + 60 * 60 * 1000)
    });
    await client.query("update app_public.resource set is_active=false where id=$1", [expiredResourceId]);
    const expiredNeedId = await createListing("need", {
      amount: 50,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000)
    });
    const future = new Date(Date.now() + 25 * 60 * 60 * 1000);
    await client.query("select * from app_private.issue_delayed_token_rewards($1)", [future]);
    expect(await rewards("resource", expiredResourceId)).toEqual([]);
    expect(await rewards("need", expiredNeedId)).toEqual([]);
  });

  it("preserves legacy immediate milestone rewards for listings created before the cutover", async () => {
    await client.query("update app_private.listing_reward_policy set effective_at=clock_timestamp()+interval '1 hour' where singleton");
    const resourceId = await createListing("resource");
    const needId = await createListing("need");
    await client.query("update app_public.resource set image_urls=array['https://example.com/legacy-r.png'] where id=$1", [resourceId]);
    await client.query("update app_public.need set image_urls=array['https://example.com/legacy-n.png'] where id=$1", [needId]);
    expect(await rewards("resource", resourceId)).toEqual([
      { event_type: "resource_first_image_reward", amount_delta: 20 }
    ]);
    expect(await rewards("need", needId)).toEqual([
      { event_type: "need_first_image_reward", amount_delta: 10 }
    ]);
  });

  it("pays milestones immediately after the 24h checkpoint and applies the accepted campaign multiplier", async () => {
    await client.query("update app_private.listing_reward_policy set effective_at=clock_timestamp()-interval '2 days' where singleton");
    const createdAt = new Date(Date.now() - 25 * 60 * 60 * 1000);
    const resourceId = await createListing("resource", { createdAt });
    const needId = await createListing("need", { createdAt });
    await submit("resource", resourceId);
    await submit("need", needId);

    await client.query("update app_public.resource set image_urls=array['https://example.com/late-r.png'],default_token_amount=100 where id=$1", [resourceId]);
    await client.query("update app_public.need set image_urls=array['https://example.com/late-n.png'],proposed_topes_amount=50 where id=$1", [needId]);

    expect(await rewards("resource", resourceId)).toEqual([
      { event_type: "resource_first_default_token_amount_reward", amount_delta: 100 },
      { event_type: "resource_first_image_reward", amount_delta: 100 }
    ]);
    expect(await rewards("need", needId)).toEqual([
      { event_type: "need_first_default_token_amount_reward", amount_delta: 50 },
      { event_type: "need_first_image_reward", amount_delta: 50 }
    ]);
  });

  it("tops up an already-paid standard reward by only the campaign multiplier difference on acceptance", async () => {
    await client.query("update app_private.listing_reward_policy set effective_at=clock_timestamp()-interval '2 days' where singleton");
    const createdAt = new Date(Date.now() - 25 * 60 * 60 * 1000);
    const resourceId = await createListing("resource", { createdAt });
    const dueAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
    await client.query(`select app_private.issue_listing_token_reward(
      'resource',$1,'age_24h',20,$2,'{}'::jsonb,clock_timestamp())`, [resourceId, dueAt]);

    await client.query(`insert into app_public.campaign_resource(
      campaign_id,resource_id,status,submission_id,submitted_at,is_current
    ) values($1,$2,'pending',$3,clock_timestamp(),true)`, [campaign, resourceId, randomUUID()]);
    await client.query(`update app_public.campaign_resource
      set status='accepted',acted_at=clock_timestamp(),acted_by_account_id=$3
      where campaign_id=$1 and resource_id=$2`, [campaign, resourceId, campaignCreator]);

    expect(await rewards("resource", resourceId)).toEqual([
      { event_type: "resource_age_24h_reward", amount_delta: 20 },
      { event_type: "resource_campaign_multiplier_adjustment", amount_delta: 80 }
    ]);
  });

  it("adjusts sequential campaign top-ups to the newly accepted campaign multiplier without compounding", async () => {
    await client.query("update app_private.listing_reward_policy set effective_at=clock_timestamp()-interval '2 days' where singleton");
    const firstCampaign = campaign;
    const createdAt = new Date(Date.now() - 25 * 60 * 60 * 1000);
    const resourceId = await createListing("resource", { createdAt });
    const dueAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
    await client.query(`select app_private.issue_listing_token_reward(
      'resource',$1,'age_24h',20,$2,'{}'::jsonb,clock_timestamp())`, [resourceId, dueAt]);
    await submit("resource", resourceId);
    expect(await rewards("resource", resourceId)).toEqual([
      { event_type: "resource_age_24h_reward", amount_delta: 20 },
      { event_type: "resource_campaign_multiplier_adjustment", amount_delta: 80 }
    ]);

    await client.query(`update app_public.campaign
      set end_at=clock_timestamp()-interval '1 minute', airdrop_at=clock_timestamp()-interval '30 minutes'
      where id=$1`, [firstCampaign]);
    await client.query("update app_public.campaign_resource set is_current=false where campaign_id=$1 and resource_id=$2", [firstCampaign, resourceId]);
    campaign = await id(`insert into app_public.campaign(
      creator_account_id,title,theme,rewards_multiplier,airdrop_amount,start_at,airdrop_at,end_at,moderation_status
    ) values($1,'Second reward campaign','test',7,3000,clock_timestamp()-interval '30 hours',
      clock_timestamp()+interval '24 hours',clock_timestamp()+interval '48 hours','approved') returning id`, [campaignCreator]);
    await submit("resource", resourceId);

    const movements = await rewards("resource", resourceId);
    expect(movements).toHaveLength(3);
    expect(movements).toEqual(expect.arrayContaining([
      { event_type: "resource_age_24h_reward", amount_delta: 20 },
      { event_type: "resource_campaign_multiplier_adjustment", amount_delta: 40 },
      { event_type: "resource_campaign_multiplier_adjustment", amount_delta: 80 }
    ]));
    expect(movements.reduce((sum, movement) => sum + movement.amount_delta, 0)).toBe(140);
  });

  it("does not multiply rewards whose 24h due time is after campaign end", async () => {
    await client.query(`update app_public.campaign
      set end_at=clock_timestamp()+interval '12 hours',
          airdrop_at=clock_timestamp()+interval '6 hours'
      where id=$1`, [campaign]);
    const resourceId = await createListing("resource", { images: ["https://example.com/r.png"], amount: 100 });
    await submit("resource", resourceId);
    const future = new Date(Date.now() + 25 * 60 * 60 * 1000);
    await client.query("select * from app_private.issue_delayed_token_rewards($1)", [future]);
    expect(await rewards("resource", resourceId)).toEqual([
      { event_type: "resource_age_24h_reward", amount_delta: 20 },
      { event_type: "resource_first_default_token_amount_reward", amount_delta: 20 },
      { event_type: "resource_first_image_reward", amount_delta: 20 }
    ]);
  });
});
