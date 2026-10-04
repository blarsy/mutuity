import { randomUUID } from "node:crypto";
import { Client } from "pg";

const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/mutuity";

describe.each(["identified_account", "admin"])("campaign linking and email self-service (%s)", role => {
  let client: Client;
  let owner: string;
  let campaignOwner: string;
  let outsider: string;
  let resource: string;
  let campaign: string;
  const id = async (sql: string, values: unknown[] = []) => (await client.query(sql, values)).rows[0].id as string;
  async function identity(account: string) {
    await client.query(`set local role ${role}`);
    await client.query("select set_config('jwt.claims.role',$1,true),set_config('jwt.claims.account_id',$2,true)", [role, account]);
  }
  async function reject(sql: string, values: unknown[], message?: string) {
    await client.query("savepoint expected_error");
    try {
      if (message) await expect(client.query(sql, values)).rejects.toThrow(message);
      else await expect(client.query(sql, values)).rejects.toMatchObject({ code: "42501" });
    } finally { await client.query("rollback to savepoint expected_error"); }
  }
  beforeEach(async () => {
    client = new Client({ connectionString: databaseUrl });
    await client.connect();
    await client.query("begin");
    const accounts: string[] = [];
    for (let i = 0; i < 3; i++) accounts.push(await id(
      "insert into app_public.account(external_subject,role_name) values($1,$2) returning id", [`links-${randomUUID()}@example.com`, role]));
    [owner, campaignOwner, outsider] = accounts;
    resource = await id("insert into app_public.resource(creator_account_id,title,location,intensity) values($1,'Link test','Test','sharing') returning id", [owner]);
    campaign = await id(`insert into app_public.campaign(creator_account_id,title,theme,rewards_multiplier,airdrop_amount,start_at,airdrop_at,end_at,moderation_status)
      values($1,'Link test','test',5,3000,now()-interval '1 day',now(),now()+interval '1 day','approved') returning id`, [campaignOwner]);
    await identity(owner);
  });
  afterEach(async () => { try { await client.query("rollback"); } finally { await client.end(); } });

  it("links only owned resources, starts pending, and preserves triaged status on retries", async () => {
    expect((await client.query("select * from app_public.link_campaign_resource($1,$2)", [campaign,resource])).rows[0].status).toBe("pending");
    await identity(outsider);
    await reject("select app_public.link_campaign_resource($1,$2)", [campaign,resource], "Only the resource creator");
    await reject("select app_public.accept_campaign_resource($1,$2)", [campaign,resource], "Only the campaign creator");
    await identity(campaignOwner);
    await client.query("select app_public.accept_campaign_resource($1,$2)", [campaign,resource]);
    await identity(owner);
    expect((await client.query("select * from app_public.link_campaign_resource($1,$2)", [campaign,resource])).rows[0].status).toBe("accepted");
    await reject("update app_public.campaign_resource set status='rejected' where resource_id=$1", [resource]);
    expect((await client.query("select app_public.unlink_campaign_resource($1,$2) as removed", [campaign,resource])).rows[0].removed).toBe(true);
    expect((await client.query("select app_public.unlink_campaign_resource($1,$2) as removed", [campaign,resource])).rows[0].removed).toBe(false);
  });

  it("rejects inactive/unapproved campaigns, inactive resources and absent identities", async () => {
    await client.query("reset role");
    await client.query("update app_public.campaign set moderation_status='pending' where id=$1", [campaign]);
    await identity(owner);
    await reject("select app_public.link_campaign_resource($1,$2)", [campaign,resource], "not currently linkable");
    await client.query("reset role");
    await client.query("update app_public.campaign set moderation_status='approved' where id=$1", [campaign]);
    await client.query("update app_public.resource set is_active=false where id=$1", [resource]);
    await identity(owner);
    await reject("select app_public.link_campaign_resource($1,$2)", [campaign,resource], "no longer active");
    await identity("");
    await reject("select app_public.link_campaign_resource($1,$2)", [campaign,resource], "Authentication required");
  });

  it("allows campaign-owner unlink and preserves explicit admin unlink without admin linking", async () => {
    await client.query("select app_public.link_campaign_resource($1,$2)", [campaign,resource]);
    await identity(outsider);
    if (role === "admin") expect((await client.query("select app_public.unlink_campaign_resource($1,$2) as removed", [campaign,resource])).rows[0].removed).toBe(true);
    else await reject("select app_public.unlink_campaign_resource($1,$2)", [campaign,resource], "Only campaign or resource creators");
    await identity(owner);
    await client.query("select app_public.link_campaign_resource($1,$2)", [campaign,resource]);
    await identity(campaignOwner);
    expect((await client.query("select app_public.unlink_campaign_resource($1,$2) as removed", [campaign,resource])).rows[0].removed).toBe(true);
  });

  it("changes only the requesting account email using a valid one-use confirmation token", async () => {
    const address = `changed-${randomUUID()}@example.com`;
    await client.query("select app_public.request_account_email_change($1)", [address]);
    await client.query("reset role");
    const mail = await client.query("select account_id,auth_token from app_private.mail_outbox where account_id=$1 and mail_kind='account_email_change_confirmation'", [owner]);
    expect(mail.rows).toHaveLength(1);
    expect(mail.rows[0].account_id).toBe(owner);
    const before = await client.query("select external_subject from app_public.account where id=$1", [campaignOwner]);
    await identity(owner);
    await reject("select app_public.confirm_account_email_change('invalid-token')", [], "invalid or expired");
    expect((await client.query("select app_public.confirm_account_email_change($1) as confirmed", [mail.rows[0].auth_token])).rows[0].confirmed).toBe(true);
    await reject("select app_public.confirm_account_email_change($1)", [mail.rows[0].auth_token], "invalid or expired");
    await client.query("reset role");
    expect((await client.query("select external_subject from app_public.account where id=$1", [owner])).rows[0].external_subject).toBe(address);
    expect((await client.query("select external_subject from app_public.account where id=$1", [campaignOwner])).rows).toEqual(before.rows);
    await identity("");
    await reject("select app_public.request_account_email_change($1)", [address], "Authentication required");
  });

  it("rejects expired email confirmation tokens without changing the account", async () => {
    const address = `expired-${randomUUID()}@example.com`;
    await client.query("select app_public.request_account_email_change($1)", [address]);
    await client.query("reset role");
    const token = (await client.query("select auth_token from app_private.mail_outbox where account_id=$1 and mail_kind='account_email_change_confirmation'", [owner])).rows[0].auth_token;
    const before = (await client.query("select external_subject from app_public.account where id=$1", [owner])).rows[0];
    await client.query("update app_private.account_auth_token set expires_at=now()-interval '1 second' where account_id=$1 and token_kind='email_change'", [owner]);
    await identity(owner);
    await reject("select app_public.confirm_account_email_change($1)", [token], "invalid or expired");
    await client.query("reset role");
    expect((await client.query("select external_subject from app_public.account where id=$1", [owner])).rows[0]).toEqual(before);
  });
});