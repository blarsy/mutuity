import { Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { getDisplayIntensityLabel } from "../../features/shared/displayIntensity";
import { formatSiteDateTime } from "../../features/shared/publicDateTime";

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
  const { t, i18n } = useTranslation("needs");
  const translatedIntensity = intensity ? getDisplayIntensityLabel(intensity as Parameters<typeof getDisplayIntensityLabel>[0], t) : t("summaryFacts.na");

  return (
    <>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2 }}>
        <Typography variant="body2">{t("summaryFacts.location")}: {location ?? t("summaryFacts.na")}</Typography>
        <Typography variant="body2">{t("summaryFacts.intensity")}: {translatedIntensity}</Typography>
        <Typography variant="body2">{t("summaryFacts.proposedTopes")}: {proposedTopesAmount ?? t("summaryFacts.na")}</Typography>
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 1 }}>
        <Typography variant="caption">{t("summaryFacts.joined")}: {formatSiteDateTime(joinedAt, i18n?.language ?? "en")}</Typography>
        {triagedAt ? <Typography variant="caption">{t("summaryFacts.triaged")}: {formatSiteDateTime(triagedAt, i18n?.language ?? "en")}</Typography> : null}
      </Stack>
    </>
  );
}
