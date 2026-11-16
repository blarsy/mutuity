import type { ButtonProps } from "react-native-paper";

import { designTokens } from "./tokens";

export type ButtonFlavor = "primary" | "secondary" | "quiet" | "elevated" | "tonal" | "destructive" | "inverse" | "authPrimary" | "social" | "neutralOutline" | "profileAction";

type ButtonFlavorStyle = {
  mode: NonNullable<ButtonProps["mode"]>;
  roundness: number;
  fontColor: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
};

const roundness = 8

/**
 * Central styles for mobile text buttons. Change a flavor here to update every
 * AppButton using it; per-call Paper color props remain available for true exceptions.
 */
export const buttonStyles: Record<ButtonFlavor, ButtonFlavorStyle> = {
  primary: {
    mode: "contained",
    roundness,
    fontColor: "#ffffff",
    backgroundColor: designTokens.colors.primary,
    borderColor: designTokens.colors.primary,
    borderWidth: 0
  },
  secondary: {
    mode: "outlined",
    roundness,
    fontColor: designTokens.colors.primary,
    backgroundColor: "transparent",
    borderColor: designTokens.colors.primary,
    borderWidth: 1
  },
  quiet: {
    mode: "text",
    roundness,
    fontColor: designTokens.colors.primary,
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderWidth: 0
  },
  elevated: {
    mode: "elevated",
    roundness,
    fontColor: designTokens.colors.primary,
    backgroundColor: "#ffffff",
    borderColor: "#ffffff",
    borderWidth: 0
  },
  tonal: {
    mode: "contained-tonal",
    roundness,
    fontColor: designTokens.colors.primary,
    backgroundColor: designTokens.colors.secondary,
    borderColor: designTokens.colors.secondary,
    borderWidth: 0
  },
  destructive: {
    mode: "text",
    roundness,
    fontColor: "#d32f2f",
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderWidth: 0
  },
  inverse: {
    mode: "text",
    roundness,
    fontColor: "#ffffff",
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderWidth: 0
  },
  authPrimary: {
    mode: "contained",
    roundness,
    fontColor: "#111111",
    backgroundColor: designTokens.colors.secondary,
    borderColor: designTokens.colors.secondary,
    borderWidth: 0
  },
  social: {
    mode: "contained",
    roundness,
    fontColor: "#111111",
    backgroundColor: designTokens.colors.secondary,
    borderColor: designTokens.colors.secondary,
    borderWidth: 0
  },
  neutralOutline: {
    mode: "outlined",
    roundness,
    fontColor: "#000000",
    backgroundColor: "transparent",
    borderColor: "#000000",
    borderWidth: 1
  },
  profileAction: {
    mode: "outlined",
    roundness,
    fontColor: "#000000",
    backgroundColor: designTokens.colors.secondary,
    borderColor: "#000000",
    borderWidth: 1
  }
};

export function getButtonFlavor(mode: ButtonProps["mode"] | undefined): ButtonFlavor {
  switch (mode) {
    case "contained":
      return "primary";
    case "outlined":
      return "secondary";
    case "elevated":
      return "elevated";
    case "contained-tonal":
      return "tonal";
    case "text":
    case undefined:
      return "quiet";
  }
}
