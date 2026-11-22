import React from "react";
import { act, fireEvent, render, waitFor, within } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";

import { EditNeedScreen } from "../../src/screens/needs/EditNeedScreen";
import { createNeedForAccount, resubmitNeedToCampaign, updateNeedById, type NeedItem } from "../../src/services/graphql/needs";
import type { CampaignListingRelation } from "../../src/services/graphql/campaignListing";
import { NeedIntensity } from "../../src/services/graphql/generated";
import { fetchMyProfile } from "../../src/services/graphql/profile";
import { useTokenBalance } from "../../src/services/realtime/useTokenBalance";

jest.mock("../../src/services/realtime/useTokenBalance", () => ({ useTokenBalance: jest.fn() }));

jest.mock("../../src/services/graphql/needs", () => ({
  createNeedForAccount: jest.fn().mockResolvedValue(undefined),
  resubmitNeedToCampaign: jest.fn().mockResolvedValue(undefined),
  updateNeedById: jest.fn().mockResolvedValue(undefined)
}));

jest.mock("../../src/services/graphql/profile", () => ({
  fetchMyProfile: jest.fn().mockResolvedValue(null)
}));

// Native image/SVG loading is unrelated to form validation.
jest.mock("../../src/components/primitives/PicturesField", () => ({ PicturesField: () => null }));
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

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, options?: Record<string, unknown>) =>
      String(options?.defaultValue ?? _key).replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(options?.[name] ?? "")),
    i18n: { language: "en" }
  })
}));

jest.mock("../../src/services/graphql/campaigns", () => ({
  fetchLinkableCampaigns: jest.fn().mockResolvedValue([
    { id: "00000000-0000-0000-0000-000000000201", title: "Community Garden" },
    { id: "00000000-0000-0000-0000-000000000202", title: "Repair Week" }
  ])
}));

