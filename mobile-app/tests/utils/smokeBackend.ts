import { ApolloLink, Observable } from "@apollo/client";
import { cleanup } from "@testing-library/react-native";

import { apolloClient, resetAccountGraphqlState } from "../../src/services/graphql/client";
import { appSettings } from "../../src/config/appSettings";

// App-level Jest smoke tests exercise real providers/services, but do not start a
// backend. Keep their background reads explicit instead of contacting a developer
// server (or letting auth hydration hang on an unreachable CI endpoint).
const emptyConnection = () => ({
  nodes: [],
  pageInfo: { hasNextPage: false, endCursor: null }
});

const reads: Record<string, (variables: Record<string, unknown>) => Record<string, unknown>> = {
  AccountById: ({ id }) => ({
    accountById: { id, displayName: "Smoke Member", avatarUrl: null, location: null, preferredLanguage: "en" }
  }),
  AccountProfile: ({ id }) => ({
    accountById: {
      id, displayName: "Smoke Member", avatarUrl: null, location: null,
      preferredLanguage: "en", bio: null, latitude: null, longitude: null, profileLinks: []
    },
    allResources: emptyConnection(),
    allNeeds: emptyConnection()
  }),
  LinkableCampaigns: () => ({ linkableCampaigns: emptyConnection() }),
  ResourceCategories: () => ({ allResourceCategories: emptyConnection() }),
  SearchResources: () => ({ searchResources: emptyConnection(), publicCampaignResourceLinks: emptyConnection() }),
  MyCampaigns: () => ({ allCampaigns: emptyConnection() }),
  ChatConversations: () => ({ listChatConversations: emptyConnection() }),
  CountUnreadChatConversations: () => ({ countUnreadChatConversations: 0 }),
  CountUnreadNotifications: () => ({ countUnreadNotifications: 0 }),
  CurrentTokenBalance: () => ({ currentTokenBalance: 0 }),
  AccountNotifications: () => ({ allAccountNotifications: emptyConnection() }),
  NeedClaimNotifications: () => ({ allNeedClaimNotifications: emptyConnection() }),
  ResourceBidNotifications: () => ({ allResourceBidNotifications: emptyConnection() })
};

let originalLink: ApolloLink;
let fetchSpy: jest.SpyInstance;
let unexpectedRequests: string[];

beforeEach(() => {
  unexpectedRequests = [];
  originalLink = apolloClient.link;
  apolloClient.setLink(new ApolloLink(operation => new Observable(observer => {
    // Keep an idle subscription without native sockets/retry timers. Realtime
    // delivery/reconnect behavior has its own integration tests.
    if (operation.operationName === "AccountEvents") return;
    const resolve = reads[operation.operationName ?? ""];
    if (!resolve) {
      const message = `Missing smoke backend fixture: ${operation.operationName}`;
      unexpectedRequests.push(message);
      observer.error(new Error(message));
      return;
    }
    observer.next({ data: resolve(operation.variables) });
    observer.complete();
  })));
  fetchSpy = jest.spyOn(globalThis, "fetch").mockImplementation(async input => {
    if (String(input) === `${appSettings.apiUrl}/health`) {
      return {
        ok: true,
        json: async () => ({ appVersionPolicy: { minIosSemver: "0.0.0", minAndroidSemver: "0.0.0" } })
      } as Response;
    }
    const message = `Unexpected smoke HTTP request: ${String(input)}`;
    unexpectedRequests.push(message);
    throw new Error(message);
  });
});

afterEach(async () => {
  cleanup();
  await resetAccountGraphqlState();
  apolloClient.setLink(originalLink);
  fetchSpy.mockRestore();
  // Components may intentionally catch errors: unknown requests must still fail
  // the test rather than silently turning a missing fixture into an empty UI.
  expect(unexpectedRequests).toEqual([]);
});