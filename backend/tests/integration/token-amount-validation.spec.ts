import { Client } from "pg";

const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ??
  "postgres://postgres:postgres@localhost:5432/mutuity";

describe("token amount validation", () => {
  let client: Client;

  beforeEach(async () => {
    client = new Client({ connectionString: databaseUrl });
    await client.connect();
    await client.query("begin");
  });

  afterEach(async () => {
    try { await client.query("rollback"); } finally { await client.end(); }
  });

  it.each([1, 2, 5, 9, 10, 99])("accepts %i tokens for leg_up", async tokenAmount => {
    await expect(client.query("select app_private.validate_topes_amount('leg_up', $1)", [tokenAmount]))
      .resolves.toMatchObject({ rowCount: 1 });
  });

  it.each([-1, 0, 100])("rejects %i tokens for leg_up", async tokenAmount => {
    await expect(client.query("select app_private.validate_topes_amount('leg_up', $1)", [tokenAmount]))
      .rejects.toThrow(tokenAmount <= 0 ? "greater than zero" : "between 1 and 99");
  });

  it("continues to allow an unspecified amount", async () => {
    await expect(client.query("select app_private.validate_topes_amount('leg_up', null)"))
      .resolves.toMatchObject({ rowCount: 1 });
  });

  it.each([
    ["sharing", 100], ["sharing", 999],
    ["commitment", 1000], ["commitment", 4999],
    ["rare_contribution", 5000]
  ])("preserves the valid %s boundary %i", async (intensity, tokenAmount) => {
    await expect(client.query("select app_private.validate_topes_amount($1, $2)", [intensity, tokenAmount]))
      .resolves.toMatchObject({ rowCount: 1 });
  });

  it.each([
    ["sharing", 99], ["sharing", 1000],
    ["commitment", 999], ["commitment", 5000],
    ["rare_contribution", 4999]
  ])("preserves the invalid %s boundary %i", async (intensity, tokenAmount) => {
    await expect(client.query("select app_private.validate_topes_amount($1, $2)", [intensity, tokenAmount]))
      .rejects.toThrow();
  });
});