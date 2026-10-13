import { renderToStaticMarkup } from "react-dom/server";
import { useQuery } from "@apollo/client/react";

import PublicCampaignDetailPage from "../../src/pages/campaigns/[campaignId]/index";
import { resolveCampaignParticipationState } from "../../src/features/campaigns/campaignParticipation";
import en from "../../src/locales/en/campaigns.json";
import fr from "../../src/locales/fr/campaigns.json";

let mockAuthenticated = true;

jest.mock("next/head", () => ({ __esModule: true, default: () => null }));
jest.mock("next/router", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, unknown>) =>
      [key, values?.start, values?.end].filter(Boolean).join(" ")
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
      campaignResourcesByResourceId: { nodes: [] },
      campaignNeedsByNeedId: { nodes: [] }
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