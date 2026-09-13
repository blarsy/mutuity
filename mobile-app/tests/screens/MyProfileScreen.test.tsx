import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
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

  it("only offers to send a confirmation link once a valid, different email is entered", async () => {
    const onRequestEmailChange = jest.fn().mockResolvedValue(undefined);
    const screen = renderWithPaper(
      <MyProfileScreen
        accountId={invalidProfile.accountId}
        profile={{ ...invalidProfile, displayName: "Alex" }}
        onSaveProfile={() => undefined}
        onRequestEmailChange={onRequestEmailChange}
      />
    );

    expect(screen.queryByTestId("email-change-request")).toBeNull();

    fireEvent.changeText(screen.getByLabelText("Email"), "not-an-email");
    expect(screen.queryByTestId("email-change-request")).toBeNull();

    fireEvent.changeText(screen.getByLabelText("Email"), "new-address@example.com");
    expect(screen.getByTestId("email-change-request")).toBeTruthy();

    fireEvent.press(screen.getByTestId("email-change-request"));

    expect(onRequestEmailChange).toHaveBeenCalledWith("new-address@example.com");
    expect(await screen.findByTestId("email-change-pending-note")).toBeTruthy();
  });

  it("opens change password dialog and validates input fields", async () => {
    const onChangePassword = jest.fn().mockResolvedValue(undefined);
    const screen = renderWithPaper(
      <MyProfileScreen
        accountId={invalidProfile.accountId}
        profile={{ ...invalidProfile, displayName: "Alex" }}
        onChangePassword={onChangePassword}
      />
    );

    expect(screen.queryByTestId("change-password-dialog")).toBeNull();

    fireEvent.press(screen.getByTestId("change-password-button"));
    expect(screen.getByTestId("change-password-dialog")).toBeTruthy();

    // Click confirm with empty inputs
    fireEvent.press(screen.getByTestId("change-password-confirm"));
    expect(onChangePassword).not.toHaveBeenCalled();
    expect(screen.getByTestId("change-password-current-error")).toBeTruthy();

    // Fill current password but leave new password empty
    fireEvent.changeText(screen.getByTestId("change-password-current-input"), "current123");
    fireEvent.press(screen.getByTestId("change-password-confirm"));
    expect(onChangePassword).not.toHaveBeenCalled();
    expect(screen.getByTestId("change-password-new-error")).toBeTruthy();

    // Enter short new password (< 8 chars)
    fireEvent.changeText(screen.getByTestId("change-password-new-input"), "short");
    fireEvent.changeText(screen.getByTestId("change-password-confirm-input"), "short");
    fireEvent.press(screen.getByTestId("change-password-confirm"));
    expect(onChangePassword).not.toHaveBeenCalled();
    expect(screen.getByTestId("change-password-new-error")).toBeTruthy();

    // Enter non-matching confirmation
    fireEvent.changeText(screen.getByTestId("change-password-new-input"), "newpassword123");
    fireEvent.changeText(screen.getByTestId("change-password-confirm-input"), "differentpassword");
    fireEvent.press(screen.getByTestId("change-password-confirm"));
    expect(onChangePassword).not.toHaveBeenCalled();
    expect(screen.getByTestId("change-password-confirm-error")).toBeTruthy();

    // Enter matching valid passwords and submit successfully
    fireEvent.changeText(screen.getByTestId("change-password-confirm-input"), "newpassword123");
    fireEvent.press(screen.getByTestId("change-password-confirm"));

    expect(onChangePassword).toHaveBeenCalledWith({
      currentPassword: "current123",
      newPassword: "newpassword123"
    });

    expect(await screen.findByText("Password changed successfully.")).toBeTruthy();
    expect(screen.queryByTestId("change-password-dialog")).toBeNull();
  });

  it("displays an error message if changing password fails", async () => {
    const onChangePassword = jest.fn().mockRejectedValue(new Error("Current password is incorrect."));
    const screen = renderWithPaper(
      <MyProfileScreen
        accountId={invalidProfile.accountId}
        profile={{ ...invalidProfile, displayName: "Alex" }}
        onChangePassword={onChangePassword}
      />
    );

    fireEvent.press(screen.getByTestId("change-password-button"));
    fireEvent.changeText(screen.getByTestId("change-password-current-input"), "wrongpass");
    fireEvent.changeText(screen.getByTestId("change-password-new-input"), "newpassword123");
    fireEvent.changeText(screen.getByTestId("change-password-confirm-input"), "newpassword123");

    fireEvent.press(screen.getByTestId("change-password-confirm"));

    expect(onChangePassword).toHaveBeenCalled();
    expect(await screen.findByTestId("change-password-error")).toBeTruthy();
    expect(screen.getByText("Current password is incorrect.")).toBeTruthy();
  });

  it("can cancel and dismiss change password dialog", () => {
    const screen = renderWithPaper(
      <MyProfileScreen
        accountId={invalidProfile.accountId}
        profile={{ ...invalidProfile, displayName: "Alex" }}
      />
    );

    fireEvent.press(screen.getByTestId("change-password-button"));
    expect(screen.getByTestId("change-password-dialog")).toBeTruthy();

    fireEvent.press(screen.getByTestId("change-password-cancel"));
    expect(screen.queryByTestId("change-password-dialog")).toBeNull();
  });
});