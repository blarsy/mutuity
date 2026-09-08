import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { Linking } from "react-native";

import { AccountPublicProfileScreen } from "../../src/screens/profile/AccountPublicProfileScreen";
import { NeedIntensity } from "../../src/services/graphql/generated";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? _key,
    i18n: { language: "en" }
  })
}));

jest.mock("../../src/services/graphql/profile", () => ({
  fetchMyProfile: jest.fn()
}));

const profile = {
  accountId: "00000000-0000-0000-0000-000000000111",
  displayName: "Nora Ibrahim",
  avatarUrl: null,
  location: {
    label: "Lyon, France",
    latitude: 45.764,
    longitude: 4.8357
  },
  bio: "Community gardener and repair volunteer.",
  profileLinks: [
    {
      type: "website",
      label: "Website",
      url: "https://example.com"
    }
  ],
  resources: [
    {
      id: "11111111-1111-1111-1111-111111111111",
      title: "Bike repair support",
      description: "I can help tune and fix bikes.",
      imageUrls: [],
      createdAt: "2026-06-01T10:00:00.000Z",
      canBeExchanged: true,
      canBeGifted: false
    }
  ],
  needs: [
    {
      id: "22222222-2222-2222-2222-222222222222",
      title: "Help planting seedlings",
      description: "Looking for an extra pair of hands in the community garden.",
      proposedTokenAmount: 12,
      intensity: NeedIntensity.Sharing
    }
  ]
};

describe("AccountPublicProfileScreen", () => {
  beforeEach(() => {
    jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shows the richer public profile information when it is available", () => {
    const screen = render(
      <AccountPublicProfileScreen
        accountId={profile.accountId}
        profile={profile}
      />
    );

    fireEvent.press(screen.getByRole("button", { name: "More info" }));

    expect(screen.getByText("Community gardener and repair volunteer.")).toBeTruthy();
    expect(screen.getByText("Website")).toBeTruthy();
    expect(screen.getByText("Available resources")).toBeTruthy();
    expect(screen.getByText("Bike repair support")).toBeTruthy();
    expect(screen.getByText("Available needs")).toBeTruthy();
    expect(screen.getByText("Help planting seedlings")).toBeTruthy();
  });

  it("does not show a bio section when the profile has no bio", () => {
    const screen = render(
      <AccountPublicProfileScreen
        accountId={profile.accountId}
        profile={{ ...profile, bio: "  " }}
      />
    );

    fireEvent.press(screen.getByRole("button", { name: "More info" }));

    expect(screen.queryByText("Bio")).toBeNull();
    expect(screen.queryByText("No bio provided.")).toBeNull();
  });

  it("opens profile links from the public profile view", () => {
    const screen = render(
      <AccountPublicProfileScreen
        accountId={profile.accountId}
        profile={profile}
      />
    );

    fireEvent.press(screen.getByRole("button", { name: "More info" }));
    fireEvent.press(screen.getByRole("link", { name: "Website" }));

    expect(Linking.openURL).toHaveBeenCalledWith("https://example.com");
  });
});
