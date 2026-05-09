import { Box, ButtonBase, Chip, Stack, Typography } from "@mui/material";

import { AvatarIconButton } from "./AvatarIconButton";

type ListingHeaderProps = {
  creatorName: string;
  creatorImageUrl?: string | null;
  expiresLabel: string;
  noDateLabel: string;
  expiresAt?: string | null;
  thumbnailUrl?: string | null;
  thumbnailAlt?: string;
  noImageLabel?: string;
  onCreatorClick?: () => void;
};

function formatExpiry(value: string | null | undefined, noDateLabel: string) {
  if (!value) {
    return noDateLabel;
  }

  return new Date(value).toLocaleDateString();
}

export function ListingHeader({
  creatorName,
  creatorImageUrl,
  expiresLabel,
  noDateLabel,
  expiresAt,
  thumbnailUrl,
  thumbnailAlt,
  noImageLabel,
  onCreatorClick
}: ListingHeaderProps) {
  return (
    <Stack alignItems="center" direction="row" justifyContent="space-between" spacing={1} sx={{ px: 2, pt: 2 }}>
      <Stack alignItems="center" direction="row" spacing={1} sx={{ minWidth: 0 }}>
        <Box
          sx={{
            alignItems: "center",
            bgcolor: thumbnailUrl ? "grey.100" : "grey.50",
            border: theme => `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            color: "text.secondary",
            display: "flex",
            flexShrink: 0,
            height: 40,
            justifyContent: "center",
            overflow: "hidden",
            width: 40
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

        <AvatarIconButton displayName={creatorName} imageUrl={creatorImageUrl} onClick={onCreatorClick} />
        <ButtonBase
          onClick={event => {
            event.stopPropagation();
            onCreatorClick?.();
          }}
          sx={{ borderRadius: 1, maxWidth: 180, typography: "body2" }}
        >
          <Typography color="text.secondary" noWrap variant="body2">
            {creatorName}
          </Typography>
        </ButtonBase>
      </Stack>

      <Chip label={`${expiresLabel}: ${formatExpiry(expiresAt, noDateLabel)}`} size="small" variant="outlined" />
    </Stack>
  );
}
