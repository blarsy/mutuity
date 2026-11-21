import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import path from "node:path";
import cookieParser from "cookie-parser";
import express from "express";
import { Client, type Pool } from "pg";
import { createAuthSessionMiddleware, createSessionForAccount, SESSION_COOKIE_NAME } from "../../src/auth/session";

// The migration and all fixtures are rolled back; never default to a dev DB.
const databaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

describeWithDatabase("current token balance session identity", () => {
  let client: Client;

  beforeEach(async () => {
    client = new Client({ connectionString: databaseUrl });
    await client.connect();
    await client.query("begin");
    await client.query(readFileSync(path.resolve(__dirname, "../../../database/migrations/172_current_token_balance_requires_account.sql"), "utf8"));
  });

  afterEach(async () => {
    try { await client.query("rollback"); }
    finally { await client.end(); }
  });

  it("returns null without an account, the account's ledger total, and zero for an empty ledger", async () => {
    const accounts = await client.query<{ id: string }>(
      "insert into app_public.account(external_subject, display_name) values ($1, 'Balance A'), ($2, 'Balance B') returning id",
      [`balance-${randomUUID()}@example.com`, `balance-${randomUUID()}@example.com`]
    );
    const accountA = accounts.rows[0]!.id;
    const accountB = accounts.rows[1]!.id;
    await client.query(
      "insert into app_public.token_movement(account_id, event_type, amount_delta, reference_type, payload, idempotency_key) values ($1, 'test_seed_credit', 731, 'test', '{}'::jsonb, $2)",
      [accountA, `balance-${randomUUID()}`]
    );
    await client.query("set local role anonymous");
    await client.query("select set_config('jwt.claims.account_id', '', true)");
    expect((await client.query("select app_public.current_token_balance() as balance")).rows[0].balance).toBeNull();
    await client.query("reset role");
    await client.query("set local role identified_account");
    await client.query("select set_config('jwt.claims.account_id', $1, true)", [accountA]);
    expect((await client.query("select app_public.current_token_balance() as balance")).rows[0].balance).toBe(731);
    await client.query("select set_config('jwt.claims.account_id', $1, true)", [accountB]);
    expect((await client.query("select app_public.current_token_balance() as balance")).rows[0].balance).toBe(0);
  });

  it("returns the social bearer's ledger balance even when a different account cookie is present", async () => {
    const accounts = await client.query<{ id: string }>(
      "insert into app_public.account(external_subject, display_name) values ($1, 'Old session'), ($2, 'Social session') returning id",
      [`balance-${randomUUID()}@example.com`, `balance-${randomUUID()}@example.com`]
    );
    const oldAccount = accounts.rows[0]!.id;
    const socialAccount = accounts.rows[1]!.id;
    await client.query(
      "insert into app_public.token_movement(account_id, event_type, amount_delta, reference_type, payload, idempotency_key) values ($1, 'test_seed_credit', 731, 'test', '{}'::jsonb, $2)",
      [socialAccount, `balance-${randomUUID()}`]
    );
    const pool = client as unknown as Pool;
    const oldSession = await createSessionForAccount(pool, { accountId: oldAccount, role: "identified_account" });
    const socialSession = await createSessionForAccount(pool, { accountId: socialAccount, role: "identified_account" });
    const app = express();
    app.use(cookieParser());
    app.use(createAuthSessionMiddleware(pool));
    app.get("/balance", async (req, res, next) => {
      try {
        await client.query("select set_config('jwt.claims.account_id', $1, true)", [req.authSession?.accountId ?? ""]);
        const result = await client.query("select app_public.current_token_balance() as balance");
        res.json({ accountId: req.authSession?.accountId ?? null, balance: result.rows[0].balance });
      } catch (error) { next(error); }
    });
    const server = app.listen(0, "127.0.0.1");
    await new Promise<void>(resolve => server.once("listening", resolve));
    try {
      const { port } = server.address() as AddressInfo;
      const response = await fetch(`http://127.0.0.1:${port}/balance`, {
        headers: { authorization: `Bearer ${socialSession.sessionToken}`, cookie: `${SESSION_COOKIE_NAME}=${oldSession.sessionToken}` }
      });
      expect(await response.json()).toEqual({ accountId: socialAccount, balance: 731 });
    } finally {
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
  });
});