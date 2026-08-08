import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { EditNeedScreen } from "../../src/screens/needs/EditNeedScreen";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? _key,
    i18n: { language: "en" }
  })
}));

describe("EditNeedScreen", () => {
  it("shows validation errors only after the first submit attempt", () => {
    const screen = render(
      <EditNeedScreen
        creatorAccountId="00000000-0000-0000-0000-000000000111"
        initialNeed={null}
        onBack={() => undefined}
        onSaved={() => undefined}
      />
    );

    expect(screen.queryAllByText("This field is required.")).toHaveLength(0);

    fireEvent.press(screen.getByRole("button", { name: "Save need" }));

    expect(screen.getAllByText("This field is required.").length).toBeGreaterThan(0);
  });
});