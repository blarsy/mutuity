import { buildNeedSearchVariables, cycleTriStateFilter } from "../../src/features/needs/needFilters";
import { resolveNeedSearchLocation, TOURNAI_CITY_CENTRE } from "../../src/features/needs/locationFallback";
import { DEFAULT_NEED_SEARCH_FILTERS } from "../../src/features/needs/types";

describe("need filters", () => {
  it("cycles tri-state values in the expected order", () => {
    expect(cycleTriStateFilter("neutral")).toBe("set");
    expect(cycleTriStateFilter("set")).toBe("unset");
    expect(cycleTriStateFilter("unset")).toBe("neutral");
  });

  it("maps filter state into GraphQL variables", () => {
    const variables = buildNeedSearchVariables({
      filters: {
        ...DEFAULT_NEED_SEARCH_FILTERS,
        searchText: "cafe",
        objectRequired: "set",
        competenceRequired: "unset"
      },
      location: {
        latitude: 50.5,
        longitude: 3.4,
        source: "browser"
      }
    });

    expect(variables).toEqual({
      latitude: null,
      longitude: null,
      browserLatitude: 50.5,
      browserLongitude: 3.4,
      searchText: "cafe",
      multiplePeopleRequired: "NEUTRAL",
      toolingRequired: "NEUTRAL",
      competenceRequired: "UNSET",
      objectRequired: "SET",
      limitCount: 50
    });
  });

  it("resolves explicit, then account, then browser, then Tournai fallback", () => {
    expect(
      resolveNeedSearchLocation({
        explicitLocation: { latitude: 1, longitude: 2 },
        accountLocation: { latitude: 3, longitude: 4 },
        browserLocation: { latitude: 5, longitude: 6 }
      })
    ).toEqual({ latitude: 1, longitude: 2, source: "explicit" });

    expect(
      resolveNeedSearchLocation({
        accountLocation: { latitude: 3, longitude: 4 },
        browserLocation: { latitude: 5, longitude: 6 }
      })
    ).toEqual({ latitude: 3, longitude: 4, source: "account" });

    expect(
      resolveNeedSearchLocation({
        browserLocation: { latitude: 5, longitude: 6 }
      })
    ).toEqual({ latitude: 5, longitude: 6, source: "browser" });

    expect(resolveNeedSearchLocation({})).toEqual(TOURNAI_CITY_CENTRE);
  });
});
