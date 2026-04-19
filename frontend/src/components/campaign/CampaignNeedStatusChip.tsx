import { Chip, type ChipProps } from "@mui/material";

export type CampaignNeedStatus = "PENDING" | "ACCEPTED" | "REJECTED";

function toStatusColor(status: CampaignNeedStatus): ChipProps["color"] {
  if (status === "PENDING") {
    return "warning";
  }

  if (status === "ACCEPTED") {
    return "success";
  }

  return "default";
}

export function CampaignNeedStatusChip({
  status,
  size = "small"
}: {
  status: CampaignNeedStatus;
  size?: ChipProps["size"];
}) {
  return <Chip color={toStatusColor(status)} label={status} size={size} />;
}
