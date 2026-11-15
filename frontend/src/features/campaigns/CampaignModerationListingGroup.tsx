import type { ReactNode } from "react";
import { useId } from "react";
import { Accordion, AccordionDetails, AccordionSummary, Box, Chip, Divider, Stack, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTranslation } from "react-i18next";

import type { CampaignNeedStatus } from "../../components/campaign/CampaignNeedStatusChip";
import { formatPublicDateTime } from "../shared/publicDateTime";

type ModerationListing = {
  status: CampaignNeedStatus;
  submittedAt: string;
  actedAt: string | null;
};

/** Local moderation presentation: never changes the shared, coloured status chip. */
export function CampaignModerationListingGroup<T extends ModerationListing>({
  items, rejectedLabel, getKey, renderCard, renderActions
}: {
  items: readonly T[];
  rejectedLabel: string;
  getKey: (item: T) => string;
  renderCard: (item: T) => ReactNode;
  renderActions: (item: T) => ReactNode;
}) {
  const { t, i18n } = useTranslation("campaigns");
  const id = useId();
  const lastAction = (item: T) => item.actedAt ?? item.submittedAt;
  const timestamp = (item: T) => Date.parse(lastAction(item)) || 0;
  const sorted = [...items].sort((a, b) => timestamp(b) - timestamp(a) || getKey(a).localeCompare(getKey(b)));
  const active = sorted.filter(item => item.status === "PENDING" || item.status === "ACCEPTED");
  const rejected = sorted.filter(item => item.status === "REJECTED");

  const rows = (list: T[]) => (
    <Stack divider={<Divider />} spacing={3}>
      {list.map(item => (
        <Box component="article" key={getKey(item)} sx={{ width: "100%", maxWidth: 480 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 1 }}>
            <Chip label={t(`listingLifecycle.status.${item.status}`)} size="small" variant="outlined"
              sx={{ bgcolor: "transparent", borderColor: "divider", color: "text.secondary" }} />
            <Typography variant="caption" color="text.secondary">
              {t("moderationListings.lastAction", { date: formatPublicDateTime(lastAction(item), i18n.language) })}
            </Typography>
          </Stack>
          {renderCard(item)}
          {item.status === "PENDING" ? <Box sx={{ mt: 2 }}>{renderActions(item)}</Box> : null}
        </Box>
      ))}
    </Stack>
  );

  return (
    <Stack spacing={3}>
      {rows(active)}
      {rejected.length ? (
        <Accordion defaultExpanded={false} TransitionProps={{ unmountOnExit: true }} disableGutters elevation={0}
          sx={{ borderTop: 1, borderColor: "divider", "&::before": { display: "none" } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} id={`${id}-summary`} aria-controls={`${id}-content`}>
            <Typography>{rejectedLabel} ({rejected.length})</Typography>
          </AccordionSummary>
          <AccordionDetails id={`${id}-content`}>{rows(rejected)}</AccordionDetails>
        </Accordion>
      ) : null}
    </Stack>
  );
}