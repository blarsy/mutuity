import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { Box, ButtonBase, Card, CardContent, IconButton, Stack, Typography } from "@mui/material";
import type { MouseEvent, ReactNode } from "react";
import { useState } from "react";

import { ListingHeader } from "./ListingHeader";

import { RichTextContent } from "../../components/richText/RichTextContent";
import { ZoomableImage } from "../../components/ZoomableImage";

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
  const images = (imageUrls ?? []).filter((url): url is string => Boolean(url && url.trim()));
  const [imageIndex, setImageIndex] = useState(0);
  const currentImage = images[imageIndex] ?? null;

  const prevImage = (event: MouseEvent) => {
    event.stopPropagation();
    setImageIndex(index => Math.max(0, index - 1));
  };

  const nextImage = (event: MouseEvent) => {
    event.stopPropagation();
    setImageIndex(index => Math.min(images.length - 1, index + 1));
  };

  return (
    <Card data-testid="need-card" sx={{ display: "flex", flexDirection: "column", height: "100%" }} variant="outlined">
      <ListingHeader
        creatorImageUrl={creatorImageUrl}
        creatorName={creatorName}
        expiresAt={expiresAt}
        expiresLabel="Expires"
        listingTitle={title}
        noDateLabel="No expiry set"
        noImageLabel="No image"
        onCreatorClick={onCreatorClick}
        thumbnailAlt={title}
        thumbnailUrl={images[0] ?? null}
      />

      <Box
        sx={{
          mt: 1,
          mx: 2,
          position: "relative",
          width: "calc(100% - 32px)",
          "&::before": { content: '""', display: "block", paddingTop: "100%" },
        }}
      >
        <Box
          sx={{
            alignItems: "center",
            bgcolor: currentImage ? "grey.100" : "grey.50",
            borderRadius: 1,
            bottom: 0,
            color: "text.secondary",
            display: "flex",
            height: "100%",
            justifyContent: "center",
            left: 0,
            overflow: "hidden",
            position: "absolute",
            right: 0,
            top: 0,
            width: "100%",
          }}
        >
          {currentImage ? (
            <ZoomableImage
              alt={title}
              src={currentImage}
              stopPropagation
              sx={{
                display: "block",
                height: "100%",
                objectFit: "cover",
                width: "100%"
              }}
            />
          ) : (
            <Typography variant="body2">No image</Typography>
          )}
        </Box>

        {images.length > 1 && imageIndex > 0 ? (
          <IconButton
            onClick={prevImage}
            size="medium"
            sx={theme => ({
              bgcolor: theme.palette.mode === "dark" ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.95)",
              border: `1px solid ${theme.palette.divider}`,
              color: theme.palette.mode === "dark" ? theme.palette.grey[100] : theme.palette.grey[900],
              bottom: 10,
              left: -18,
              position: "absolute",
              transition: "transform 140ms ease, box-shadow 140ms ease, background-color 140ms ease",
              "&:hover": {
                bgcolor: theme.palette.mode === "dark" ? "rgba(0, 0, 0, 0.92)" : "rgba(255, 255, 255, 1)",
                boxShadow: theme.shadows[4],
                transform: "translateY(-1px) scale(1.08)"
              },
              "&:active": {
                transform: "scale(0.96)"
              }
            })}
          >
            <ArrowBackIosNewIcon fontSize="medium" />
          </IconButton>
        ) : null}

        {images.length > 1 && imageIndex < images.length - 1 ? (
          <IconButton
            onClick={nextImage}
            size="medium"
            sx={theme => ({
              bgcolor: theme.palette.mode === "dark" ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.95)",
              border: `1px solid ${theme.palette.divider}`,
              color: theme.palette.mode === "dark" ? theme.palette.grey[100] : theme.palette.grey[900],
              bottom: 10,
              position: "absolute",
              right: -18,
              transition: "transform 140ms ease, box-shadow 140ms ease, background-color 140ms ease",
              "&:hover": {
                bgcolor: theme.palette.mode === "dark" ? "rgba(0, 0, 0, 0.92)" : "rgba(255, 255, 255, 1)",
                boxShadow: theme.shadows[4],
                transform: "translateY(-1px) scale(1.08)"
              },
              "&:active": {
                transform: "scale(0.96)"
              }
            })}
          >
            <ArrowForwardIosIcon fontSize="medium" />
          </IconButton>
        ) : null}

        {images.length > 1 ? (
          <Stack
            direction="row"
            spacing={0.5}
            sx={{
              bottom: 8,
              justifyContent: "center",
              left: 0,
              pointerEvents: "none",
              position: "absolute",
              right: 0,
            }}
          >
            {images.map((_, index) => (
              <Box
                key={index}
                sx={{
                  bgcolor: index === imageIndex ? "white" : "rgba(255,255,255,0.5)",
                  borderRadius: "50%",
                  height: 6,
                  width: 6,
                }}
              />
            ))}
          </Stack>
        ) : null}
      </Box>

      <ButtonBase onClick={() => onClick?.()} sx={{ alignItems: "stretch", display: "block", flexGrow: 1, textAlign: "left" }}>
        <CardContent>
          <Stack spacing={1.5}>
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