describe("EditNeedScreen", () => {
  beforeEach(() => {
    jest.mocked(fetchMyProfile).mockResolvedValue(null);
    jest.mocked(useTokenBalance).mockReturnValue({ balance: 5, loading: false, error: null, refresh: jest.fn() });
  });

  describe("listing application feedback", () => {
    function renderListing(status: CampaignListingRelation["status"], elapsedHours = 1) {
      const campaignRelation: CampaignListingRelation = {
        campaignId: "campaign-1", submissionId: "submission-1", status, isCurrent: true,
        rejectionNote: "Please explain the need", submittedAt: new Date(Date.now() - elapsedHours * 3600000).toISOString(),
        campaignByCampaignId: { title: "Winter drive", startAt: "2026-01-01", endAt: "2099-01-01" }
      };
      const initialNeed: NeedItem = {
        id: "need-1", title: "Grocery pickup", description: "", location: { label: "Tournai" },
        proposedTokenAmount: 25, intensity: NeedIntensity.LegUp, distanceKm: 0, located: true,
        createdAt: null, creatorAccountId: "owner", claimCount: 0, isClaimedByCurrentAccount: false,
        campaignId: "campaign-1", campaignRelation
      };
      const onSaved = jest.fn();
      const screen = render(<EditNeedScreen creatorAccountId="owner" initialNeed={initialNeed}
        campaigns={[{ id: "campaign-2", title: "Another drive" }]} onBack={jest.fn()} onSaved={onSaved} />, { wrapper: PaperProvider });
      return { screen, onSaved };
    }

    beforeEach(() => jest.clearAllMocks());

    it("keeps rejection feedback on edit and only resubmits via the explicit action", async () => {
      const { screen, onSaved } = renderListing("REJECTED");
      expect(screen.getByText("listingCampaignStatusREJECTED")).toBeTruthy();
      expect(screen.getByText("Please explain the need")).toBeTruthy();
      fireEvent.changeText(screen.getByLabelText("Title"), "Updated title");
      fireEvent.press(screen.getByRole("button", { name: "Save need" }));
      await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
      expect(resubmitNeedToCampaign).not.toHaveBeenCalled();
      fireEvent.press(screen.getByRole("button", { name: "listingCampaignResubmit" }));
      await waitFor(() => expect(resubmitNeedToCampaign).toHaveBeenCalledWith("need-1", "campaign-1"));
      expect(updateNeedById).toHaveBeenLastCalledWith("need-1", expect.objectContaining({ title: "Updated title" }));
    });

    it.each(["PENDING", "ACCEPTED"] as const)("locks campaign switching for a recent %s application", (status) => {
      const { screen } = renderListing(status);
      fireEvent.press(screen.getByRole("button", { name: /Campaign \(optional\)/ }));
      expect(screen.queryByTestId("need-campaign-dialog")).toBeNull();
      expect(screen.queryByRole("button", { name: "listingCampaignResubmit" })).toBeNull();
    });

    it("allows switching after 24 hours but not an empty ongoing application", async () => {
      const { screen } = renderListing("PENDING", 25);
      fireEvent.press(screen.getByRole("button", { name: /Campaign \(optional\)/ }));
      const dialog = await screen.findByTestId("need-campaign-dialog");
      expect(within(dialog).getByText("Another drive")).toBeTruthy();
      expect(within(dialog).queryByText("No campaign")).toBeNull();
    });
  });

  it("shows the current available balance next to the amount/intensity controls", () => {
    const props = { creatorAccountId: "account", initialNeed: null, campaigns: [], onBack: jest.fn(), onSaved: jest.fn() };
    const screen = render(<EditNeedScreen {...props} />, { wrapper: PaperProvider });
    expect(useTokenBalance).toHaveBeenLastCalledWith("account", true);
    expect(screen.getByTestId("need-token-balance")).toHaveTextContent("Available balance: 5");
    const amountGroup = within(screen.getByTestId("need-token-amount-group"));
    expect(amountGroup.getByLabelText("Tope amount")).toBeTruthy();
    expect(amountGroup.getByTestId("need-token-balance")).toBeTruthy();
    jest.mocked(useTokenBalance).mockReturnValue({ balance: 3115, loading: false, error: null, refresh: jest.fn() });
    screen.rerender(<EditNeedScreen {...props} />);
    expect(screen.getByTestId("need-token-balance")).toHaveTextContent("Available balance: 3,115");
  });

  it("shows an unknown balance on failure and isolates injected balances", () => {
    jest.mocked(useTokenBalance).mockReturnValue({ balance: null, loading: false, error: new Error("offline"), refresh: jest.fn() });
    const props = { creatorAccountId: "account", initialNeed: null, campaigns: [], onBack: jest.fn(), onSaved: jest.fn() };
    const screen = render(<EditNeedScreen {...props} />, { wrapper: PaperProvider });
    expect(screen.getByTestId("need-token-balance")).toHaveTextContent("Available balance: —");
    expect(screen.getByText("We could not update your balance.")).toBeTruthy();
    screen.rerender(<EditNeedScreen {...props} tokenBalance={0} />);
    expect(useTokenBalance).toHaveBeenLastCalledWith("account", false);
    expect(screen.getByTestId("need-token-balance")).toHaveTextContent("Available balance: 0");
    expect(screen.queryByText("We could not update your balance.")).toBeNull();
    screen.rerender(<EditNeedScreen {...props} creatorAccountId={null} />);
    expect(useTokenBalance).toHaveBeenLastCalledWith(null, false);
  });

  it("defaults a new need to the profile location", async () => {
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

    const screen = render(
      <EditNeedScreen
        creatorAccountId="00000000-0000-0000-0000-000000000111"
        initialNeed={null}
        campaigns={[]}
        onBack={() => undefined}
        onSaved={() => undefined}
      />,
      { wrapper: PaperProvider }
    );

    await act(async () => {
      resolveProfile(profile);
      await profileRequest;
    });
    expect(screen.getByLabelText("Location").props.value).toBe("Tournai");
    expect(fetchMyProfile).toHaveBeenCalledWith("00000000-0000-0000-0000-000000000111");
  });

  describe("location on create and edit", () => {
    const accountId = "owner";
    const need: NeedItem = {
      id: "need-1", title: "Grocery pickup", description: "Original", location: null,
      proposedTokenAmount: 25, intensity: NeedIntensity.LegUp, distanceKm: Infinity, located: false,
      createdAt: null, creatorAccountId: accountId, claimCount: 0, isClaimedByCurrentAccount: false
    };

    beforeEach(() => jest.clearAllMocks());

    it("saves an unrelated change to a locationless need without applying the profile location", async () => {
      const onSaved = jest.fn();
      const screen = render(<EditNeedScreen creatorAccountId={accountId} initialNeed={need}
        campaigns={[]} onBack={jest.fn()} onSaved={onSaved} />, { wrapper: PaperProvider });
      expect(screen.getByLabelText("Location").props.value).toBe("");
      expect(screen.getByText("Location")).toBeTruthy();
      expect(screen.queryByText("Location *")).toBeNull();
      fireEvent.changeText(screen.getByLabelText("Description"), "Updated description");
      fireEvent.press(screen.getByRole("button", { name: "Save need" }));
      await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
      expect(fetchMyProfile).not.toHaveBeenCalled();
      expect(updateNeedById).toHaveBeenCalledWith("need-1", expect.objectContaining({
        description: "Updated description", location: null, preserveLocationCoordinates: true
      }));
      expect(createNeedForAccount).not.toHaveBeenCalled();
    });

    it("allows an existing location to be cleared", async () => {
      const onSaved = jest.fn();
      const screen = render(<EditNeedScreen creatorAccountId={accountId}
        initialNeed={{ ...need, location: { label: "Tournai", latitude: 50.6, longitude: 3.4 } }}
        campaigns={[]} onBack={jest.fn()} onSaved={onSaved} />, { wrapper: PaperProvider });
      fireEvent.changeText(screen.getByLabelText("Location"), "   ");
      fireEvent.press(screen.getByRole("button", { name: "Save need" }));
      await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
      expect(updateNeedById).toHaveBeenCalledWith("need-1", expect.objectContaining({ location: null }));
      expect(jest.mocked(updateNeedById).mock.calls[0]?.[1]).not.toHaveProperty("preserveLocationCoordinates");
    });

    it("does not preserve hidden coordinates when an initially locationless need is explicitly cleared", async () => {
      const onSaved = jest.fn();
      const screen = render(<EditNeedScreen creatorAccountId={accountId} initialNeed={need}
        campaigns={[]} onBack={jest.fn()} onSaved={onSaved} />, { wrapper: PaperProvider });
      fireEvent.changeText(screen.getByLabelText("Location"), "Tournai");
      fireEvent.changeText(screen.getByLabelText("Location"), "");
      fireEvent.press(screen.getByRole("button", { name: "Save need" }));
      await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
      expect(updateNeedById).toHaveBeenCalledWith("need-1", expect.objectContaining({ location: null }));
      expect(jest.mocked(updateNeedById).mock.calls[0]?.[1]).not.toHaveProperty("preserveLocationCoordinates");
    });

    it("retains an existing address and coordinates when editing another field", async () => {
      const location = { label: "Tournai", latitude: 50.6, longitude: 3.4 };
      const onSaved = jest.fn();
      const screen = render(<EditNeedScreen creatorAccountId={accountId} initialNeed={{ ...need, location }}
        campaigns={[]} onBack={jest.fn()} onSaved={onSaved} />, { wrapper: PaperProvider });
      fireEvent.press(screen.getByRole("button", { name: "Save need" }));
      await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
      expect(updateNeedById).toHaveBeenCalledWith("need-1", expect.objectContaining({ location }));
    });

    it("still requires a nonblank location on creation", async () => {
      const onSaved = jest.fn();
      const screen = render(<EditNeedScreen creatorAccountId={accountId} initialNeed={null}
        campaigns={[]} onBack={jest.fn()} onSaved={onSaved} />, { wrapper: PaperProvider });
      expect(screen.getByText("Location *")).toBeTruthy();
      fireEvent.changeText(screen.getByLabelText("Title"), "New need");
      fireEvent.changeText(screen.getByLabelText("Tope amount"), "25");
      fireEvent.changeText(screen.getByLabelText("Location"), "   ");
      fireEvent.press(screen.getByRole("button", { name: "Save need" }));
      expect(screen.getAllByText("Location is required.").length).toBeGreaterThan(0);
      expect(createNeedForAccount).not.toHaveBeenCalled();
      expect(updateNeedById).not.toHaveBeenCalled();
      expect(onSaved).not.toHaveBeenCalled();
    });
  });

  it("shows validation errors only after the first submit attempt", () => {
    const screen = render(
      <EditNeedScreen
        creatorAccountId="00000000-0000-0000-0000-000000000111"
        initialNeed={null}
        onBack={() => undefined}
        onSaved={() => undefined}
      />,
      { wrapper: PaperProvider }
    );

    expect(screen.queryAllByText("This field is required.")).toHaveLength(0);

    fireEvent.press(screen.getByRole("button", { name: "Save need" }));

    expect(screen.getAllByText("This field is required.").length).toBeGreaterThan(0);
  });

  it("offers an optional single campaign picker", async () => {
    const screen = render(
      <EditNeedScreen
        creatorAccountId="00000000-0000-0000-0000-000000000111"
        initialNeed={null}
        onBack={() => undefined}
        onSaved={() => undefined}
      />,
      { wrapper: PaperProvider }
    );

    fireEvent.press(screen.getByRole("button", { name: /Campaign \(optional\)/ }));

    expect(await screen.findByText("Community Garden")).toBeTruthy();
    expect(screen.getAllByText("No campaign").length).toBeGreaterThan(0);
    // Each option exposes a radio row and a nested Paper radio control.
    expect(screen.getAllByRole("radio", { name: /No campaign|Community Garden|Repair Week/ }))
      .toHaveLength(3);
  });

  describe.each(["create", "edit"] as const)("%s token amounts", mode => {
    const accountId = "00000000-0000-0000-0000-000000000111";
    const initialNeed: NeedItem = {
      id: "need-1",
      title: "Grocery pickup",
      description: "",
      location: { label: "Tournai" },
      proposedTokenAmount: 25,
      intensity: NeedIntensity.LegUp,
      distanceKm: 0,
      located: true,
      createdAt: null,
      creatorAccountId: accountId,
      claimCount: 0,
      isClaimedByCurrentAccount: false
    };

    beforeEach(() => jest.clearAllMocks());

    function renderForm() {
      const onSaved = jest.fn();
      const screen = render(
        <EditNeedScreen
          creatorAccountId={accountId}
          initialNeed={mode === "edit" ? initialNeed : null}
          campaigns={[]}
          onBack={() => undefined}
          onSaved={onSaved}
        />,
        { wrapper: PaperProvider }
      );
      fireEvent.changeText(screen.getByLabelText("Title"), "Grocery pickup");
      fireEvent.changeText(screen.getByLabelText("Location"), "Tournai");
      return { screen, onSaved };
    }

    it.each([1, 5, 9, 10, 99, 100])("saves a need with %i tokens", async tokenAmount => {
      const { screen, onSaved } = renderForm();
      // Amounts above the available balance (5) remain valid in both create/edit.
      expect(screen.getByTestId("need-token-balance")).toHaveTextContent("Available balance: 5");
      fireEvent.changeText(screen.getByLabelText("Tope amount"), String(tokenAmount));
      fireEvent.press(screen.getByRole("button", { name: "Save need" }));

      await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
      const mutation = mode === "edit" ? updateNeedById : createNeedForAccount;
      expect(mutation).toHaveBeenCalledWith(
        mode === "edit" ? initialNeed.id : accountId,
        expect.objectContaining({ proposedTokenAmount: tokenAmount })
      );
    });

    if (mode === "edit") {
      it("preserves an existing amount above 10000 when saving without changing it", async () => {
        const highValueNeed = {
          ...initialNeed,
          proposedTokenAmount: 15000,
          intensity: NeedIntensity.RareContribution
        };
        const onSaved = jest.fn();
        const screen = render(
          <EditNeedScreen
            creatorAccountId={accountId}
            initialNeed={highValueNeed}
            campaigns={[]}
            onBack={() => undefined}
            onSaved={onSaved}
          />,
          { wrapper: PaperProvider }
        );

        fireEvent(screen.getByTestId("price-info"), "layout", {
          nativeEvent: { layout: { width: 300 } }
        });
        expect(screen.getByLabelText("Tope amount").props.value).toBe("15000");

        fireEvent.press(screen.getByRole("button", { name: "Save need" }));
        await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
        expect(updateNeedById).toHaveBeenCalledWith(
          highValueNeed.id,
          expect.objectContaining({ proposedTokenAmount: 15000 })
        );
      });
    }

    it("rejects zero tokens", () => {
      const { screen, onSaved } = renderForm();
      fireEvent.changeText(screen.getByLabelText("Tope amount"), "0");
      fireEvent.press(screen.getByRole("button", { name: "Save need" }));

      expect(screen.getAllByText("Tope amount is outside the allowed range for this intensity.").length)
        .toBeGreaterThan(0);
      expect(createNeedForAccount).not.toHaveBeenCalled();
      expect(updateNeedById).not.toHaveBeenCalled();
      expect(onSaved).not.toHaveBeenCalled();
    });
  });
});