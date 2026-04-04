import { TEST_BACKEND_URL, seedDemoAccount } from "../integration/auth-test-helpers";
import { seedNeed } from "../integration/need-test-helpers";

jest.setTimeout(30000);

describe("need search contract", () => {
  it("exposes the public search shape with ranking metadata and filter inputs", async () => {
    const prefix = `Contract Search ${Date.now()}`;
    const creator = await seedDemoAccount({
      identifier: `contract-search-${Date.now()}@example.com`,
      displayName: "Contract Creator"
    });

    await seedNeed({
      creatorAccount: creator,
      title: `${prefix} - Visible Need`,
      description: `${prefix} contract coverage`,
      location: "Tournai centre",
      latitude: 50.6072,
      longitude: 3.3889,
      toolingRequired: false,
      competenceRequired: false,
      multiplePeopleRequired: false,
      objectRequired: true,
      requiredToolingText: "cargo bike",
      requiredCompetenceText: "coordination",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

    const response = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: `
          query ContractSearch($searchText: String!, $objectRequired: TriStateFilter!) {
            searchNeeds(
              searchText: $searchText
              objectRequired: $objectRequired
            ) {
              nodes {
                id
                title
                creatorDisplayName
                location
                latitude
                longitude
                intensity
                proposedTopesAmount
                objectRequired
                competenceRequired
                toolingRequired
                multiplePeopleRequired
                closenessScore
                easeOfSetupScore
                expirationScore
                weightedScore
                queryLatitude
                queryLongitude
              }
            }
          }
        `,
        variables: {
          searchText: prefix,
          objectRequired: "SET"
        }
      })
    });

    expect(response.status).toBe(200);

    await expect(response.json()).resolves.toMatchObject({
      data: {
        searchNeeds: {
          nodes: [
            {
              title: `${prefix} - Visible Need`,
              creatorDisplayName: "Contract Creator",
              location: "Tournai centre",
              objectRequired: true,
              queryLatitude: expect.any(String),
              queryLongitude: expect.any(String),
              closenessScore: expect.any(String),
              easeOfSetupScore: expect.any(String),
              expirationScore: expect.any(String),
              weightedScore: expect.any(String)
            }
          ]
        }
      }
    });
  });
});
