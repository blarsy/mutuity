import React from "react";
import { fireEvent, render, waitFor, within } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { CampaignModerationScreen } from "../../src/screens/campaigns/CampaignModerationScreen";
import { CampaignDetailScreen } from "../../src/screens/campaigns/CampaignDetailScreen";
import type { CampaignItem } from "../../src/services/graphql/campaigns";
import { CampaignModerationStatus } from "../../src/services/graphql/generated";
import { FormTextInput, ThemedDialog } from "../../src/components/primitives";
import { NeedSearchCard, ResourceSearchCard } from "../../src/components/listings/SearchListingCards";
import { ResourceDetailScreen } from "../../src/screens/resources/ResourceDetailScreen";
import { NeedDetailScreen } from "../../src/screens/needs/NeedDetailScreen";
import { US3Navigator } from "../../src/navigation/US3Navigator";
import { fetchCampaignById } from "../../src/services/graphql/campaigns";

jest.mock("../../src/screens/resources/ResourceDetailScreen", () => ({ ResourceDetailScreen: jest.fn(() => null) }));
jest.mock("../../src/screens/needs/NeedDetailScreen", () => ({ NeedDetailScreen: jest.fn(() => null) }));
jest.mock("../../src/screens/campaigns/MyCampaignsScreen", () => ({ MyCampaignsScreen: () => null }));
jest.mock("../../src/screens/campaigns/CampaignPublicInfoScreen", () => ({ CampaignPublicInfoScreen: () => null }));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? _key,
    i18n: { language: "en" }
  })
}));

jest.mock("../../src/services/graphql/campaignModeration", () => ({
  isVisibleModerationRelation: jest.requireActual("../../src/services/graphql/campaignModeration").isVisibleModerationRelation,
  fetchCampaignModerationHistory: jest.fn().mockResolvedValue([
    { eventType: "campaign_approved", body: "Looks good", createdAt: "2026-07-25T12:00:00.000Z" }
  ]),
  fetchCampaignNeedTriage: jest.fn().mockResolvedValue([
    {
      campaignId: "campaign-1",
      needId: "need-1",
      submissionId: "need-submission-1",
      isCurrent: true,
      submittedAt: "2026-01-01",
      rejectionNote: null,
      campaignByCampaignId: { title: "Community garden", startAt: "2026-01-01", endAt: "2099-01-01" },
      status: "PENDING",
      campaignTitle: "Community garden",
      title: "Gardening volunteers",
      intensity: "COMMITMENT",
      proposedTokens: 10,
      imageUrls: ["https://example.com/need.jpg"],
      createdAt: "2026-07-24T12:00:00.000Z",
      creatorDisplayName: "Need creator"
    }
  ]),
  fetchCampaignResourceTriage: jest.fn().mockResolvedValue([
    {
      campaignId: "campaign-1",
      resourceId: "resource-1",
      submissionId: "resource-submission-1",
      isCurrent: true,
      submittedAt: "2026-01-01",
      rejectionNote: null,
      campaignByCampaignId: { title: "Community garden", startAt: "2026-01-01", endAt: "2099-01-01" },
      status: "PENDING",
      campaignTitle: "Community garden",
      title: "Community garden tools",
      location: "Central park",
      defaultTokens: 15,
      imageUrls: ["https://example.com/resource.jpg"],
      createdAt: "2026-07-24T12:00:00.000Z",
      creatorDisplayName: "Resource creator",
      canBeExchanged: true,
      canBeGifted: true
    }
  ]),
  triageCampaignNeed: jest.fn().mockResolvedValue(undefined),
  triageCampaignResource: jest.fn().mockResolvedValue(undefined)
}));

jest.mock("../../src/services/graphql/campaigns", () => ({
  fetchCampaignById: jest.fn().mockResolvedValue(null)
}));

import { fetchCampaignNeedTriage, fetchCampaignResourceTriage, triageCampaignNeed, triageCampaignResource } from "../../src/services/graphql/campaignModeration";

