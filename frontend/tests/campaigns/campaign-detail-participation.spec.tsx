/** @jest-environment jsdom */
import { act } from "react";
import type { Root } from "react-dom/client";
import { useMutation, useQuery } from "@apollo/client/react";

import PublicCampaignDetailPage from "../../src/pages/campaigns/[campaignId]/index";
import { PUBLIC_CAMPAIGN_DETAIL_QUERY } from "../../src/features/campaigns/campaigns.queries";
import { resolveCampaignParticipationState } from "../../src/features/campaigns/campaignParticipation";
import en from "../../src/locales/en/campaigns.json";
import fr from "../../src/locales/fr/campaigns.json";
import type { CampaignListingRelation } from "../../src/features/campaigns/campaignListingLifecycle";
import { formatSiteDateTime } from "../../src/features/shared/publicDateTime";

let mockAuthenticated = true;
let mockLanguage = "en";
let mockRelations: CampaignListingRelation[] = [];
const mockResourceRefetch = jest.fn();
const mockNeedRefetch = jest.fn();
const mockMutations: Record<string, jest.Mock> = {};

jest.mock("next/head", () => ({ __esModule: true, default: () => null }));
jest.mock("next/router", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: { language: mockLanguage },
    t: (key: string, values?: Record<string, unknown>) =>
      [key, values?.date, values?.start, values?.end].filter(Boolean).join(" ")
  })
}));
jest.mock("../../src/features/auth/AuthProvider", () => ({
  useAuth: () => ({ session: { authenticated: mockAuthenticated, account: mockAuthenticated ? { id: "viewer" } : null } })
}));
jest.mock("../../src/components/richText/RichTextContent", () => ({ RichTextContent: () => null }));
// The accepted public list has separate integration tests; keep it distinct
// from the owner picker and avoid requiring an Apollo provider here.
jest.mock("../../src/features/campaigns/PublicCampaignJoinedListings", () => ({
  PublicCampaignJoinedListings: ({ campaignId }: { campaignId: string }) => (
    <section data-testid="public-accepted-listings">Accepted public listings for {campaignId}</section>
  )
}));
jest.mock("@apollo/client/react", () => ({ useQuery: jest.fn(), useMutation: jest.fn() }));

const now = Date.parse("2026-10-13T12:00:00Z");
const campaign = {
  id: "campaign", creatorAccountId: "creator", title: "Campaign title", description: "Description", theme: "Theme",
  moderationStatus: "APPROVED", imageUrl: null, startAt: "2026-10-12T12:00:00Z", airdropAt: "2026-10-13T12:00:00Z",
  endAt: "2026-10-14T12:00:00Z", airdropAmount: 3500, rewardsMultiplier: 7, accountByCreatorAccountId: null
};
function formattedDates(overrides: Partial<typeof campaign> = {}) {
  const dates = { ...campaign, ...overrides };
  return {
    startAt: formatSiteDateTime(dates.startAt, "en"),
    endAt: formatSiteDateTime(dates.endAt, "en")
  };
}

function page(overrides: Partial<typeof campaign> = {}) {
  return <PublicCampaignDetailPage campaignId={campaign.id} initialCampaign={{ ...campaign, ...overrides }} />;
}
function submission(patch: Partial<CampaignListingRelation> = {}): CampaignListingRelation {
  return {
    campaignId: campaign.id, submissionId: "submission", submittedAt: new Date(now - 3_600_000).toISOString(),
    status: "PENDING", isCurrent: true, actedAt: null, rejectionNote: null,
    campaignByCampaignId: { title: "Linked campaign", startAt: campaign.startAt, endAt: campaign.endAt }, ...patch
  };
}
function latestQueryOptions(operation: string) {
  const calls = jest.mocked(useQuery).mock.calls.filter(([query]) => query.loc?.source.body.includes(`query ${operation}`));
  expect(calls.length).toBeGreaterThan(0);
  return calls[calls.length - 1][1];
}
function expectOwnerQueriesSkipped(skip: boolean) {
  for (const operation of ["MyActiveResourcesForCampaign", "MyActiveNeedsForCampaign"]) {
    expect(latestQueryOptions(operation)).toMatchObject({ skip, variables: { creatorAccountId: mockAuthenticated ? "viewer" : "", campaignId: campaign.id } });
  }
}

