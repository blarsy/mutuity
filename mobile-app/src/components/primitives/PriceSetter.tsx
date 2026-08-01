import React from "react";
import { StyleSheet, View } from "react-native";
import { Icon, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";
import { FormTextInput } from "./FormTextInput";
import { PriceGradientBar } from "./PriceGradientBar";

export interface PriceSetterProps {
  label: string;
  value: number | null;
  onChange: (nextValue: number) => void;
  onBlur?: () => void;
  accessibilityLabel?: string;
}

function getPercentFromValue(value: number): number {
  if (value <= 100) {
    return (value / 100) * 25;
  }

  if (value <= 1000) {
    return 25 + ((value - 100) / 900) * 25;
  }

  if (value <= 5000) {
    return 50 + ((value - 1000) / 4000) * 25;
  }

  return Math.min(100, 75 + ((value - 5000) / 5000) * 25);
}

function roundToIncrement(value: number, increment: number): number {
  return Math.round(value / increment) * increment;
}

function getValueFromPercent(percent: number): number {
  const increment = 50;

  if (percent <= 25) {
    return roundToIncrement(percent * 4, increment);
  }

  if (percent <= 50) {
    return roundToIncrement((((percent - 25) * 4) / 100) * 900 + 100, increment);
  }

  if (percent <= 75) {
    return roundToIncrement((((percent - 50) * 4) / 100) * 4000 + 1000, increment);
  }

  return roundToIncrement((((percent - 75) * 4) / 100) * 5000 + 5000, increment);
}

function getPriceBucketKey(value: number | null): string {
  if (value === null || value <= 100) {
    return "priceLegUp";
  }

  if (value <= 1000) {
    return "priceFavor";
  }

  if (value <= 5000) {
    return "priceCommitment";
  }

  return "pricePrecious";
}

export function PriceSetter({
  label,
  value,
  onChange,
  onBlur,
  accessibilityLabel
}: PriceSetterProps): React.JSX.Element {
  const { t } = useTranslation(["common", "us2"]);
  const safeValue = value ?? 0;

  return (
    <View style={styles.root}>
      <View style={styles.inputRow}>
        <FormTextInput
          label={label}
          accessibilityLabel={accessibilityLabel ?? label}
          value={safeValue.toString()}
          onChangeText={(nextText) => {
            const parsed = Number(nextText);
            onChange(Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : 0);
          }}
          {...(onBlur ? { onBlur } : {})}
          keyboardType="number-pad"
          style={styles.input}
        />
        <Icon source="help-circle" size={20} color={designTokens.colors.primary} />
      </View>

      <View style={styles.gradientRow}>
        <PriceGradientBar
          testID="price-info"
          percent={getPercentFromValue(safeValue)}
          onPercentChanged={(percent) => onChange(getValueFromPercent(percent))}
        />

        <Text variant="bodyMedium" style={styles.hintText}>
          {t(getPriceBucketKey(value), {
            ns: "common",
            defaultValue: "Price range"
          })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: designTokens.spacing.xs
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: designTokens.spacing.xs
  },
  input: {
    flex: 1
  },
  gradientRow: {
    gap: designTokens.spacing.sm,
    width: "100%"
  },
  hintText: {
    textAlign: "center",
    width: "100%",
    paddingHorizontal: designTokens.spacing.sm,
    fontFamily: appFontFamilies.general
  }
});
