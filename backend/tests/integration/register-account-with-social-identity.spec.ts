import { Pool, PoolClient } from "pg";

import { TEST_DATABASE_URL } from "./auth-test-helpers";

describe("register_local_account_with_social_identity", () => {
  const pool = new Pool({ connectionString: TEST_DATABASE_URL });

  async function inRollbackTxn<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    await client.query("begin");

    try {
      return await fn(client);
    } finally {
      await client.query("rollback");
      client.release();
    }
  }

  afterAll(async () => {
    await pool.end();
  });

  it("creates account + identity", async () => {
    await inRollbackTxn(async client => {
      const identifier = `social-create-${Date.now()}@example.com`;
      const providerSubject = `google-sub-${Date.now()}`;

      await client.query(
        `
        select app_public.register_local_account_with_social_identity(
          $1::text, $2::text, $3::text, $4::text, $5::text, $6::text
        )
        `,
        [identifier, "Social User", "P@ssw0rd!123", "google", providerSubject, identifier],
      );

      const accountRes = await client.query(
        `select id, external_subject from app_public.account where external_subject = $1`,
        [identifier],
      );
      expect(accountRes.rowCount).toBe(1);

      const identityRes = await client.query(
        `
        select ai.account_id, ai.provider, ai.provider_subject, ai.provider_email
        from app_private.account_identity ai
        where ai.provider = $1 and ai.provider_subject = $2
        `,
        ["google", providerSubject],
      );

      expect(identityRes.rowCount).toBe(1);
      expect(identityRes.rows[0].account_id).toBe(accountRes.rows[0].id);
      expect(identityRes.rows[0].provider_email).toBe(identifier);
    });
  });

  it("raises unique violation on duplicate provider subject", async () => {
    await inRollbackTxn(async client => {
      const ts = Date.now();
      const providerSubject = `dup-sub-${ts}`;

      await client.query(
        `
        select app_public.register_local_account_with_social_identity(
          $1::text, $2::text, $3::text, $4::text, $5::text, $6::text
        )
        `,
        [
          `first-${ts}@example.com`,
          "First User",
          "P@ssw0rd!123",
          "google",
          providerSubject,
          `first-${ts}@example.com`,
        ],
      );

      await expect(
        client.query(
          `
          select app_public.register_local_account_with_social_identity(
            $1::text, $2::text, $3::text, $4::text, $5::text, $6::text
          )
          `,
          [
            `second-${ts}@example.com`,
            "Second User",
            "P@ssw0rd!123",
            "google",
            providerSubject,
            `second-${ts}@example.com`,
          ],
        ),
      ).rejects.toMatchObject({
        code: "P0001",
      });
    });
  });

  it("does not bypass account identifier uniqueness", async () => {
    await inRollbackTxn(async client => {
      const ts = Date.now();
      const identifier = `same-email-${ts}@example.com`;

      await client.query(
        `
        select app_public.register_local_account_with_social_identity(
          $1::text, $2::text, $3::text, $4::text, $5::text, $6::text
        )
        `,
        [identifier, "First User", "P@ssw0rd!123", "google", `google-sub-${ts}`, identifier],
      );

      await expect(
        client.query(
          `
          select app_public.register_local_account_with_social_identity(
            $1::text, $2::text, $3::text, $4::text, $5::text, $6::text
          )
          `,
          [
            identifier,
            "Second User",
            "P@ssw0rd!123",
            "apple",
            `apple-sub-${ts}`,
            `other-provider-email-${ts}@example.com`,
          ],
        ),
      ).rejects.toMatchObject({ code: "P0001" });
    });
  });
});