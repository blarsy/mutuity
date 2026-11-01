import { renderToStaticMarkup } from "react-dom/server";
import { useQuery } from "@apollo/client/react";

import CampaignModerationPage from "../../src/pages/campaigns/[campaignId]/moderation";
import { formatPublicDateTime } from "../../src/features/shared/publicDateTime";

jest.mock("next/router", () => ({ useRouter: () => ({ query: { campaignId: "campaign-1" }, push: jest.fn() }) }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }) }));
jest.mock("@apollo/client/react", () => ({ useQuery: jest.fn(), useMutation: () => [jest.fn(), { loading: false }] }));
jest.mock("../../src/components/PageContainer", () => ({ PageContainer: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
jest.mock("../../src/features/campaigns/CampaignModerationHistory", () => ({ CampaignModerationHistory: () => null }));
jest.mock("../../src/components/richText/RichTextEditor", () => ({ RichTextEditor: () => null }));
jest.mock("../../src/components/ImageUploadField", () => ({ ImageUploadField: () => null }));

describe("campaign moderation saved details", () => {
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