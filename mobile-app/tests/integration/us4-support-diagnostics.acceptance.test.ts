import { buildIssueReport } from "../../src/services/support/reportIssue";
import { createDiagnosticsSnapshot } from "../../src/services/support/diagnostics";

describe("US4 support diagnostics acceptance", () => {
  it("createDiagnosticsSnapshot returns a valid snapshot with timestamp and platform", () => {
    const snapshot = createDiagnosticsSnapshot();

    expect(snapshot.timestamp).toBeTruthy();
    expect(typeof snapshot.platform).toBe("string");
    expect(snapshot.platform.length).toBeGreaterThan(0);
    // Timestamp should be a valid ISO string
    expect(new Date(snapshot.timestamp).toISOString()).toBe(snapshot.timestamp);
  });

  it("createDiagnosticsSnapshot includes appVersion when provided", () => {
    const snapshot = createDiagnosticsSnapshot("1.2.3");

    expect(snapshot.appVersion).toBe("1.2.3");
    expect(snapshot.timestamp).toBeTruthy();
    expect(typeof snapshot.platform).toBe("string");
  });

  it("createDiagnosticsSnapshot omits appVersion when not provided", () => {
    const snapshot = createDiagnosticsSnapshot();

    expect(snapshot.appVersion).toBeUndefined();
  });

  it("buildIssueReport includes summary, timestamp, and platform", () => {
    const report = buildIssueReport({
      summary: "App crashes on startup",
      description: "The app crashes immediately after the splash screen"
    });

    expect(report).toContain("Summary: App crashes on startup");
    expect(report).toContain("Description: The app crashes immediately after the splash screen");
    expect(report).toContain("Timestamp:");
    expect(report).toContain("Platform:");
    expect(report).toContain("OS Version:");
  });

  it("buildIssueReport includes app version when provided", () => {
    const report = buildIssueReport({
      summary: "UI glitch on profile screen",
      appVersion: "1.0.0"
    });

    expect(report).toContain("Summary: UI glitch on profile screen");
    expect(report).toContain("App version: 1.0.0");
    expect(report).toContain("Platform:");
  });

  it("buildIssueReport omits description and app version when not provided", () => {
    const report = buildIssueReport({
      summary: "Notification not received"
    });

    expect(report).toContain("Summary: Notification not received");
    expect(report).not.toContain("Description:");
    expect(report).not.toContain("App version:");
    expect(report).toContain("Timestamp:");
    expect(report).toContain("Platform:");
  });

  it("buildIssueReport produces a non-empty string for any valid input", () => {
    const report = buildIssueReport({ summary: "Test" });
    expect(report.length).toBeGreaterThan(0);
    expect(typeof report).toBe("string");
  });
});