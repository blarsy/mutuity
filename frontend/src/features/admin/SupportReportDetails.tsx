import { Box, Stack, Typography } from "@mui/material";

function displayText(value: unknown) {
  return typeof value === "string" && value.trim() ? value : "-";
}

function displayDiagnostics(value: unknown) {
  if (value == null) return "-";
  if (typeof value === "string") return value || "-";
  try {
    return JSON.stringify(value, null, 2) ?? "-";
  } catch {
    return "Unable to display diagnostics.";
  }
}

function Detail({ label, value, monospace = false }: { label: string; value: string; monospace?: boolean }) {
  return (
    <Box>
      <Typography variant="subtitle2">{label}</Typography>
      <Typography component="div" variant="body2" sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", fontFamily: monospace ? "monospace" : undefined }}>
        {value}
      </Typography>
    </Box>
  );
}

/** All report content is untrusted and deliberately rendered as text, never HTML. */
export function SupportReportDetails({ report }: { report: Record<string, unknown> }) {
  const createdAt = displayText(report.createdAt);
  const date = new Date(createdAt);

  return (
    <Stack spacing={2}>
      <Detail label="Report ID" value={displayText(report.id)} />
      <Detail label="Created" value={Number.isNaN(date.getTime()) ? createdAt : date.toLocaleString()} />
      <Detail label="Account" value={displayText(report.accountName)} />
      <Detail label="Account ID" value={displayText(report.accountId)} />
      <Detail label="Summary" value={displayText(report.summary)} />
      <Detail label="Description" value={displayText(report.description)} />
      <Detail label="Diagnostics" value={displayDiagnostics(report.diagnostics)} monospace />
    </Stack>
  );
}