export interface MainScreenEntry {
  key: string;
  label: string;
  routeName: string;
  uiApproved: boolean;
}

export const mainScreenRegistry: MainScreenEntry[] = [
  { key: "search-resources", label: "Search resources", routeName: "SearchResources", uiApproved: false },
  { key: "search-needs", label: "Search needs", routeName: "SearchNeeds", uiApproved: false },
  { key: "my-resources", label: "My resources", routeName: "MyResources", uiApproved: false },
  { key: "my-needs", label: "My needs", routeName: "MyNeeds", uiApproved: false },
  { key: "my-bids", label: "My bids", routeName: "MyBids", uiApproved: false },
  { key: "my-claims", label: "My claims", routeName: "MyClaims", uiApproved: false },
  { key: "chat", label: "Chat", routeName: "Chat", uiApproved: false },
  { key: "notifications", label: "Notifications", routeName: "Notifications", uiApproved: false },
  { key: "my-campaigns", label: "My campaigns", routeName: "MyCampaigns", uiApproved: false },
  { key: "my-profile", label: "My profile", routeName: "MyProfile", uiApproved: false },
  { key: "my-preferences", label: "My preferences", routeName: "MyPreferences", uiApproved: false },
  { key: "my-economics", label: "Contribution", routeName: "MyEconomics", uiApproved: false }
];
