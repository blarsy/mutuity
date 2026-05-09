import NextLink from "next/link";
import { Box, IconButton, Link, Tooltip, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { conversationContextUrl, conversationParticipantUrl } from "./chatRouting";
import { AvatarIconButton } from "../ui/AvatarIconButton";

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
  listingThumbnailUrl,
  otherAccountId,
  otherAccountAvatarUrl,
  otherAccountDisplayName,
  onBack,
  t
}: {
  kind: ConversationKind;
  contextId: string | null;
  contextTitle: string | null;
  listingThumbnailUrl?: string | null;
  otherAccountId?: string | null;
  otherAccountAvatarUrl?: string | null;
  otherAccountDisplayName?: string | null;
  onBack?: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const contextUrl = contextId ? conversationContextUrl(kind, contextId) : null;
  const participantUrl = otherAccountId ? conversationParticipantUrl(otherAccountId) : null;

  return (
    <Box sx={{ alignItems: "center", display: "flex", gap: 1, minHeight: 56, px: 1.5, py: 1 }}>
      {onBack && (
        <Tooltip title={t("thread.back")}>
          <IconButton onClick={onBack} size="small" sx={{ display: { sm: "none" } }}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
      )}
      <Box
        sx={{
          alignItems: "center",
          bgcolor: listingThumbnailUrl ? "grey.100" : "grey.50",
          border: theme => `1px solid ${theme.palette.divider}`,
          borderRadius: 1,
          color: "text.secondary",
          display: "flex",
          flexShrink: 0,
          height: 32,
          justifyContent: "center",
          overflow: "hidden",
          width: 32
        }}
      >
        {listingThumbnailUrl ? (
          <Box
            component="img"
            alt={contextTitle ?? "Listing"}
            src={listingThumbnailUrl}
            sx={{ display: "block", height: "100%", objectFit: "cover", width: "100%" }}
          />
        ) : (
          <Typography variant="caption">•</Typography>
        )}
      </Box>

      {otherAccountDisplayName ? (
        <AvatarIconButton
          displayName={otherAccountDisplayName}
          imageUrl={otherAccountAvatarUrl ?? null}
          onClick={undefined}
        />
      ) : null}

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
        <Box sx={{ alignItems: "center", display: "flex", gap: 0.5 }}>
          <Typography color="text.secondary" noWrap variant="caption">
            {t("kind." + kind)}
          </Typography>
          {participantUrl && otherAccountDisplayName && (
            <>
              <Typography color="text.secondary" variant="caption">{"·"}</Typography>
              <Link
                color="text.secondary"
                component={NextLink}
                href={participantUrl}
                noWrap
                underline="hover"
                variant="caption"
              >
                {otherAccountDisplayName}
              </Link>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
