import { print } from "graphql";
import { apolloClient } from "../../../src/services/graphql/client";
import { fetchCurrentTokenBalance } from "../../../src/services/graphql/economics";
import {
  fetchNotificationWindow, fetchUnreadNotificationsCount, markAllNotificationsRead, markNotificationRead
} from "../../../src/services/graphql/notifications";
import { signalAccountRefresh } from "../../../src/services/realtime/accountEvents";
import {
  ACCOUNT_NOTIFICATIONS_QUERY, NEED_CLAIM_NOTIFICATIONS_QUERY, RESOURCE_BID_NOTIFICATIONS_QUERY,
  COUNT_UNREAD_NOTIFICATIONS_QUERY, CURRENT_TOKEN_BALANCE_QUERY,
  MARK_ACCOUNT_NOTIFICATION_READ_MUTATION, MARK_NEED_CLAIM_NOTIFICATION_READ_MUTATION,
  MARK_RESOURCE_BID_NOTIFICATION_READ_MUTATION, MARK_ALL_NOTIFICATIONS_READ_MUTATION
} from "../../../src/services/graphql/operations";

jest.mock("../../../src/services/graphql/client", () => ({ apolloClient: { query: jest.fn(), mutate: jest.fn() } }));
// Service tests must not load native NetInfo or the authenticated provider.
jest.mock("../../../src/services/realtime/accountEvents", () => ({ signalAccountRefresh: jest.fn() }));
jest.mock("../../../src/i18n", () => ({
  __esModule: true, default: { t: (_key: string, options: { defaultValue: string }) => options.defaultValue }
}));

const sources = [
  { source: "account", field: "allAccountNotifications", query: ACCOUNT_NOTIFICATIONS_QUERY,
    mutation: MARK_ACCOUNT_NOTIFICATION_READ_MUTATION },
  { source: "need-claim", field: "allNeedClaimNotifications", query: NEED_CLAIM_NOTIFICATIONS_QUERY,
    mutation: MARK_NEED_CLAIM_NOTIFICATION_READ_MUTATION },
  { source: "resource-bid", field: "allResourceBidNotifications", query: RESOURCE_BID_NOTIFICATIONS_QUERY,
    mutation: MARK_RESOURCE_BID_NOTIFICATION_READ_MUTATION }
] as const;

function node(id: string, createdAt = "2026-10-10T10:00:00.000Z") {
  return { id, createdAt, readAt: null, payload: { needId: "need" }, eventType: "claim_created" };
}

function feed(overrides: Record<string, unknown> = {}) {
  const connections = Object.fromEntries(sources.map(({ field }) => [field, {
    nodes: [], pageInfo: { hasNextPage: false, endCursor: field === "allAccountNotifications" ? "account-cursor" : null }
  }]));
  Object.assign(connections, overrides);
  (apolloClient.query as jest.Mock).mockImplementation(({ query }) => {
    const source = sources.find(candidate => candidate.query === query)!;
    return Promise.resolve({ data: { [source.field]: connections[source.field] } });
  });
}

beforeEach(() => { jest.resetAllMocks(); });

describe("expanded three-source notification window", () => {
  it.each(sources)("uses the actual ordered $source document and scopes every query to the recipient", async ({ query: orderedQuery }) => {
    feed();
    await fetchNotificationWindow("alice", 100);
    expect(apolloClient.query).toHaveBeenCalledTimes(3);
    for (const { query } of sources) {
      expect(apolloClient.query).toHaveBeenCalledWith({
        query, variables: { first: 100, condition: { recipientAccountId: "alice" } }, fetchPolicy: "network-only"
      });
    }
    // A local tie-break sort cannot repair server pagination that cuts a timestamp tie nondeterministically.
    expect(print(orderedQuery)).toMatch(/orderBy:\s*\[CREATED_AT_DESC, ID_DESC\]/);
    expect(print(orderedQuery)).toContain("hasNextPage");
  });

  it("defaults to 50 and expands every source on subsequent reloads without a cursor", async () => {
    feed();
    await fetchNotificationWindow("alice");
    for (const { query } of sources) {
      expect(apolloClient.query).toHaveBeenCalledWith({
        query, variables: { first: 50, condition: { recipientAccountId: "alice" } }, fetchPolicy: "network-only"
      });
    }
    jest.clearAllMocks();
    await fetchNotificationWindow("bob", 150);
    for (const { query } of sources) {
      expect(apolloClient.query).toHaveBeenCalledWith({
        query, variables: { first: 150, condition: { recipientAccountId: "bob" } }, fetchPolicy: "network-only"
      });
    }
  });

  it("retains older secondary-source items in an expanded window across realtime reloads", async () => {
    (apolloClient.query as jest.Mock).mockImplementation(({ query, variables }) => {
      const source = sources.find(candidate => candidate.query === query)!;
      const nodes = Array.from({ length: 70 }, (_, index) => node(String(100 - index),
        new Date(Date.UTC(2026, 9, 10, 12, 0, -index)).toISOString()));
      return Promise.resolve({ data: { [source.field]: {
        nodes: nodes.slice(0, variables.first),
        pageInfo: { hasNextPage: variables.first < nodes.length, endCursor: "cursor" }
      } } });
    });
    const initial = await fetchNotificationWindow("alice");
    expect(initial.items).toHaveLength(150); expect(initial.hasNextPage).toBe(true);
    const expanded = await fetchNotificationWindow("alice", 100);
    expect(expanded.items).toHaveLength(210); expect(expanded.hasNextPage).toBe(false);
    for (const { source } of sources) {
      expect(expanded.items).toContainEqual(expect.objectContaining({ source, id: "31" }));
    }
    expect(await fetchNotificationWindow("alice", 100)).toEqual(expanded);
  });

  it("merges sources chronologically, breaks timestamp ties by descending id and deduplicates only within a source", async () => {
    feed({
      allAccountNotifications: { nodes: [node("a"), node("same"), node("a")],
        pageInfo: { hasNextPage: false, endCursor: "cursor" } },
      allNeedClaimNotifications: { nodes: [node("z"), node("same")], pageInfo: { hasNextPage: false } },
      allResourceBidNotifications: { nodes: [node("newest", "2026-10-10T11:00:00.000Z"),
        node("oldest", "2026-10-09T11:00:00.000Z")], pageInfo: { hasNextPage: false } }
    });
    const page = await fetchNotificationWindow("alice");
    expect(page.items.map(item => `${item.source}:${item.id}`)).toEqual([
      "resource-bid:newest", "need-claim:z", "account:same", "need-claim:same", "account:a", "resource-bid:oldest"
    ]);
    expect(page.items[0]).toEqual(expect.objectContaining({ readAt: null, payload: { needId: "need" } }));
    expect(page.endCursor).toBe("cursor");
    expect(page.hasNextPage).toBe(false);
  });

  it.each(sources)("reports hasNextPage when only $source has more data", async ({ field }) => {
    feed({ [field]: { nodes: [], pageInfo: { hasNextPage: true, endCursor: "source-cursor" } } });
    expect((await fetchNotificationWindow("alice")).hasNextPage).toBe(true);
  });

  it("returns a valid empty window rather than treating empty connections as unavailable", async () => {
    feed();
    expect(await fetchNotificationWindow("alice")).toEqual({ items: [], hasNextPage: false, endCursor: "account-cursor" });
  });

  it.each(sources)("rejects unavailable $source instead of presenting a misleading partial window", async ({ field }) => {
    feed({ [field]: null });
    await expect(fetchNotificationWindow("alice")).rejects.toThrow("Notification feed unavailable");
  });

  it("propagates query failure without signalling an invalidation", async () => {
    const error = new Error("network");
    (apolloClient.query as jest.Mock).mockRejectedValue(error);
    await expect(fetchNotificationWindow("alice")).rejects.toBe(error);
    expect(signalAccountRefresh).not.toHaveBeenCalled();
  });
});

