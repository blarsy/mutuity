import type { SxProps, Theme } from "@mui/material/styles";

export const LISTING_CARD_MIN_WIDTH_PX = 280;

export const listingCardGridSx: SxProps<Theme> = {
  display: "grid",
  gap: 2,
  gridTemplateColumns: `repeat(auto-fit, minmax(${LISTING_CARD_MIN_WIDTH_PX}px, 1fr))`
};

export const centeredResponsiveListingCardGridSx: SxProps<Theme> = {
  display: "grid",
  gap: 2,
  gridTemplateColumns: {
    xs: "minmax(0, 1fr)",
    sm: "repeat(2, minmax(0, 1fr))",
    md: "repeat(3, minmax(0, 1fr))",
    lg: "repeat(4, minmax(0, 1fr))",
    xl: "repeat(5, minmax(0, 1fr))"
  },
  justifyContent: "center",
  justifyItems: "center"
};
