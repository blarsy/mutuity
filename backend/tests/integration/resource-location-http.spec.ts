import { randomUUID } from "node:crypto";
import { Client } from "pg";
import {
  loginWithGraphqlSessionCookie,
  seedDemoAccount
} from "./auth-test-helpers";

// HTTP mutations commit: run only with an explicitly opted-in disposable database
// and a separate backend configured to use that same database. Never use defaults.
const enabled = process.env.RESOURCE_LOCATION_DISPOSABLE === "true" &&
  Boolean(process.env.TEST_DATABASE_URL && process.env.TEST_BACKEND_URL);
const describeHttp = enabled ? describe : describe.skip;
jest.setTimeout(30000);

const mutation = `mutation PublishResource(
  $resourceId: UUID, $title: String!, $description: String, $location: String,
  $latitude: BigFloat, $longitude: BigFloat, $intensity: NeedIntensity!,
  $defaultTokenAmount: Int, $categoryCodes: [Int!], $imageUrls: [String!],
  $isProduct: Boolean!, $isService: Boolean!, $canBeGiven: Boolean!,
  $canBeExchanged: Boolean!, $canBeTakenAway: Boolean!, $canBeDelivered: Boolean!,
  $expiresAt: Datetime
) {
  publishResource(input: {
    resourceId: $resourceId, title: $title, description: $description, location: $location,
    latitude: $latitude, longitude: $longitude, intensity: $intensity,
    defaultTokenAmount: $defaultTokenAmount, categoryCodes: $categoryCodes, imageUrls: $imageUrls,
    isProduct: $isProduct, isService: $isService, canBeGiven: $canBeGiven,
    canBeExchanged: $canBeExchanged, canBeTakenAway: $canBeTakenAway,
    canBeDelivered: $canBeDelivered, expiresAt: $expiresAt
  }) {
    resource { id creatorAccountId title description location latitude longitude intensity
      defaultTokenAmount categoryLabels imageUrls isProduct isService canBeGiven
      canBeExchanged canBeTakenAway canBeDelivered expiresAt }
  }
}`;

type Resource = {
  id: string;
  location: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
};
type Payload = {
  data?: { publishResource: { resource: Resource } | null } | null;
  errors?: Array<{ message: string; path?: Array<string | number>; extensions?: { code?: string } }>;
};