let container: HTMLDivElement;
let root: Root;
beforeAll(() => { Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true }); });
beforeEach(() => {
  jest.spyOn(Date, "now").mockReturnValue(now);
  mockAuthenticated = true;
  mockLanguage = "en";
  mockRelations = [];
  mockResourceRefetch.mockReset().mockResolvedValue({});
  mockNeedRefetch.mockReset().mockResolvedValue({});
  for (const name of ["RequestResourceJoinToCampaign", "ReopenResourceJoinToCampaign", "RequestNeedJoinToCampaign", "ReopenNeedJoinToCampaign"]) {
    mockMutations[name] = jest.fn().mockResolvedValue({});
  }
  jest.mocked(useMutation).mockReset();
  jest.mocked(useMutation).mockImplementation(((query: { loc?: { source: { body: string } } }) => {
    const name = Object.keys(mockMutations).find(operation => query.loc?.source.body.includes(`mutation ${operation}`));
    if (!name) throw new Error("Unexpected mutation");
    return [mockMutations[name]];
  }) as unknown as typeof useMutation);
  jest.mocked(useQuery).mockReset();
  jest.mocked(useQuery).mockImplementation(((query: { loc?: { source: { body: string } } }) => {
    const isResource = query.loc?.source.body.includes("query MyActiveResourcesForCampaign");
    if (!isResource && !query.loc?.source.body.includes("query MyActiveNeedsForCampaign")) throw new Error("Unexpected query");
    const listing = {
      id: isResource ? "resource" : "need", creatorAccountId: "viewer", title: isResource ? "My resource" : "My need",
      description: "Listing description", location: "Brussels", expiresAt: null, imageUrls: [],
      accountByCreatorAccountId: { id: "viewer", displayName: "Contributor", externalSubject: "viewer" },
      categoryLabels: [], defaultTokenAmount: 25, proposedTopesAmount: 50, intensity: "SHARING",
      campaignResourcesByResourceId: { nodes: mockRelations }, campaignNeedsByNeedId: { nodes: mockRelations }
    };
    return { data: { [isResource ? "allResources" : "allNeeds"]: { nodes: [listing] } }, loading: false,
      refetch: isResource ? mockResourceRefetch : mockNeedRefetch };
  }) as unknown as typeof useQuery);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = require("react-dom/client").createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.restoreAllMocks();
});
async function renderCampaign(overrides: Partial<typeof campaign> = {}) {
  await act(async () => { root.render(page(overrides)); });
}
function button(text: string, scope: ParentNode = document.body): HTMLButtonElement {
  const result = [...scope.querySelectorAll("button")].find(item => item.textContent?.trim() === text);
  if (!result) throw new Error(`Button not found: ${text}`);
  return result;
}
async function click(element: HTMLElement) { await act(async () => { element.click(); }); }
function dialog(): HTMLElement {
  const result = document.querySelector<HTMLElement>('[role="dialog"][aria-labelledby="campaign-join-dialog-title"]');
  if (!result) throw new Error("Join dialog not found");
  return result;
}
async function openDialog() { await click(button("public.joinDialog.open")); return dialog(); }
async function closeDialog() {
  await click(button("public.joinDialog.close", dialog()));
  // MUI keeps the modal mounted until its exit transition completes.
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 300)); });
  expect(document.querySelector('[aria-labelledby="campaign-join-dialog-title"]')).toBeNull();
}

describe("campaign participation state", () => {
  it.each([
    [{}, "running"], [{ startAt: new Date(now).toISOString() }, "running"],
    [{ startAt: "2026-10-14T00:00:00Z" }, "upcoming"], [{ moderationStatus: "PENDING" }, "pending"],
    [{ moderationStatus: "AWAITING_ADAPTATION" }, "awaitingAdaptation"], [{ moderationStatus: "REJECTED" }, "unavailable"],
    [{ endAt: new Date(now).toISOString() }, "ended"], [{ moderationStatus: "PENDING", endAt: new Date(now).toISOString() }, "ended"],
    [{ startAt: "invalid" }, "unavailable"], [{ endAt: "invalid" }, "unavailable"], [{ startAt: campaign.endAt }, "unavailable"]
  ])("resolves %p as %s", (overrides, expected) => {
    expect(resolveCampaignParticipationState({ ...campaign, ...overrides }, now)).toBe(expected);
  });
  it("does not allow missing campaigns", () => expect(resolveCampaignParticipationState(null, now)).toBe("unavailable"));
});

