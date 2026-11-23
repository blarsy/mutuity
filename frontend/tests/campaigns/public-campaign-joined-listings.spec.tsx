/** @jest-environment jsdom */
import { readFileSync } from "fs";
import { resolve } from "path";
import { buildSchema, parse, validate } from "graphql";
import { act } from "react";
import type { Root } from "react-dom/client";
import type { ReactNode } from "react";

import { PUBLIC_CAMPAIGN_JOINED_LINKS_QUERY, PublicCampaignJoinedListings } from "../../src/features/campaigns/PublicCampaignJoinedListings";
import { PUBLIC_NEED_DETAIL_QUERY } from "../../src/features/needs/needs.queries";
import { RESOURCE_DETAIL_QUERY } from "../../src/features/resources/resources.queries";

const mockQuery = jest.fn();
const mockPush = jest.fn();
// Keep the Apollo client identity stable across renders, as it is in the app.
const mockClient = { query: mockQuery };
jest.mock("@apollo/client/react", () => ({ useApolloClient: () => mockClient }));
jest.mock("next/router", () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock("@mui/material", () => {
  const Container = ({ children, action, role }: { children?: ReactNode; action?: ReactNode; role?: string }) => <div role={role}>{children}{action}</div>;
  return { Alert: Container, Box: Container, Stack: Container, Typography: Container,
    Button: ({ children, onClick }: { children: ReactNode; onClick: () => void }) => <button onClick={onClick}>{children}</button> };
});
jest.mock("../../src/features/ui/NeedCard", () => ({ NeedCard: ({ title, creatorName, onClick }: { title: string; creatorName: string; onClick: () => void }) => <button onClick={onClick}>need: {title} ({creatorName})</button> }));
jest.mock("../../src/features/ui/ResourceCard", () => ({ ResourceCard: ({ title, creatorName, onClick }: { title: string; creatorName: string; onClick: () => void }) => <button onClick={onClick}>resource: {title} ({creatorName})</button> }));

const links = (needs: Array<{ campaignId: string; needId: string }>, resources: Array<{ campaignId: string; resourceId: string }> = []) => ({ data: {
  publicCampaignNeedLinks: { nodes: needs }, publicCampaignResourceLinks: { nodes: resources }
} });
const need = (id: string, extra = {}) => ({ data: { needById: { id, title: id, isActive: true, expiresAt: null, imageUrls: [], description: null, accountByCreatorAccountId: null, ...extra } } });
const resource = (id: string, extra = {}) => ({ data: { resourceById: { id, title: id, isActive: true, expiresAt: null, imageUrls: [], description: null, accountByCreatorAccountId: { displayName: "Alice" }, ...extra } } });
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

let container: HTMLDivElement;
let root: Root;
beforeAll(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
});
beforeEach(() => {
  mockQuery.mockReset(); mockPush.mockReset();
  container = document.createElement("div"); document.body.appendChild(container);
  root = require("react-dom/client").createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });
async function render(campaignId: string) { await act(async () => { root.render(<PublicCampaignJoinedListings campaignId={campaignId} />); }); }
async function click(text: string) {
  const button = [...container.querySelectorAll("button")].find(item => item.textContent?.includes(text));
  expect(button).toBeDefined();
  await act(async () => { button!.dispatchEvent(new window.MouseEvent("click", { bubbles: true })); });
}

it("uses valid schema operations and complete public links without unsupported filtering or pagination", () => {
  const schema = buildSchema(readFileSync(resolve(__dirname, "../../src/graphql/schema.graphql"), "utf8"));
  for (const document of [PUBLIC_CAMPAIGN_JOINED_LINKS_QUERY, PUBLIC_NEED_DETAIL_QUERY, RESOURCE_DETAIL_QUERY]) {
    expect(validate(schema, parse(document.loc!.source.body))).toEqual([]);
  }
  const source = PUBLIC_CAMPAIGN_JOINED_LINKS_QUERY.loc!.source.body;
  expect(source).not.toMatch(/condition|filter|first|after|allCampaignNeeds|allCampaignResources/);
});

it("scopes and deduplicates accepted links, omits unavailable/inactive/expired details, and navigates", async () => {
  mockQuery.mockImplementation(({ query, variables }) => {
    if (query === PUBLIC_CAMPAIGN_JOINED_LINKS_QUERY) return Promise.resolve(links([
      { campaignId: "a", needId: "n1" }, { campaignId: "a", needId: "n1" }, { campaignId: "b", needId: "other" },
      { campaignId: "a", needId: "inactive" }, { campaignId: "a", needId: "expired" }, { campaignId: "a", needId: "missing" }
    ], [{ campaignId: "a", resourceId: "r1" }, { campaignId: "a", resourceId: "r1" }]));
    if (variables.needId === "inactive") return Promise.resolve(need("inactive", { isActive: false }));
    if (variables.needId === "expired") return Promise.resolve(need("expired", { expiresAt: "2000-01-01T00:00:00Z" }));
    if (variables.needId === "missing") return Promise.resolve({ data: { needById: null } });
    if (variables.needId) return Promise.resolve(need(variables.needId));
    return Promise.resolve(resource(variables.resourceId));
  });
  await render("a");
  expect(container.textContent).toContain("need: n1 (public.joinedListings.unknownCreator)");
  expect(container.textContent).toContain("resource: r1 (Alice)");
  expect(container.textContent).not.toMatch(/other|inactive|expired|missing/);
  expect(mockQuery).toHaveBeenCalledTimes(6);
  expect(mockQuery.mock.calls.every(([options]) => options.fetchPolicy === "no-cache" && options.context.fetchOptions.signal instanceof AbortSignal)).toBe(true);
  await click("need: n1"); await click("resource: r1");
  expect(mockPush.mock.calls).toEqual([["/needs/n1"], ["/resources/r1"]]);
});

