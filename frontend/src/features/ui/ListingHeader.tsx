import { Box, ButtonBase, Chip, Stack, Typography } from "@mui/material";

import { AvatarIconButton } from "./AvatarIconButton";

type ListingHeaderProps = {
  creatorName: string;
  listingTitle: string;
  creatorImageUrl?: string | null;
  expiresLabel: string;
  noDateLabel: string;
  expiresAt?: string | null;
  thumbnailUrl?: string | null;
  thumbnailAlt?: string;
  noImageLabel?: string;
  showCreatorAvatar?: boolean;
  onCreatorClick?: () => void;
  onThumbnailClick?: () => void;
};

function formatExpiry(value: string | null | undefined, noDateLabel: string) {
  if (!value) {
    return noDateLabel;
  }

  return new Date(value).toLocaleDateString();
}

export function ListingHeader({
  creatorName,
  listingTitle,
  creatorImageUrl,
  expiresLabel,
  noDateLabel,
  expiresAt,
  thumbnailUrl,
  thumbnailAlt,
  noImageLabel,
  showCreatorAvatar = true,
  onCreatorClick,
  onThumbnailClick
}: ListingHeaderProps) {
  return (
    <Stack alignItems="center" direction="row" justifyContent="space-between" spacing={1} sx={{ px: 2, pt: 2 }}>
      <Stack alignItems="center" direction="row" spacing={1} sx={{ minWidth: 0 }}>
        <Box
          onClick={event => {
            if (!onThumbnailClick) {
              return;
            }

            event.stopPropagation();
            onThumbnailClick();
          }}
          sx={{
            cursor: onThumbnailClick ? "pointer" : "default",
            flexShrink: 0,
            height: { xs: 44, sm: 48 },
            position: "relative",
            width: { xs: 44, sm: 48 }
          }}
        >
          <Box
            sx={{
              alignItems: "center",
              bgcolor: theme => theme.palette.mode === "dark" ? "grey.900" : "grey.100",
              border: theme => `1px solid ${theme.palette.divider}`,
              borderRadius: 1.5,
              boxShadow: theme => theme.shadows[1],
              color: "text.secondary",
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
          </Box>
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
          <Typography noWrap sx={{ fontWeight: 600, maxWidth: 240 }} variant="subtitle2">
            {listingTitle}
          </Typography>
        </Stack>
      </Stack>

      <Chip label={`${expiresLabel}: ${formatExpiry(expiresAt, noDateLabel)}`} size="small" variant="outlined" />
    </Stack>
  );
}
