import { createDiagnosticsSnapshot } from "./diagnostics";

export interface ReportIssuePayload {
  summary: string;
  description?: string;
  appVersion?: string;
}

export function buildIssueReport(payload: ReportIssuePayload): string {
  const snapshot = createDiagnosticsSnapshot(payload.appVersion);
  return [
    `Summary: ${payload.summary}`,
    payload.description ? `Description: ${payload.description}` : null,
    `Timestamp: ${snapshot.timestamp}`,
    `Platform: ${snapshot.platform}`,
    snapshot.appVersion ? `App version: ${snapshot.appVersion}` : null
  ]
    .filter(Boolean)
    .join("\n");
}