describe("campaign detail participation", () => {
  it.each([
    ["2026-10-11T12:00:00Z", ["false", "false", "false"]],
    ["2026-10-12T12:00:00Z", ["true", "false", "false"]],
    ["2026-10-13T12:00:00Z", ["true", "true", "false"]],
    ["2026-10-14T12:00:00Z", ["true", "true", "true"]]
  ])("marks only elapsed timeline dates at %s", async (timestamp, expected) => {
    jest.mocked(Date.now).mockReturnValue(Date.parse(timestamp as string));
    await renderCampaign();
    expect([...container.querySelectorAll('ol[aria-label="public.timeline"] li')]
      .map(item => item.getAttribute("data-elapsed"))).toEqual(expected);
  });

  it("presents ordered timeline dates and prominent campaign rewards", async () => {
    await renderCampaign();
    const timeline = container.querySelector('ol[aria-label="public.timeline"]');
    expect(timeline).not.toBeNull();
    expect([...timeline!.querySelectorAll("li")].map(item => item.querySelector(".MuiTypography-subtitle2")?.textContent))
      .toEqual(["labels.start", "labels.airdrop", "labels.end"]);
    expect([...timeline!.querySelectorAll("time")].map(item => item.dateTime))
      .toEqual([campaign.startAt, campaign.airdropAt, campaign.endAt]);
    const airdrop = container.querySelector('[aria-labelledby="campaign-airdrop-heading"]')!;
    expect(airdrop.querySelector('[data-testid="token-amount"]')?.textContent).toContain("3500");
    expect(getComputedStyle(airdrop.querySelector('img[src="/token-symbol.svg"]')!).width).toBe("64px");
    const multiplier = container.querySelector('[aria-labelledby="campaign-multiplier-heading"]')!;
    expect(multiplier.textContent).toContain("×7");
    expect(multiplier.textContent).toContain("public.rewardsMultiplierHint");
    for (const translations of [en, fr]) {
      expect(translations.public.timeline).toBeTruthy();
      expect(translations.public.rewardsMultiplierHint).toBeTruthy();
    }
  });

  it("formats the campaign dates using the active website language", async () => {
    mockLanguage = "fr";
    await renderCampaign();
    expect(container.textContent).toContain("12/10/2026");
    expect(container.textContent).toContain("14/10/2026");
  });

  it("shows accepted public listings separately, loads owner cards only in the dialog, submits both types and reopens and closes", async () => {
    await renderCampaign();
    expect(container.textContent).toContain("Accepted public listings for campaign");
    expect(container.textContent).not.toContain("My resource");
    expect(container.textContent).not.toContain("My need");
    expectOwnerQueriesSkipped(true);
    const modal = await openDialog();
    expectOwnerQueriesSkipped(false);
    expect(container.querySelector('[data-testid="public-accepted-listings"]')).not.toBeNull();
    expect(modal.querySelector('[data-testid="public-accepted-listings"]')).toBeNull();
    expect(modal.textContent).toContain("My resource");
    expect(modal.textContent).toContain("My need");
    expect(modal.textContent).toContain("Contributor");
    expect(modal.querySelectorAll('[data-testid="token-amount"]')).toHaveLength(2);
    expect(modal.querySelector('[data-testid="resource-card"]')).not.toBeNull();
    expect(modal.querySelector('[data-testid="need-card"]')).not.toBeNull();
    for (const card of modal.querySelectorAll<HTMLElement>('[data-testid="resource-card"], [data-testid="need-card"]')) {
      expect(getComputedStyle(card).maxWidth).toBe("400px");
    }
    const styles = [...document.styleSheets].flatMap(sheet => [...sheet.cssRules].map(rule => rule.cssText)).join(" ");
    expect(styles).toMatch(/repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
    expect(styles).not.toContain("auto-fit");
    for (const operation of ["MyActiveResourcesForCampaign", "MyActiveNeedsForCampaign"]) {
      const call = jest.mocked(useQuery).mock.calls.find(([query]) => query.loc?.source.body.includes(`query ${operation}`));
      expect(call?.[0].loc?.source.body).toMatch(/\bactedAt\b/);
    }
    await click(button("public.resourceJoin.joinSingle", modal));
    expect(mockMutations.RequestResourceJoinToCampaign).toHaveBeenCalledWith({ variables: { campaignId: "campaign", resourceId: "resource" } });
    expect(mockResourceRefetch).toHaveBeenCalledTimes(1);
    expect(modal.textContent).toContain("public.resourceJoin.joinSuccess");
    const needCard = modal.querySelector<HTMLElement>('[data-testid="need-card"]')!;
    const checkbox = needCard.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    await click(checkbox);
    expect(checkbox.checked).toBe(true);
    await click(button("public.needJoin.joinSelected", modal));
    expect(mockMutations.RequestNeedJoinToCampaign).toHaveBeenCalledWith({ variables: { campaignId: "campaign", needId: "need" } });
    expect(mockNeedRefetch).toHaveBeenCalledTimes(1);
    expect(modal.textContent).toContain("public.needJoin.joinSuccess");
    expect(checkbox.checked).toBe(false);
    await closeDialog();
    expectOwnerQueriesSkipped(true);
    expect(container.textContent).toContain("Accepted public listings for campaign");
    expect(container.textContent).not.toContain("My resource");
    await openDialog();
    expectOwnerQueriesSkipped(false);
    expect(dialog().textContent).toContain("My need");
    await closeDialog();
    expectOwnerQueriesSkipped(true);
  });

  it("shows rejection feedback for both kinds and explicitly resubmits each", async () => {
    const actedAt = "2026-10-13T11:30:00Z";
    mockRelations = [submission({ status: "REJECTED", isCurrent: false, actedAt, rejectionNote: "Add more details" })];
    await renderCampaign();
    expect(container.textContent).not.toContain("Add more details");
    const modal = await openDialog();
    expect(modal.textContent?.match(/Add more details/g)).toHaveLength(2);
    expect(modal.textContent?.split(`listingLifecycle.rejectedAt ${formatSiteDateTime(actedAt, "en")}`)).toHaveLength(3);
    expect(modal.textContent?.match(/listingLifecycle.saveDoesNotResubmit/g)).toHaveLength(2);
    for (const kind of ["resource", "need"] as const) {
      const card = modal.querySelector<HTMLElement>(`[data-testid="${kind}-card"]`)!;
      const resubmit = button("listingLifecycle.resubmit", card);
      expect(resubmit.disabled).toBe(false);
      await click(resubmit);
    }
    expect(mockMutations.ReopenResourceJoinToCampaign).toHaveBeenCalledWith({ variables: { campaignId: "campaign", resourceId: "resource" } });
    expect(mockMutations.ReopenNeedJoinToCampaign).toHaveBeenCalledWith({ variables: { campaignId: "campaign", needId: "need" } });
    expect(mockMutations.RequestResourceJoinToCampaign).not.toHaveBeenCalled();
    expect(mockMutations.RequestNeedJoinToCampaign).not.toHaveBeenCalled();
    expect(mockResourceRefetch).toHaveBeenCalledTimes(1);
    expect(mockNeedRefetch).toHaveBeenCalledTimes(1);
  });

  it.each(["ACCEPTED", "PENDING"] as const)("prevents joining another campaign while an existing %s slot is locked", async status => {
    mockRelations = [submission({ campaignId: "another-campaign", status })];
    await renderCampaign();
    const modal = await openDialog();
    for (const kind of ["resource", "need"] as const) {
      const card = modal.querySelector<HTMLElement>(`[data-testid="${kind}-card"]`)!;
      expect(button(`public.${kind}Join.joinSingle`, card).disabled).toBe(true);
      expect(card.querySelector<HTMLInputElement>('input[type="checkbox"]')?.disabled).toBe(true);
      expect(card.textContent).toContain(status === "ACCEPTED" ? "listingLifecycle.acceptedLocked" : "listingLifecycle.pendingLocked");
      expect(card.textContent).not.toContain("listingLifecycle.resubmit");
    }
  });

  it.each(["24h pending", "ended accepted", "superseded"] as const)("allows explicit resubmit for %s history without obsolete feedback", async scenario => {
    const old = submission({ status: "REJECTED", isCurrent: false, rejectionNote: "Obsolete feedback", submittedAt: new Date(now - 100 * 3_600_000).toISOString() });
    const latest = submission({ campaignId: "another-campaign", submittedAt: new Date(now - 24 * 3_600_000).toISOString(),
      ...(scenario === "ended accepted" ? { status: "ACCEPTED", campaignByCampaignId: { title: "Ended", startAt: "2020-01-01", endAt: new Date(now).toISOString() } }
        : scenario === "superseded" ? { status: "SUPERSEDED", isCurrent: false } : {}) });
    mockRelations = [old, latest];
    await renderCampaign();
    const modal = await openDialog();
    expect(modal.textContent).not.toContain("Obsolete feedback");
    expect([...modal.querySelectorAll("button")].filter(item => item.textContent === "listingLifecycle.resubmit")).toHaveLength(2);
  });

  it("requests and displays the actual campaign reward fields", async () => {
    const query = PUBLIC_CAMPAIGN_DETAIL_QUERY.loc?.source.body;
    expect(query).toMatch(/\bairdropAmount\b/);
    expect(query).toMatch(/\brewardsMultiplier\b/);
    await renderCampaign();
    expect(container.textContent).toMatch(/create.fields.airdropAmount[^<]*3500/);
    expect(container.textContent).toMatch(/create.fields.rewardsMultiplier[^<]*7/);
  });

  it.each([
    [{ startAt: "2026-10-14T00:00:00Z" }, "upcoming"], [{ moderationStatus: "PENDING" }, "pending"],
    [{ moderationStatus: "AWAITING_ADAPTATION" }, "awaitingAdaptation"], [{ endAt: new Date(now).toISOString() }, "ended"],
    [{ moderationStatus: "PENDING", endAt: new Date(now).toISOString() }, "ended"], [{ moderationStatus: "REJECTED" }, "unavailable"]
  ])("hides public and owner listings and skips owner queries for %p with a %s hint", async (overrides, expected) => {
    await renderCampaign(overrides);
    expect(container.textContent).toContain(`public.participation.${expected}`);
    const dates = formattedDates(overrides);
    expect(container.textContent).toContain(dates.startAt);
    expect(container.textContent).toContain(dates.endAt);
    expect(container.textContent).toContain("public.joinedListings.unavailable");
    expect(container.querySelector('[data-testid="public-accepted-listings"]')).toBeNull();
    expect(container.textContent).not.toContain("public.joinDialog.open");
    expect(container.textContent).not.toContain("My resource");
    expect(container.textContent).not.toContain("My need");
    expectOwnerQueriesSkipped(true);
  });

  it("shows public listings and a sign-in link to anonymous users only while running", async () => {
    mockAuthenticated = false;
    await renderCampaign();
    expect(container.textContent).toContain("Accepted public listings for campaign");
    expect(container.textContent).toContain("public.joinDialog.signInRequired");
    expect(container.querySelector('a[href="/login?next=%2Fcampaigns%2Fcampaign"]')?.textContent).toBe("public.resourceJoin.signInAction");
    expect(container.textContent).not.toContain("public.joinDialog.open");
    expectOwnerQueriesSkipped(true);
    await renderCampaign({ moderationStatus: "PENDING" });
    expect(container.textContent).toContain("public.participation.pending");
    expect(container.textContent).not.toContain("public.joinDialog.signInRequired");
    expect(container.querySelector('[data-testid="public-accepted-listings"]')).toBeNull();
    expectOwnerQueriesSkipped(true);
  });

  it("closes an open picker and skips both owner queries if the campaign stops running", async () => {
    await renderCampaign();
    await openDialog();
    expectOwnerQueriesSkipped(false);
    await renderCampaign({ moderationStatus: "PENDING" });
    expectOwnerQueriesSkipped(true);
    expect(container.textContent).toContain("public.participation.pending");
    expect(container.querySelector('[data-testid="public-accepted-listings"]')).toBeNull();
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 300)); });
    expect(document.querySelector('[aria-labelledby="campaign-join-dialog-title"]')).toBeNull();
  });

  it.each([en, fr])("provides all unavailable-state hints in each locale", locale => {
    for (const state of ["upcoming", "pending", "awaitingAdaptation", "ended", "unavailable"] as const) {
      expect(locale.public.participation[state]).toBeTruthy();
    }
  });
});