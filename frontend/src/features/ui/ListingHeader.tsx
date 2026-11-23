import NotificationImportantIcon from "@mui/icons-material/NotificationImportant";
import { Box, ButtonBase, Chip, Stack, Typography } from "@mui/material";
import type { MouseEvent, ReactNode } from "react";
import { useEffect, useState } from "react";

import { AvatarIconButton } from "./AvatarIconButton";

type ListingHeaderProps = {
  creatorName: string;
  listingTitle: string;
  creatorImageUrl?: string | null;
  expiresLabel: string;
  noDateLabel: string;
  expiresAt?: string | null;
  showExpiry?: boolean;
  expiryWarningLabel?: string;
  endAdornment?: ReactNode;
  thumbnailUrl?: string | null;
  thumbnailAlt?: string;
  noImageLabel?: string;
  showCreatorAvatar?: boolean;
  onCreatorClick?: () => void;
  onListingClick?: () => void;
};

function formatExpiry(value: string | null | undefined, noDateLabel: string) {
  if (!value) {
    return noDateLabel;
  }

  return new Date(value).toLocaleDateString();
}

const EXPIRY_WARNING_WINDOW_MS = 72 * 60 * 60 * 1000;
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

function ExpiryWarning({ expiresAt, label }: { expiresAt?: string | null; label: string }) {
  const [now, setNow] = useState(() => Date.now());
  const expiry = expiresAt ? new Date(expiresAt).getTime() : NaN;
  const remaining = expiry - now;

  useEffect(() => {
    if (!Number.isFinite(expiry)) return;
    const remainingNow = expiry - Date.now();
    if (remainingNow < 0) return;
    const untilChange = remainingNow > EXPIRY_WARNING_WINDOW_MS
      ? remainingNow - EXPIRY_WARNING_WINDOW_MS
      : remainingNow + 1;
    const timer = setTimeout(() => setNow(Date.now()), Math.min(untilChange, MAX_TIMEOUT_MS));
    return () => clearTimeout(timer);
  }, [expiry, now]);

  if (!Number.isFinite(expiry) || remaining < 0 || remaining > EXPIRY_WARNING_WINDOW_MS) return null;
  return <NotificationImportantIcon aria-label={label} color="warning" sx={{ flexShrink: 0, ml: "auto" }} titleAccess={label} />;
}

export function ListingHeader({
  creatorName,
  listingTitle,
  creatorImageUrl,
  expiresLabel,
  noDateLabel,
  expiresAt,
  showExpiry = true,
  expiryWarningLabel,
  endAdornment,
  thumbnailUrl,
  thumbnailAlt,
  noImageLabel,
  showCreatorAvatar = true,
  onCreatorClick,
  onListingClick
}: ListingHeaderProps) {
  return (
    <Stack alignItems="center" direction="row" justifyContent="space-between" spacing={1} sx={{ px: 2, pt: 2 }}>
      <Stack alignItems="center" direction="row" spacing={1} sx={{ minWidth: 0 }}>
        <Box
          sx={{
            flexShrink: 0,
            height: { xs: 44, sm: 48 },
            position: "relative",
            width: { xs: 44, sm: 48 }
          }}
        >
          <ButtonBase
            component={onListingClick ? "button" : "div"}
            disabled={!onListingClick}
            aria-label={onListingClick ? listingTitle : undefined}
            onClick={onListingClick ? (event: MouseEvent<HTMLElement>) => {
              event.stopPropagation();
              onListingClick();
            } : undefined}
            sx={{
              alignItems: "center",
              bgcolor: theme => theme.palette.mode === "dark" ? "grey.900" : "grey.100",
              border: theme => `1px solid ${theme.palette.divider}`,
              borderRadius: 1.5,
              boxShadow: theme => theme.shadows[1],
              color: "text.secondary",
              cursor: onListingClick ? "pointer" : "default",
              display: "flex",
              height: { xs: 34, sm: 38 },
              justifyContent: "center",
              left: 0,
              overflow: "hidden",
              position: "absolute",
              top: 0,
              width: { xs: 34, sm: 38 }
            }}
          >
            {thumbnailUrl ? (
              <Box
                component="img"
                alt={thumbnailAlt ?? "Listing thumbnail"}
                src={thumbnailUrl}
                sx={{ display: "block", height: "100%", objectFit: "cover", width: "100%" }}
              />
            ) : (
              <Typography color="text.secondary" sx={{ px: 0.5, textAlign: "center" }} variant="caption">
                {noImageLabel ?? "No image"}
              </Typography>
            )}
          </ButtonBase>
          {showCreatorAvatar ? (
            <AvatarIconButton
              displayName={creatorName}
              imageUrl={creatorImageUrl}
              onClick={event => {
                event.stopPropagation();
                onCreatorClick?.();
              }}
              size={24}
              sx={{
                bgcolor: "background.paper",
                border: theme => `2px solid ${theme.palette.background.paper}`,
                borderRadius: "50%",
                bottom: 0,
                boxShadow: theme => theme.shadows[2],
                position: "absolute",
                right: 0
              }}
            />
          ) : null}
        </Box>

        <Stack spacing={0.25} sx={{ minWidth: 0 }}>
          <ButtonBase
            onClick={event => {
              event.stopPropagation();
              onCreatorClick?.();
            }}
            sx={{ borderRadius: 1, justifyContent: "flex-start", maxWidth: 220, typography: "body2" }}
          >
            <Typography color="text.secondary" noWrap variant="body2">
              {creatorName}
            </Typography>
          </ButtonBase>
          <ButtonBase
            component={onListingClick ? "button" : "div"}
            disabled={!onListingClick}
            onClick={onListingClick ? (event: MouseEvent<HTMLElement>) => {
              event.stopPropagation();
              onListingClick();
            } : undefined}
            sx={{
              borderRadius: 1,
              cursor: onListingClick ? "pointer" : "default",
              justifyContent: "flex-start",
              maxWidth: 240,
              textAlign: "left"
            }}
          >
            <Typography noWrap sx={{ fontWeight: 600, maxWidth: 240 }} variant="subtitle2">
              {listingTitle}
            </Typography>
          </ButtonBase>
        </Stack>
      </Stack>

      {endAdornment}
      {showExpiry ? expiryWarningLabel ? (
        <ExpiryWarning key={expiresAt ?? ""} expiresAt={expiresAt} label={expiryWarningLabel} />
      ) : <Chip label={`${expiresLabel}: ${formatExpiry(expiresAt, noDateLabel)}`} size="small" variant="outlined" /> : null}
    </Stack>
  );
}
