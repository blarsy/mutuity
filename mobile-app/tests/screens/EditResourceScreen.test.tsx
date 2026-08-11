import React from "react";
import { act, fireEvent, render } from "@testing-library/react-native";

import { EditResourceScreen } from "../../src/screens/resources/EditResourceScreen";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? _key,
    i18n: { language: "en" }
  })
}));

jest.mock("../../src/services/graphql/resources", () => ({
  ...jest.requireActual("../../src/services/graphql/resources"),
  fetchResourceCategories: jest.fn().mockResolvedValue([
    { code: 1, label: "Decoration", labelFr: "Décoration" },
    { code: 2, label: "Transport", labelFr: "Transport" }
  ])
}));

jest.mock("../../src/services/graphql/campaigns", () => ({
  fetchLinkableCampaigns: jest.fn().mockResolvedValue([
    { id: "00000000-0000-0000-0000-000000000201", title: "Community Garden" },
    { id: "00000000-0000-0000-0000-000000000202", title: "Repair Week" }
  ])
}));

jest.mock("../../src/services/network/useNetworkStatus", () => ({
  useNetworkStatus: () => ({ isConnected: true, isInternetReachable: true })
}));

describe("EditResourceScreen", () => {
  it("shows validation errors inline only after the first submit attempt", () => {
    const screen = render(
      <EditResourceScreen
        creatorAccountId="00000000-0000-0000-0000-000000000111"
        initialResource={null}
        onBack={() => undefined}
        onSaved={() => undefined}
      />
    );

    expect(screen.queryAllByText("Title is required.")).toHaveLength(0);
    expect(screen.queryAllByText("Select at least one category.")).toHaveLength(0);
    expect(screen.queryAllByText("Address is required for on-site pickup.")).toHaveLength(0);

    fireEvent.press(screen.getByRole("button", { name: "Save resource" }));

    expect(screen.getAllByText("Title is required.")).toHaveLength(1);
    expect(screen.getAllByText("Select at least one category.")).toHaveLength(1);
    expect(screen.getAllByText("Address is required for on-site pickup.")).toHaveLength(1);
  });

  it("opens the category selector with available resource categories", async () => {
    const screen = render(
      <EditResourceScreen
        creatorAccountId="00000000-0000-0000-0000-000000000111"
        initialResource={null}
        onBack={() => undefined}
        onSaved={() => undefined}
      />
    );

    fireEvent.press(screen.getByRole("button", { name: /Categories/ }));

    expect(await screen.findByText("Decoration")).toBeTruthy();
    expect(screen.getByText("Transport")).toBeTruthy();
  });

  it("lists selected categories as removable pills", async () => {
    const screen = render(
      <EditResourceScreen
        creatorAccountId="00000000-0000-0000-0000-000000000111"
        initialResource={null}
        onBack={() => undefined}
        onSaved={() => undefined}
      />
    );

    await act(async () => undefined);
    fireEvent.press(screen.getByRole("button", { name: /Categories/ }));
    fireEvent.press(await screen.findByText("Decoration"));
    fireEvent.press(screen.getByText("Transport"));
    fireEvent.press(screen.getByText("Confirm"));

    expect(screen.getByTestId("selected-resource-category-1")).toBeTruthy();
    expect(screen.getByTestId("selected-resource-category-2")).toBeTruthy();

    fireEvent(screen.getByTestId("selected-resource-category-1"), "close");

    expect(screen.queryByTestId("selected-resource-category-1")).toBeNull();
    expect(screen.getByTestId("selected-resource-category-2")).toBeTruthy();
  });

  it("offers an optional single campaign picker", async () => {
    const screen = render(
      <EditResourceScreen
        creatorAccountId="00000000-0000-0000-0000-000000000111"
        initialResource={null}
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