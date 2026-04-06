import { TEST_BACKEND_URL, seedDemoAccount } from "./auth-test-helpers";
import { seedResource } from "./resource-test-helpers";

jest.setTimeout(30000);

describe("resource search integration", () => {
  it("returns only active, non-expired resources ordered by closeness and creation recency", async () => {
    const prefix = `US1 Resource Search ${Date.now()}`;
    const creator = await seedDemoAccount({
      identifier: `resource-search-${Date.now()}@example.com`,
      displayName: "Resource Search Creator"
    });

    await seedResource({
      creatorAccount: creator,
      title: `${prefix} - Same Distance Older`,
      description: `${prefix} visible older resource`,
      location: "Tournai centre",
      latitude: 50.6072,
      longitude: 3.3889,
      expiresAt: null
    });

    await seedResource({
      creatorAccount: creator,
      title: `${prefix} - Same Distance Newer`,
      description: `${prefix} visible newer resource`,
      location: "Tournai centre",
      latitude: 50.6072,
      longitude: 3.3889,
      expiresAt: null
    });

    await seedResource({
      creatorAccount: creator,
      title: `${prefix} - Farther`,
      description: `${prefix} farther resource`,
      location: "Brussels",
      latitude: 50.85,
      longitude: 4.35,
      expiresAt: null
    });

    await seedResource({
      creatorAccount: creator,
      title: `${prefix} - Expired`,
      description: `${prefix} expired resource`,
      location: "Old resource",
      latitude: 50.6072,
      longitude: 3.3889,
      expiresAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
    });

    await seedResource({
      creatorAccount: creator,
      title: `${prefix} - Inactive`,
      description: `${prefix} inactive resource`,
      location: "Hidden resource",
      latitude: 50.6072,
      longitude: 3.3889,
      isActive: false,
      expiresAt: null
    });

    const response = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: `
          query SearchResources($searchText: String!, $latitude: BigFloat!, $longitude: BigFloat!) {
            searchResources(
              searchText: $searchText
              latitude: $latitude
              longitude: $longitude
            ) {
              nodes {
                id
                title
                distanceKm
                createdAt
              }
            }
          }
        `,
        variables: {
          searchText: prefix,
          latitude: 50.6072,
          longitude: 3.3889
        }
      })
    });

    expect(response.status).toBe(200);

    const payload = (await response.json()) as {
      data?: {
        searchResources: {
          nodes: Array<{
            id: string;
            title: string;
            distanceKm: string;
            createdAt: string;
          }>;
        };
      };
      errors?: Array<{ message: string }>;
    };

    expect(payload.errors).toBeUndefined();

    const nodes = payload.data?.searchResources.nodes ?? [];
    expect(nodes.some(node => node.title.includes("Expired"))).toBe(false);
    expect(nodes.some(node => node.title.includes("Inactive"))).toBe(false);

    expect(nodes[0]?.title).toBe(`${prefix} - Same Distance Newer`);
    expect(nodes[1]?.title).toBe(`${prefix} - Same Distance Older`);

    const fartherIndex = nodes.findIndex(node => node.title === `${prefix} - Farther`);
    expect(fartherIndex).toBeGreaterThan(1);
  });

  it("applies tri-state filters to resource modality flags", async () => {
    const prefix = `US1 Resource Flags ${Date.now()}`;
    const creator = await seedDemoAccount({
      identifier: `resource-flags-${Date.now()}@example.com`,
      displayName: "Resource Flag Creator"
    });

    await seedResource({
      creatorAccount: creator,
      title: `${prefix} - Gift Delivery`,
      canBeGiven: true,
      canBeDelivered: true,
      canBeExchanged: false
    });

    await seedResource({
      creatorAccount: creator,
      title: `${prefix} - Gift Pickup`,
      canBeGiven: true,
      canBeDelivered: false,
      canBeExchanged: false
    });

    await seedResource({
      creatorAccount: creator,
      title: `${prefix} - Exchange Only`,
      canBeGiven: false,
      canBeDelivered: false,
      canBeExchanged: true
    });

    const response = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: `
          query SearchResources(
            $searchText: String!
            $latitude: BigFloat!
            $longitude: BigFloat!
            $canBeGiven: TriStateFilter
            $canBeDelivered: TriStateFilter
          ) {
            searchResources(
              searchText: $searchText
              latitude: $latitude
              longitude: $longitude
              canBeGiven: $canBeGiven
              canBeDelivered: $canBeDelivered
            ) {
              nodes {
                title
                canBeGiven
                canBeDelivered
              }
            }
          }
        `,
        variables: {
          searchText: prefix,
          latitude: 50.6072,
          longitude: 3.3889,
          canBeGiven: "SET",
          canBeDelivered: "UNSET"
        }
      })
    });

    expect(response.status).toBe(200);

    const payload = (await response.json()) as {
      data?: {
        searchResources: {
          nodes: Array<{
            title: string;
            canBeGiven: boolean;
            canBeDelivered: boolean;
          }>;
        };
      };
      errors?: Array<{ message: string }>;
    };

    expect(payload.errors).toBeUndefined();

    const titles = (payload.data?.searchResources.nodes ?? []).map(node => node.title);
    expect(titles).toContain(`${prefix} - Gift Pickup`);
    expect(titles).not.toContain(`${prefix} - Gift Delivery`);
    expect(titles).not.toContain(`${prefix} - Exchange Only`);
  });

  it("filters resources by the fixed system category codes", async () => {
    const prefix = `US1 Resource Categories ${Date.now()}`;
    const creator = await seedDemoAccount({
      identifier: `resource-categories-${Date.now()}@example.com`,
      displayName: "Resource Category Creator"
    });

    await seedResource({
      creatorAccount: creator,
      title: `${prefix} - Food`,
      categoryCodes: [3]
    });

    await seedResource({
      creatorAccount: creator,
      title: `${prefix} - Transport`,
      categoryCodes: [2]
    });

    const response = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: `
          query SearchResourcesByCategory(
            $searchText: String!
            $latitude: BigFloat!
            $longitude: BigFloat!
            $categoryCodes: [Int!]
          ) {
            searchResources(
              searchText: $searchText
              latitude: $latitude
              longitude: $longitude
              categoryCodes: $categoryCodes
            ) {
              nodes {
                title
                categoryLabels
              }
            }
          }
        `,
        variables: {
          searchText: prefix,
          latitude: 50.6072,
          longitude: 3.3889,
          categoryCodes: [3]
        }
      })
    });

    expect(response.status).toBe(200);

    const payload = (await response.json()) as {
      data?: {
        searchResources: {
          nodes: Array<{
            title: string;
            categoryLabels: string[];
          }>;
        };
      };
      errors?: Array<{ message: string }>;
    };

    expect(payload.errors).toBeUndefined();

    const nodes = payload.data?.searchResources.nodes ?? [];
    const titles = nodes.map(node => node.title);

    expect(titles).toContain(`${prefix} - Food`);
    expect(titles).not.toContain(`${prefix} - Transport`);
    expect(nodes[0]?.categoryLabels).toContain("Food & beverage");
  });
});
