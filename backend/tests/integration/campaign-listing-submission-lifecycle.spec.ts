import { randomUUID } from "node:crypto";
import { Client } from "pg";

// Never silently use DATABASE_URL: these fixtures require a disposable/local
// owner connection (SET ROLE, fixture DML), and every test rolls back.
const databaseUrl = process.env.TEST_DATABASE_URL;
const describeDatabase = databaseUrl ? describe : describe.skip;
const cases = ["need", "resource"].flatMap(kind =>
  ["identified_account", "admin"].map(role => ({ kind, role })));

type Submission = {
  campaign_id: string;
  submission_id: string;
  submitted_at: Date;
  status: "pending" | "accepted" | "rejected" | "superseded";
  is_current: boolean;
  rejection_note: string | null;
  acted_at: Date | null;
  acted_by_account_id: string | null;
};

describeDatabase.each(cases)("campaign $kind submission lifecycle ($role)", ({ kind, role }) => {
  let client: Client;
  let owner: string;
  let campaignOwner: string;
  let outsider: string;
  let listing: string;
  let campaign: string;
  let alternate: string;
  const table = `app_public.campaign_${kind}`;
  const listingColumn = `${kind}_id`;
  const linkSql = `select * from app_public.link_campaign_${kind}($1,$2)`;
  const decisionSql = (action: "accept" | "reject", withNote = false) =>
    `select * from app_public.${action}_campaign_${kind}($1,$2,$3${withNote ? ",$4" : ""})`;

  async function id(sql: string, values: unknown[] = []) {
    return (await client.query<{ id: string }>(sql, values)).rows[0].id;
  }
  async function identity(account: string, asRole = role) {
    await client.query(`set local role ${asRole}`);
    await client.query("select set_config('jwt.claims.role',$1,true),set_config('jwt.claims.account_id',$2,true)", [asRole, account]);
  }
  async function privileged(sql: string, values: unknown[] = []) {
    await client.query("reset role");
    return client.query(sql, values);
  }
  async function submit(target = campaign): Promise<Submission> {
    await identity(owner);
    return (await client.query<Submission>(linkSql, [target, listing])).rows[0];
  }
  async function decide(action: "accept" | "reject", submission: Submission, note?: string | null): Promise<Submission> {
    await identity(campaignOwner);
    return (await client.query<Submission>(decisionSql(action, note !== undefined),
      [submission.campaign_id, listing, submission.submission_id, ...(note !== undefined ? [note] : [])])).rows[0];
  }
  async function rows(): Promise<Submission[]> {
    return (await privileged(`select * from ${table} where ${listingColumn}=$1 order by campaign_id`, [listing])).rows;
  }
  async function age(interval: string) {
    await privileged(`update ${table} set submitted_at=clock_timestamp()-$2::interval where ${listingColumn}=$1 and is_current`, [listing, interval]);
  }
  async function rejected(sql: string, values: unknown[] = [], code?: string) {
    await client.query("savepoint expected_failure");
    try {
      if (code) await expect(client.query(sql, values)).rejects.toMatchObject({ code });
      else await expect(client.query(sql, values)).rejects.toThrow();
    } finally {
      await client.query("rollback to savepoint expected_failure");
      await client.query("release savepoint expected_failure");
    }
  }
  async function createCampaign() {
    return id(`insert into app_public.campaign(creator_account_id,title,theme,rewards_multiplier,airdrop_amount,start_at,airdrop_at,end_at,moderation_status)
      values($1,'Lifecycle campaign','test',5,3000,now()-interval '3 days',now()-interval '2 days',now()+interval '2 days','approved') returning id`, [campaignOwner]);
  }

  beforeEach(async () => {
    client = new Client({ connectionString: databaseUrl });
    await client.connect();
    await client.query("begin");
    const accounts: string[] = [];
    for (let i = 0; i < 3; i++) accounts.push(await id(
      "insert into app_public.account(external_subject,role_name) values($1,$2) returning id",
      [`submission-${randomUUID()}@example.com`, role]));
    [owner, campaignOwner, outsider] = accounts;
    listing = await id(`insert into app_public.${kind}(creator_account_id,title,location,intensity)
      values($1,'Lifecycle listing','Test','sharing') returning id`, [owner]);
    campaign = await createCampaign();
    alternate = await createCampaign();
    await identity(owner);
  });
  afterEach(async () => {
    try { await client?.query("rollback"); } finally { await client?.end(); }
  });

  it("creates a current pending composite-key row and makes same-campaign retries exact no-ops", async () => {
    const first = await submit();
    expect(first).toMatchObject({ campaign_id: campaign, [listingColumn]: listing,
      status: "pending", is_current: true, rejection_note: null, acted_at: null, acted_by_account_id: null });
    expect(first.submission_id).toMatch(/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i);
    expect(first.submitted_at).toBeInstanceOf(Date);
    await age("25 hours");
    const before = (await rows())[0];
    expect(await submit()).toEqual(before);
    expect(await rows()).toHaveLength(1);
    const accepted = await decide("accept", before);
    expect(accepted).toMatchObject({ status: "accepted", is_current: true, submission_id: first.submission_id,
      acted_by_account_id: campaignOwner, acted_at: expect.any(Date) });
    expect(await submit()).toEqual(accepted);
  });

  it("uses current, not historical, campaign participation for notification matching", async () => {
    await decide("accept", await submit());
    await client.query("reset role");
    await client.query(`update app_public.${kind} set latitude=0,longitude=0 where id=$1`, [listing]);
    await client.query("update app_public.account set latitude=0,longitude=0 where id=$1", [outsider]);
    const otherNeed = await id(`insert into app_public.need(creator_account_id,title,location,intensity)
      values($1,'Matching participant','Test','sharing') returning id`, [outsider]);
    await client.query(`insert into app_public.campaign_need(campaign_id,need_id,status,is_current,acted_at)
      values($1,$2,'accepted',true,now())`, [campaign, otherNeed]);
    // Keep this participant inside the helper's bounded candidate window even
    // in a development database containing many other matching accounts.
    await client.query(`insert into app_public.resource(creator_account_id,title,location,intensity)
      select $1,'Matching resource','Test','sharing' from generate_series(1,4)`, [outsider]);
    await client.query(`insert into app_public.need(creator_account_id,title,location,intensity)
      select $1,'Matching need','Test','sharing' from generate_series(1,4)`, [outsider]);
    const score = async () => (await client.query(
      `select campaign_score from app_private.get_accounts_to_notify_of_new_${kind}($1,0,500) where account_id=$2`,
      [listing, outsider])).rows[0].campaign_score;
    expect(Number(await score())).toBeGreaterThan(0);
    await client.query("update app_public.campaign_need set is_current=false where need_id=$1", [otherNeed]);
    expect(Number(await score())).toBe(0);
    await client.query("update app_public.campaign_need set is_current=true where need_id=$1", [otherNeed]);
    await client.query(`update ${table} set is_current=false where ${listingColumn}=$1`, [listing]);
    expect(Number(await score())).toBe(0);
    await client.query(`update ${table} set is_current=true where ${listingColumn}=$1`, [listing]);
    await client.query("update app_public.campaign set end_at=now()-interval '1 hour' where id=$1", [campaign]);
    expect(Number(await score())).toBe(0);
  });

  it("enforces listing ownership, campaign ownership and identity without an admin bypass", async () => {
    await identity(outsider);
    await rejected(linkSql, [campaign, listing]);
    const first = await submit();
    for (const actor of [outsider, owner]) {
      await identity(actor);
      await rejected(decisionSql("accept"), [campaign, listing, first.submission_id]);
      await rejected(decisionSql("reject", true), [campaign, listing, first.submission_id, "Unauthorized note"]);
    }
    await identity("");
    await rejected(linkSql, [campaign, listing]);
    await rejected(decisionSql("accept"), [campaign, listing, first.submission_id]);
    await rejected(decisionSql("reject"), [campaign, listing, first.submission_id]);
    expect(await rows()).toEqual([first]);
  });

  it.each(["pending", "future", "ended", "missing"])("requires a started approved unended target campaign (%s)", async invalid => {
    const target = invalid === "missing" ? randomUUID() : campaign;
    if (invalid === "pending") await privileged("update app_public.campaign set moderation_status='pending' where id=$1", [campaign]);
    if (invalid === "future") await privileged("update app_public.campaign set start_at=now()+interval '1 hour',airdrop_at=now()+interval '2 hours' where id=$1", [campaign]);
    if (invalid === "ended") await privileged("update app_public.campaign set end_at=now()-interval '1 hour' where id=$1", [campaign]);
    await identity(owner);
    await rejected(linkSql, [target, listing]);
    expect(await rows()).toHaveLength(0);
  });

  it.each(["inactive", "expired"])("requires an active listing (%s)", async invalid => {
    await privileged(`update app_public.${kind} set ${invalid === "inactive" ? "is_active=false" : "expires_at=now()-interval '1 second'"} where id=$1`, [listing]);
    await identity(owner);
    await rejected(linkSql, [campaign, listing]);
    expect(await rows()).toHaveLength(0);
  });

  it("blocks switching just before 24h without changing the original submission", async () => {
    await submit();
    await age("23 hours 59 minutes");
    const before = await rows();
    await identity(owner);
    await rejected(linkSql, [alternate, listing]);
    expect(await rows()).toEqual(before);
  });

  it.each(["24 hours", "24 hours 0.000001 seconds", "25 hours"])("supersedes pending at/after the exact 24h boundary (%s)", async interval => {
    const first = await submit();
    await age(interval);
    const next = await submit(alternate);
    expect(next).toMatchObject({ campaign_id: alternate, status: "pending", is_current: true });
    expect(next.submission_id).not.toBe(first.submission_id);
    expect(next.submitted_at.getTime()).toBeGreaterThan((await rows()).find(row => row.campaign_id === campaign)!.submitted_at.getTime());
    expect((await rows()).find(row => row.campaign_id === campaign)).toMatchObject({ status: "superseded", is_current: false, submission_id: first.submission_id });
    expect((await rows()).filter(row => row.is_current)).toHaveLength(1);
    await identity(campaignOwner);
    await rejected(decisionSql("accept"), [campaign, listing, first.submission_id]);
    await rejected(decisionSql("reject"), [campaign, listing, first.submission_id]);
  });

  it("rolls back a supersede when the target insertion fails after eligibility checks", async () => {
    await submit();
    await age("25 hours");
    const before = await rows();
    // Transaction-local constraint forces the final write to fail, not merely
    // target validation. The function must not leave the old row superseded.
    await privileged(`alter table ${table} add constraint lifecycle_test_target_failure check (campaign_id <> '${alternate}'::uuid) not valid`);
    await identity(owner);
    await rejected(linkSql, [alternate, listing], "23514");
    expect(await rows()).toEqual(before);
  });

  it("rolls back a supersede when reusing an existing composite-key target fails", async () => {
    await decide("reject", await submit(alternate));
    await submit();
    await age("25 hours");
    const before = await rows();
    // The target already exists, so this exercises the ON CONFLICT/UPDATE
    // failure path as well as the INSERT path tested above.
    await privileged(`alter table ${table} add constraint lifecycle_test_resubmit_failure check (campaign_id <> '${alternate}'::uuid or status <> 'pending') not valid`);
    await identity(owner);
    await rejected(linkSql, [alternate, listing], "23514");
    expect(await rows()).toEqual(before);
  });

  it("does not release an old pending submission for an invalid target", async () => {
    await submit();
    await age("25 hours");
    await privileged("update app_public.campaign set moderation_status='pending' where id=$1", [alternate]);
    const before = await rows();
    await identity(owner);
    await rejected(linkSql, [alternate, listing]);
    expect(await rows()).toEqual(before);
  });

  it.each(["A private explanation", null])("rejects with an optional note and explicitly resubmits using a new UUID/time (%s)", async note => {
    await submit();
    await age("1 hour");
    const first = (await rows())[0];
    const rejection = await decide("reject", first, note);
    expect(rejection).toMatchObject({ status: "rejected", is_current: false, rejection_note: note,
      submission_id: first.submission_id, submitted_at: first.submitted_at,
      acted_by_account_id: campaignOwner, acted_at: expect.any(Date) });
    const next = await submit();
    expect(next).toMatchObject({ status: "pending", is_current: true, rejection_note: null,
      acted_at: null, acted_by_account_id: null });
    expect(next.submission_id).not.toBe(first.submission_id);
    expect(next.submitted_at.getTime()).toBeGreaterThan(first.submitted_at.getTime());
    expect(await rows()).toEqual([next]); // Composite key is unchanged, no synthetic relation ID.
    await identity(campaignOwner);
    for (const action of ["accept", "reject"] as const) {
      await rejected(decisionSql(action), [campaign, listing, first.submission_id]);
      await rejected(decisionSql(action), [campaign, listing, null]);
    }
    expect(await rows()).toEqual([next]);
    expect((await decide("accept", next)).status).toBe("accepted");
  });

  it("allows immediate switching after rejection but respects a newer campaign's pending lock on resubmit", async () => {
    const first = await submit();
    await decide("reject", first); // Omitted note exercises the SQL default.
    const next = await submit(alternate);
    const before = await rows();
    await identity(owner);
    await rejected(linkSql, [campaign, listing]);
    expect(await rows()).toEqual(before);
    expect(next.is_current).toBe(true);
  });

  it("resubmits a superseded composite row with fresh identity after the newer submission is rejected", async () => {
    const first = await submit();
    await age("25 hours");
    const next = await submit(alternate);
    await decide("reject", next);
    const resubmitted = await submit();
    expect(resubmitted).toMatchObject({ status: "pending", is_current: true, rejection_note: null });
    expect(resubmitted.submission_id).not.toBe(first.submission_id);
    expect((await rows()).filter(row => row.is_current)).toEqual([resubmitted]);
    await identity(campaignOwner);
    await rejected(decisionSql("accept"), [campaign, listing, first.submission_id]);
  });

  it("keeps accepted submissions locked regardless of age or listing inactivity", async () => {
    const first = await submit();
    await decide("accept", first);
    await age("25 hours");
    await privileged(`update app_public.${kind} set is_active=false where id=$1`, [listing]);
    const before = await rows();
    await identity(owner);
    await rejected(linkSql, [alternate, listing]);
    await privileged(`update app_public.${kind} set is_active=true where id=$1`, [listing]);
    await identity(owner);
    await rejected(linkSql, [alternate, listing]);
    await identity(campaignOwner);
    await rejected(decisionSql("reject", true), [campaign, listing, first.submission_id, "Cannot reverse acceptance"]);
    expect(await rows()).toEqual(before);
  });

  it.each(["accept", "pending"])("lazily releases an ended campaign's %s submission", async status => {
    const first = await submit();
    if (status === "accept") await decide("accept", first);
    await privileged("update app_public.campaign set end_at=now()-interval '1 hour' where id=$1", [campaign]);
    expect((await rows())[0].is_current).toBe(true); // No background cleanup needed.
    const next = await submit(alternate);
    const all = await rows();
    expect(all.find(row => row.campaign_id === campaign)?.is_current).toBe(false);
    expect(all.filter(row => row.is_current)).toEqual([next]);
  });

  it("denies INSERT/UPDATE/DELETE to owners and outsiders and exposes no legacy mutation overloads", async () => {
    await submit();
    const before = await rows();
    for (const actor of [owner, campaignOwner, outsider]) {
      await identity(actor);
      await rejected(`insert into ${table}(campaign_id,${listingColumn},status) values($1,$2,'pending')`, [alternate, listing], "42501");
      await rejected(`update ${table} set status='accepted' where ${listingColumn}=$1`, [listing], "42501");
      await rejected(`delete from ${table} where ${listingColumn}=$1`, [listing], "42501");
    }
    await identity("", "anonymous");
    await rejected(linkSql, [alternate, listing], "42501");
    await rejected(`insert into ${table}(campaign_id,${listingColumn},status) values($1,$2,'pending')`, [alternate, listing], "42501");
    await rejected(`update ${table} set status='accepted' where ${listingColumn}=$1`, [listing], "42501");
    await rejected(`delete from ${table} where ${listingColumn}=$1`, [listing], "42501");
    expect(await rows()).toEqual(before);
    for (const signature of [`unlink_campaign_${kind}(uuid,uuid)`, `accept_campaign_${kind}(uuid,uuid)`, `reject_campaign_${kind}(uuid,uuid)`]) {
      expect((await client.query("select to_regprocedure($1) as fn", [`app_public.${signature}`])).rows[0].fn).toBeNull();
    }
  });

  it("keeps submission history function-only without depending on its column design", async () => {
    await decide("reject", await submit(), "Retain this feedback in history");
    await submit();
    // History columns are owned by the migration author. Verify effective
    // append-only access without assuming event IDs or listing-kind columns.
    for (const asRole of [role, "anonymous"]) {
      for (const privilege of ["INSERT", "UPDATE", "DELETE", "TRUNCATE", "REFERENCES", "TRIGGER"]) {
        const access = await client.query("select has_table_privilege($1,$2,$3) as allowed",
          [asRole, "app_public.campaign_listing_submission_event", privilege]);
        expect({ asRole, privilege, allowed: access.rows[0].allowed }).toEqual({ asRole, privilege, allowed: false });
      }
      await identity(asRole === "anonymous" ? "" : owner, asRole);
      await rejected("delete from app_public.campaign_listing_submission_event where false", [], "42501");
    }
  });

  it("preserves rejected history across resubmission and restricts every event to participants", async () => {
    const note = `Historical private feedback ${randomUUID()}`;
    const first = await submit();
    await decide("reject", first, note);
    const next = await submit();
    await decide("accept", next);
    const historySql = `select submission_id,status,rejection_note from app_public.campaign_listing_submission_event
      where campaign_id=$1 and ${listingColumn}=$2 order by created_at,id`;
    const expected = [
      { submission_id: first.submission_id, status: "pending", rejection_note: null },
      { submission_id: first.submission_id, status: "rejected", rejection_note: note },
      { submission_id: next.submission_id, status: "pending", rejection_note: null },
      { submission_id: next.submission_id, status: "accepted", rejection_note: null }
    ];
    expect((await privileged(historySql, [campaign, listing])).rows).toEqual(expected);
    for (const actor of [owner, campaignOwner]) {
      await identity(actor);
      expect((await client.query(historySql, [campaign, listing])).rows).toEqual(expected);
    }
    await identity(outsider);
    expect((await client.query(historySql, [campaign, listing])).rows).toEqual([]);
    await identity("", "anonymous");
    await rejected(historySql, [campaign, listing], "42501");
  });

  if (kind === "need") {
    it("creates an initial campaign need through the public function and delegates atomically to linking", async () => {
      await identity(owner);
      const created = await id(`select id from app_public.create_need(
        title => 'Initial campaign need', location => 'Test', intensity => 'sharing',
        proposed_topes_amount => 100, campaign_id => $1)`, [campaign]);
      const relation = (await client.query(`select * from app_public.campaign_need where need_id=$1`, [created])).rows[0];
      expect(relation).toMatchObject({ campaign_id: campaign, need_id: created, status: "pending", is_current: true });
      expect((await client.query("select * from app_public.link_campaign_need($1,$2)", [campaign, created])).rows[0]).toEqual(relation);
      const history = await client.query(`select submission_id,status from app_public.campaign_listing_submission_event where need_id=$1`, [created]);
      expect(history.rows).toEqual([{ submission_id: relation.submission_id, status: "pending" }]);
      // Force a failure in the delegated final write. No orphan need may remain.
      await privileged(`alter table app_public.campaign_need add constraint lifecycle_initial_link_failure
        check(campaign_id <> '${alternate}'::uuid) not valid`);
      await identity(owner);
      await rejected(`select app_public.create_need(title => 'Must roll back initial need', location => 'Test',
        intensity => 'sharing', proposed_topes_amount => 100, campaign_id => $1)`, [alternate], "23514");
      expect((await privileged("select id from app_public.need where creator_account_id=$1 and title='Must roll back initial need'", [owner])).rows).toEqual([]);
    });
  }

  it("keeps rejection notes readable by both participants but not outsiders or anonymous users", async () => {
    const note = `Private feedback ${randomUUID()}`;
    await decide("reject", await submit(), note);
    for (const actor of [owner, campaignOwner]) {
      await identity(actor);
      const visible = await client.query(`select rejection_note from ${table} where campaign_id=$1 and ${listingColumn}=$2`, [campaign, listing]);
      expect(visible.rows).toEqual([{ rejection_note: note }]);
    }
    for (const [actor, asRole] of [[outsider, role], ["", "anonymous"]]) {
      await identity(actor, asRole);
      await client.query("savepoint private_note_read");
      const visible = await client.query(`select rejection_note from ${table} where campaign_id=$1 and ${listingColumn}=$2`, [campaign, listing])
        .then(result => ({ rows: result.rows, error: null }), error => ({ rows: [], error }));
      await client.query("rollback to savepoint private_note_read");
      await client.query("release savepoint private_note_read");
      // Either no table access, no visible row, or a redacted note is safe.
      if (visible.error) expect(visible.error).toMatchObject({ code: "42501" });
      expect(visible.rows).not.toContainEqual({ rejection_note: note });
    }
  });
});