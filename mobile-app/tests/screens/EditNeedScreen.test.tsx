import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";

import { EditNeedScreen } from "../../src/screens/needs/EditNeedScreen";
import { createNeedForAccount, updateNeedById, type NeedItem } from "../../src/services/graphql/needs";
import { NeedIntensity } from "../../src/services/graphql/generated";
import { fetchMyProfile } from "../../src/services/graphql/profile";

jest.mock("../../src/services/graphql/needs", () => ({
  createNeedForAccount: jest.fn().mockResolvedValue(undefined),
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
    t: (_key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? _key,
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
      fireEvent.changeText(screen.getByLabelText("Tope amount"), String(tokenAmount));
      fireEvent.press(screen.getByRole("button", { name: "Save need" }));

      await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
      const mutation = mode === "edit" ? updateNeedById : createNeedForAccount;
      expect(mutation).toHaveBeenCalledWith(
        mode === "edit" ? initialNeed.id : accountId,
        expect.objectContaining({ proposedTokenAmount: tokenAmount })
      );
    });

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