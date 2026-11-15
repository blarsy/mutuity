import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { createInstance } from "i18next";

import { CampaignDetailScreen } from "../../src/screens/campaigns/CampaignDetailScreen";
import type { CampaignItem } from "../../src/services/graphql/campaigns";
import { CampaignModerationStatus } from "../../src/services/graphql/generated";
import en from "../../src/i18n/locales/en/us3.json";
import fr from "../../src/i18n/locales/fr/us3.json";

const mockStatsI18n = createInstance();
void mockStatsI18n.init({
  lng: "en",
  fallbackLng: "en",
  initAsync: false,
  resources: { en: { us3: en }, fr: { us3: fr } }
});

jest.mock("react-i18next", () => ({
  ...jest.requireActual("react-i18next"),
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string; count?: number }) =>
      /^(campaignResourcesCount|campaignNeedsCount|campaignStatsPendingCount)$/.test(key)
        ? mockStatsI18n.t(key, { ...options, ns: "us3" })
        : options?.defaultValue ?? key,
    i18n: mockStatsI18n
  })
}));

const newCampaign: CampaignItem = {
  id: "",
  title: "",
  theme: "",
  description: "",
  imageUrl: null,
  startAt: "2026-08-08T00:00:00.000Z",
  airdropAt: "2026-08-23T00:00:00.000Z",
  endAt: "2026-09-07T00:00:00.000Z",
  createdAt: "2026-08-08T00:00:00.000Z",
  creatorAccountId: "00000000-0000-0000-0000-000000000111",
  moderationStatus: CampaignModerationStatus.Pending,
  resourceCount: 0,
  needCount: 0,
  rewardsMultiplier: 5,
  airdropAmount: 3000,
  pendingEntries: []
};

