export interface DiagnosticsSnapshot {
  timestamp: string;
  platform: string;
  appVersion?: string;
}

export function createDiagnosticsSnapshot(appVersion?: string): DiagnosticsSnapshot {
  const snapshot: DiagnosticsSnapshot = {
    timestamp: new Date().toISOString(),
    platform: "mobile"
  };

  if (appVersion) {
    snapshot.appVersion = appVersion;
  }

  return snapshot;
}
