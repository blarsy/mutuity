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

  describe("proximity filtering (T094)", () => {
    it("returns unlocated resources at end when favorLocalResources=true", async () => {
      const prefix = `US1 Proximity Unlocated ${Date.now()}`;
      const creator = await seedDemoAccount({
        identifier: `proximity-unlocated-${Date.now()}@example.com`,
        displayName: "Proximity Test Creator"
      });

      // Located resource
      await seedResource({
        creatorAccount: creator,
        title: `${prefix} - Located`,
        description: "Located resource in Tournai",
        location: "Tournai centre",
        latitude: 50.6072,
        longitude: 3.3889,
        expiresAt: null
      });

      // Unlocated resource (no latitude/longitude)
      await seedResource({
        creatorAccount: creator,
        title: `${prefix} - Unlocated`,
        description: "Remote or online-only resource",
        location: null,
        latitude: null,
        longitude: null,
        expiresAt: null
      });

      const response = await fetch(`${TEST_BACKEND_URL}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query: `
            query SearchResourcesProximity(
              $searchText: String!
              $latitude: BigFloat!
              $longitude: BigFloat!
              $favorLocalResources: Boolean
            ) {
              searchResources(
                searchText: $searchText
                latitude: $latitude
                longitude: $longitude
                favorLocalResources: $favorLocalResources
              ) {
                nodes {
                  id
                  title
                  distanceKm
                }
              }
            }
          `,
          variables: {
            searchText: prefix,
            latitude: 50.6072,
            longitude: 3.3889,
            favorLocalResources: true
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
            }>;
          };
        };
        errors?: Array<{ message: string }>;
      };

      expect(payload.errors).toBeUndefined();

      const nodes = payload.data?.searchResources.nodes ?? [];
      expect(nodes).toHaveLength(2);
      
      // Located resource should come first
      expect(nodes[0]?.title).toBe(`${prefix} - Located`);
      expect(Number(nodes[0]?.distanceKm)).toBeLessThan(1);
      
      // Unlocated resource should come last, assigned to max distance (50 km default)
      expect(nodes[1]?.title).toBe(`${prefix} - Unlocated`);
      expect(Number(nodes[1]?.distanceKm)).toBe(50);
    });

    it("filters out unlocated resources when favorLocalResources=false", async () => {
      const prefix = `US1 Proximity No Local ${Date.now()}`;
      const creator = await seedDemoAccount({
        identifier: `proximity-no-local-${Date.now()}@example.com`,
        displayName: "Proximity No Local Creator"
      });

      // Located resource
      await seedResource({
        creatorAccount: creator,
        title: `${prefix} - Located`,
        description: "Located resource",
        location: "Tournai centre",
        latitude: 50.6072,
        longitude: 3.3889,
        expiresAt: null
      });

      // Unlocated resource
      await seedResource({
        creatorAccount: creator,
        title: `${prefix} - Unlocated`,
        description: "Unlocated resource",
        location: null,
        latitude: null,
        longitude: null,
        expiresAt: null
      });

      const response = await fetch(`${TEST_BACKEND_URL}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query: `
            query SearchResourcesNoLocal(
              $searchText: String!
              $latitude: BigFloat!
              $longitude: BigFloat!
              $favorLocalResources: Boolean
            ) {
              searchResources(
                searchText: $searchText
                latitude: $latitude
                longitude: $longitude
                favorLocalResources: $favorLocalResources
              ) {
                nodes {
                  title
                  distanceKm
                }
              }
            }
          `,
          variables: {
            searchText: prefix,
            latitude: 50.6072,
            longitude: 3.3889,
            favorLocalResources: false
          }
        })
      });

      expect(response.status).toBe(200);

      const payload = (await response.json()) as {
        data?: {
          searchResources: {
            nodes: Array<{
              title: string;
              distanceKm: string;
            }>;
          };
        };
        errors?: Array<{ message: string }>;
      };

      expect(payload.errors).toBeUndefined();

      const nodes = payload.data?.searchResources.nodes ?? [];
      
      // Only located resource should be returned
      expect(nodes).toHaveLength(1);
      expect(nodes[0]?.title).toBe(`${prefix} - Located`);
    });

    it("respects maxDistanceKm parameter and caps at system setting", async () => {
      const prefix = `US1 Proximity Distance Cap ${Date.now()}`;
      const creator = await seedDemoAccount({
        identifier: `proximity-distance-cap-${Date.now()}@example.com`,
        displayName: "Proximity Distance Cap Creator"
      });

      // Resource 10 km away (Tournai)
      await seedResource({
        creatorAccount: creator,
        title: `${prefix} - Near 10km`,
        description: "Near resource",
        location: "Tournai centre",
        latitude: 50.6072,
        longitude: 3.3889,
        expiresAt: null
      });

      // Resource ~50 km away (Brussels area)
      await seedResource({
        creatorAccount: creator,
        title: `${prefix} - Far 50km`,
        description: "Far resource",
        location: "Brussels",
        latitude: 50.85,
        longitude: 4.35,
        expiresAt: null
      });

      // Test with maxDistanceKm=30 (should exclude ~50km resource)
      const response = await fetch(`${TEST_BACKEND_URL}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query: `
            query SearchResourcesDistanceCap(
              $searchText: String!
              $latitude: BigFloat!
              $longitude: BigFloat!
              $maxDistanceKm: BigFloat
            ) {
              searchResources(
                searchText: $searchText
                latitude: $latitude
                longitude: $longitude
                maxDistanceKm: $maxDistanceKm
              ) {
                nodes {
                  title
                  distanceKm
                }
              }
            }
          `,
          variables: {
            searchText: prefix,
            latitude: 50.6072,
            longitude: 3.3889,
            maxDistanceKm: 30
          }
        })
      });

      expect(response.status).toBe(200);

      const payload = (await response.json()) as {
        data?: {
          searchResources: {
            nodes: Array<{
              title: string;
              distanceKm: string;
            }>;
          };
        };
        errors?: Array<{ message: string }>;
      };

      expect(payload.errors).toBeUndefined();

      const nodes = payload.data?.searchResources.nodes ?? [];
      
      // Only the near resource should be included
      expect(nodes.length).toBe(1);
      expect(nodes[0]?.title).toBe(`${prefix} - Near 10km`);
      expect(Number(nodes[0]?.distanceKm)).toBeLessThan(30);
    });

    it("combines favorLocalResources and maxDistanceKm filters correctly", async () => {
      const prefix = `US1 Proximity Combined ${Date.now()}`;
      const creator = await seedDemoAccount({
        identifier: `proximity-combined-${Date.now()}@example.com`,
        displayName: "Proximity Combined Creator"
      });

      // Close located resource
      await seedResource({
        creatorAccount: creator,
        title: `${prefix} - Close Located`,
        description: "Close located",
        location: "Tournai centre",
        latitude: 50.6072,
        longitude: 3.3889,
        expiresAt: null
      });

      // Far located resource
      await seedResource({
        creatorAccount: creator,
        title: `${prefix} - Far Located`,
        description: "Far located",
        location: "Brussels",
        latitude: 50.85,
        longitude: 4.35,
        expiresAt: null
      });

      // Unlocated resource
      await seedResource({
        creatorAccount: creator,
        title: `${prefix} - Unlocated`,
        description: "Unlocated",
        location: null,
        latitude: null,
        longitude: null,
        expiresAt: null
      });

      // Test with favorLocalResources=true and maxDistanceKm=30
      const response = await fetch(`${TEST_BACKEND_URL}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          query: `
            query SearchResourcesCombined(
              $searchText: String!
              $latitude: BigFloat!
              $longitude: BigFloat!
              $favorLocalResources: Boolean
              $maxDistanceKm: BigFloat
            ) {
              searchResources(
                searchText: $searchText
                latitude: $latitude
                longitude: $longitude
                favorLocalResources: $favorLocalResources
                maxDistanceKm: $maxDistanceKm
              ) {
                nodes {
                  title
                  distanceKm
                }
              }
            }
          `,
          variables: {
            searchText: prefix,
            latitude: 50.6072,
            longitude: 3.3889,
            favorLocalResources: true,
            maxDistanceKm: 30
          }
        })
      });

      expect(response.status).toBe(200);

      const payload = (await response.json()) as {
        data?: {
          searchResources: {
            nodes: Array<{
              title: string;
              distanceKm: string;
            }>;
          };
        };
        errors?: Array<{ message: string }>;
      };

      expect(payload.errors).toBeUndefined();

      const nodes = payload.data?.searchResources.nodes ?? [];
      const titles = nodes.map(n => n.title);

      // Should include close located, unlocated (assigned to 30 since it's the cap), but exclude far located
      expect(titles).toContain(`${prefix} - Close Located`);
      expect(titles).toContain(`${prefix} - Unlocated`);
      expect(titles).not.toContain(`${prefix} - Far Located`);

      // Verify ordering: close located first, then unlocated
      expect(nodes[0]?.title).toBe(`${prefix} - Close Located`);
      expect(nodes[1]?.title).toBe(`${prefix} - Unlocated`);
      expect(Number(nodes[1]?.distanceKm)).toBe(30);
    });
  });
});
