import { TEST_BACKEND_URL, seedDemoAccount } from "./auth-test-helpers";
import { seedNeed } from "./need-test-helpers";

jest.setTimeout(30000);

describe("need search integration", () => {
  it("returns only active, non-expired needs ordered by weighted score and capped at 50 results", async () => {
    const prefix = `US1 Search ${Date.now()}`;
    const creator = await seedDemoAccount({
      identifier: `search-${Date.now()}@example.com`,
      displayName: "Search Creator"
    });

    await seedNeed({
      creatorAccount: creator,
      title: `${prefix} - Highest Rank`,
      description: `${prefix} visible need`,
      location: "Tournai centre",
      latitude: 50.6072,
      longitude: 3.3889,
      toolingRequired: false,
      competenceRequired: false,
      multiplePeopleRequired: false,
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    });

    await seedNeed({
      creatorAccount: creator,
      title: `${prefix} - Lower Rank`,
      description: `${prefix} farther away need`,
      location: "Far away",
      latitude: 50.90,
      longitude: 4.20,
      toolingRequired: true,
      competenceRequired: true,
      multiplePeopleRequired: true,
      expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString()
    });

    await seedNeed({
      creatorAccount: creator,
      title: `${prefix} - Expired`,
      description: `${prefix} expired need`,
      location: "Old need",
      latitude: 50.6072,
      longitude: 3.3889,
      expiresAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
    });

    await seedNeed({
      creatorAccount: creator,
      title: `${prefix} - Inactive`,
      description: `${prefix} inactive need`,
      location: "Hidden need",
      latitude: 50.6072,
      longitude: 3.3889,
      isActive: false,
      expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
    });

    await Promise.all(
      Array.from({ length: 55 }, (_, index) =>
        seedNeed({
          creatorAccount: creator,
          title: `${prefix} - Bulk ${index + 1}`,
          description: `${prefix} bulk seeded need ${index + 1}`,
          location: `Bulk ${index + 1}`,
          latitude: 50.6072 + index * 0.0001,
          longitude: 3.3889 + index * 0.0001,
          expiresAt: new Date(Date.now() + (index + 2) * 60 * 60 * 1000).toISOString()
        })
      )
    );

    const response = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: `
          query SearchNeeds($searchText: String!, $latitude: BigFloat!, $longitude: BigFloat!) {
            searchNeeds(
              searchText: $searchText
              latitude: $latitude
              longitude: $longitude
              limitCount: 50
            ) {
              nodes {
                id
                title
                weightedScore
                closenessScore
                easeOfSetupScore
                expirationScore
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
        searchNeeds: {
          nodes: Array<{
            id: string;
            title: string;
            weightedScore: string;
            closenessScore: string;
            easeOfSetupScore: string;
            expirationScore: string;
          }>;
        };
      };
      errors?: Array<{ message: string }>;
    };

    expect(payload.errors).toBeUndefined();

    const nodes = payload.data?.searchNeeds.nodes ?? [];
    expect(nodes).toHaveLength(50);
    expect(nodes.some(node => node.title.includes("Expired"))).toBe(false);
    expect(nodes.some(node => node.title.includes("Inactive"))).toBe(false);

    const highestRankIndex = nodes.findIndex(node => node.title === `${prefix} - Highest Rank`);
    expect(highestRankIndex).toBeGreaterThanOrEqual(0);
    expect(highestRankIndex).toBeLessThan(10);

    const weightedScores = nodes.map(node => Number(node.weightedScore));
    const sortedScores = [...weightedScores].sort((left, right) => right - left);
    expect(weightedScores).toEqual(sortedScores);
  });

  it("applies maxDistanceKm to proximity filtering", async () => {
    const prefix = `US1 Need Proximity ${Date.now()}`;
    const creator = await seedDemoAccount({
      identifier: `need-proximity-${Date.now()}@example.com`,
      displayName: "Need Proximity Creator"
    });

    await seedNeed({
      creatorAccount: creator,
      title: `${prefix} - Near`,
      description: `${prefix} near need`,
      location: "Tournai",
      latitude: 50.6072,
      longitude: 3.3889,
      expiresAt: null
    });

    await seedNeed({
      creatorAccount: creator,
      title: `${prefix} - Far`,
      description: `${prefix} far need`,
      location: "Mons",
      latitude: 50.4542,
      longitude: 3.9523,
      expiresAt: null
    });

    const response30 = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: `
          query SearchNeedsProximity(
            $searchText: String!
            $latitude: BigFloat!
            $longitude: BigFloat!
            $favorLocalResources: Boolean
            $maxDistanceKm: BigFloat
          ) {
            searchNeeds(
              searchText: $searchText
              latitude: $latitude
              longitude: $longitude
              favorLocalResources: $favorLocalResources
              maxDistanceKm: $maxDistanceKm
            ) {
              nodes {
                title
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

    expect(response30.status).toBe(200);

    const payload30 = (await response30.json()) as {
      data?: {
        searchNeeds: {
          nodes: Array<{
            title: string;
          }>;
        };
      };
      errors?: Array<{ message: string }>;
    };

    expect(payload30.errors).toBeUndefined();

    const titles30 = (payload30.data?.searchNeeds.nodes ?? []).map(node => node.title);
    expect(titles30).toContain(`${prefix} - Near`);
    expect(titles30).not.toContain(`${prefix} - Far`);

    const response50 = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: `
          query SearchNeedsProximityWide(
            $searchText: String!
            $latitude: BigFloat!
            $longitude: BigFloat!
            $favorLocalResources: Boolean
            $maxDistanceKm: BigFloat
          ) {
            searchNeeds(
              searchText: $searchText
              latitude: $latitude
              longitude: $longitude
              favorLocalResources: $favorLocalResources
              maxDistanceKm: $maxDistanceKm
            ) {
              nodes {
                title
              }
            }
          }
        `,
        variables: {
          searchText: prefix,
          latitude: 50.6072,
          longitude: 3.3889,
          favorLocalResources: true,
          maxDistanceKm: 50
        }
      })
    });

    expect(response50.status).toBe(200);

    const payload50 = (await response50.json()) as {
      data?: {
        searchNeeds: {
          nodes: Array<{
            title: string;
          }>;
        };
      };
      errors?: Array<{ message: string }>;
    };

    expect(payload50.errors).toBeUndefined();

    const titles50 = (payload50.data?.searchNeeds.nodes ?? []).map(node => node.title);
    expect(titles50).toContain(`${prefix} - Near`);
    expect(titles50).toContain(`${prefix} - Far`);
  });
});
