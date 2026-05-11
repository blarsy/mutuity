import type { SxProps, Theme } from "@mui/material/styles";

export const LISTING_CARD_MIN_WIDTH_PX = 280;

export const listingCardGridSx: SxProps<Theme> = {
  display: "grid",
  gap: 2,
  gridTemplateColumns: `repeat(auto-fit, minmax(${LISTING_CARD_MIN_WIDTH_PX}px, 1fr))`
};
