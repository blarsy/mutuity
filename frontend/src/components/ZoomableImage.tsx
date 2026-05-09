import { useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import CloseIcon from "@mui/icons-material/Close";
import { Box, Dialog, IconButton } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

type ZoomableImageProps = {
  src: string;
  alt: string;
  sx?: SxProps<Theme>;
  stopPropagation?: boolean;
};

export function ZoomableImage({ src, alt, sx, stopPropagation = false }: ZoomableImageProps) {
  const [open, setOpen] = useState(false);

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    if (stopPropagation) {
      event.stopPropagation();
    }
    setOpen(true);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (stopPropagation) {
        event.stopPropagation();
      }
      setOpen(true);
    }
  };

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <Box
        alt={alt}
        aria-label={alt}
        component="img"
        onClick={handleOpen}
        onKeyDown={handleKeyDown}
        role="button"
        src={src}
        sx={{
          cursor: "zoom-in",
          ...sx
        }}
        tabIndex={0}
      />

      <Dialog fullScreen onClose={() => setOpen(false)} open={open}>
        <Box
          onClick={() => setOpen(false)}
          sx={{
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.92)",
            cursor: "zoom-out",
            display: "flex",
            height: "100%",
            justifyContent: "center",
            p: 2,
            position: "relative",
            width: "100%"
          }}
        >
          <IconButton
            aria-label="Close image viewer"
            onClick={(event) => {
              event.stopPropagation();
              setOpen(false);
            }}
            sx={{
              color: "common.white",
              position: "absolute",
              right: 12,
              top: 12,
              zIndex: 1
            }}
          >
            <CloseIcon />
          </IconButton>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <Box
            alt={alt}
            component="img"
            src={src}
            sx={{
              maxHeight: "100%",
              maxWidth: "100%",
              objectFit: "contain"
            }}
          />
        </Box>
      </Dialog>
    </>
  );
}
