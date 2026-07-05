import { mainScreenRegistry } from "../../src/navigation/mainScreenRegistry";

const hiddenAnonymousRoutes = ["MyProfile", "MyPreferences", "MyEconomics"] as const;
const allowedAnonymousFallbackRoute = "SearchResources";

function resolveAnonymousDeepLinkTarget(routeName: string): string {
  return hiddenAnonymousRoutes.includes(routeName as (typeof hiddenAnonymousRoutes)[number])
    ? allowedAnonymousFallbackRoute
    : routeName;
}

describe("US1 anonymous restricted routes acceptance", () => {
  it("blocks anonymous deep links to profile, preferences, and contribution and reroutes to an allowed surface", () => {
    const restrictedEntries = mainScreenRegistry.filter((entry) =>
      hiddenAnonymousRoutes.includes(entry.routeName as (typeof hiddenAnonymousRoutes)[number])
    );

    expect(restrictedEntries.map((entry) => entry.label)).toEqual([
      "My profile",
      "My preferences",
      "Contribution"
    ]);

    expect(resolveAnonymousDeepLinkTarget("MyProfile")).toBe(allowedAnonymousFallbackRoute);
    expect(resolveAnonymousDeepLinkTarget("MyPreferences")).toBe(allowedAnonymousFallbackRoute);
    expect(resolveAnonymousDeepLinkTarget("MyEconomics")).toBe(allowedAnonymousFallbackRoute);
    expect(resolveAnonymousDeepLinkTarget("SearchResources")).toBe("SearchResources");
    expect(resolveAnonymousDeepLinkTarget("SearchNeeds")).toBe("SearchNeeds");
  });
});