describeHttp("resource location through the HTTP publishResource mutation", () => {
  let db: Client;
  let ownerCookie: string;
  let outsiderCookie: string;
  let ownerId: string;
  const tag = `resource-location-${randomUUID()}`;
  const fields = {
    title: `${tag} title`, description: "A description to preserve", intensity: "SHARING",
    defaultTokenAmount: 250, categoryCodes: [3, 7],
    imageUrls: ["https://example.com/location-test.jpg"],
    isProduct: true, isService: true, canBeGiven: true, canBeExchanged: false,
    canBeTakenAway: true, canBeDelivered: false, expiresAt: "2099-01-02T03:04:05Z"
  };

  beforeAll(async () => {
    db = new Client({ connectionString: process.env.TEST_DATABASE_URL });
    await db.connect();
    const owner = await seedDemoAccount({ identifier: `${tag}-owner@example.com` });
    const outsider = await seedDemoAccount({ identifier: `${tag}-outsider@example.com` });
    ownerId = owner.accountId;
    await db.query("update app_public.account set latitude=48.8566, longitude=2.3522 where id=$1", [ownerId]);
    ownerCookie = await loginWithGraphqlSessionCookie(owner.identifier, owner.password);
    outsiderCookie = await loginWithGraphqlSessionCookie(outsider.identifier, outsider.password);
  });

  afterAll(async () => { await db?.end(); });

  async function publish(variables: Record<string, unknown>, cookie: string): Promise<Payload> {
    const response = await fetch(`${process.env.TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ query: mutation, variables })
    });
    expect(response.status).toBe(200);
    return response.json() as Promise<Payload>;
  }

  async function stored(id: string) {
    const result = await db.query(`select r.id, r.creator_account_id, r.title, r.description,
      r.location, r.latitude::float8 as latitude, r.longitude::float8 as longitude,
      r.intensity::text, r.default_token_amount, r.image_urls, r.is_product, r.is_service,
      r.can_be_given, r.can_be_exchanged, r.can_be_taken_away, r.can_be_delivered,
      r.expires_at, r.is_active,
      array(select a.category_code from app_public.resource_category_assignment a
        where a.resource_id=r.id order by a.category_code) as category_codes
      from app_public.resource r where r.id=$1`, [id]);
    expect(result.rowCount).toBe(1);
    return result.rows[0];
  }

  it("creates with explicit nulls without copying the owner's profile coordinates", async () => {
    const result = await publish({ ...fields, location: null, latitude: null, longitude: null }, ownerCookie);
    expect(result.errors).toBeUndefined();
    const resource = result.data?.publishResource?.resource;
    expect(resource).toMatchObject({ location: null, latitude: null, longitude: null });
    expect(await stored(resource!.id)).toMatchObject({
      creator_account_id: ownerId, location: null, latitude: null, longitude: null,
      title: fields.title, category_codes: [3, 7]
    });
  });

  it("creates, edits, denies a non-owner, and clears all location fields without losing other values", async () => {
    const created = await publish({ ...fields, location: "  Brussels  ", latitude: 50.85, longitude: 4.35 }, ownerCookie);
    expect(created.errors).toBeUndefined();
    const resource = created.data?.publishResource?.resource;
    expect(resource).toMatchObject({ location: "Brussels" });
    expect(Number(resource?.latitude)).toBeCloseTo(50.85);
    expect(Number(resource?.longitude)).toBeCloseTo(4.35);
    const id = resource!.id;
    expect(await stored(id)).toMatchObject({ creator_account_id: ownerId, location: "Brussels", latitude: 50.85, longitude: 4.35 });

    const editedFields = { ...fields, title: `${tag} edited`, description: "Edited description" };
    const edited = await publish({ ...editedFields, resourceId: id, location: "Paris", latitude: 48.8566, longitude: 2.3522 }, ownerCookie);
    expect(edited.errors).toBeUndefined();
    expect(edited.data?.publishResource?.resource).toMatchObject({ id, location: "Paris" });
    expect(Number(edited.data?.publishResource?.resource.latitude)).toBeCloseTo(48.8566);
    expect(Number(edited.data?.publishResource?.resource.longitude)).toBeCloseTo(2.3522);
    const before = await stored(id);
    expect(before).toMatchObject({
      creator_account_id: ownerId, title: editedFields.title, description: editedFields.description,
      location: "Paris", latitude: 48.8566, longitude: 2.3522, intensity: "sharing",
      default_token_amount: 250, category_codes: [3, 7], image_urls: fields.imageUrls,
      is_product: true, is_service: true, can_be_given: true, can_be_exchanged: false,
      can_be_taken_away: true, can_be_delivered: false, expires_at: new Date(fields.expiresAt), is_active: true
    });

    // The identical update succeeds on the outsider's own resource, so a failed
    // request against the owner's resource cannot be explained by invalid input
    // or an unauthenticated outsider session.
    const outsiderCreated = await publish({ ...fields, location: "Ghent", latitude: 51.05, longitude: 3.72 }, outsiderCookie);
    expect(outsiderCreated.errors).toBeUndefined();
    const attemptedEdit = { ...editedFields, title: "Unauthorized edit", categoryCodes: [],
      location: null, latitude: null, longitude: null };
    const control = await publish({ ...attemptedEdit, resourceId: outsiderCreated.data!.publishResource!.resource.id }, outsiderCookie);
    expect(control.errors).toBeUndefined();
    expect(control.data?.publishResource?.resource).toMatchObject({ title: "Unauthorized edit", location: null });

    const denied = await publish({ ...attemptedEdit, resourceId: id }, outsiderCookie);
    expect(denied.errors).toHaveLength(1);
    expect(denied.errors?.[0].path).toEqual(["publishResource"]);
    expect(denied.data?.publishResource ?? null).toBeNull();
    expect(await stored(id)).toEqual(before);

    const cleared = await publish({ ...editedFields, resourceId: id, location: null, latitude: null, longitude: null }, ownerCookie);
    expect(cleared.errors).toBeUndefined();
    expect(cleared.data?.publishResource?.resource).toMatchObject({
      id, creatorAccountId: ownerId, title: editedFields.title, description: editedFields.description,
      location: null, latitude: null, longitude: null, intensity: "SHARING", defaultTokenAmount: 250,
      categoryLabels: ["Food & beverage", "Building material & tools"], imageUrls: fields.imageUrls,
      isProduct: true, isService: true, canBeGiven: true, canBeExchanged: false,
      canBeTakenAway: true, canBeDelivered: false
    });
    expect(await stored(id)).toEqual({ ...before, location: null, latitude: null, longitude: null });
  });
});