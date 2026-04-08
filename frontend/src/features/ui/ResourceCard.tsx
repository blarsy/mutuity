import { Box, ButtonBase, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

import { AvatarIconButton } from "./AvatarIconButton";

type ResourceCardProps = {
  title: string;
  creatorName: string;
  creatorImageUrl?: string | null;
  description?: string | null;
  expiresAt?: string | null;
  imageUrl?: string | null;
  location?: string | null;
  chips?: ReactNode;
  footer?: ReactNode;
  actions?: ReactNode;
  onClick?: () => void;
  onCreatorClick?: () => void;
  onImageClick?: () => void;
};

function truncateDescription(value?: string | null, maxLength = 100) {
  if (!value) {
    return "No description yet.";
  }

  const normalized = value.trim().replace(/\s+/g, " ");

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}…`;
}

function formatExpiry(value?: string | null) {
  if (!value) {
    return "Permanent";
  }

  return new Date(value).toLocaleDateString();
}

export function ResourceCard({
  title,
  creatorName,
  creatorImageUrl,
  description,
  expiresAt,
  imageUrl,
  location,
  chips,
  footer,
  actions,
  onClick,
  onCreatorClick,
  onImageClick
}: ResourceCardProps) {
  return (
    <Card sx={{ display: "flex", flexDirection: "column", height: "100%" }} variant="outlined">
      <Stack alignItems="center" direction="row" justifyContent="space-between" spacing={1} sx={{ px: 2, pt: 2 }}>
        <Stack alignItems="center" direction="row" spacing={1}>
          <AvatarIconButton displayName={creatorName} imageUrl={creatorImageUrl} onClick={onCreatorClick} />
          <ButtonBase
            onClick={event => {
              event.stopPropagation();
              onCreatorClick?.();
            }}
            sx={{ borderRadius: 1, typography: "body2" }}
          >
            <Typography color="text.secondary" variant="body2">
              {creatorName}
            </Typography>
          </ButtonBase>
        </Stack>

        <Chip label={`Expires: ${formatExpiry(expiresAt)}`} size="small" variant="outlined" />
      </Stack>

      <ButtonBase
        disabled={!onImageClick}
        onClick={() => onImageClick?.()}
        sx={{ display: "block", mt: 1, textAlign: "left" }}
      >
        <Box
          sx={{
            alignItems: "center",
            bgcolor: imageUrl ? "grey.100" : "grey.50",
            backgroundImage: imageUrl ? `url(${imageUrl})` : "none",
            backgroundPosition: "center",
            backgroundSize: "cover",
            borderRadius: 1,
            color: "text.secondary",
            display: "flex",
            height: 140,
            justifyContent: "center",
            mx: 2,
            overflow: "hidden"
          }}
        >
          {!imageUrl ? <Typography variant="body2">No image yet</Typography> : null}
        </Box>
      </ButtonBase>

      <ButtonBase
        onClick={() => onClick?.()}
        sx={{ alignItems: "stretch", display: "block", flexGrow: 1, textAlign: "left" }}
      >
        <CardContent>
          <Stack spacing={1.5}>
            <Box>
              <Typography gutterBottom variant="h6">
                {title}
              </Typography>
              {location ? (
                <Typography color="text.secondary" variant="body2">
                  {location}
                </Typography>
              ) : null}
            </Box>

            <Typography color="text.secondary" variant="body2">
              {truncateDescription(description)}
            </Typography>

            {chips ? (
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {chips}
              </Stack>
            ) : null}

            {footer}
          </Stack>
        </CardContent>
      </ButtonBase>

      {actions ? <Box sx={{ px: 2, pb: 2 }}>{actions}</Box> : null}
    </Card>
  );
}
