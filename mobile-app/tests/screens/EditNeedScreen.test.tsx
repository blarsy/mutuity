import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { EditNeedScreen } from "../../src/screens/needs/EditNeedScreen";

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

  it("offers an optional single campaign picker", async () => {
    const screen = render(
      <EditNeedScreen
        creatorAccountId="00000000-0000-0000-0000-000000000111"
        initialNeed={null}
        onBack={() => undefined}
        onSaved={() => undefined}
      />
    );

    fireEvent.press(screen.getByRole("button", { name: /Campaign \(optional\)/ }));

    expect(await screen.findByText("Community Garden")).toBeTruthy();
    expect(screen.getByText("No campaign")).toBeTruthy();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });
});