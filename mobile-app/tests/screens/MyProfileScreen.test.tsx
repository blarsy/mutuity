import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

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
  it("shows validation errors only after the first submit attempt", () => {
    const screen = render(
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
});