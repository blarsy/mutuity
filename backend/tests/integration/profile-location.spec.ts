import { Client } from "pg";
import {
  TEST_BACKEND_URL,
  TEST_DATABASE_URL,
  loginWithGraphqlSessionCookie,
  seedDemoAccount
} from "./auth-test-helpers";

jest.setTimeout(30000);

it("persists account location removal through GraphQL and allows setting it again", async () => {
  const account = await seedDemoAccount({ identifier: `profile-location-${Date.now()}@example.com` });
  const cookie = await loginWithGraphqlSessionCookie(account.identifier, account.password);
  const request = async (query: string, variables: Record<string, unknown>) => {
    const response = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json", cookie },
      body: JSON.stringify({ query, variables })
    });
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.errors).toBeUndefined();
    return result.data;
  };
  const mutation = `mutation UpdateAccountProfile($accountId: UUID!, $patch: AccountPatch!) {
    updateAccountById(input: { id: $accountId, accountPatch: $patch }) {
      account { id location latitude longitude }
    }
  }`;
  const empty = { location: null, latitude: null, longitude: null };
  const client = new Client({ connectionString: TEST_DATABASE_URL });
  await client.connect();
  try {
    for (const patch of [
      { location: "Tournai", latitude: 50.6072, longitude: 3.3889 },
      empty,
      { location: "Zero coordinates", latitude: 0, longitude: 0 },
      empty
    ]) {
      const data = await request(mutation, { accountId: account.accountId, patch });
      expect(data.updateAccountById.account.location).toBe(patch.location);
      const reloaded = await request(`query AccountProfile($accountId: UUID!) {
        accountById(id: $accountId) { location latitude longitude }
      }`, { accountId: account.accountId });
      for (const saved of [data.updateAccountById.account, reloaded.accountById]) {
        expect({
          location: saved.location,
          latitude: saved.latitude === null ? null : Number(saved.latitude),
          longitude: saved.longitude === null ? null : Number(saved.longitude)
        }).toEqual(patch);
      }
      const stored = await client.query(
        "select location, latitude::float8 as latitude, longitude::float8 as longitude from app_public.account where id = $1",
        [account.accountId]
      );
      expect(stored.rows[0]).toEqual(patch);
    }
  } finally {
    await client.query("delete from app_public.account where id = $1", [account.accountId]);
    await client.end();
  }
});