import { TEST_BACKEND_URL, loginWithGraphqlSessionCookie, seedDemoAccount } from "./auth-test-helpers";
import { seedNeed } from "./need-test-helpers";

jest.setTimeout(30000);

describe("need filtering integration", () => {
  it("applies accent-insensitive text search and tri-state filters", async () => {
    const prefix = `Filter ${Date.now()}`;
    const creator = await seedDemoAccount({
      identifier: `filter-${Date.now()}@example.com`,
      displayName: "Café Solidaire"
    });

    await seedNeed({
      creatorAccount: creator,
      title: `${prefix} Café vélo`,
      description: "Besoin urgent de transport solidaire",
      location: "Tournai",
      latitude: 50.6072,
      longitude: 3.3889,
      objectRequired: true,
      toolingRequired: true,
      competenceRequired: false,
      requiredToolingText: "vélo cargo",
      requiredCompetenceText: "coordination",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

    await seedNeed({
      creatorAccount: creator,
      title: `${prefix} Hidden`,
      description: "Should be filtered out",
      location: "Tournai",
      latitude: 50.6072,
      longitude: 3.3889,
      objectRequired: false,
      toolingRequired: false,
      competenceRequired: true,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

    const response = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: `
          query FilteredNeeds($searchText: String!, $objectRequired: TriStateFilter!, $toolingRequired: TriStateFilter!, $competenceRequired: TriStateFilter!) {
            searchNeeds(
              searchText: $searchText
              objectRequired: $objectRequired
              toolingRequired: $toolingRequired
              competenceRequired: $competenceRequired
            ) {
              nodes {
                title
                objectRequired
                toolingRequired
                competenceRequired
              }
            }
          }
        `,
        variables: {
          searchText: `${prefix} cafe`,
          objectRequired: "SET",
          toolingRequired: "SET",
          competenceRequired: "UNSET"
        }
      })
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        searchNeeds: {
          nodes: [
            {
              title: `${prefix} Café vélo`,
              objectRequired: true,
              toolingRequired: true,
              competenceRequired: false
            }
          ]
        }
      }
    });
  });

  it("uses account coordinates first, then browser coordinates, then Tournai fallback", async () => {
    const prefix = `Fallback ${Date.now()}`;
    const creator = await seedDemoAccount({
      identifier: `fallback-${Date.now()}@example.com`,
      displayName: "Fallback Creator"
    });

    await seedNeed({
      creatorAccount: creator,
      title: `${prefix} Account Need`,
      location: "Stored account location",
      latitude: 51.0001,
      longitude: 3.9999,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

    const fallbackCreator = await seedDemoAccount({
      identifier: `fallback-secondary-${Date.now()}@example.com`,
      displayName: "Fallback Secondary Creator"
    });

    await seedNeed({
      creatorAccount: fallbackCreator,
      title: `${prefix} Fallback Need`,
      location: "Tournai",
      latitude: 50.6072,
      longitude: 3.3889,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

    const sessionCookie = await loginWithGraphqlSessionCookie(creator.identifier, creator.password);

    const accountResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: sessionCookie
      },
      body: JSON.stringify({
        query: `
          query AccountFallback($searchText: String!) {
            searchNeeds(searchText: $searchText) {
              nodes {
                queryLatitude
                queryLongitude
              }
            }
          }
        `,
        variables: {
          searchText: `${prefix} Account`
        }
      })
    });

    expect(accountResponse.status).toBe(200);
    await expect(accountResponse.json()).resolves.toMatchObject({
      data: {
        searchNeeds: {
          nodes: [
            {
              queryLatitude: "51.000100",
              queryLongitude: "3.999900"
            }
          ]
        }
      }
    });

    const browserResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: `
          query BrowserFallback($searchText: String!, $browserLatitude: BigFloat!, $browserLongitude: BigFloat!) {
            searchNeeds(
              searchText: $searchText
              browserLatitude: $browserLatitude
              browserLongitude: $browserLongitude
            ) {
              nodes {
                queryLatitude
                queryLongitude
              }
            }
          }
        `,
        variables: {
          searchText: `${prefix} Account`,
          browserLatitude: 50.9001,
          browserLongitude: 3.8999
        }
      })
    });

    expect(browserResponse.status).toBe(200);
    await expect(browserResponse.json()).resolves.toMatchObject({
      data: {
        searchNeeds: {
          nodes: [
            {
              queryLatitude: "50.9001",
              queryLongitude: "3.8999"
            }
          ]
        }
      }
    });

    const fallbackResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: `
          query DefaultFallback($searchText: String!) {
            searchNeeds(searchText: $searchText) {
              nodes {
                queryLatitude
                queryLongitude
              }
            }
          }
        `,
        variables: {
          searchText: `${prefix} Fallback`
        }
      })
    });

    expect(fallbackResponse.status).toBe(200);
    await expect(fallbackResponse.json()).resolves.toMatchObject({
      data: {
        searchNeeds: {
          nodes: [
            {
              queryLatitude: "50.6072",
              queryLongitude: "3.3889"
            }
          ]
        }
      }
    });
  });
});
