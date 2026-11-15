import { Alert, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { CampaignListingRelation } from "./campaignListingLifecycle";

export function CampaignListingFeedback({ relation, locked }: {
  relation: CampaignListingRelation | null;
  locked: boolean;
}) {
  const { t, i18n } = useTranslation("campaigns");
  if (!relation) return null;
  const campaign = relation.campaignByCampaignId;
  const date = (value: string) => Number.isFinite(Date.parse(value))
    ? new Date(value).toLocaleString(i18n.language) : "—";
  const dateValue = relation.status === "ACCEPTED" || relation.status === "REJECTED"
    ? relation.actedAt : relation.submittedAt;
  const dateKey = relation.status === "ACCEPTED" ? "listingLifecycle.acceptedAt"
    : relation.status === "REJECTED" ? "listingLifecycle.rejectedAt" : "listingLifecycle.submittedAt";
  return (
    <Alert severity={relation.status === "REJECTED" ? "warning" : "info"}>
      <Stack spacing={0.5}>
        <Typography variant="subtitle2">
          {campaign?.title} — {t(`listingLifecycle.status.${relation.status}`)}
        </Typography>
        {dateValue ? <Typography variant="body2">
          {t(dateKey, { date: date(dateValue) })}
        </Typography> : null}
        {relation.status === "REJECTED" && relation.rejectionNote?.trim() ? <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
          {t("listingLifecycle.feedbackLabel")}: {relation.rejectionNote}
        </Typography> : null}
        {relation.status === "REJECTED" ? <Typography variant="body2">{t("listingLifecycle.saveDoesNotResubmit")}</Typography> : null}
        {locked ? <Typography variant="body2">{t(relation.status === "ACCEPTED"
          ? "listingLifecycle.acceptedLocked" : "listingLifecycle.pendingLocked")}</Typography> : null}
      </Stack>
    </Alert>
  );
}