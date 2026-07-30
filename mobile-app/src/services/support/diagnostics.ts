import { Platform } from "react-native";

export interface DiagnosticsSnapshot {
  timestamp: string;
  platform: string;
  osVersion: string;
  appVersion?: string;
  buildNumber?: string;
  deviceLocale?: string;
}

export function createDiagnosticsSnapshot(appVersion?: string, buildNumber?: string): DiagnosticsSnapshot {
  const os = typeof Platform.OS === "string" ? Platform.OS : "unknown";
  const version = Platform.Version ? String(Platform.Version) : "unknown";

  const snapshot: DiagnosticsSnapshot = {
    timestamp: new Date().toISOString(),
    platform: os,
    osVersion: version
  };

  if (appVersion) {
    snapshot.appVersion = appVersion;
  }

  if (buildNumber) {
    snapshot.buildNumber = buildNumber;
  }

  return snapshot;
}

export function formatDiagnosticsForDisplay(snapshot: DiagnosticsSnapshot): string {
  const lines = [
    `Timestamp: ${snapshot.timestamp}`,
    `Platform: ${snapshot.platform}`,
    `OS Version: ${snapshot.osVersion}`
  ];

  if (snapshot.appVersion) {
    lines.push(`App version: ${snapshot.appVersion}`);
  }

  if (snapshot.buildNumber) {
    lines.push(`Build: ${snapshot.buildNumber}`);
  }

  if (snapshot.deviceLocale) {
    lines.push(`Locale: ${snapshot.deviceLocale}`);
  }

  return lines.join("\n");
}
