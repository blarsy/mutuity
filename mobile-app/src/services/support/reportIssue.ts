import { apolloClient } from "../graphql/client";
import { SubmitSupportReportDocument } from "../graphql/operations.generated";
import { createDiagnosticsSnapshot, formatDiagnosticsForDisplay, getSupportAppMetadata } from "./diagnostics";

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

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DIAGNOSTIC_VALUE_LIMIT = 64;

export async function submitIssueReport(payload: ReportIssuePayload): Promise<string> {
  const summary = payload.summary.trim();
  if (!summary) throw new Error("A summary is required");

  const metadata = getSupportAppMetadata(payload.appVersion, payload.buildNumber);
  const snapshot = createDiagnosticsSnapshot(metadata.appVersion, metadata.buildNumber);
  // Explicit allowlist and per-value limits prevent accidental diagnostic data leaks.
  const diagnostics: Record<string, string> = {};
  for (const [key, value] of Object.entries({
    timestamp: snapshot.timestamp,
    platform: snapshot.platform,
    osVersion: snapshot.osVersion,
    appVersion: snapshot.appVersion,
    buildNumber: snapshot.buildNumber
  })) {
    if (typeof value === "string" && value.trim()) {
      diagnostics[key] = value.trim().slice(0, DIAGNOSTIC_VALUE_LIMIT);
    }
  }

  const result = await apolloClient.mutate({
    mutation: SubmitSupportReportDocument,
    variables: {
      input: {
        pSummary: summary,
        pDescription: payload.description?.trim() || null,
        pDiagnostics: diagnostics
      }
    }
  });
  const id = result.data?.submitSupportReport?.uuid;
  if (result.error || typeof id !== "string" || !UUID_PATTERN.test(id)) {
    throw new Error("Support report was not confirmed");
  }
  return id;
}