it("processes every link from an unbounded connection, including entries beyond typical page sizes", async () => {
  mockQuery.mockImplementation(({ query, variables }) => query === PUBLIC_CAMPAIGN_JOINED_LINKS_QUERY
    ? Promise.resolve(links(Array.from({ length: 125 }, (_, index) => ({ campaignId: "a", needId: `n${index}` }))))
    : Promise.resolve(need(variables.needId)));
  await render("a");
  expect(container.querySelectorAll("button")).toHaveLength(125);
  expect(container.textContent).toContain("need: n124");
  expect(mockQuery).toHaveBeenCalledTimes(126);
});

it("shows loading, handles errors and retries to an empty state", async () => {
  const pending = deferred<ReturnType<typeof links>>();
  mockQuery.mockReturnValueOnce(pending.promise).mockResolvedValueOnce(links([]));
  await render("a");
  expect(container.textContent).toContain("public.joinedListings.loading");
  await act(async () => { pending.reject(new Error("network")); });
  expect(container.textContent).toContain("public.joinedListings.error");
  await click("public.joinedListings.retry");
  expect(container.textContent).toContain("public.joinedListings.emptyNeeds");
  expect(container.textContent).toContain("public.joinedListings.emptyResources");
});

it.each(["links", "detail"])("treats missing %s data as an error rather than a misleading empty state", async failure => {
  mockQuery.mockImplementation(({ query }) => {
    if (query === PUBLIC_CAMPAIGN_JOINED_LINKS_QUERY) return Promise.resolve(failure === "links"
      ? { data: { publicCampaignNeedLinks: null, publicCampaignResourceLinks: { nodes: [] } } }
      : links([{ campaignId: "a", needId: "n1" }]));
    return Promise.reject(new Error("detail failed"));
  });
  await render("a");
  expect(container.textContent).toContain("public.joinedListings.error");
  expect(container.textContent).not.toContain("public.joinedListings.emptyNeeds");
});

it("does not start old detail reads when an obsolete link request completes", async () => {
  const oldLinks = deferred<ReturnType<typeof links>>();
  mockQuery.mockReturnValueOnce(oldLinks.promise).mockResolvedValueOnce(links([]));
  await render("a");
  await render("b");
  await act(async () => { oldLinks.resolve(links([{ campaignId: "a", needId: "old" }])); });
  expect(mockQuery).toHaveBeenCalledTimes(2);
  expect(container.textContent).toContain("public.joinedListings.emptyNeeds");
});

it("bounds combined detail concurrency and stops starting requests after unmount", async () => {
  const requests = Array.from({ length: 10 }, () => deferred<ReturnType<typeof need>>());
  mockQuery.mockImplementation(({ query, variables }) => query === PUBLIC_CAMPAIGN_JOINED_LINKS_QUERY
    ? Promise.resolve(links(Array.from({ length: 10 }, (_, index) => ({ campaignId: "a", needId: `n${index}` }))))
    : requests[Number(variables.needId.slice(1))].promise);
  await render("a");
  expect(mockQuery).toHaveBeenCalledTimes(7);
  await act(async () => { requests[0].resolve(need("n0")); });
  expect(mockQuery).toHaveBeenCalledTimes(8);
  await act(async () => { root.unmount(); });
  await act(async () => { requests[1].resolve(need("n1")); });
  expect(mockQuery).toHaveBeenCalledTimes(8);
  root = require("react-dom/client").createRoot(container);
});

it("never shows or continues an old campaign after its id changes, even when requests ignore abort", async () => {
  const oldDetail = deferred<ReturnType<typeof need>>();
  let oldSignal: AbortSignal | undefined;
  mockQuery.mockImplementation(({ query, variables, context }) => {
    if (query === PUBLIC_CAMPAIGN_JOINED_LINKS_QUERY) {
      return Promise.resolve(mockQuery.mock.calls.filter(([options]) => options.query === query).length === 1
        ? links([{ campaignId: "a", needId: "old" }]) : links([{ campaignId: "b", needId: "new" }]));
    }
    if (variables.needId === "old") { oldSignal = context.fetchOptions.signal; return oldDetail.promise; }
    return Promise.resolve(need("new"));
  });
  await render("a");
  await render("b");
  expect(oldSignal?.aborted).toBe(true);
  expect(container.textContent).toContain("need: new");
  await act(async () => { oldDetail.resolve(need("old")); });
  expect(container.textContent).toContain("need: new");
  expect(container.textContent).not.toContain("need: old");
});