import { renderToStaticMarkup } from "react-dom/server";
import { useQuery } from "@apollo/client/react";

import PublicCampaignDetailPage from "../../src/pages/campaigns/[campaignId]/index";
import { PUBLIC_CAMPAIGN_DETAIL_QUERY } from "../../src/features/campaigns/campaigns.queries";
import { resolveCampaignParticipationState } from "../../src/features/campaigns/campaignParticipation";
import en from "../../src/locales/en/campaigns.json";
import fr from "../../src/locales/fr/campaigns.json";
import type { CampaignListingRelation } from "../../src/features/campaigns/campaignListingLifecycle";

let mockAuthenticated = true;
let mockRelations: CampaignListingRelation[] = [];

jest.mock("next/head", () => ({ __esModule: true, default: () => null }));
jest.mock("next/router", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: { language: "en" },
    t: (key: string, values?: Record<string, unknown>) =>
      [key, values?.date, values?.start, values?.end].filter(Boolean).join(" ")
  })
}));
jest.mock("../../src/features/auth/AuthProvider", () => ({
  useAuth: () => ({ session: { authenticated: mockAuthenticated, account: { id: "viewer" } } })
}));
jest.mock("../../src/components/richText/RichTextContent", () => ({ RichTextContent: () => null }));
jest.mock("@apollo/client/react", () => ({ useQuery: jest.fn(), useMutation: () => [jest.fn()] }));

const now = Date.parse("2026-10-13T12:00:00Z");
const campaign = {
  id: "campaign",
  creatorAccountId: "creator",
  title: "Campaign title",
  description: "Description",
  theme: "Theme",
  moderationStatus: "APPROVED",
  imageUrl: null,
  startAt: "2026-10-12T12:00:00Z",
  airdropAt: "2026-10-13T12:00:00Z",
  endAt: "2026-10-14T12:00:00Z",
  airdropAmount: 3500,
  rewardsMultiplier: 7,
  accountByCreatorAccountId: null
};
const formattedDates = { startAt: "October 12", airdropAt: "October 13", endAt: "October 14" };

function renderCampaign(overrides: Partial<typeof campaign> = {}) {
  return renderToStaticMarkup(
    <PublicCampaignDetailPage campaignId={campaign.id} initialCampaign={{ ...campaign, ...overrides }} formattedDates={formattedDates} />
  );
}

beforeEach(() => {
  jest.spyOn(Date, "now").mockReturnValue(now);
  mockAuthenticated = true;
  mockRelations = [];
  jest.mocked(useQuery).mockReset();
  jest.mocked(useQuery).mockImplementation(query => {
    const operation = query.definitions.find(definition => definition.kind === "OperationDefinition");
    const isResource = operation?.kind === "OperationDefinition" && operation.name?.value === "MyActiveResourcesForCampaign";
    const listing = {
      id: isResource ? "resource" : "need",
      creatorAccountId: "viewer",
      title: isResource ? "My resource" : "My need",
      description: "Listing description",
      location: "Brussels",
      expiresAt: null,
      imageUrls: [],
      accountByCreatorAccountId: { id: "viewer", displayName: "Contributor", externalSubject: "viewer" },
      categoryLabels: [],
      defaultTokenAmount: 25,
      proposedTopesAmount: 50,
      intensity: "SHARING",
      campaignResourcesByResourceId: { nodes: mockRelations },
      campaignNeedsByNeedId: { nodes: mockRelations }
    };
    return {
      data: { [isResource ? "allResources" : "allNeeds"]: { nodes: [listing] } },
      loading: false,
      refetch: jest.fn()
    } as unknown as ReturnType<typeof useQuery>;
  });
});

afterEach(() => jest.restoreAllMocks());

