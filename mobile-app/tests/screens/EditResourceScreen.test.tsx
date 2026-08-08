import React from "react";
import { fireEvent, render } from "@testing-library/react-native";

import { EditResourceScreen } from "../../src/screens/resources/EditResourceScreen";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? _key
  })
}));

jest.mock("../../src/services/network/useNetworkStatus", () => ({
  useNetworkStatus: () => ({ isConnected: true, isInternetReachable: true })
}));

describe("EditResourceScreen", () => {
  it("shows validation errors only after the first submit attempt", () => {
    const screen = render(
      <EditResourceScreen
        creatorAccountId="00000000-0000-0000-0000-000000000111"
        initialResource={null}
        onBack={() => undefined}
        onSaved={() => undefined}
      />
    );

    expect(screen.queryAllByText("Title is required.")).toHaveLength(0);
    expect(screen.queryAllByText("Address is required for on-site pickup.")).toHaveLength(0);

    fireEvent.press(screen.getByRole("button", { name: "Save resource" }));

    expect(screen.getAllByText("Title is required.").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Address is required for on-site pickup.").length).toBeGreaterThan(0);
  });
});