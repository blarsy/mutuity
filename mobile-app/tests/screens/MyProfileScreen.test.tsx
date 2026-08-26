import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";

import { MyProfileScreen, type MyProfileRecord } from "../../src/screens/profile/MyProfileScreen";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? _key
  })
}));

jest.mock("../../src/services/auth/AuthProvider", () => ({
  useAuth: () => ({ refreshSession: async () => undefined })
}));

const invalidProfile: MyProfileRecord = {
  accountId: "00000000-0000-0000-0000-000000000111",
  displayName: "",
  email: "alex@example.com",
  avatarUrl: null,
  location: null,
  bio: ""
};

describe("MyProfileScreen", () => {
  const renderWithPaper = (ui: React.ReactElement) => render(<PaperProvider>{ui}</PaperProvider>);

  it("shows validation errors only after the first submit attempt", () => {
    const screen = renderWithPaper(
      <MyProfileScreen
        accountId={invalidProfile.accountId}
        profile={invalidProfile}
        onSaveProfile={() => undefined}
      />
    );

    expect(screen.queryAllByText("Title is required.")).toHaveLength(0);

    fireEvent.press(screen.getByRole("button", { name: "Save" }));

    expect(screen.getAllByText("Title is required.").length).toBeGreaterThan(0);
  });

  it("adds a profile link and includes it in the save payload", () => {
    const onSaveProfile = jest.fn();
    const screen = renderWithPaper(
      <MyProfileScreen
        accountId={invalidProfile.accountId}
        profile={{
          ...invalidProfile,
          displayName: "Alex",
          profileLinks: []
        }}
        onSaveProfile={onSaveProfile}
      />
    );

    fireEvent.press(screen.getByTestId("profile-link-add"));
    fireEvent.changeText(screen.getByLabelText("Label"), "Website");
    fireEvent.changeText(screen.getByLabelText("URL"), "https://example.com");
    fireEvent.press(screen.getByTestId("profile-link-editor-save"));

    fireEvent.press(screen.getAllByRole("button", { name: "Save" })[0]);

    expect(onSaveProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: "Alex",
        profileLinks: [
          {
            type: "website",
            label: "Website",
            url: "https://example.com"
          }
        ]
      })
    );
  });

  it("confirms before deleting a profile link", () => {
    const onSaveProfile = jest.fn();
    const screen = renderWithPaper(
      <MyProfileScreen
        accountId={invalidProfile.accountId}
        profile={{
          ...invalidProfile,
          displayName: "Alex",
          profileLinks: [
            {
              type: "website",
              label: "Website",
              url: "https://example.com"
            }
          ]
        }}
        onSaveProfile={onSaveProfile}
      />
    );

    fireEvent.press(screen.getAllByLabelText("Delete")[0]);
    fireEvent.press(screen.getByTestId("profile-link-delete-confirm"));
    fireEvent.press(screen.getAllByRole("button", { name: "Save" })[0]);

    expect(onSaveProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: "Alex",
        profileLinks: []
      })
    );
  });
});