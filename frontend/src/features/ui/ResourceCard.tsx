import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { Box, ButtonBase, Card, CardContent, Chip, IconButton, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { RichTextContent } from "../../components/richText/RichTextContent";
import { AvatarIconButton } from "./AvatarIconButton";

type ResourceCardProps = {
  title: string;
  creatorName: string;
  creatorImageUrl?: string | null;
  description?: string | null;
  expiresAt?: string | null;
  /** All image URLs — first is shown by default, left/right arrows browse the rest */
  imageUrls?: string[] | null;
  location?: string | null;
  chips?: ReactNode;
  footer?: ReactNode;
  actions?: ReactNode;
  onClick?: () => void;
  onCreatorClick?: () => void;
};

function formatExpiry(value: string | null | undefined, noDateLabel: string) {
  if (!value) {
    return noDateLabel;
  }

  return new Date(value).toLocaleDateString();
}

export function ResourceCard({
  title,
  creatorName,
  creatorImageUrl,
  description,
  expiresAt,
  imageUrls,
  location,
  chips,
  footer,
  actions,
  onClick,
  onCreatorClick,
}: ResourceCardProps) {
  const { t } = useTranslation("resources");
  const images = imageUrls ?? [];
  const [imageIndex, setImageIndex] = useState(0);
  const currentImage = images[imageIndex] ?? null;

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageIndex((i) => Math.max(0, i - 1));
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageIndex((i) => Math.min(images.length - 1, i + 1));
  };

  return (
    <Card
      sx={(theme) => ({
        display: "flex",
        flexDirection: "column",
        // 400–500 px wide, filling available space, max 500 px
        flex: "0 1 460px",
        minWidth: 280,
        maxWidth: 500,
        [theme.breakpoints.down("sm")]: { flex: "0 1 100%", maxWidth: "100%" },
      })}
      variant="outlined"
    >
      {/* Header: creator + expiry */}
      <Stack
        alignItems="center"
        direction="row"
        justifyContent="space-between"
        spacing={1}
        sx={{ px: 2, pt: 2 }}
      >
        <Stack alignItems="center" direction="row" spacing={1}>
          <AvatarIconButton
            displayName={creatorName}
            imageUrl={creatorImageUrl}
            onClick={onCreatorClick}
          />
          <ButtonBase
            onClick={(e) => {
              e.stopPropagation();
              onCreatorClick?.();
            }}
            sx={{ borderRadius: 1, typography: "body2" }}
          >
            <Typography color="text.secondary" variant="body2">
              {creatorName}
            </Typography>
          </ButtonBase>
        </Stack>

        <Chip
          label={`${t("card.expires")}: ${formatExpiry(expiresAt, t("card.permanent"))}`}
          size="small"
          variant="outlined"
        />
      </Stack>

      {/* Square image gallery */}
      <Box
        sx={{
          mt: 1,
          mx: 2,
          position: "relative",
          // Enforce 1:1 aspect ratio
          width: "calc(100% - 32px)",
          "&::before": { content: '""', display: "block", paddingTop: "100%" },
        }}
      >
        {/* Image or placeholder */}
        <ButtonBase
          disabled={!onClick}
          onClick={() => onClick?.()}
          sx={{
            bottom: 0,
            left: 0,
            position: "absolute",
            right: 0,
            top: 0,
            width: "100%",
          }}
        >
          <Box
            sx={{
              alignItems: "center",
              bgcolor: currentImage ? "grey.100" : "grey.50",
              backgroundImage: currentImage ? `url(${currentImage})` : "none",
              backgroundPosition: "center",
              backgroundSize: "cover",
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
            {!currentImage ? (
              <Typography variant="body2">{t("card.noImageYet")}</Typography>
            ) : null}
          </Box>
        </ButtonBase>

        {/* Left arrow */}
        {images.length > 1 && imageIndex > 0 ? (
          <IconButton
            onClick={prevImage}
            size="small"
            sx={{
              bgcolor: "rgba(255,255,255,0.8)",
              bottom: 8,
              left: 8,
              position: "absolute",
              "&:hover": { bgcolor: "rgba(255,255,255,0.95)" },
            }}
          >
            <ArrowBackIosNewIcon fontSize="small" />
          </IconButton>
        ) : null}

        {/* Right arrow */}
        {images.length > 1 && imageIndex < images.length - 1 ? (
          <IconButton
            onClick={nextImage}
            size="small"
            sx={{
              bgcolor: "rgba(255,255,255,0.8)",
              bottom: 8,
              position: "absolute",
              right: 8,
              "&:hover": { bgcolor: "rgba(255,255,255,0.95)" },
            }}
          >
            <ArrowForwardIosIcon fontSize="small" />
          </IconButton>
        ) : null}

        {/* Dot indicators */}
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
            {images.map((_, i) => (
              <Box
                key={i}
                sx={{
                  bgcolor: i === imageIndex ? "white" : "rgba(255,255,255,0.5)",
                  borderRadius: "50%",
                  height: 6,
                  width: 6,
                }}
              />
            ))}
          </Stack>
        ) : null}
      </Box>

      {/* Text content */}
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

            <Box sx={{ maxHeight: 120, overflow: "hidden" }}>
              <RichTextContent
                emptyFallback={t("card.noDescriptionYet")}
                html={description ?? ""}
              />
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
