import { gql } from "@apollo/client";
import type { ClientOptions } from "graphql-ws";

const mockCreateClient = jest.fn();
const mockFetch = jest.fn();
jest.mock("graphql-ws", () => ({ createClient: (...args: unknown[]) => mockCreateClient(...args) }));
jest.mock("../../src/i18n", () => ({ __esModule: true, default: { language: "fr" } }));
jest.mock("../../src/features/auth/events", () => ({ notifyAuthRequired: jest.fn() }));

type Sink = { next: (value: unknown) => void; complete: () => void };
const clients: Array<{ subscribe: jest.Mock; dispose: jest.Mock; sinks: Sink[]; stop: jest.Mock }> = [];
let graphql: typeof import("../../src/services/graphql/client");
const balanceQuery = gql`query AccountBoundaryBalance { currentTokenBalance }`;
const eventsQuery = gql`subscription AccountBoundaryEvents($topic: String!) { listen(topic: $topic) { relatedNodeId } }`;
async function flushLinks() { for (let i = 0; i < 12; i++) await Promise.resolve(); }

describe("GraphQL account boundary", () => {
  beforeAll(() => {
    Object.defineProperty(globalThis, "window", { configurable: true, value: new EventTarget() });
    jest.spyOn(globalThis, "fetch").mockImplementation(mockFetch);
    mockCreateClient.mockImplementation((_options: ClientOptions) => {
      const client = { subscribe: jest.fn(), dispose: jest.fn(), sinks: [] as Sink[], stop: jest.fn() };
      client.subscribe.mockImplementation((_payload: unknown, sink: Sink) => {
        client.sinks.push(sink);
        return client.stop;
      });
      client.dispose.mockResolvedValue(undefined);
      clients.push(client);
      return client;
    });
    graphql = require("../../src/services/graphql/client");
  });
  afterAll(async () => {
    await graphql.resetAccountGraphqlState();
    jest.restoreAllMocks();
    Reflect.deleteProperty(globalThis, "window");
  });

  it("disposes the old authenticated socket and creates a working client for the next account", async () => {
    const previous = graphql.apolloClient.subscribe({ query: eventsQuery, variables: { topic: "a" } }).subscribe({});
    await flushLinks();
    expect(clients).toHaveLength(1);
    await graphql.resetAccountGraphqlState();
    expect(clients[0].dispose).toHaveBeenCalledTimes(1);
    expect(clients[0].stop).toHaveBeenCalled();
    const receive = jest.fn();
    const next = graphql.apolloClient.subscribe({ query: eventsQuery, variables: { topic: "b" } }).subscribe({ next: receive });
    await flushLinks();
    expect(clients).toHaveLength(2);
    clients[1].sinks[0].next({ data: { listen: { relatedNodeId: "new" } } });
    expect(receive).toHaveBeenCalledWith(expect.objectContaining({ data: { listen: { relatedNodeId: "new" } } }));
    clients[0].sinks[0].next({ data: { listen: { relatedNodeId: "old" } } });
    expect(receive).toHaveBeenCalledTimes(1);
    expect(mockCreateClient).toHaveBeenLastCalledWith(expect.objectContaining({ retryAttempts: Infinity }));
    previous.unsubscribe();
    next.unsubscribe();
  });

  it("clears account-specific root data without refetching and ignores late old-account HTTP results", async () => {
    graphql.apolloClient.writeQuery({ query: balanceQuery, data: { currentTokenBalance: 42 } });
    let resolve!: (response: Response) => void;
    mockFetch.mockImplementationOnce(() => new Promise<Response>(done => { resolve = done; }));
    const oldQuery = graphql.apolloClient.query({ query: balanceQuery, fetchPolicy: "network-only" }).catch(() => undefined);
    await flushLinks();
    expect(mockFetch).toHaveBeenCalledTimes(1);
    await graphql.resetAccountGraphqlState();
    expect(graphql.apolloClient.readQuery({ query: balanceQuery })).toBeNull();
    resolve(new Response(JSON.stringify({ data: { currentTokenBalance: 999 } }), { headers: { "content-type": "application/json" } }));
    await oldQuery;
    await Promise.resolve();
    expect(graphql.apolloClient.readQuery({ query: balanceQuery })).toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(1);
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ data: { currentTokenBalance: 3 } }), { headers: { "content-type": "application/json" } }));
    await graphql.apolloClient.query({ query: balanceQuery, fetchPolicy: "network-only" });
    expect(graphql.apolloClient.readQuery({ query: balanceQuery })).toEqual({ currentTokenBalance: 3 });
  });

  it("shares root balance/count updates between differently named page and badge queries", () => {
    const combinedPageQuery = gql`query CombinedPageEconomics { currentTokenBalance countUnreadNotifications }`;
    const badgeQuery = gql`query AccountBoundaryBadge { countUnreadNotifications }`;
    graphql.apolloClient.writeQuery({ query: combinedPageQuery, data: { currentTokenBalance: 19, countUnreadNotifications: 8 } });
    expect(graphql.apolloClient.readQuery({ query: balanceQuery })).toEqual({ currentTokenBalance: 19 });
    expect(graphql.apolloClient.readQuery({ query: badgeQuery })).toEqual({ countUnreadNotifications: 8 });
    graphql.apolloClient.writeQuery({ query: badgeQuery, data: { countUnreadNotifications: 0 } });
    expect(graphql.apolloClient.readQuery({ query: combinedPageQuery })).toEqual({ currentTokenBalance: 19, countUnreadNotifications: 0 });
  });
});