describe("CampaignDetailScreen", () => {
  beforeEach(() => { void mockStatsI18n.changeLanguage("en"); });

  it.each([
    ["en", 1, 0, 1, 0, "1 resource", "1 need"],
    ["en", 3, 2, 4, 1, "3 resources (2 pending)", "4 needs (1 pending)"],
    ["en", 0, 0, 0, 0, "0 resources", "0 needs"],
    ["fr", 1, 0, 1, 0, "1 ressource", "1 besoin"],
    ["fr", 3, 2, 4, 1, "3 ressources (2 en attente)", "4 besoins (1 en attente)"],
    ["fr", 2, 1, 3, 2, "2 ressources (1 en attente)", "3 besoins (2 en attente)"]
  ] as const)("localizes %s stats with totals %s/%s and %s/%s", (
    language, resourceCount, pendingResourceCount, needCount, pendingNeedCount, resourcesText, needsText
  ) => {
    void mockStatsI18n.changeLanguage(language);
    const screen = render(<CampaignDetailScreen creatorAccountId={null} campaign={{
      ...newCampaign, resourceCount, pendingResourceCount, needCount, pendingNeedCount
    }} />);

    expect(screen.getByText(resourcesText)).toBeTruthy();
    expect(screen.getByText(needsText)).toBeTruthy();
    expect(screen.queryByText(/\(0 (pending|en attente)\)/)).toBeNull();
  });

  it("omits pending suffixes for legacy campaign items without optional counts", () => {
    const screen = render(<CampaignDetailScreen creatorAccountId={null} campaign={{
      ...newCampaign, resourceCount: 3, needCount: 2
    }} />);
    expect(screen.getByText("3 resources")).toBeTruthy();
    expect(screen.getByText("2 needs")).toBeTruthy();
    expect(screen.queryByText(/\(.*pending\)/)).toBeNull();
  });

  it("updates stats from parent moderation props without a redundant generic pending row", () => {
    const campaign: CampaignItem = {
      ...newCampaign, id: "campaign-stats", title: "Community garden",
      moderationStatus: CampaignModerationStatus.Approved,
      resourceCount: 3, pendingResourceCount: 2, needCount: 2, pendingNeedCount: 1,
      pendingEntries: [{ id: "entry-1", type: "resource", title: "Garden tools", creatorAccountId: "creator" }]
    };
    const screen = render(<CampaignDetailScreen creatorAccountId={null} campaign={campaign} moderationMode />);
    expect(screen.getByText("3 resources (2 pending)")).toBeTruthy();
    expect(screen.getByText("2 needs (1 pending)")).toBeTruthy();
    expect(screen.getByText("Garden tools")).toBeTruthy();
    expect(screen.queryByText(/\d+ pending entr/)).toBeNull();
    expect(screen.queryByText("{{count}} pending entries")).toBeNull();

    screen.rerender(<CampaignDetailScreen creatorAccountId={null} campaign={{
      ...campaign, resourceCount: 3, pendingResourceCount: 1, needCount: 1, pendingNeedCount: 0
    }} moderationMode />);
    expect(screen.getByText("3 resources (1 pending)")).toBeTruthy();
    expect(screen.getByText("1 need")).toBeTruthy();
    expect(screen.queryByText("3 resources (2 pending)")).toBeNull();
    expect(screen.queryByText("2 needs (1 pending)")).toBeNull();
  });

  it("shows validation errors only after the first submit attempt", () => {
    const screen = render(
      <CampaignDetailScreen
        campaign={newCampaign}
        creatorAccountId={newCampaign.creatorAccountId}
        isNew
      />
    );

    expect(screen.queryAllByText("This field is required.")).toHaveLength(0);

    fireEvent.press(screen.getByRole("button", { name: "Create campaign" }));

    expect(screen.getAllByText("This field is required.").length).toBeGreaterThan(0);
    expect(screen.queryByTestId("campaign-created-at")).toBeNull();
  });

  it.each([CampaignModerationStatus.Approved, CampaignModerationStatus.Pending])(
    "shows all saved campaign details for a non-editable %s campaign",
    moderationStatus => {
      const campaign = {
        ...newCampaign,
        id: "campaign-1",
        title: "Community garden",
        description: "Grow together in our neighbourhood.",
        imageUrl: "https://example.com/campaign.jpg",
        moderationStatus
      };
      const screen = render(<CampaignDetailScreen campaign={campaign} creatorAccountId={null} />);
      const format = (value: string) => new Intl.DateTimeFormat("en", {
        year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"
      }).format(new Date(value));

      expect(screen.getByText(`Created: ${format(campaign.createdAt)}`)).toBeTruthy();
      expect(screen.getByText(`Start date: ${format(campaign.startAt)}`)).toBeTruthy();
      expect(screen.getByText(`End date: ${format(campaign.endAt)}`)).toBeTruthy();
      expect(screen.getByText(`Airdrop date: ${format(campaign.airdropAt)}`)).toBeTruthy();
      expect(screen.getByText("Airdrop amount: 3000")).toBeTruthy();
      expect(screen.getByText("Rewards multiplier: 5")).toBeTruthy();
      expect(screen.getByText(campaign.description)).toBeTruthy();
      expect(screen.getByLabelText(campaign.title).props.source).toEqual({ uri: campaign.imageUrl });
    }
  );

  it("shows the saved creation datetime alongside the pending campaign editor", () => {
    const screen = render(
      <CampaignDetailScreen campaign={newCampaign} creatorAccountId={newCampaign.creatorAccountId} />
    );
    expect(screen.getByTestId("campaign-created-at")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save campaign" })).toBeTruthy();
  });

  it("allows the creator to edit a campaign awaiting adaptation", () => {
    const campaign = {
      ...newCampaign,
      id: "campaign-adaptation",
      title: "Community garden",
      moderationStatus: CampaignModerationStatus.AwaitingAdaptation
    };
    const screen = render(
      <CampaignDetailScreen campaign={campaign} creatorAccountId={campaign.creatorAccountId} />
    );

    expect(screen.getByRole("button", { name: "Save campaign" })).toBeTruthy();
    expect(screen.getByLabelText("Title").props.value).toBe("Community garden");
  });

  it("keeps an approved campaign read-only for its creator", () => {
    const campaign = {
      ...newCampaign,
      id: "campaign-approved",
      title: "Community garden",
      moderationStatus: CampaignModerationStatus.Approved
    };
    const screen = render(
      <CampaignDetailScreen campaign={campaign} creatorAccountId={campaign.creatorAccountId} />
    );

    expect(screen.queryByRole("button", { name: "Save campaign" })).toBeNull();
    expect(screen.getByTestId("campaign-details")).toBeTruthy();
  });
});