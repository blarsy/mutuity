import React from "react";
import { act, fireEvent, render } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";

import i18n from "../../src/i18n";
import { MyProfileScreen, type MyProfileRecord } from "../../src/screens/profile/MyProfileScreen";
import { AuthProvider, useAuth } from "../../src/services/auth/AuthProvider";
import { bootstrapSession, setPersistedLanguage } from "../../src/services/auth/session";
import { fetchAccountSnapshotById } from "../../src/services/graphql/auth";
import { resetAccountGraphqlState } from "../../src/services/graphql/client";
import { fetchCurrentAccountEmail, fetchMyProfile, updateMyProfile } from "../../src/services/graphql/profile";

jest.mock("../../src/services/auth/session", () => ({
  bootstrapSession: jest.fn(),
  setPersistedAccountId: jest.fn().mockResolvedValue(undefined),
  setPersistedLanguage: jest.fn().mockResolvedValue(undefined)
}));
jest.mock("../../src/services/graphql/auth", () => ({ fetchAccountSnapshotById: jest.fn() }));
jest.mock("../../src/services/graphql/client", () => ({ resetAccountGraphqlState: jest.fn().mockResolvedValue(undefined) }));
jest.mock("../../src/services/graphql/profile", () => ({
  fetchMyProfile: jest.fn(),
  fetchCurrentAccountEmail: jest.fn(),
  updateMyProfile: jest.fn()
}));

const profile: MyProfileRecord = {
  accountId: "11111111-1111-4111-8111-111111111111",
  displayName: "Alex",
  email: "alex@example.com",
  avatarUrl: null,
  location: null,
  bio: "Hello!",
  preferredLanguage: "en"
};

function SignedInProfile() {
  const { session } = useAuth();
  return session.authenticated ? <MyProfileScreen accountId={session.accountId} /> : null;
}

async function renderProfile() {
  const screen = render(<PaperProvider><AuthProvider><SignedInProfile /></AuthProvider></PaperProvider>);
  await act(async () => {});
  return screen;
}

beforeEach(async () => {
  jest.clearAllMocks();
  await i18n.changeLanguage("en");
  let preferredLanguage: "en" | "fr" = "en";
  jest.mocked(bootstrapSession).mockImplementation(async () => ({
    token: `mock:${profile.accountId}`, accountId: profile.accountId, language: preferredLanguage
  }));
  jest.mocked(fetchAccountSnapshotById).mockImplementation(async (id) => ({
    id, displayName: profile.displayName, avatarUrl: null, preferredLanguage
  }));
  jest.mocked(fetchMyProfile).mockReset().mockImplementation(async () => ({ ...profile, preferredLanguage }));
  jest.mocked(fetchCurrentAccountEmail).mockResolvedValue(profile.email);
  jest.mocked(updateMyProfile).mockImplementation(async (_id, patch) => {
    preferredLanguage = patch.preferredLanguage ?? preferredLanguage;
    return { ...profile, preferredLanguage };
  });
});

it("keeps the saved profile open in the new language without rebooting auth or reloading profile data", async () => {
  const screen = await renderProfile();
  expect(screen.getByLabelText("Full name").props.value).toBe(profile.displayName);
  fireEvent.press(screen.getByTestId("profile-language-fr"));
  expect(i18n.language).toBe("en");

  await act(async () => {
    fireEvent.press(screen.getByRole("button", { name: "Save" }));
  });

  expect(updateMyProfile).toHaveBeenCalledWith(profile.accountId, expect.objectContaining({ preferredLanguage: "fr" }));
  expect(setPersistedLanguage).toHaveBeenLastCalledWith("fr");
  expect(i18n.language).toBe("fr");
  expect(bootstrapSession).toHaveBeenCalledTimes(1);
  expect(resetAccountGraphqlState).toHaveBeenCalledTimes(1);
  expect(fetchAccountSnapshotById).toHaveBeenCalledTimes(2);
  expect(fetchMyProfile).toHaveBeenCalledTimes(1);
  expect(fetchCurrentAccountEmail).toHaveBeenCalledTimes(1);
  expect(screen.getByLabelText("Nom complet").props.value).toBe(profile.displayName);
  expect(screen.getByLabelText("E-mail").props.value).toBe(profile.email);
  expect(screen.getByText("Profil enregistré.")).toBeTruthy();
});

it("still offers a retry after a genuine profile load failure", async () => {
  jest.mocked(fetchMyProfile).mockRejectedValueOnce(new Error("Offline"));
  const screen = await renderProfile();
  expect(screen.getByText("We could not load this profile.")).toBeTruthy();

  await act(async () => {
    fireEvent.press(screen.getByRole("button", { name: "Retry" }));
  });

  expect(screen.getByLabelText("Full name").props.value).toBe(profile.displayName);
  expect(fetchMyProfile).toHaveBeenCalledTimes(2);
});