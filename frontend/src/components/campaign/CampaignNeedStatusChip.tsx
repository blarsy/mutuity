import { Chip, type ChipProps } from "@mui/material";
import type { CampaignNeedStatus as GeneratedCampaignNeedStatus } from "../../graphql/generated";

export type CampaignNeedStatus = `${GeneratedCampaignNeedStatus}`;

const statusColors = {
  PENDING: "warning",
  ACCEPTED: "success",
  REJECTED: "default",
  SUPERSEDED: "default"
} satisfies Record<CampaignNeedStatus, ChipProps["color"]>;

export function CampaignNeedStatusChip({
  status,
  size = "small"
}: {
  status: CampaignNeedStatus;
  size?: ChipProps["size"];
}) {
  return <Chip color={statusColors[status]} label={status} size={size} />;
}
