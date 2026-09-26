import React from "react";
import { render, waitFor } from "@testing-library/react-native";

import { UpdateRequiredScreen } from "../../src/screens/system/UpdateRequiredScreen";
import { getAppVersionStatus, MINIMUM_SUPPORTED_APP_VERSION } from "../../src/services/app/version";
import { minimumVersionForPlatform } from "../../src/services/app/versionGate";

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
    const status = getAppVersionStatus("1.0.0", MINIMUM_SUPPORTED_APP_VERSION);
    expect(status.updateRequired).toBe(false);
    expect(status.currentVersion).toBe("1.0.0");
    expect(status.minimumVersion).toBe(MINIMUM_SUPPORTED_APP_VERSION);
  });

  it("getAppVersionStatus returns updateRequired true when current < minimum", () => {
    const status = getAppVersionStatus("0.0.1", MINIMUM_SUPPORTED_APP_VERSION);
    expect(status.updateRequired).toBe(true);
    expect(status.currentVersion).toBe("0.0.1");
    expect(status.minimumVersion).toBe(MINIMUM_SUPPORTED_APP_VERSION);
  });

  it("getAppVersionStatus returns updateRequired false when current equals minimum", () => {
    const status = getAppVersionStatus(MINIMUM_SUPPORTED_APP_VERSION, MINIMUM_SUPPORTED_APP_VERSION);
    expect(status.updateRequired).toBe(false);
  });

  it("getAppVersionStatus compares against a server-provided minimum", () => {
    // Simulates the backend raising the floor to 1.2.0 after a breaking change.
    const status = getAppVersionStatus("1.0.0", "1.2.0");
    expect(status.updateRequired).toBe(true);
    expect(status.minimumVersion).toBe("1.2.0");
  });

  it("getAppVersionStatus defaults to the bundled floor when no minimum is given", () => {
    expect(getAppVersionStatus("0.0.1").updateRequired).toBe(true);
    expect(getAppVersionStatus("0.1.0").updateRequired).toBe(false);
  });

  it("minimumVersionForPlatform selects the correct platform floor", () => {
    const floor = { minIosSemver: "1.5.0", minAndroidSemver: "1.3.0" };
    expect(minimumVersionForPlatform(floor, "ios")).toBe("1.5.0");
    expect(minimumVersionForPlatform(floor, "android")).toBe("1.3.0");
  });
});