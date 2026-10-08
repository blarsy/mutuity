import React from "react";
import { fireEvent, render, within } from "@testing-library/react-native";
import { Image, Linking, Pressable, Text, View } from "react-native";
import { PaperProvider } from "react-native-paper";

import { AccountPublicProfileScreen } from "../../src/screens/profile/AccountPublicProfileScreen";
import type { MyProfileRecord } from "../../src/screens/profile/MyProfileScreen";
import { NeedIntensity } from "../../src/services/graphql/generated";
import { useCurrentAccount } from "../../src/services/auth/useCurrentAccount";
import { AccountPublicProfileNavigator } from "../../src/navigation/AccountPublicProfileNavigator";

jest.mock("../../src/screens/resources/ResourceDetailScreen", () => ({
  ResourceDetailScreen: jest.fn()
}));

jest.mock("../../src/screens/needs/NeedDetailScreen", () => ({
  NeedDetailScreen: jest.fn()
}));

import { ResourceDetailScreen } from "../../src/screens/resources/ResourceDetailScreen";
import { NeedDetailScreen } from "../../src/screens/needs/NeedDetailScreen";

jest.mock("../../src/services/auth/useCurrentAccount", () => ({
  useCurrentAccount: jest.fn()
}));

jest.mock("../../src/services/graphql/contribution", () => ({
  giftTokens: jest.fn(),
  getGiftErrorMessage: jest.fn()
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string; amount?: number }) =>
      (options?.defaultValue ?? _key).replace("{{amount}}", String(options?.amount ?? "")),
    i18n: { language: "en" }
  })
}));

jest.mock("../../src/services/graphql/profile", () => ({
  fetchMyProfile: jest.fn()
}));

const profile: MyProfileRecord = {
  accountId: "00000000-0000-0000-0000-000000000111",
  displayName: "Nora Ibrahim",
  email: "",
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
      imageUrls: ["https://example.com/seedlings.jpg"],
      createdAt: "2026-06-02T10:00:00.000Z",
      proposedTokenAmount: 12,
      intensity: NeedIntensity.Sharing
    }
  ]
};

describe("AccountPublicProfileScreen", () => {
  beforeEach(() => {
    jest.spyOn(Linking, "openURL").mockResolvedValue(undefined);
    (useCurrentAccount as jest.Mock).mockReturnValue({ authenticated: true, accountId: "sender-account" });
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

  it("matches resource card layout and typography while retaining need metadata", () => {
    const screen = render(<AccountPublicProfileScreen accountId={profile.accountId} profile={profile} />);
    const resourceCard = screen.getByTestId(`resource-card-${profile.resources![0]!.id}`);
    const needCard = screen.getByTestId(`need-card-${profile.needs![0]!.id}`);
    const needContent = within(needCard);

    expect(needCard.props.style).toEqual(resourceCard.props.style);
    expect(needContent.getByText("Help planting seedlings").props.style).toEqual(
      within(resourceCard).getByText("Bike repair support").props.style
    );
    expect(needContent.getByText("Help planting seedlings").props.numberOfLines).toBe(2);
    expect(needContent.getByText("Published 06/02/2026")).toBeTruthy();
    expect(needContent.getByText("Brought by Nora Ibrahim")).toBeTruthy();
    expect(needContent.getByText("Sharing")).toBeTruthy();
    expect(needContent.getByText("12 Topes")).toBeTruthy();
    expect(needCard.findByType(Image).props.source).toEqual({ uri: "https://example.com/seedlings.jpg" });
    expect(needCard.findByType(Image).props.style).toMatchObject({ width: 92, height: 92 });
  });

  it("uses the resource-style image fallback and handles missing publication dates", () => {
    const need = { ...profile.needs![0]!, imageUrls: [], createdAt: null };
    const screen = render(
      <AccountPublicProfileScreen accountId={profile.accountId} profile={{ ...profile, needs: [need] }} />
    );

    expect(screen.getByTestId(`need-card-image-fallback-${need.id}`).props.style).toMatchObject({ width: 92, height: 92 });
    expect(within(screen.getByTestId(`need-card-${need.id}`)).getByText("Published -")).toBeTruthy();
  });

  it("opens the selected resource or need when its card is pressed", () => {
    const onOpenResource = jest.fn();
    const onOpenNeed = jest.fn();
    const screen = render(
      <AccountPublicProfileScreen
        accountId={profile.accountId}
        profile={profile}
        onOpenResource={onOpenResource}
        onOpenNeed={onOpenNeed}
      />
    );

    fireEvent.press(screen.getByRole("button", { name: "Bike repair support" }));
    fireEvent.press(screen.getByRole("button", { name: "Help planting seedlings" }));

    expect(onOpenResource).toHaveBeenCalledWith(profile.resources![0]!.id);
    expect(onOpenNeed).toHaveBeenCalledWith(profile.needs![0]!.id);
  });

  it.each([
    { kind: "resource", title: "Bike repair support", id: profile.resources![0]!.id },
    { kind: "need", title: "Help planting seedlings", id: profile.needs![0]!.id }
  ])("navigates from the profile to $kind details and back without leaving the profile", ({ kind, title, id }) => {
    const detailScreen = kind === "resource" ? ResourceDetailScreen : NeedDetailScreen;
    (detailScreen as jest.Mock).mockImplementation((props: {
      resourceId?: string;
      needId?: string;
      currentAccountId: string | null;
      onBack: () => void;
    }) => (
      <View>
        <Text>{`${kind} details ${props.resourceId ?? props.needId}`}</Text>
        <Text>{props.currentAccountId}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Return to profile" onPress={props.onBack} />
      </View>
    ));
    const onBack = jest.fn();
    const screen = render(
      <AccountPublicProfileNavigator
        accountId={profile.accountId}
        currentAccountId="sender-account"
        profile={profile}
        onBack={onBack}
      />
    );

    fireEvent.press(screen.getByRole("button", { name: title }));
    expect(screen.getByText(`${kind} details ${id}`)).toBeTruthy();
    expect(screen.getByText("sender-account")).toBeTruthy();
    expect(screen.queryByTestId("account-public-profile-screen")).toBeNull();

    fireEvent.press(screen.getByRole("button", { name: "Return to profile" }));
    expect(screen.getByTestId("account-public-profile-screen")).toBeTruthy();
    expect(onBack).not.toHaveBeenCalled();

    fireEvent.press(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalledTimes(1);
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

  it("opens the gifting dialog from the public account identity row", () => {
    const screen = render(
      <PaperProvider>
        <AccountPublicProfileScreen accountId={profile.accountId} profile={profile} />
      </PaperProvider>
    );

    fireEvent.press(screen.getByRole("button", { name: "giftForm.title" }));
    expect(screen.getByLabelText("giftForm.amountLabel")).toBeTruthy();
    expect(screen.getByLabelText("giftForm.messageLabel")).toBeTruthy();
  });

  it.each([
    { authenticated: false, accountId: null },
    { authenticated: true, accountId: profile.accountId }
  ])("hides gifting for signed-out users and the account owner: %j", (session) => {
    (useCurrentAccount as jest.Mock).mockReturnValue(session);
    const screen = render(<AccountPublicProfileScreen accountId={profile.accountId} profile={profile} />);
    expect(screen.queryByRole("button", { name: "giftForm.title" })).toBeNull();
  });
});
