import { Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("needs");

  return (
    <>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2 }}>
        <Typography variant="body2">{t("summaryFacts.location")}: {location ?? t("summaryFacts.na")}</Typography>
        <Typography variant="body2">{t("summaryFacts.intensity")}: {intensity ?? t("summaryFacts.na")}</Typography>
        <Typography variant="body2">{t("summaryFacts.proposedTopes")}: {proposedTopesAmount ?? t("summaryFacts.na")}</Typography>
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 1 }}>
        <Typography variant="caption">{t("summaryFacts.joined")}: {new Date(joinedAt).toLocaleString()}</Typography>
        {triagedAt ? <Typography variant="caption">{t("summaryFacts.triaged")}: {new Date(triagedAt).toLocaleString()}</Typography> : null}
      </Stack>
    </>
  );
}
