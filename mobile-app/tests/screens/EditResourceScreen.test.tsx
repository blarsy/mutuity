import React from "react";
import { act, fireEvent, render, waitFor, within } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";

import { EditResourceScreen } from "../../src/screens/resources/EditResourceScreen";
import { fetchMyProfile } from "../../src/services/graphql/profile";
import { resubmitResourceToCampaign, updateResourceById, type MyResourceItem } from "../../src/services/graphql/resources";
import type { CampaignListingRelation } from "../../src/services/graphql/campaignListing";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? _key,
    i18n: { language: "en" }
  })
}));

jest.mock("../../src/services/graphql/resources", () => ({
  ...jest.requireActual("../../src/services/graphql/resources"),
  updateResourceById: jest.fn().mockResolvedValue(undefined),
  resubmitResourceToCampaign: jest.fn().mockResolvedValue(undefined),
  fetchResourceCategories: jest.fn().mockResolvedValue([
    { code: 1, label: "Decoration", labelFr: "Décoration" },
    { code: 2, label: "Transport", labelFr: "Transport" }
  ])
}));

jest.mock("../../src/services/graphql/campaigns", () => ({
  fetchLinkableCampaigns: jest.fn().mockResolvedValue([
    { id: "00000000-0000-0000-0000-000000000201", title: "Community Garden" },
    { id: "00000000-0000-0000-0000-000000000202", title: "Repair Week" }
  ])
}));

jest.mock("../../src/services/graphql/profile", () => ({
  fetchMyProfile: jest.fn().mockResolvedValue(null)
}));

jest.mock("../../src/components/primitives/ProximityLocationEditor", () => ({
  ProximityLocationEditor: ({
    value,
    onChange
  }: {
    value: { label: string; latitude?: number; longitude?: number } | null;
    onChange: (value: { label: string } | null) => void;
  }) => {
    const { TextInput } = require("react-native");
    return (
      <TextInput
        accessibilityLabel="Location"
        value={value?.label ?? ""}
        onChangeText={(label: string) => onChange({ label })}
      />
    );
  }
}));

jest.mock("../../src/services/network/useNetworkStatus", () => ({
  useNetworkStatus: () => ({ isConnected: true, isInternetReachable: true })
}));

const renderWithPaper = (ui: React.ReactElement) => render(ui, { wrapper: PaperProvider });

