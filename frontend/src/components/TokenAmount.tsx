import { useState } from "react";
import QuestionMarkIcon from "@mui/icons-material/QuestionMark";
import { Box, IconButton, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { TokenExplainerDialog } from "./tokenExplainer/TokenExplainerDialog";

export interface TokenAmountProps {
  amount: number;
  size?: number;
  textColor?: string;
  showExplainer?: boolean;
  explainerAccessibilityLabel?: string;
  /** Balances can be negative; listing prices follow the mobile nonnegative display. */
  signed?: boolean;
  sx?: SxProps<Theme>;
}

export function TokenAmount({ amount, size = 36, textColor = "text.primary", showExplainer = true,
  explainerAccessibilityLabel, signed = false, sx = [] }: TokenAmountProps) {
  const { t } = useTranslation("contribution");
  const [explainerOpen, setExplainerOpen] = useState(false);
  const roundedAmount = Number.isFinite(amount) ? Math.round(amount) : 0;
  const safeAmount = signed ? roundedAmount : Math.max(0, roundedAmount);

  return (
    <Box component="span" data-testid="token-amount" sx={[
      { display: "inline-flex", alignItems: "center", color: textColor, flexShrink: 0, gap: 0.25 },
      ...(Array.isArray(sx) ? sx : [sx])
    ]}>
      <Typography component="span" aria-label={t("topesAmount", { amount: safeAmount })}
        sx={{ fontFamily: "inherit", fontWeight: 700, fontSize: Math.max(18, size * 0.7), lineHeight: 1.2 }}>
        {safeAmount}
      </Typography>
      <Box component="img" src="/token-symbol.svg" alt="" aria-hidden="true" width={size} height={size}
        sx={{ display: "block", objectFit: "contain" }} />
      {showExplainer ? (
        <IconButton size="small" aria-label={explainerAccessibilityLabel ?? t("topesGuide.openButton")}
          aria-haspopup="dialog" onClick={event => { event.stopPropagation(); setExplainerOpen(true); }}
          sx={{ color: "inherit", alignSelf: "flex-start", p: 0.5, "&:hover": { color: "primary.main" } }}>
          <QuestionMarkIcon sx={{ fontSize: 16 }} />
        </IconButton>
      ) : null}
      {explainerOpen ? (
        <Box component="span" onClick={event => event.stopPropagation()}>
          <TokenExplainerDialog visible onClose={() => setExplainerOpen(false)} />
        </Box>
      ) : null}
    </Box>
  );
}