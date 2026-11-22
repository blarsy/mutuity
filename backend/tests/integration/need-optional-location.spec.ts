import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";
import {
  TEST_BACKEND_URL, TEST_DATABASE_URL, loginWithGraphqlSessionCookie, seedDemoAccount
} from "./auth-test-helpers";

jest.setTimeout(30000);

// HTTP mutations commit fixtures; require an explicitly configured disposable stack.
const describeHttp = process.env.NEED_LOCATION_DISPOSABLE === "true" &&
  Boolean(process.env.TEST_DATABASE_URL && process.env.TEST_BACKEND_URL) ? describe : describe.skip;

const database = path.resolve(__dirname, "../../../database");
const createMutation = `mutation CreateNeed($input: CreateNeedInput!) {
  createNeed(input: $input) { need { id title location latitude longitude } }
}`;
const updateMutation = `mutation UpdateNeed($input: UpdateNeedByIdInput!) {
  updateNeedById(input: $input) { need { id title location latitude longitude } }
}`;

type Need = { id: string; title: string; location: string | null; latitude: string | null; longitude: string | null };
type Payload = { data?: Record<string, any>; errors?: Array<{ message: string }> };

async function graphql(query: string, variables: Record<string, unknown> = {}, cookie?: string): Promise<Payload> {
  const response = await fetch(`${TEST_BACKEND_URL}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify({ query, variables })
  });
  expect(response.status).toBe(200);
  return response.json() as Promise<Payload>;
}

it("keeps the canonical function and deployment migration synchronized", () => {
  const canonical = readFileSync(path.join(database, "functions/need/create_need.sql"), "utf8").trim();
  const migration = readFileSync(path.join(database, "migrations/177_need_optional_location.sql"), "utf8");
  expect(migration).toContain(canonical);
});

describeHttp("optional need location through GraphQL", () => {
  let client: Client;
  let ownerCookie: string;
  let outsiderCookie: string;
  let adminCookie: string;
  let ownerId: string;
  let prefix: string;

  beforeAll(async () => {
    prefix = `need-location-${randomUUID()}`;
    const owner = await seedDemoAccount({ identifier: `${prefix}@example.com` });
    const outsider = await seedDemoAccount({ identifier: `${prefix}-other@example.com` });
    const admin = await seedDemoAccount({ identifier: `${prefix}-admin@example.com`, role: "admin" });
    ownerId = owner.accountId;
    client = new Client({ connectionString: TEST_DATABASE_URL });
    await client.connect();
    await client.query("update app_public.account set latitude=48.8566, longitude=2.3522, activation_verified_at=now() where id=$1", [ownerId]);
    ownerCookie = await loginWithGraphqlSessionCookie(owner.identifier, owner.password);
    outsiderCookie = await loginWithGraphqlSessionCookie(outsider.identifier, outsider.password);
    adminCookie = await loginWithGraphqlSessionCookie(admin.identifier, admin.password);
  });
  afterAll(async () => { await client?.end(); });

  async function create(input: Record<string, unknown>): Promise<Need> {
    const result = await graphql(createMutation, { input: { title: `${prefix}-${randomUUID()}`, intensity: "SHARING", ...input } }, ownerCookie);
    expect(result.errors).toBeUndefined();
    return result.data?.createNeed.need as Need;
  }
  async function stored(id: string) {
    return (await client.query("select location,latitude,longitude from app_public.need where id=$1", [id])).rows[0];
  }

  it("exposes nullable output and patch fields while keeping create input optional", async () => {
    const result = await graphql(`query {
      need: __type(name: "Need") { fields { name type { kind name ofType { name } } } }
      patch: __type(name: "NeedPatch") { inputFields { name type { kind name ofType { name } } } }
      create: __type(name: "CreateNeedInput") { inputFields { name type { kind name ofType { name } } } }
    }`);
    expect(result.errors).toBeUndefined();
    for (const [type, fieldList] of [["need", "fields"], ["patch", "inputFields"], ["create", "inputFields"]]) {
      const fields = result.data?.[type][fieldList] as Array<{ name: string; type: { kind: string; name: string } }>;
      for (const name of ["location", "latitude", "longitude"]) {
        expect(fields.find(field => field.name === name)?.type).toMatchObject({ kind: "SCALAR", name: name === "location" ? "String" : "BigFloat" });
      }
    }
    const columns = await client.query(`select column_name, is_nullable, column_default
      from information_schema.columns where table_schema='app_public' and table_name='need'
        and column_name in ('location','latitude','longitude') order by column_name`);
    expect(columns.rows).toEqual(["latitude", "location", "longitude"].map(column_name => ({
      column_name, is_nullable: "YES", column_default: null
    })));
  });

  it("retains existing table privileges and allows an administrator to create a locationless need", async () => {
    const privileges = await client.query(`select role,
      has_table_privilege(role, 'app_public.need', 'select') as can_select,
      has_table_privilege(role, 'app_public.need', 'insert') as can_insert,
      has_table_privilege(role, 'app_public.need', 'update') as can_update
      from unnest(array['anonymous','identified_account','admin']) role`);
    expect(privileges.rows).toEqual([
      { role: "anonymous", can_select: true, can_insert: false, can_update: false },
      { role: "identified_account", can_select: true, can_insert: true, can_update: true },
      { role: "admin", can_select: true, can_insert: true, can_update: true }
    ]);
    const result = await graphql(createMutation, { input: { title: `${prefix}-admin`, intensity: "SHARING" } }, adminCookie);
    expect(result.errors).toBeUndefined();
    const need = result.data?.createNeed.need as Need;
    expect(await stored(need.id)).toEqual({ location: null, latitude: null, longitude: null });
  });

  it.each([
    ["omitted", {}], ["null", { location: null, latitude: null, longitude: null }], ["blank", { location: "   " }]
  ])("persists %s location and absent coordinates as null despite profile coordinates", async (_label, input) => {
    const need = await create(input);
    expect(need).toMatchObject({ location: null, latitude: null, longitude: null });
    expect(await stored(need.id)).toEqual({ location: null, latitude: null, longitude: null });
  });

  it("preserves explicit coordinates without an address, including partial coordinates", async () => {
    const need = await create({ location: null, latitude: 51.123, longitude: 4.456 });
    expect(await stored(need.id)).toEqual({ location: null, latitude: "51.123000", longitude: "4.456000" });
    const partial = await create({ location: " ", latitude: 51.123 });
    expect(await stored(partial.id)).toEqual({ location: null, latitude: "51.123000", longitude: null });
  });

  it("retains legacy coordinate fallback and explicit overrides for a present address", async () => {
    const accountFallback = await create({ location: " Paris " });
    expect(await stored(accountFallback.id)).toEqual({ location: "Paris", latitude: "48.856600", longitude: "2.352200" });
    const explicit = await create({ location: "Brussels", latitude: 50.85, longitude: 4.35 });
    expect(await stored(explicit.id)).toEqual({ location: "Brussels", latitude: "50.850000", longitude: "4.350000" });
    await client.query("update app_public.account set latitude=null, longitude=null where id=$1", [ownerId]);
    try {
      const fallback = await create({ location: "Tournai" });
      expect(await stored(fallback.id)).toEqual({ location: "Tournai", latitude: "50.607200", longitude: "3.388900" });
      const absent = await create({});
      expect(await stored(absent.id)).toEqual({ location: null, latitude: null, longitude: null });
    } finally {
      await client.query("update app_public.account set latitude=48.8566, longitude=2.3522 where id=$1", [ownerId]);
    }
  });

  it("clears all location fields on update, preserves omitted fields, and enforces ownership", async () => {
    const need = await create({ location: "Brussels", latitude: 50.85, longitude: 4.35 });
    const update = (cookie: string, needPatch: Record<string, unknown>) =>
      graphql(updateMutation, { input: { id: need.id, needPatch } }, cookie);
    const omitted = await update(ownerCookie, { title: `${prefix}-edited` });
    expect(omitted.errors).toBeUndefined();
    expect(await stored(need.id)).toEqual({ location: "Brussels", latitude: "50.850000", longitude: "4.350000" });
    const denied = await update(outsiderCookie, { location: null, latitude: null, longitude: null });
    expect(denied.errors?.length || denied.data?.updateNeedById?.need == null).toBeTruthy();
    expect(await stored(need.id)).toEqual({ location: "Brussels", latitude: "50.850000", longitude: "4.350000" });
    const cleared = await update(ownerCookie, { location: null, latitude: null, longitude: null });
    expect(cleared.errors).toBeUndefined();
    expect(cleared.data?.updateNeedById.need).toMatchObject({ location: null, latitude: null, longitude: null });
    expect(await stored(need.id)).toEqual({ location: null, latitude: null, longitude: null });
    const anonymous = await graphql(createMutation, { input: { title: `${prefix}-anonymous`, intensity: "SHARING" } });
    expect(anonymous.errors?.length || anonymous.data?.createNeed?.need == null).toBeTruthy();
  });

  it("searches unknown locations safely with the existing distance policy", async () => {
    const title = `${prefix}-search-${randomUUID()}`;
    const need = await create({ title });
    const distance = Number((await client.query("select app_private.get_local_exchange_max_distance_km() as distance")).rows[0].distance);
    const query = `query Search($text: String!, $distance: BigFloat!, $local: Boolean!, $lat: BigFloat!, $lon: BigFloat!) {
      searchNeeds(searchText: $text, latitude: $lat, longitude: $lon,
        maxDistanceKm: $distance, favorLocalResources: $local) {
        nodes { id location latitude longitude closenessScore weightedScore }
      }
    }`;
    const search = (max: number, local: boolean) => graphql(query, { text: title, distance: max, local, lat: 50.6072, lon: 3.3889 });
    const wide = await search(distance, true);
    expect(wide.errors).toBeUndefined();
    expect(wide.data?.searchNeeds.nodes).toEqual([expect.objectContaining({ id: need.id, location: null, latitude: null, longitude: null })]);
    expect(Number.isFinite(Number(wide.data?.searchNeeds.nodes[0].weightedScore))).toBe(true);
    const nonlocal = await search(distance, false);
    expect(nonlocal.errors).toBeUndefined();
    expect(nonlocal.data?.searchNeeds.nodes).toEqual([]);
    if (distance > 0) {
      const narrow = await search(distance / 2, true);
      expect(narrow.errors).toBeUndefined();
      expect(narrow.data?.searchNeeds.nodes).toEqual([]);
    }

    const editedTitle = `${prefix}-edited-search-${randomUUID()}`;
    const edited = await create({ title: editedTitle, location: "Tournai", latitude: 50.6072, longitude: 3.3889 });
    const clear = await graphql(updateMutation, { input: { id: edited.id, needPatch: {
      location: null, latitude: null, longitude: null
    } } }, ownerCookie);
    expect(clear.errors).toBeUndefined();
    const afterEdit = await graphql(query, { text: editedTitle, distance, local: true, lat: 50.6072, lon: 3.3889 });
    expect(afterEdit.errors).toBeUndefined();
    expect(afterEdit.data?.searchNeeds.nodes).toEqual([expect.objectContaining({
      id: edited.id, location: null, latitude: null, longitude: null
    })]);
  });
});