describe("EditResourceScreen", () => {
  beforeEach(() => {
    jest.mocked(fetchMyProfile).mockResolvedValue(null);
  });

  describe("listing application feedback", () => {
    function renderListing(status: CampaignListingRelation["status"], elapsedHours = 1) {
      const campaignRelation: CampaignListingRelation = {
        campaignId: "campaign-1", submissionId: "submission-1", status, isCurrent: true,
        rejectionNote: "Please explain the resource", submittedAt: new Date(Date.now() - elapsedHours * 3600000).toISOString(),
        campaignByCampaignId: { title: "Winter drive", startAt: "2026-01-01", endAt: "2099-01-01" }
      };
      const initialResource: MyResourceItem = {
        id: "resource-1", title: "Garden tools", description: "", defaultTokenAmount: 25, imageUrls: [],
        isActive: true, isProduct: true, isService: false, canBeTakenAway: true, canBeDelivered: false,
        canBeExchanged: false, canBeGifted: true, location: { label: "Tournai" }, expiresAt: null, updatedAt: null,
        categoryCodes: [1], campaignId: "campaign-1", campaignRelation
      };
      const onSaved = jest.fn();
      const screen = renderWithPaper(<EditResourceScreen creatorAccountId="owner" initialResource={initialResource}
        categories={[]} campaigns={[{ id: "campaign-2", title: "Another drive" }]} onBack={jest.fn()} onSaved={onSaved} />);
      return { screen, onSaved };
    }

    beforeEach(() => jest.clearAllMocks());

    it("keeps rejection feedback on edit and only resubmits via the explicit action", async () => {
      const { screen, onSaved } = renderListing("REJECTED");
      expect(screen.getByText("listingCampaignStatusREJECTED")).toBeTruthy();
      expect(screen.getByText("Please explain the resource")).toBeTruthy();
      fireEvent.changeText(screen.getByLabelText("Title"), "Updated title");
      fireEvent.press(screen.getByRole("button", { name: "Save resource" }));
      await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
      expect(resubmitResourceToCampaign).not.toHaveBeenCalled();
      fireEvent.press(screen.getByRole("button", { name: "listingCampaignResubmit" }));
      await waitFor(() => expect(resubmitResourceToCampaign).toHaveBeenCalledWith("resource-1", "campaign-1"));
      expect(updateResourceById).toHaveBeenLastCalledWith("resource-1", expect.objectContaining({ title: "Updated title" }));
    });

    it.each(["PENDING", "ACCEPTED"] as const)("locks campaign switching for a recent %s application", (status) => {
      const { screen } = renderListing(status);
      fireEvent.press(screen.getByRole("button", { name: /Campaign \(optional\)/ }));
      expect(screen.queryByTestId("resource-campaign-dialog")).toBeNull();
      expect(screen.queryByRole("button", { name: "listingCampaignResubmit" })).toBeNull();
    });

    it("allows switching after 24 hours but not an empty ongoing application", async () => {
      const { screen } = renderListing("PENDING", 25);
      fireEvent.press(screen.getByRole("button", { name: /Campaign \(optional\)/ }));
      const dialog = await screen.findByTestId("resource-campaign-dialog");
      expect(within(dialog).getByText("Another drive")).toBeTruthy();
      expect(within(dialog).queryByText("No campaign")).toBeNull();
    });
  });

  it("defaults a new resource to the profile location", async () => {
    const profileLocation = { label: "Tournai", latitude: 50.6056, longitude: 3.3878 };
    let resolveProfile!: (profile: Awaited<ReturnType<typeof fetchMyProfile>>) => void;
    const profileRequest = new Promise<Awaited<ReturnType<typeof fetchMyProfile>>>((resolve) => {
      resolveProfile = resolve;
    });
    jest.mocked(fetchMyProfile).mockReturnValue(profileRequest);
    const profile = {
      accountId: "00000000-0000-0000-0000-000000000111",
      displayName: "",
      email: "",
      avatarUrl: null,
      location: profileLocation,
      bio: "",
      profileLinks: [],
      resources: [],
      needs: []
    };

    const screen = renderWithPaper(
      <EditResourceScreen
        creatorAccountId="00000000-0000-0000-0000-000000000111"
        initialResource={null}
        categories={[]}
        campaigns={[]}
        onBack={() => undefined}
        onSaved={() => undefined}
      />
    );

    await act(async () => {
      resolveProfile(profile);
      await profileRequest;
    });
    expect(screen.getByLabelText("Location").props.value).toBe("Tournai");
    expect(fetchMyProfile).toHaveBeenCalledWith("00000000-0000-0000-0000-000000000111");
  });

  it("shows validation errors inline only after the first submit attempt", () => {
    const screen = renderWithPaper(
      <EditResourceScreen
        creatorAccountId="00000000-0000-0000-0000-000000000111"
        initialResource={null}
        onBack={() => undefined}
        onSaved={() => undefined}
      />
    );

    expect(screen.queryAllByText("Title is required.")).toHaveLength(0);
    expect(screen.queryAllByText("Select at least one category.")).toHaveLength(0);
    expect(screen.queryAllByText("Address is required for on-site pickup.")).toHaveLength(0);

    fireEvent.press(screen.getByRole("button", { name: "Save resource" }));

    expect(screen.getAllByText("Title is required.")).toHaveLength(1);
    expect(screen.getAllByText("Select at least one category.")).toHaveLength(1);
    expect(screen.getAllByText("Address is required for on-site pickup.")).toHaveLength(1);
  });

  it("opens the category selector with available resource categories", async () => {
    const screen = renderWithPaper(
      <EditResourceScreen
        creatorAccountId="00000000-0000-0000-0000-000000000111"
        initialResource={null}
        onBack={() => undefined}
        onSaved={() => undefined}
      />
    );

    fireEvent.press(screen.getByRole("button", { name: /Categories/ }));

    expect(await screen.findByText("Decoration")).toBeTruthy();
    expect(screen.getByText("Transport")).toBeTruthy();
  });

  it("preserves an existing amount above 10000 when saving without changing it", async () => {
    const initialResource: MyResourceItem = {
      id: "resource-high-price",
      title: "Garden tools",
      description: "",
      defaultTokenAmount: 15000,
      imageUrls: [],
      isActive: true,
      isProduct: true,
      isService: false,
      canBeTakenAway: true,
      canBeDelivered: false,
      canBeExchanged: false,
      canBeGifted: true,
      location: { label: "Tournai" },
      expiresAt: null,
      updatedAt: null,
      categoryCodes: [1],
      campaignId: null
    };
    const onSaved = jest.fn();
    const screen = renderWithPaper(
      <EditResourceScreen
        creatorAccountId="owner"
        initialResource={initialResource}
        categories={[{ code: 1, label: "Decoration", labelFr: "Décoration" }]}
        campaigns={[]}
        onBack={jest.fn()}
        onSaved={onSaved}
      />
    );

    fireEvent(screen.getByTestId("price-info"), "layout", {
      nativeEvent: { layout: { width: 300 } }
    });
    expect(screen.getByLabelText("Tope amount").props.value).toBe("15000");

    fireEvent.press(screen.getByRole("button", { name: "Save resource" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(updateResourceById).toHaveBeenCalledWith(
      initialResource.id,
      expect.objectContaining({ defaultTokenAmount: 15000 })
    );
  });

  it("lists selected categories as removable pills", async () => {
    const screen = renderWithPaper(
      <EditResourceScreen
        creatorAccountId="00000000-0000-0000-0000-000000000111"
        initialResource={null}
        onBack={() => undefined}
        onSaved={() => undefined}
      />
    );

    await act(async () => undefined);
    fireEvent.press(screen.getByRole("button", { name: /Categories/ }));
    fireEvent.press(await screen.findByText("Decoration"));
    fireEvent.press(screen.getByText("Transport"));
    fireEvent.press(screen.getByText("OK"));

    expect(screen.getByTestId("selected-resource-category-1")).toBeTruthy();
    expect(screen.getByTestId("selected-resource-category-2")).toBeTruthy();

    const firstSelectedCategory = screen.getByTestId("selected-resource-category-1-container");
    fireEvent.press(within(firstSelectedCategory).getByLabelText("Close"));

    expect(screen.queryByTestId("selected-resource-category-1")).toBeNull();
    expect(screen.getByTestId("selected-resource-category-2")).toBeTruthy();
  });

  it("offers an optional single campaign picker", async () => {
    const screen = renderWithPaper(
      <EditResourceScreen
        creatorAccountId="00000000-0000-0000-0000-000000000111"
        initialResource={null}
        onBack={() => undefined}
        onSaved={() => undefined}
      />
    );

    fireEvent.press(screen.getByRole("button", { name: /Campaign \(optional\)/ }));

    const campaignDialog = await screen.findByTestId("resource-campaign-dialog");
    expect(within(campaignDialog).getByText("Community Garden")).toBeTruthy();
    expect(within(campaignDialog).getByText("Repair Week")).toBeTruthy();
    expect(within(campaignDialog).getByText("No campaign")).toBeTruthy();
  });
});