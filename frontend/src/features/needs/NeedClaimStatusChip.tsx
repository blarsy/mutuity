import { Chip, Stack, Typography, type ChipProps } from "@mui/material";
import { useTranslation } from "react-i18next";
import { formatSiteDateTime } from "../shared/publicDateTime";

export function formatNeedClaimStatus(status: string) {
  return status.replaceAll("_", " ").toLowerCase();
}

export function buildNeedClaimStatusSummary(
  status: string,
  settledAt: string | null | undefined,
  topesAmount: number | null | undefined,
  locale = "en"
) {
  switch (status) {
    case "SETTLED": {
      const datePart = settledAt ? `Settled on ${formatSiteDateTime(settledAt, locale)}` : "Claim settled";
      return topesAmount && topesAmount > 0 ? `${datePart} • ${topesAmount} Topes recorded` : datePart;
    }
    case "DECLINED":
      return "Another claim was selected for this need.";
    case "EXPIRED":
      return "The need expired before the claim could be fulfilled.";
    case "WITHDRAWN":
      return "This claim was withdrawn.";
    default:
      return null;
  }
}

function toStatusColor(status: string): ChipProps["color"] {
  switch (status) {
    case "OPEN":
      return "primary";
    case "SETTLED":
      return "success";
    case "DECLINED":
      return "warning";
    case "EXPIRED":
      return "default";
    case "WITHDRAWN":
      return "default";
    default:
      return "default";
  }
}

export function NeedClaimStatusChip({
  status,
  settledAt = null,
  topesAmount = null,
  showSummary = true,
  size = "small"
}: {
  status: string;
  settledAt?: string | null;
  topesAmount?: number | null;
  showSummary?: boolean;
  size?: ChipProps["size"];
}) {
  const { i18n } = useTranslation("needs");
  const summary = buildNeedClaimStatusSummary(status, settledAt, topesAmount, i18n?.language ?? "en");
  const chip = <Chip color={toStatusColor(status)} label={formatNeedClaimStatus(status)} size={size} />;

  if (!showSummary || !summary) {
    return chip;
  }

  return (
    <Stack alignItems={{ xs: "flex-start", sm: "flex-end" }} spacing={0.5}>
      {chip}
      <Typography color="text.secondary" variant="caption">
        {summary}
      </Typography>
    </Stack>
  );
}
