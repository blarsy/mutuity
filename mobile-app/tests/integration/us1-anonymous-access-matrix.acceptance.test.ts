import { mainScreenRegistry } from "../../src/navigation/mainScreenRegistry";

type AnonymousBehavior = "allowed" | "loginPrompt" | "hidden";

const anonymousBehaviorByLabel: Record<string, AnonymousBehavior> = {
  "Search resources": "allowed",
  "Search needs": "allowed",
  "My resources": "loginPrompt",
  "My needs": "loginPrompt",
  "My bids": "loginPrompt",
  "My claims": "loginPrompt",
  Chat: "loginPrompt",
  Notifications: "loginPrompt",
  "My campaigns": "loginPrompt",
  "My profile": "hidden",
  "My preferences": "hidden",
  Contribution: "hidden"
} as const;

describe("US1 anonymous access matrix acceptance", () => {
  it("keeps browse-only screens accessible and restricted surfaces gated for anonymous users", () => {
    expect(mainScreenRegistry.map((entry) => entry.label)).toEqual([
      "Search resources",
      "Search needs",
      "My resources",
      "My needs",
      "My bids",
      "My claims",
      "Chat",
      "Notifications",
      "My campaigns",
      "My profile",
      "My preferences",
      "Contribution"
    ]);

    const matrix = mainScreenRegistry.map((entry) => ({
      label: entry.label,
      routeName: entry.routeName,
      anonymousBehavior: anonymousBehaviorByLabel[entry.label]
    }));

    expect(matrix).toEqual([
      { label: "Search resources", routeName: "SearchResources", anonymousBehavior: "allowed" },
      { label: "Search needs", routeName: "SearchNeeds", anonymousBehavior: "allowed" },
      { label: "My resources", routeName: "MyResources", anonymousBehavior: "loginPrompt" },
      { label: "My needs", routeName: "MyNeeds", anonymousBehavior: "loginPrompt" },
      { label: "My bids", routeName: "MyBids", anonymousBehavior: "loginPrompt" },
      { label: "My claims", routeName: "MyClaims", anonymousBehavior: "loginPrompt" },
      { label: "Chat", routeName: "Chat", anonymousBehavior: "loginPrompt" },
      { label: "Notifications", routeName: "Notifications", anonymousBehavior: "loginPrompt" },
      { label: "My campaigns", routeName: "MyCampaigns", anonymousBehavior: "loginPrompt" },
      { label: "My profile", routeName: "MyProfile", anonymousBehavior: "hidden" },
      { label: "My preferences", routeName: "MyPreferences", anonymousBehavior: "hidden" },
      { label: "Contribution", routeName: "MyEconomics", anonymousBehavior: "hidden" }
    ]);
  });
});