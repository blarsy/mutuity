import {
  SEARCH_RESOURCES_QUERY,
  RESOURCE_BY_ID_QUERY,
  MY_RESOURCES_QUERY
} from "../../src/services/graphql/operations";
import {
  buildSearchResourcesVariables,
  fetchSearchResources,
  normalizeSearchResource
} from "../../src/services/graphql/resources";
import { TriStateFilter, type SearchResourcesRecord } from "../../src/services/graphql/generated";
import { apolloClient } from "../../src/services/graphql/client";
import { print } from "graphql";

jest.mock("../../src/services/graphql/client", () => ({ apolloClient: { query: jest.fn() } }));

describe("US1 search resources contract", () => {
  it("exports the search resources query document", () => {
    expect(SEARCH_RESOURCES_QUERY).toBeDefined();
    expect(print(SEARCH_RESOURCES_QUERY)).toContain("latitude: $latitude");
    expect(print(SEARCH_RESOURCES_QUERY)).toContain("longitude: $longitude");
  });

  it("exports the resource detail query document", () => {
    expect(RESOURCE_BY_ID_QUERY).toBeDefined();
  });

  it("exports the my resources query document", () => {
    expect(MY_RESOURCES_QUERY).toBeDefined();
  });

  it("maps screen filters into backend searchResources variables", () => {
    const variables = buildSearchResourcesVariables({
      searchTerm: "bike",
      hasReferenceLocation: true,
      referenceLocation: { latitude: 0, longitude: 2.35 },
      distanceKm: 25,
      natureOptions: { isProduct: false, isService: true },
      transportOptions: { canBeTakenAway: false, canBeDelivered: true },
      exchangeOptions: { canBeExchanged: true, canBeGifted: false }
    });

    expect(variables.searchText).toBe("bike");
    expect(variables.favorLocalResources).toBe(true);
    expect(variables.maxDistanceKm).toBe(25);
    expect(variables.latitude).toBe(0);
    expect(variables.longitude).toBe(2.35);
    expect(variables.isProduct).toBe(TriStateFilter.Neutral);
    expect(variables.isService).toBe(TriStateFilter.Set);
    expect(variables.canBeDelivered).toBe(TriStateFilter.Set);
    expect(variables.canBeTakenAway).toBe(TriStateFilter.Neutral);
    expect(variables.canBeExchanged).toBe(TriStateFilter.Set);
    expect(variables.canBeGiven).toBe(TriStateFilter.Neutral);
  });

  it("omits incomplete, invalid or disabled reference coordinates", () => {
    const filters = {
      searchTerm: "",
      hasReferenceLocation: true,
      distanceKm: 10,
      natureOptions: { isProduct: false, isService: false },
      transportOptions: { canBeTakenAway: false, canBeDelivered: false },
      exchangeOptions: { canBeExchanged: false, canBeGifted: false }
    };
    for (const referenceLocation of [null, { latitude: NaN, longitude: 2 }, { latitude: 91, longitude: 2 }]) {
      const variables = buildSearchResourcesVariables({ ...filters, referenceLocation });
      expect(variables.latitude).toBeUndefined();
      expect(variables.longitude).toBeUndefined();
    }
    const disabled = buildSearchResourcesVariables({
      ...filters,
      hasReferenceLocation: false,
      referenceLocation: { latitude: 50, longitude: 3 }
    });
    expect(disabled.latitude).toBeUndefined();
    expect(disabled.longitude).toBeUndefined();
    expect(disabled.maxDistanceKm).toBeUndefined();
  });

  it("passes selected coordinates to Apollo search variables", async () => {
    jest.mocked(apolloClient.query).mockResolvedValueOnce({ data: { searchResources: { nodes: [] } } } as never);
    await fetchSearchResources({
      searchTerm: "",
      hasReferenceLocation: true,
      referenceLocation: { latitude: 48.85, longitude: 2.35 },
      distanceKm: 10,
      natureOptions: { isProduct: false, isService: false },
      transportOptions: { canBeTakenAway: false, canBeDelivered: false },
      exchangeOptions: { canBeExchanged: false, canBeGifted: false }
    });
    expect(apolloClient.query).toHaveBeenCalledWith(expect.objectContaining({
      query: SEARCH_RESOURCES_QUERY,
      variables: expect.objectContaining({ latitude: 48.85, longitude: 2.35 })
    }));
  });

  it("normalizes backend resource records for screen rendering", () => {
    const record: SearchResourcesRecord = {
      __typename: "SearchResourcesRecord",
      canBeDelivered: true,
      canBeExchanged: false,
      canBeGiven: true,
      canBeTakenAway: true,
      categoryLabels: ["Transport"],
      createdAt: null,
      creatorAccountId: null,
      creatorDisplayName: null,
      defaultTokenAmount: null,
      description: "Repair support",
      distanceKm: 3.2,
      expiresAt: null,
      id: "00000000-0000-0000-0000-000000000001",
      imageUrls: null,
      intensity: null,
      isActive: true,
      isProduct: false,
      isService: true,
      latitude: 48.85,
      location: "Paris",
      longitude: 2.35,
      queryLatitude: null,
      queryLongitude: null,
      title: "Bike Repair Session",
      updatedAt: null
    };

    const normalized = normalizeSearchResource(record);

    expect(normalized).toBeTruthy();
    expect(normalized?.id).toBe("00000000-0000-0000-0000-000000000001");
    expect(normalized?.type).toBe("service");
    expect(normalized?.canBeGifted).toBe(true);
    expect(normalized?.category).toBe("Transport");
  });

  it("parses string distance values returned from BigFloat fields", () => {
    const record: SearchResourcesRecord = {
      __typename: "SearchResourcesRecord",
      canBeDelivered: true,
      canBeExchanged: false,
      canBeGiven: false,
      canBeTakenAway: true,
      categoryLabels: ["Food"],
      createdAt: null,
      creatorAccountId: null,
      creatorDisplayName: null,
      defaultTokenAmount: null,
      description: "Food basket",
      distanceKm: "4.25",
      expiresAt: null,
      id: "00000000-0000-0000-0000-000000000002",
      imageUrls: null,
      intensity: null,
      isActive: true,
      isProduct: true,
      isService: false,
      latitude: null,
      location: null,
      longitude: null,
      queryLatitude: null,
      queryLongitude: null,
      title: "Community Pantry Basket",
      updatedAt: null
    };

    const normalized = normalizeSearchResource(record);

    expect(normalized?.distanceKm).toBe(4.25);
    expect(normalized?.located).toBe(false);
    expect(normalizeSearchResource({ ...record, latitude: "50.6072", longitude: "3.3889" })?.located).toBe(true);
  });
});