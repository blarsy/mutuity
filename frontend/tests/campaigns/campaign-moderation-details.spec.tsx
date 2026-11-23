import { renderToStaticMarkup } from "react-dom/server";
import { useQuery } from "@apollo/client/react";

import CampaignModerationPage from "../../src/pages/campaigns/[campaignId]/moderation";
import { formatPublicDateTime } from "../../src/features/shared/publicDateTime";

jest.mock("next/router", () => ({ useRouter: () => ({ query: { campaignId: "campaign-1" }, push: jest.fn() }) }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }) }));
jest.mock("@apollo/client/react", () => ({ useQuery: jest.fn(), useMutation: () => [jest.fn(), { loading: false }] }));
jest.mock("../../src/components/PageContainer", () => ({ PageContainer: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
jest.mock("../../src/features/campaigns/CampaignModerationHistory", () => ({
  CampaignModerationHistory: () => <div data-testid="moderation-history-content">Moderation history entries</div>
}));
jest.mock("../../src/features/campaigns/CampaignListingPreviewDialog", () => ({ CampaignListingPreviewDialog: () => null }));
jest.mock("../../src/components/richText/RichTextEditor", () => ({ RichTextEditor: () => null }));
jest.mock("../../src/components/richText/RichTextContent", () => ({ RichTextContent: ({ html }: { html: string }) => <>{html}</> }));
jest.mock("../../src/components/ImageUploadField", () => ({ ImageUploadField: () => null }));

describe("campaign moderation saved details", () => {
  it.each([
    ["PENDING", "2099-01-01T00:00:00Z", true],
    ["AWAITING_ADAPTATION", "2099-01-01T00:00:00Z", true],
    ["APPROVED", "2099-01-01T00:00:00Z", false],
    ["PENDING", "2020-01-01T00:00:00Z", false],
    ["APPROVED", "2020-01-01T00:00:00Z", false]
  ])("defaults history expanded=%s", (moderationStatus, endAt, expanded) => {
    jest.mocked(useQuery).mockReturnValue({ data: {
      campaignById: {
        id: "campaign-1", title: "Campaign", theme: "Theme", moderationStatus,
        createdAt: "2026-01-01", startAt: "2020-01-01", airdropAt: "2026-11-01", endAt,
        rewardsMultiplier: 5, airdropAmount: 3500,
      },
      allCampaignNeeds: { nodes: [] }, allCampaignResources: { nodes: [] }
    }, loading: false } as unknown as ReturnType<typeof useQuery>);

    const html = renderToStaticMarkup(<CampaignModerationPage />);
    expect(html).toContain(`aria-expanded="${expanded}"`);
    expect(html).toContain(expanded ? 'data-testid="history-expanded-icon"' : 'data-testid="history-collapsed-icon"');
    expect(html.includes("moderation-history-content")).toBe(expanded);
  });


  it("only renders ongoing current submissions in the embedded need and resource triage", () => {
    const node = {
      campaignId: "campaign-1", needId: "need-1", resourceId: "resource-1", submissionId: "submission-1",
      submittedAt: "2026-11-14T00:00:00Z", status: "PENDING", isCurrent: true,
      campaignByCampaignId: { id: "campaign-1", title: "Campaign", startAt: "2020-01-01", endAt: "2099-01-01" },
      needByNeedId: { id: "need-1", title: "Visible need" },
      resourceByResourceId: { id: "resource-1", title: "Visible resource" }
    };
    const hidden = (patch: Record<string, unknown>) => ({
      ...node, submissionId: "hidden", needByNeedId: { title: "Hidden need" }, resourceByResourceId: { title: "Hidden resource" }, ...patch
    });
    const nodes = [node, hidden({ isCurrent: false }), hidden({ status: "SUPERSEDED" }), hidden({
      campaignByCampaignId: { ...node.campaignByCampaignId, endAt: "2020-01-02" }
    })];
    jest.mocked(useQuery).mockReturnValue({ data: {
      campaignById: {
        id: "campaign-1", title: "Campaign", theme: "Theme", moderationStatus: "APPROVED",
        createdAt: "2026-01-01", startAt: "2020-01-01", airdropAt: "2026-11-01", endAt: "2099-01-01",
        rewardsMultiplier: 5, airdropAmount: 3500
      },
      allCampaignNeeds: { nodes }, allCampaignResources: { nodes }
    }, loading: false } as unknown as ReturnType<typeof useQuery>);
    const html = renderToStaticMarkup(<CampaignModerationPage />);
    expect(html).toContain("Visible need");
    expect(html).toContain("Visible resource");
    expect(html).not.toContain("Hidden need");
    expect(html).not.toContain("Hidden resource");
  });

  it.each(["PENDING", "APPROVED", "AWAITING_ADAPTATION"])("shows every requested field for %s campaigns", moderationStatus => {
    const campaign = {
      id: "campaign-1",
      title: "Community garden",
      theme: "Gardening",
      description: "Grow together in our neighbourhood.",
      imageUrl: "https://example.com/campaign.jpg",
      managerNoteFromCreator: null,
      moderationStatus,
      createdAt: "2026-07-01T12:34:00Z",
      startAt: "2026-08-01T09:30:00Z",
      airdropAt: "2026-08-15T14:45:00Z",
      endAt: "2026-09-01T18:00:00Z",
      airdropAmount: 3500,
      rewardsMultiplier: 7
    };
    jest.mocked(useQuery).mockReturnValue({ data: { campaignById: campaign }, loading: false } as ReturnType<typeof useQuery>);

    const html = renderToStaticMarkup(<CampaignModerationPage />);
    expect(html).toContain(campaign.description);
    expect(html).toContain(`src="${campaign.imageUrl}"`);
    expect(html).toContain(`alt="${campaign.title}"`);
    for (const value of [campaign.createdAt, campaign.startAt, campaign.endAt, campaign.airdropAt]) {
      expect(html).toContain(formatPublicDateTime(value, "en"));
    }
    for (const label of ["labels.created", "create.fields.startDatetime", "create.fields.endDatetime", "create.fields.airdropDatetime", "create.fields.airdropAmount", "create.fields.rewardsMultiplier"]) {
      expect(html).toContain(label);
    }
    expect(html).toContain(">3500</dd>");
    expect(html).toContain(">7</dd>");
  });
});