describe.each([
  { name: "unread count", fetchValue: fetchUnreadNotificationsCount, query: COUNT_UNREAD_NOTIFICATIONS_QUERY,
    field: "countUnreadNotifications", message: "Unread count unavailable" },
  { name: "token balance", fetchValue: fetchCurrentTokenBalance, query: CURRENT_TOKEN_BALANCE_QUERY,
    field: "currentTokenBalance", message: "Token balance unavailable" }
])("$name service unknown-value contract", ({ fetchValue, query, field, message }) => {
  it.each([0, 24])("accepts the valid numeric value %i with network-only fetching", async value => {
    (apolloClient.query as jest.Mock).mockResolvedValue({ data: { [field]: value } });
    await expect(fetchValue()).resolves.toBe(value);
    expect(apolloClient.query).toHaveBeenCalledWith({ query, fetchPolicy: "network-only" });
  });
  it.each([null, undefined, "0"])("rejects unknown/non-numeric %p instead of returning a false zero", async value => {
    (apolloClient.query as jest.Mock).mockResolvedValue({ data: { [field]: value } });
    await expect(fetchValue()).rejects.toThrow(message);
  });
  it("rejects absent response data", async () => {
    (apolloClient.query as jest.Mock).mockResolvedValue({});
    await expect(fetchValue()).rejects.toThrow(message);
  });
});

describe("notification mutation invalidation", () => {
  it.each(sources)("marks $source with the matching mutation and signals only after success", async ({ source, mutation }) => {
    let resolve!: (value: unknown) => void;
    (apolloClient.mutate as jest.Mock).mockReturnValue(new Promise(yes => { resolve = yes; }));
    const pending = markNotificationRead("notice", source);
    expect(apolloClient.mutate).toHaveBeenCalledWith({ mutation, variables: { input: { notificationId: "notice" } } });
    expect(signalAccountRefresh).not.toHaveBeenCalled();
    resolve({ data: {} }); await pending;
    expect(signalAccountRefresh).toHaveBeenCalledTimes(1);
  });
  it.each(sources)("does not signal after a failed $source mutation", async ({ source }) => {
    const error = new Error("mutation rejected");
    (apolloClient.mutate as jest.Mock).mockRejectedValue(error);
    await expect(markNotificationRead("notice", source)).rejects.toBe(error);
    expect(signalAccountRefresh).not.toHaveBeenCalled();
  });
  it("mark-all signals once on success, never on failure", async () => {
    (apolloClient.mutate as jest.Mock).mockResolvedValue({ data: {} });
    await markAllNotificationsRead();
    expect(apolloClient.mutate).toHaveBeenCalledWith({ mutation: MARK_ALL_NOTIFICATIONS_READ_MUTATION, variables: { input: {} } });
    expect(signalAccountRefresh).toHaveBeenCalledTimes(1);
    jest.clearAllMocks();
    (apolloClient.mutate as jest.Mock).mockRejectedValue(new Error("denied"));
    await expect(markAllNotificationsRead()).rejects.toThrow("denied");
    expect(signalAccountRefresh).not.toHaveBeenCalled();
  });
});