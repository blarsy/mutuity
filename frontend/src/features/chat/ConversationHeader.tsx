import NextLink from "next/link";
import { Box, IconButton, Link, Tooltip, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { conversationContextUrl } from "./chatRouting";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConversationKind = "need" | "resource";

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Shared header for the conversation thread panel.
 *
 * Renders a back button (mobile only), the context title as a navigation link
 * when contextId is available, and a localised kind label beneath it.
 */
export function ConversationHeader({
  kind,
  contextId,
  contextTitle,
  onBack,
  t
}: {
  kind: ConversationKind;
  contextId: string | null;
  contextTitle: string | null;
  onBack?: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const contextUrl = contextId ? conversationContextUrl(kind, contextId) : null;

  return (
    <Box sx={{ alignItems: "center", display: "flex", gap: 1, minHeight: 56, px: 1.5, py: 1 }}>
      {onBack && (
        <Tooltip title={t("thread.back")}>
          <IconButton onClick={onBack} size="small" sx={{ display: { sm: "none" } }}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
      )}
      <Box sx={{ flex: 1, overflow: "hidden" }}>
        {contextTitle && contextUrl ? (
          <Link
            color="text.primary"
            component={NextLink}
            href={contextUrl}
            noWrap
            sx={{ display: "block", fontWeight: 600 }}
            underline="hover"
            variant="subtitle2"
          >
            {contextTitle}
          </Link>
        ) : (
          <Typography fontWeight={600} noWrap variant="subtitle2">
            {contextTitle ?? t("thread.loadingHeader")}
          </Typography>
        )}
        <Typography color="text.secondary" noWrap variant="caption">
          {t("kind." + kind)}
        </Typography>
      </Box>
    </Box>
  );
}
