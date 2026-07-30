import React from "react";
import { render, waitFor } from "@testing-library/react-native";

import { UpdateRequiredScreen } from "../../src/screens/system/UpdateRequiredScreen";
import { getAppVersionStatus, MINIMUM_SUPPORTED_APP_VERSION } from "../../src/services/app/version";

describe("US4 update-required gate acceptance", () => {
  it("renders update-required screen with alert role", async () => {
    const screen = render(React.createElement(UpdateRequiredScreen, {}));

    await waitFor(() => {
      expect(screen.getByText("Update required")).toBeTruthy();
      expect(screen.getByText("Please update the app to continue.")).toBeTruthy();
    });

    // The alert role ensures screen readers announce this as critical
    const alertElement = screen.getByRole("alert");
    expect(alertElement).toBeTruthy();
  });

  it("renders dismiss button when onDismiss is provided", async () => {
    const mockDismiss = jest.fn();
    const screen = render(
      React.createElement(UpdateRequiredScreen, { onDismiss: mockDismiss })
    );

    await waitFor(() => {
      expect(screen.getByText("Dismiss")).toBeTruthy();
    });
  });

  it("does not render dismiss button when onDismiss is not provided", async () => {
    const screen = render(React.createElement(UpdateRequiredScreen, {}));

    await waitFor(() => {
      expect(screen.queryByText("Dismiss")).toBeNull();
    });
  });

  it("getAppVersionStatus returns updateRequired false when current >= minimum", () => {
    const status = getAppVersionStatus("1.0.0");
    expect(status.updateRequired).toBe(false);
    expect(status.currentVersion).toBe("1.0.0");
    expect(status.minimumVersion).toBe(MINIMUM_SUPPORTED_APP_VERSION);
  });

  it("getAppVersionStatus returns updateRequired true when current < minimum", () => {
    const status = getAppVersionStatus("0.0.1");
    expect(status.updateRequired).toBe(true);
    expect(status.currentVersion).toBe("0.0.1");
    expect(status.minimumVersion).toBe(MINIMUM_SUPPORTED_APP_VERSION);
  });

  it("getAppVersionStatus returns updateRequired false when current equals minimum", () => {
    const status = getAppVersionStatus(MINIMUM_SUPPORTED_APP_VERSION);
    expect(status.updateRequired).toBe(false);
  });
});