describe("campaign participation state", () => {
  it.each([
    [{}, "running"],
    [{ startAt: new Date(now).toISOString() }, "running"],
    [{ startAt: "2026-10-14T00:00:00Z" }, "upcoming"],
    [{ moderationStatus: "PENDING" }, "pending"],
    [{ moderationStatus: "AWAITING_ADAPTATION" }, "awaitingAdaptation"],
    [{ moderationStatus: "REJECTED" }, "unavailable"],
    [{ endAt: new Date(now).toISOString() }, "ended"],
    [{ moderationStatus: "PENDING", endAt: new Date(now).toISOString() }, "ended"],
    [{ startAt: "invalid" }, "unavailable"],
    [{ endAt: "invalid" }, "unavailable"],
    [{ startAt: campaign.endAt }, "unavailable"]
  ])("resolves %p as %s", (overrides, expected) => {
    expect(resolveCampaignParticipationState({ ...campaign, ...overrides }, now)).toBe(expected);
  });

  it("does not allow missing campaigns", () => {
    expect(resolveCampaignParticipationState(null, now)).toBe("unavailable");
  });
});

describe("campaign detail listing layout and visibility", () => {
  function submission(patch: Partial<CampaignListingRelation> = {}): CampaignListingRelation {
    return {
      campaignId: campaign.id, submissionId: "submission", submittedAt: new Date(now - 3_600_000).toISOString(),
      status: "PENDING", isCurrent: true, actedAt: null, rejectionNote: null,
      campaignByCampaignId: { title: "Linked campaign", startAt: campaign.startAt, endAt: campaign.endAt }, ...patch
    };
  }

  it("offers explicit same-campaign resubmit and displays rejection feedback for both listing kinds", () => {
    const actedAt = "2026-10-13T11:30:00Z";
    mockRelations = [submission({ status: "REJECTED", isCurrent: false, actedAt, rejectionNote: "Add more details" })];
    const html = renderCampaign();
    const buttons = html.match(/<button\b[^>]*>[\s\S]*?<\/button>/g) ?? [];
    const resubmit = buttons.filter(button => button.includes("listingLifecycle.resubmit"));
    expect(resubmit).toHaveLength(2);
    expect(resubmit.every(button => !button.includes("disabled="))).toBe(true);
    expect(html.match(/Add more details/g)).toHaveLength(2);
    expect(html.split(`listingLifecycle.rejectedAt ${new Date(actedAt).toLocaleString("en")}`)).toHaveLength(3);
    expect(html.match(/listingLifecycle.saveDoesNotResubmit/g)).toHaveLength(2);
    for (const [query] of jest.mocked(useQuery).mock.calls) {
      expect(query.loc?.source.body).toMatch(/\bactedAt\b/);
    }
  });

  it.each(["ACCEPTED", "PENDING"] as const)("prevents joining another campaign while the existing %s slot is locked", status => {
    mockRelations = [submission({ campaignId: "another-campaign", status })];
    const html = renderCampaign();
    const buttons = html.match(/<button\b[^>]*>[\s\S]*?<\/button>/g) ?? [];
    const joinButtons = buttons.filter(button => /public\.(resource|need)Join\.joinSingle/.test(button));
    expect(joinButtons).toHaveLength(2);
    expect(joinButtons.every(button => button.includes("disabled="))).toBe(true);
    expect(html).not.toContain("listingLifecycle.resubmit");
    expect(html).toContain(status === "ACCEPTED" ? "listingLifecycle.acceptedLocked" : "listingLifecycle.pendingLocked");
  });

  it.each(["24h pending", "ended accepted", "superseded"] as const)("allows a fresh join for %s history without obsolete rejection feedback", scenario => {
    const old = submission({ status: "REJECTED", isCurrent: false, rejectionNote: "Obsolete feedback",
      submittedAt: new Date(now - 100 * 3_600_000).toISOString() });
    const latest = submission({ campaignId: "another-campaign", submittedAt: new Date(now - 24 * 3_600_000).toISOString(),
      ...(scenario === "ended accepted" ? { status: "ACCEPTED", campaignByCampaignId: { title: "Ended", startAt: "2020-01-01", endAt: new Date(now).toISOString() } }
        : scenario === "superseded" ? { status: "SUPERSEDED", isCurrent: false } : {}) });
    mockRelations = [old, latest];
    const html = renderCampaign();
    expect(html).not.toContain("Obsolete feedback");
    // The historical rejection is still a valid explicit resubmit destination.
    expect(html).toContain("listingLifecycle.resubmit");
  });

  it("requests the campaign reward fields from GraphQL", () => {
    const query = PUBLIC_CAMPAIGN_DETAIL_QUERY.loc?.source.body;
    expect(query).toMatch(/\bairdropAmount\b/);
    expect(query).toMatch(/\brewardsMultiplier\b/);
  });

  it("displays the actual campaign airdrop amount and rewards multiplier", () => {
    const html = renderCampaign();
    expect(html).toContain("create.fields.airdropAmount");
    expect(html).toContain("create.fields.rewardsMultiplier");
    expect(html).toMatch(/create.fields.airdropAmount[^<]*3500/);
    expect(html).toMatch(/create.fields.rewardsMultiplier[^<]*7/);
  });

  it("renders both standard listing cards, headers, token visuals and responsive grids while running", () => {
    const html = renderCampaign();
    expect(html).toContain('data-testid="resource-card"');
    expect(html).toContain('data-testid="need-card"');
    expect(html).toContain("My resource");
    expect(html).toContain("My need");
    expect(html).toContain("Contributor");
    expect(html.match(/data-testid="token-amount"/g)).toHaveLength(2);
    expect(html).toContain("max-width:400px");
    expect(html).toContain("repeat(3, minmax(0, 1fr))");
    expect(html).not.toContain("auto-fit");
    for (const [, options] of jest.mocked(useQuery).mock.calls) {
      expect(typeof options === "object" ? options?.skip : undefined).toBe(false);
    }
  });

  it.each([
    [{ startAt: "2026-10-14T00:00:00Z" }, "upcoming"],
    [{ moderationStatus: "PENDING" }, "pending"],
    [{ moderationStatus: "AWAITING_ADAPTATION" }, "awaitingAdaptation"],
    [{ endAt: new Date(now).toISOString() }, "ended"],
    [{ moderationStatus: "PENDING", endAt: new Date(now).toISOString() }, "ended"],
    [{ moderationStatus: "REJECTED" }, "unavailable"]
  ])("hides lists and skips queries for %p with a %s hint", (overrides, expected) => {
    const html = renderCampaign(overrides);
    expect(html).toContain(`public.participation.${expected}`);
    expect(html).toContain(formattedDates.startAt);
    expect(html).toContain(formattedDates.endAt);
    expect(html).not.toContain('data-testid="resource-card"');
    expect(html).not.toContain('data-testid="need-card"');
    expect(html).not.toContain("public.resourceJoin.title");
    expect(html).not.toContain("public.needJoin.title");
    for (const [, options] of jest.mocked(useQuery).mock.calls) {
      expect(typeof options === "object" ? options?.skip : undefined).toBe(true);
    }
  });

  it("only prompts anonymous users to sign in when joining is available", () => {
    mockAuthenticated = false;
    expect(renderCampaign()).toContain("public.resourceJoin.signInRequired");
    const html = renderCampaign({ moderationStatus: "PENDING" });
    expect(html).toContain("public.participation.pending");
    expect(html).not.toContain("public.resourceJoin.signInRequired");
    expect(html).not.toContain("public.needJoin.signInRequired");
  });

  it.each([en, fr])("provides all unavailable-state hints in each locale", locale => {
    for (const state of ["upcoming", "pending", "awaitingAdaptation", "ended", "unavailable"] as const) {
      expect(locale.public.participation[state]).toBeTruthy();
    }
  });
});