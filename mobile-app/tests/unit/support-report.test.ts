import { print } from "graphql";
import Constants from "expo-constants";
import { Platform } from "react-native";

import { apolloClient } from "../../src/services/graphql/client";
import { createDiagnosticsSnapshot, getSupportAppMetadata } from "../../src/services/support/diagnostics";
import { submitIssueReport } from "../../src/services/support/reportIssue";

jest.mock("../../src/services/graphql/client", () => ({ apolloClient: { mutate: jest.fn() } }));
jest.mock("../../src/services/support/diagnostics", () => ({
  ...jest.requireActual("../../src/services/support/diagnostics"),
  createDiagnosticsSnapshot: jest.fn()
}));

const mutate = apolloClient.mutate as jest.Mock;
const snapshot = createDiagnosticsSnapshot as jest.Mock;
const id = "12345678-1234-1234-1234-123456789abc";

beforeEach(() => {
  jest.resetAllMocks();
  snapshot.mockReturnValue({
    timestamp: "2026-11-22T00:00:00.000Z",
    platform: "ios",
    osVersion: "18",
    appVersion: "1".repeat(90),
    buildNumber: "42",
    deviceLocale: "en",
    secret: "must not leave the device"
  });
});

it("submits only bounded allowlisted diagnostics and resolves with the returned UUID", async () => {
  mutate.mockResolvedValue({ data: { submitSupportReport: { uuid: id } } });
  await expect(submitIssueReport({ summary: "  Help  ", description: " Details  " })).resolves.toBe(id);
  const { mutation, variables } = mutate.mock.calls[0]![0];
  expect(print(mutation)).toContain("submitSupportReport(input: $input)");
  expect(print(mutation)).toContain("uuid");
  expect(variables).toEqual({ input: {
    pSummary: "Help",
    pDescription: "Details",
    pDiagnostics: {
      timestamp: "2026-11-22T00:00:00.000Z", platform: "ios", osVersion: "18",
      appVersion: "1".repeat(64), buildNumber: "42"
    }
  } });
});

it("uses runtime version metadata, passes a null optional description, and does not log the report", async () => {
  const log = jest.spyOn(console, "info").mockImplementation(() => undefined);
  mutate.mockResolvedValue({ data: { submitSupportReport: { uuid: id } } });
  await submitIssueReport({ summary: "private text", description: "  " });
  expect(snapshot).toHaveBeenCalledWith("0.1.0", undefined);
  expect(mutate.mock.calls[0]![0].variables.input.pDescription).toBeNull();
  expect(log).not.toHaveBeenCalled();
  log.mockRestore();
});

it("rejects blank summaries before making a request", async () => {
  await expect(submitIssueReport({ summary: "  " })).rejects.toThrow();
  expect(mutate).not.toHaveBeenCalled();
});

it.each([
  {},
  { data: null },
  { data: { submitSupportReport: null } },
  { data: { submitSupportReport: { uuid: null } } },
  { data: { submitSupportReport: { uuid: "not-a-uuid" } } },
  { data: { submitSupportReport: { uuid: id } }, error: new Error("GraphQL failure") }
])("does not report success without an unambiguous backend confirmation: %p", async result => {
  mutate.mockResolvedValue(result);
  await expect(submitIssueReport({ summary: "Help" })).rejects.toThrow();
});

it.each(["network failure", "unauthenticated", "GraphQL failure"])("propagates %s", async message => {
  mutate.mockRejectedValue(new Error(message));
  await expect(submitIssueReport({ summary: "Help" })).rejects.toThrow(message);
});

it("uses native build metadata first and falls back to the manifest or explicit props", () => {
  const originalOS = Platform.OS;
  const originalPlatform = Constants.platform;
  const originalConfig = Constants.expoConfig;
  try {
    Object.defineProperty(Platform, "OS", { configurable: true, value: "ios" });
    Object.defineProperty(Constants, "platform", { configurable: true, value: { ios: { buildNumber: "99" } } });
    Object.defineProperty(Constants, "expoConfig", { configurable: true, value: { version: "2.0", ios: { buildNumber: "88" }, android: { versionCode: 77 } } });
    expect(getSupportAppMetadata()).toEqual({ appVersion: "2.0", buildNumber: "99" });
    expect(getSupportAppMetadata("3.0", "100")).toEqual({ appVersion: "3.0", buildNumber: "100" });
    Object.defineProperty(Platform, "OS", { configurable: true, value: "android" });
    expect(getSupportAppMetadata()).toEqual({ appVersion: "2.0", buildNumber: "77" });
  } finally {
    Object.defineProperty(Platform, "OS", { configurable: true, value: originalOS });
    Object.defineProperty(Constants, "platform", { configurable: true, value: originalPlatform });
    Object.defineProperty(Constants, "expoConfig", { configurable: true, value: originalConfig });
  }
});