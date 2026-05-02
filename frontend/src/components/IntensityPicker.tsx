/**
 * IntensityPicker — editable gradient bar linking intensity zone ↔ token amount.
 *
 * Intensity zones (resource uses lowercase, needs uses uppercase — both accepted):
 *   leg_up / LEG_UP        :  10 –    99   midpoint  54
 *   sharing / SHARING      : 100 –   999   midpoint 549
 *   commitment / COMMITMENT: 1000 – 4999   midpoint 2999
 *   rare_contribution / RARE_CONTRIBUTION: 5000+    anchor 5000
 */
import { Box, Stack, TextField, Typography, useTheme } from "@mui/material";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

// ── zone helpers ─────────────────────────────────────────────────────────────

export type IntensityZone =
  | "leg_up"
  | "sharing"
  | "commitment"
  | "rare_contribution";

/** Accept both GraphQL uppercase and display lowercase */
export function normalizeIntensity(
  value: string
): IntensityZone {
  const v = value.toLowerCase();
  if (v === "leg_up") return "leg_up";
  if (v === "sharing") return "sharing";
  if (v === "commitment") return "commitment";
  return "rare_contribution";
}

/** Return the same casing the caller passed in */
export function denormalizeIntensity(
  zone: IntensityZone,
  uppercase: boolean
): string {
  return uppercase ? zone.toUpperCase() : zone;
}

const ZONE_ORDER: IntensityZone[] = [
  "leg_up",
  "sharing",
  "commitment",
  "rare_contribution",
];

// Midpoint used when a zone is selected via the bar
const MIDPOINT: Record<IntensityZone, number> = {
  leg_up: 54,
  sharing: 549,
  commitment: 2999,
  rare_contribution: 5000,
};

// Token range boundaries (inclusive min, exclusive max for last zone)
const ZONE_MIN: Record<IntensityZone, number> = {
  leg_up: 10,
  sharing: 100,
  commitment: 1000,
  rare_contribution: 5000,
};

function tokenAmountToZone(amount: number): IntensityZone {
  if (amount < 100) return "leg_up";
  if (amount < 1000) return "sharing";
  if (amount < 5000) return "commitment";
  return "rare_contribution";
}

function zoneToPercent(zone: IntensityZone): number {
  // Center of each 25%-wide segment
  const idx = ZONE_ORDER.indexOf(zone);
  return idx * 25 + 12.5;
}

function percentToZone(percent: number): IntensityZone {
  const idx = Math.min(3, Math.floor(percent / 25));
  return ZONE_ORDER[idx];
}

// ── GradientBar ──────────────────────────────────────────────────────────────

interface GradientBarProps {
  zone: IntensityZone;
  onChange?: (zone: IntensityZone) => void;
  barHeight?: number;
}

function GradientBar({ zone, onChange, barHeight = 16 }: GradientBarProps) {
  const theme = useTheme();
  const contrastColor = theme.palette.getContrastText(
    theme.palette.background.paper
  );
  const [dragging, setDragging] = useState(false);

  const percent = zoneToPercent(zone);

  const toPercent = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    return Math.min(100, Math.max(0, (x / rect.width) * 100));
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!onChange) return;
    setDragging(true);
    onChange(percentToZone(toPercent(event)));
  };
  const handleMouseUp = () => setDragging(false);
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!dragging || !onChange) return;
    onChange(percentToZone(toPercent(event)));
  };

  return (
    <Box
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
      sx={{
        cursor: onChange ? "pointer" : "default",
        height: barHeight + 14,
        position: "relative",
        width: "100%",
      }}
    >
      {/* Segmented gradient track */}
      <Box
        sx={{
          background:
            "linear-gradient(90deg, #fef0e3 0%, #fef0e3 25%, #ffb873 25%, #ffb873 50%, #ff770c 50%, #ff770c 75%, #ff4401 75%, #ff4401 100%)",
          border: "1px solid rgba(0,0,0,.2)",
          borderRadius: "999px",
          height: barHeight,
          overflow: "hidden",
          width: "100%",
        }}
      />
      {/* Position indicator (vertical line) */}
      <Box
        sx={{
          backgroundColor: contrastColor,
          height: barHeight + 8,
          left: `${percent}%`,
          pointerEvents: "none",
          position: "absolute",
          top: 0,
          transform: "translate(-50%, 0)",
          width: 2,
        }}
      />
      {/* Chevron */}
      <Box
        sx={{
          alignItems: "center",
          color: contrastColor,
          display: "flex",
          justifyContent: "center",
          left: `${percent}%`,
          pointerEvents: "none",
          position: "absolute",
          top: barHeight + 4,
          transform: "translate(-50%, 0)",
        }}
      >
        <ArrowDropUpIcon fontSize="medium" />
      </Box>
    </Box>
  );
}

