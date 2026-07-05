export const designTokens = {
  colors: {
    primary: "#ff4401",
    primaryContainer: "#fef0e3",
    deleted: "#E0E0E0",
    backdrop: "rgba(227,94,30,0.3)"
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16
  }
} as const;

export type DesignTokens = typeof designTokens;
