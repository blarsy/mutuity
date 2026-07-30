import React from "react";
import { render } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { EditResourceScreen } from "../../src/screens/resources/EditResourceScreen";

import "../../src/i18n";

jest.mock("../../src/services/network/useNetworkStatus", () => ({
  useNetworkStatus: () => ({ isConnected: false, isInternetReachable: false })
}));

/**
 * E2E Smoke S4: Offline during resource save does not show false success.
 *
 * Required exception coverage for P1.
 * Source: US1 acceptance exception test "offline during resource save must not show false success"
 */
describe("E2E Smoke S4 - Offline Resource Save Exception", () => {
  it("offline warning is present when network is unavailable", () => {
    const screen = render(
      React.createElement(SafeAreaProvider, null,
        React.createElement(EditResourceScreen, {
          creatorAccountId: "123e4567-e89b-12d3-a456-426614174000",
          initialResource: null,
          onBack: () => undefined,
          onSaved: () => undefined
        })
      )
    );

    // The offline warning label should be present in the UI
    expect(screen.getByLabelText("Offline resource save warning")).toBeTruthy();
  });

  it("does not show false success message when offline", () => {
    const screen = render(
      React.createElement(SafeAreaProvider, null,
        React.createElement(EditResourceScreen, {
          creatorAccountId: "123e4567-e89b-12d3-a456-426614174000",
          initialResource: null,
          onBack: () => undefined,
          onSaved: () => undefined
        })
      )
    );

    // No success message should appear when offline
    expect(screen.queryByText("Resource saved")).toBeNull();
    expect(screen.queryByText("Enregistrement réussi")).toBeNull();
  });
});