// ── IntensityPicker (editable) ───────────────────────────────────────────────

export interface IntensityPickerProps {
  /** Intensity value (lowercase or uppercase accepted) */
  intensity: string;
  /** Token amount — pass "" when absent */
  tokenAmount: number | "";
  tokenAmountLabel: string;
  intensityLabel?: string;
  onIntensityChange: (intensity: string) => void;
  onTokenAmountChange: (amount: number | "") => void;
  /** Whether to emit uppercase values (for needs) or lowercase (for resources) */
  uppercase?: boolean;
  error?: boolean;
  helperText?: string;
  onBlur?: () => void;
}

export function IntensityPicker({
  intensity,
  tokenAmount,
  tokenAmountLabel,
  onIntensityChange,
  onTokenAmountChange,
  uppercase = false,
  error,
  helperText,
  onBlur,
}: IntensityPickerProps) {
  const { t } = useTranslation("resources");
  const zone = normalizeIntensity(intensity);

  const [inputValue, setInputValue] = useState<string>(
    tokenAmount === "" ? "" : String(tokenAmount)
  );

  // Sync inputValue when parent resets
  useEffect(() => {
    setInputValue(tokenAmount === "" ? "" : String(tokenAmount));
  }, [tokenAmount]);

  const applyZone = (nextZone: IntensityZone) => {
    onIntensityChange(denormalizeIntensity(nextZone, uppercase));
    const mid = MIDPOINT[nextZone];
    onTokenAmountChange(mid);
    setInputValue(String(mid));
  };

  const handleTokenInput = (raw: string) => {
    setInputValue(raw);
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num > 0) {
      onTokenAmountChange(num);
      const nextZone = tokenAmountToZone(num);
      if (nextZone !== zone) {
        onIntensityChange(denormalizeIntensity(nextZone, uppercase));
      }
    } else if (raw === "") {
      onTokenAmountChange("");
    }
  };

  const rangeLabel =
    zone === "leg_up"
      ? "10 – 99"
      : zone === "sharing"
      ? "100 – 999"
      : zone === "commitment"
      ? "1 000 – 4 999"
      : "5 000+";

  return (
    <Stack spacing={1}>
      <GradientBar zone={zone} onChange={applyZone} />
      <Stack direction="row" justifyContent="space-between">
        {ZONE_ORDER.map((z) => (
          <Typography
            key={z}
            variant="caption"
            color={z === zone ? "primary" : "text.secondary"}
            sx={{ fontWeight: z === zone ? 700 : 400, width: "25%", textAlign: "center" }}
          >
            {t(`intensity.${z}`)}
          </Typography>
        ))}
      </Stack>
      <TextField
        size="small"
        type="number"
        label={tokenAmountLabel}
        value={inputValue}
        onChange={(e) => handleTokenInput(e.target.value)}
        onBlur={onBlur}
        error={error}
        helperText={helperText ?? `${t("intensity.rangeHint")}: ${rangeLabel}`}
        inputProps={{ min: ZONE_MIN[zone] }}
      />
    </Stack>
  );
}

// ── IntensityDisplay (read-only) ─────────────────────────────────────────────

export interface IntensityDisplayProps {
  intensity: string;
  tokenAmount?: number | null;
}

export function IntensityDisplay({ intensity, tokenAmount }: IntensityDisplayProps) {
  const { t } = useTranslation("resources");
  const zone = normalizeIntensity(intensity);

  return (
    <Stack spacing={0.5}>
      <GradientBar zone={zone} barHeight={10} />
      <Stack direction="row" justifyContent="space-between">
        {ZONE_ORDER.map((z) => (
          <Typography
            key={z}
            variant="caption"
            color={z === zone ? "primary" : "text.secondary"}
            sx={{ fontWeight: z === zone ? 700 : 400, width: "25%", textAlign: "center" }}
          >
            {t(`intensity.${z}`)}
          </Typography>
        ))}
      </Stack>
      {tokenAmount != null ? (
        <Typography variant="body2" color="text.secondary">
          {t("intensity.suggestedAmount")}: {tokenAmount}
        </Typography>
      ) : null}
    </Stack>
  );
}
