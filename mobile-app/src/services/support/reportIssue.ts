import { createDiagnosticsSnapshot, formatDiagnosticsForDisplay } from "./diagnostics";

export interface ReportIssuePayload {
  summary: string;
  description?: string;
  appVersion?: string;
  buildNumber?: string;
}

export function buildIssueReport(payload: ReportIssuePayload): string {
  const snapshot = createDiagnosticsSnapshot(payload.appVersion, payload.buildNumber);
  return [
    `Summary: ${payload.summary}`,
    payload.description ? `Description: ${payload.description}` : null,
    formatDiagnosticsForDisplay(snapshot)
  ]
    .filter(Boolean)
    .join("\n");
}

export async function submitIssueReport(payload: ReportIssuePayload): Promise<{ success: boolean }> {
  const report = buildIssueReport(payload);

  try {
    // In production, this would POST to a support endpoint.
    // For now, we log the report and return success.
    console.info("[support:report]", report);
    return { success: true };
  } catch {
    return { success: false };
  }
}
