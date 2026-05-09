import { Box, ButtonBase, Card, CardContent, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

import { ListingHeader } from "./ListingHeader";

import { RichTextContent } from "../../components/richText/RichTextContent";

type NeedCardProps = {
  title: string;
  creatorName: string;
  creatorImageUrl?: string | null;
  description?: string | null;
  expiresAt?: string | null;
  imageUrls?: string[] | null;
  chips?: ReactNode;
  footer?: ReactNode;
  actions?: ReactNode;
  onClick?: () => void;
  onCreatorClick?: () => void;
};

export function NeedCard({
  title,
  creatorName,
  creatorImageUrl,
  description,
  expiresAt,
  imageUrls,
  chips,
  footer,
  actions,
  onClick,
  onCreatorClick
}: NeedCardProps) {
  const thumbnailUrl = imageUrls?.[0] ?? null;

  return (
    <Card sx={{ display: "flex", flexDirection: "column", height: "100%" }} variant="outlined">
      <ListingHeader
        creatorImageUrl={creatorImageUrl}
        creatorName={creatorName}
        expiresAt={expiresAt}
        expiresLabel="Expires"
        noDateLabel="No expiry set"
        noImageLabel="No image"
        onCreatorClick={onCreatorClick}
        thumbnailAlt={title}
        thumbnailUrl={thumbnailUrl}
      />

      <ButtonBase onClick={() => onClick?.()} sx={{ alignItems: "stretch", display: "block", flexGrow: 1, textAlign: "left" }}>
        <CardContent>
          <Stack spacing={1.5}>
            <Typography gutterBottom variant="h6">
              {title}
            </Typography>

            <Box sx={{ maxHeight: 120, overflow: "hidden" }}>
              <RichTextContent emptyFallback="No description yet." html={description ?? ""} />
            </Box>

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