const campaign: CampaignItem = {
  id: "campaign-1",
  title: "Community garden",
  theme: "Gardening",
  description: "Grow together.",
  imageUrl: null,
  startAt: "2026-08-01T00:00:00.000Z",
  airdropAt: "2026-08-15T00:00:00.000Z",
  endAt: "2026-09-01T00:00:00.000Z",
  createdAt: "2026-07-25T12:00:00.000Z",
  creatorAccountId: "account-1",
  moderationStatus: CampaignModerationStatus.Approved,
  resourceCount: 1,
  needCount: 1,
  rewardsMultiplier: 5,
  airdropAmount: 3000
};

function renderScreen(initialCampaign: CampaignItem = campaign): ReturnType<typeof render> {
  return render(
    <SafeAreaProvider>
      <PaperProvider>
        <CampaignModerationScreen campaign={initialCampaign} creatorAccountId="account-1" />
      </PaperProvider>
    </SafeAreaProvider>
  );
}

describe("CampaignModerationScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(["need", "resource"] as const)("opens a %s card in a full-screen public preview and returns without losing moderation state", async (kind) => {
    const screen = renderScreen();
    await screen.findByTestId(`${kind}-card-${kind}-1`);
    fireEvent.press(screen.getByTestId(`${kind}-card-${kind}-1`));
    const modal = screen.getByTestId("campaign-listing-preview");
    expect(modal.props.presentationStyle).toBe("fullScreen");
    const detail = kind === "need" ? screen.UNSAFE_getByType(NeedDetailScreen) : screen.UNSAFE_getByType(ResourceDetailScreen);
    expect(detail.props[kind === "need" ? "needId" : "resourceId"]).toBe(`${kind}-1`);
    expect(detail.props.currentAccountId).toBeUndefined();
    fireEvent(detail, "back");
    expect(screen.queryByTestId("campaign-listing-preview")).toBeNull();
    expect(screen.getByTestId(`${kind}-moderation-${kind}-1`)).toBeTruthy();
    expect(triageCampaignNeed).not.toHaveBeenCalled();
    expect(triageCampaignResource).not.toHaveBeenCalled();

    fireEvent.press(screen.getByTestId(`${kind}-card-${kind}-1`));
    fireEvent(screen.getByTestId("campaign-listing-preview"), "requestClose");
    expect(screen.queryByTestId("campaign-listing-preview")).toBeNull();
  });

  it("reuses search cards with moderation controls below and outside each card", async () => {
    const screen = renderScreen();
    await screen.findByText("Community garden tools");
    expect(screen.UNSAFE_getByType(ResourceSearchCard).props.listing).toMatchObject({
      id: "resource-1", creatorDisplayName: "Resource creator", imageUrls: ["https://example.com/resource.jpg"],
      canBeExchanged: true, canBeGifted: true
    });
    expect(screen.UNSAFE_getByType(NeedSearchCard).props.listing).toMatchObject({
      id: "need-1", creatorDisplayName: "Need creator", proposedTokenAmount: 10
    });
    for (const kind of ["resource", "need"]) {
      const card = screen.getByTestId(`${kind}-card-${kind}-1`);
      expect(within(card).queryByRole("button", { name: "Approve" })).toBeNull();
      expect(within(card).queryByRole("button", { name: "Reject" })).toBeNull();
      const entry = screen.getByTestId(`${kind}-moderation-${kind}-1`);
      expect(within(entry).getByRole("button", { name: "Approve" })).toBeTruthy();
      expect(within(entry).getByRole("button", { name: "Reject" })).toBeTruthy();
    }
  });

  it.each(["need", "resource"] as const)("rejects a %s with an optional note and the displayed submission ID", async (kind) => {
    const screen = renderScreen();
    await screen.findByText("Community garden tools");
    fireEvent.press(screen.getAllByRole("button", { name: "Reject" })[kind === "resource" ? 0 : 1]);
    const note = await screen.findByLabelText("listingCampaignRejectionNote");
    const dialog = screen.UNSAFE_getByType(ThemedDialog);
    expect(dialog.props.visible).toBe(true);
    expect(dialog.props.title).toBe("listingCampaignRejectTitle");
    expect(screen.UNSAFE_getByType(FormTextInput).props).toMatchObject({ multiline: true, numberOfLines: 4, maxLength: 2000 });
    expect(dialog.props.actions[1].props.mode).toBe("contained");
    fireEvent.changeText(note, "Please clarify this listing");
    // The dialog adds a third Reject button after the two cards.
    fireEvent.press(screen.getAllByRole("button", { name: "Reject" }).slice(-1)[0]);
    await waitFor(() => expect(kind === "need" ? triageCampaignNeed : triageCampaignResource).toHaveBeenCalledWith(
      "campaign-1", `${kind}-1`, "reject", `${kind}-submission-1`, "Please clarify this listing"
    ));
  });

  it("does not render superseded or ended applications as actionable", async () => {
    jest.mocked(fetchCampaignNeedTriage).mockResolvedValueOnce([{
      campaignId: "campaign-1", needId: "old-need", submissionId: "old-submission", status: "SUPERSEDED", isCurrent: false,
      submittedAt: "2026-01-01", rejectionNote: null, campaignTitle: null,
      campaignByCampaignId: { title: "Old campaign", startAt: "2026-01-01", endAt: "2099-01-01" },
      title: "Superseded need", intensity: null, proposedTokens: null
    }]);
    jest.mocked(fetchCampaignResourceTriage).mockResolvedValueOnce([{
      campaignId: "campaign-1", resourceId: "old-resource", submissionId: "old-submission", status: "PENDING", isCurrent: true,
      submittedAt: "2025-01-01", rejectionNote: null, campaignTitle: null,
      campaignByCampaignId: { title: "Old campaign", startAt: "2025-01-01", endAt: "2025-12-31" },
      title: "Ended resource", location: null, defaultTokens: null
    }]);
    const screen = renderScreen();
    await screen.findByText("No resources linked to this campaign.");
    expect(screen.queryByText("Superseded need")).toBeNull();
    expect(screen.queryByText("Ended resource")).toBeNull();
    expect(screen.queryAllByRole("button", { name: "Approve" })).toHaveLength(0);
  });

  it.each(["need", "resource"] as const)("shows %s status and last-action time above cards, with dividers and pending-only actions", async (kind) => {
    const base = {
      campaignId: "campaign-1", submissionId: "submission-1", submittedAt: "2026-01-03T10:15:00Z",
      rejectionNote: null, campaignTitle: "Community garden",
      campaignByCampaignId: { title: "Community garden", startAt: "2026-01-01", endAt: "2099-01-01" },
      title: "Listing", intensity: null, proposedTokens: 10, location: null, defaultTokens: null
    };
    const items = (["PENDING", "ACCEPTED", "REJECTED"] as const).map((status) => ({
      ...base, status, isCurrent: status !== "REJECTED", needId: status, resourceId: status,
      actedAt: status === "PENDING" ? null : "2026-01-04T11:30:00Z"
    }));
    if (kind === "need") jest.mocked(fetchCampaignNeedTriage).mockResolvedValueOnce(items);
    else jest.mocked(fetchCampaignResourceTriage).mockResolvedValueOnce(items);
    const screen = renderScreen();
    await screen.findByTestId(`${kind}-moderation-PENDING`);
    expect(screen.queryByTestId(`${kind}-moderation-REJECTED`)).toBeNull();
    const toggle = screen.getByTestId(`rejected-${kind === "need" ? "needs" : "resources"}-toggle`);
    expect(toggle.props.accessibilityState.expanded).toBe(false);
    fireEvent.press(toggle);
    const date = (value: string) => new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
    for (const status of ["PENDING", "ACCEPTED", "REJECTED"]) {
      const entry = screen.getByTestId(`${kind}-moderation-${status}`);
      const info = screen.getByTestId(`${kind}-moderation-info-${status}`);
      expect(within(info).getByText(date(status === "PENDING" ? base.submittedAt : "2026-01-04T11:30:00Z"))).toBeTruthy();
      const layoutOrder = entry.findAll((node: { props: { testID?: string } }) => typeof node.props.testID === "string")
        .map((node: { props: { testID?: string } }) => node.props.testID);
      expect(layoutOrder.indexOf(`${kind}-moderation-info-${status}`)).toBeLessThan(layoutOrder.indexOf(`${kind}-card-${status}`));
      expect(within(entry).queryAllByRole("button", { name: "Approve" })).toHaveLength(status === "PENDING" ? 1 : 0);
      expect(within(entry).queryAllByRole("button", { name: "Reject" })).toHaveLength(status === "PENDING" ? 1 : 0);
    }
    expect(screen.getByTestId(`${kind}-divider-PENDING`)).toBeTruthy();
    expect(screen.queryByTestId(`${kind}-divider-ACCEPTED`)).toBeNull();
    const renderedCards = (kind === "need" ? screen.UNSAFE_getAllByType(NeedSearchCard) : screen.UNSAFE_getAllByType(ResourceSearchCard))
      .map((card: { props: { listing: { id: string } } }) => card.props.listing.id);
    expect(renderedCards).toEqual(["ACCEPTED", "PENDING", "REJECTED"]);
    const stats = screen.UNSAFE_getByType(CampaignDetailScreen).props.campaign;
    expect(stats[kind === "need" ? "needCount" : "resourceCount"]).toBe(2);
    expect(stats[kind === "need" ? "pendingNeedCount" : "pendingResourceCount"]).toBe(1);
    fireEvent.press(toggle);
    expect(screen.queryByTestId(`${kind}-moderation-REJECTED`)).toBeNull();
  });

  it("hides the approved campaign form and details while keeping the notice", async () => {
    const screen = renderScreen();
    await waitFor(() => expect(screen.getByText("Community garden tools")).toBeTruthy());

    expect(screen.getByText("This campaign has been approved and can no longer be modified.")).toBeTruthy();
    expect(screen.queryByLabelText("Title")).toBeNull();
    expect(screen.queryByTestId("campaign-details")).toBeNull();
    expect(screen.queryByTestId("campaign-created-at")).toBeNull();
    expect(screen.queryByRole("button", { name: "Save campaign" })).toBeNull();
  });

  it("keeps the moderation form editable and save available before approval", () => {
    const pendingCampaign = { ...campaign, moderationStatus: CampaignModerationStatus.Pending };
    const screen = render(
      <CampaignDetailScreen
        campaign={pendingCampaign}
        creatorAccountId="account-1"
        moderationMode
      />
    );

    expect(screen.getByLabelText("Title").props.editable).toBe(true);
    expect(screen.getByRole("button", { name: "Save campaign" })).toBeTruthy();
    expect(screen.queryByText("This campaign has been approved and can no longer be modified.")).toBeNull();
  });

  it.each([CampaignModerationStatus.Pending, CampaignModerationStatus.AwaitingAdaptation])(
    "expands the journal initially for a campaign with status %s and allows collapsing it",
    async (moderationStatus) => {
      const screen = renderScreen({ ...campaign, moderationStatus });
      const toggle = screen.getByTestId("campaign-moderation-journal-toggle");
      expect(toggle.props.accessibilityState.expanded).toBe(true);
      await screen.findByText("Looks good");
      fireEvent.press(toggle);
      expect(toggle.props.accessibilityState.expanded).toBe(false);
      expect(screen.queryByText("Looks good")).toBeNull();
      fireEvent.press(toggle);
      expect(screen.getByText("Looks good")).toBeTruthy();
    }
  );

  it("collapses the approved campaign journal initially, allows toggling it, and supports linked-entry triage", async () => {
    const screen = renderScreen();

    await waitFor(() => expect(screen.getByText("Community garden tools")).toBeTruthy());
    expect(screen.getByTestId("campaign-moderation-journal-toggle").props.accessibilityState.expanded).toBe(false);
    expect(screen.queryByText("Looks good")).toBeNull();
    fireEvent.press(screen.getByTestId("campaign-moderation-journal-toggle"));
    await waitFor(() => expect(screen.getByText("Looks good")).toBeTruthy());
    expect(screen.getByText(/Campaign approved/)).toBeTruthy();
    fireEvent.press(screen.getByTestId("campaign-moderation-journal-toggle"));
    expect(screen.queryByText("Looks good")).toBeNull();

    expect(screen.getByText("Gardening volunteers")).toBeTruthy();

    fireEvent.press(screen.getAllByRole("button", { name: "Approve" })[0]);
    await waitFor(() => {
      expect(triageCampaignResource).toHaveBeenCalledWith("campaign-1", "resource-1", "accept", "resource-submission-1", undefined);
    });
    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: "Approve" })[0].props.accessibilityState?.disabled).not.toBe(true);
    });

    fireEvent.press(screen.getAllByRole("button", { name: "Approve" })[1]);
    await waitFor(() => {
      expect(triageCampaignNeed).toHaveBeenCalledWith("campaign-1", "need-1", "accept", "need-submission-1", undefined);
    });
  });

  it("reloads both triage lists when notifications reopen the same or another campaign", async () => {
    const otherCampaign = { ...campaign, id: "campaign-2", title: "Other campaign" };
    jest.mocked(fetchCampaignById).mockImplementation(async (id) => id === campaign.id ? campaign : otherCampaign);
    const relation = {
      campaignId: "campaign-1", submissionId: "submission-1", status: "PENDING" as const,
      isCurrent: true, submittedAt: "2026-01-01", rejectionNote: null, campaignTitle: campaign.title,
      campaignByCampaignId: { title: campaign.title, startAt: "2026-01-01", endAt: "2099-01-01" }
    };
    jest.mocked(fetchCampaignNeedTriage)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ ...relation, needId: "new-need", title: "New need", intensity: null, proposedTokens: null }])
      .mockResolvedValueOnce([]);
    jest.mocked(fetchCampaignResourceTriage)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ ...relation, resourceId: "new-resource", title: "New resource", location: null, defaultTokens: null }])
      .mockResolvedValueOnce([]);

    function NotificationHarness(): React.JSX.Element {
      const [pendingId, setPendingId] = React.useState<string | null>("campaign-1");
      const consume = React.useCallback(() => setPendingId(null), []);
      return (
        <SafeAreaProvider><PaperProvider>
          <Pressable onPress={() => setPendingId("campaign-1")}><Text>Open same</Text></Pressable>
          <Pressable onPress={() => setPendingId("campaign-2")}><Text>Open other</Text></Pressable>
          <US3Navigator currentAccountId="account-1" pendingCampaignId={pendingId} pendingCampaignModeration onConsumePendingCampaign={consume} />
        </PaperProvider></SafeAreaProvider>
      );
    }

    const screen = render(<NotificationHarness />);
    await screen.findByText("No resources linked to this campaign.");
    expect(fetchCampaignNeedTriage).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getByText("Open same"));
    await screen.findByTestId("need-moderation-new-need");
    expect(screen.getByTestId("resource-moderation-new-resource")).toBeTruthy();
    expect(fetchCampaignNeedTriage).toHaveBeenCalledTimes(2);
    expect(fetchCampaignResourceTriage).toHaveBeenCalledTimes(2);
    expect(screen.UNSAFE_getByType(CampaignDetailScreen).props.campaign).toMatchObject({ pendingNeedCount: 1, pendingResourceCount: 1 });

    fireEvent.press(screen.getByText("Open other"));
    await waitFor(() => expect(fetchCampaignNeedTriage).toHaveBeenCalledWith("campaign-2"));
    await screen.findByText("No resources linked to this campaign.");
    expect(fetchCampaignResourceTriage).toHaveBeenCalledWith("campaign-2");
    expect(screen.queryByTestId("need-moderation-new-need")).toBeNull();
    expect(screen.queryByTestId("resource-moderation-new-resource")).toBeNull();
    expect(screen.UNSAFE_getByType(CampaignDetailScreen).props.campaign.id).toBe("campaign-2");
  });
});
