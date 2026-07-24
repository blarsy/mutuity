import { mainScreenRegistry } from "./mainScreenRegistry";

export type MainScreenRouteName = (typeof mainScreenRegistry)[number]["routeName"];

export const anonymousBrowseAllowedRoutes: MainScreenRouteName[] = ["SearchResources", "SearchNeeds"];

export const anonymousLoginPromptRoutes: MainScreenRouteName[] = [
  "MyResources",
  "MyNeeds",
  "MyBids",
  "MyClaims",
  "Chat",
  "Notifications",
  "MyCampaigns"
];

export const anonymousHiddenRoutes: MainScreenRouteName[] = ["MyProfile", "MyPreferences", "MyEconomics"];

export function isAnonymousBrowseAllowed(routeName: MainScreenRouteName): boolean {
  return anonymousBrowseAllowedRoutes.includes(routeName);
}

export function isAnonymousLoginPrompt(routeName: MainScreenRouteName): boolean {
  return anonymousLoginPromptRoutes.includes(routeName);
}

export function isAnonymousHidden(routeName: MainScreenRouteName): boolean {
  return anonymousHiddenRoutes.includes(routeName);
}

export function resolveAnonymousRoute(routeName: MainScreenRouteName): MainScreenRouteName {
  return isAnonymousHidden(routeName) ? "SearchResources" : routeName;
}

export function isRestrictedMainScreen(routeName: MainScreenRouteName): boolean {
  return isAnonymousLoginPrompt(routeName) || isAnonymousHidden(routeName);
}