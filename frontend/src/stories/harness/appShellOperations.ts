import type { MockApolloParameters } from "./mockApollo";

/**
 * Operations issued by `AppShell`/`AppTopBar` on every page, so page stories
 * render a realistic chrome instead of empty badges.
 */
export const appShellOperations: NonNullable<MockApolloParameters["operations"]> = {
  TokenBalance: { currentTokenBalance: 420 },
  CountUnreadNotifications: { countUnreadNotifications: 3 },
  CountUnreadChatConversations: { countUnreadChatConversations: 1 },
  ListChatConversations: { listChatConversations: { nodes: [] } },
  AccountEvents: { listen: { relatedNodeId: null } }
};

export function withAppShellOperations(
  operations: NonNullable<MockApolloParameters["operations"]> = {}
): NonNullable<MockApolloParameters["operations"]> {
  return { ...appShellOperations, ...operations };
}
