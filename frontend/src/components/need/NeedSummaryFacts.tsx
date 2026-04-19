import { Stack, Typography } from "@mui/material";

export function NeedSummaryFacts({
  location,
  intensity,
  proposedTopesAmount,
  joinedAt,
  triagedAt
}: {
  location?: string | null;
  intensity?: string | null;
  proposedTopesAmount?: number | null;
  joinedAt: string;
  triagedAt?: string | null;
}) {
  return (
    <>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2 }}>
        <Typography variant="body2">Location: {location ?? "N/A"}</Typography>
        <Typography variant="body2">Intensity: {intensity ?? "N/A"}</Typography>
        <Typography variant="body2">Proposed Topes: {proposedTopesAmount ?? "N/A"}</Typography>
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 1 }}>
        <Typography variant="caption">Joined: {new Date(joinedAt).toLocaleString()}</Typography>
        {triagedAt ? <Typography variant="caption">Triaged: {new Date(triagedAt).toLocaleString()}</Typography> : null}
      </Stack>
    </>
  );
}
