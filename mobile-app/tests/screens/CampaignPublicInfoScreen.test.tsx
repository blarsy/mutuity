import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";
import { CampaignPublicInfoScreen } from "../../src/screens/campaigns/CampaignPublicInfoScreen";
import { ResourceDetailScreen } from "../../src/screens/resources/ResourceDetailScreen";
import { NeedDetailScreen } from "../../src/screens/needs/NeedDetailScreen";
import { fetchCampaignPublicListings } from "../../src/services/graphql/campaignPublicListings";
import { CampaignModerationStatus } from "../../src/services/graphql/generated";
import type { CampaignItem } from "../../src/services/graphql/campaigns";

jest.mock("../../src/assets/img/TOKENS.svg", () => "TokenSymbol");
jest.mock("../../src/screens/resources/ResourceDetailScreen", () => ({ ResourceDetailScreen: jest.fn(() => null) }));
jest.mock("../../src/screens/needs/NeedDetailScreen", () => ({ NeedDetailScreen: jest.fn(() => null) }));
jest.mock("../../src/navigation/AccountPublicProfileNavigator", () => ({ AccountPublicProfileNavigator: jest.fn(() => null) }));
jest.mock("../../src/services/graphql/campaignPublicListings", () => ({ fetchCampaignPublicListings: jest.fn() }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key, i18n: { language: "en" } }) }));

const campaign: CampaignItem = {
  id: "c1", title: "Garden", theme: "Garden", description: "", imageUrl: null,
  startAt: "2026-01-01", endAt: "2099-01-01", airdropAt: "2027-01-01", createdAt: "2026-01-01",
  creatorAccountId: "owner", moderationStatus: CampaignModerationStatus.Approved,
  resourceCount: 0, needCount: 0, rewardsMultiplier: 5, airdropAmount: 3000
};
const listings = {
  resources: [{ id: "r1", title: "Tools", imageUrls: [], canBeGifted: true }],
  needs: [{ id: "n1", title: "Helpers", imageUrls: [], proposedTokenAmount: 20 }]
};

function renderScreen(id = "c1") {
  return render(<PaperProvider><CampaignPublicInfoScreen campaignId={id} campaign={campaign} currentAccountId="viewer" /></PaperProvider>);
}

describe("CampaignPublicInfoScreen listings", () => {
  beforeEach(() => jest.mocked(fetchCampaignPublicListings).mockReset());

  it.each(["resource", "need"] as const)("shows listings and opens and returns from a %s", async (kind) => {
    jest.mocked(fetchCampaignPublicListings).mockResolvedValue(listings);
    const screen = renderScreen();
    await screen.findByText("Tools");
    expect(screen.getByText("Helpers")).toBeTruthy();
    fireEvent.press(screen.getByTestId(`${kind}-card-${kind === "resource" ? "r1" : "n1"}`));
    const detail = kind === "resource" ? screen.UNSAFE_getByType(ResourceDetailScreen) : screen.UNSAFE_getByType(NeedDetailScreen);
    expect(detail.props).toMatchObject({ [kind === "resource" ? "resourceId" : "needId"]: kind === "resource" ? "r1" : "n1", currentAccountId: "viewer" });
    fireEvent(detail, "back");
    expect(screen.getByText("Tools")).toBeTruthy();
  });

  it("does not show empty headings or an empty-state message", async () => {
    jest.mocked(fetchCampaignPublicListings).mockResolvedValue({ resources: [], needs: [] });
    const screen = renderScreen();
    await waitFor(() => expect(fetchCampaignPublicListings).toHaveBeenCalledWith("c1"));
    expect(screen.queryByText("Resources")).toBeNull();
    expect(screen.queryByText("Needs")).toBeNull();
    expect(screen.queryByText("We could not load the campaign listings.")).toBeNull();
  });

  it("shows only a populated section", async () => {
    jest.mocked(fetchCampaignPublicListings).mockResolvedValue({ resources: [], needs: listings.needs });
    const screen = renderScreen();
    await screen.findByText("Helpers");
    expect(screen.getByText("Needs")).toBeTruthy();
    expect(screen.queryByText("Resources")).toBeNull();
  });

  it("offers retry when loading listings fails", async () => {
    jest.mocked(fetchCampaignPublicListings).mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(listings);
    const screen = renderScreen();
    await screen.findByText("We could not load the campaign listings.");
    fireEvent.press(screen.getByLabelText("retry"));
    await screen.findByText("Tools");
    expect(fetchCampaignPublicListings).toHaveBeenCalledTimes(2);
  });

  it("ignores a previous campaign's late response", async () => {
    let resolveFirst!: (value: typeof listings) => void;
    jest.mocked(fetchCampaignPublicListings).mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
      .mockResolvedValueOnce({ resources: [], needs: [] });
    const screen = renderScreen();
    screen.rerender(<PaperProvider><CampaignPublicInfoScreen campaignId="c2" campaign={campaign} /></PaperProvider>);
    await waitFor(() => expect(fetchCampaignPublicListings).toHaveBeenCalledWith("c2"));
    await act(async () => { resolveFirst(listings); });
    expect(screen.queryByText("Tools")).toBeNull();
  });
});