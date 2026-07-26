import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { DatePickerModal } from "react-native-paper-dates";
import { Icon, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";

export interface DateTimePickerFieldProps {
  label: string;
  value: Date | undefined;
  onChange: (nextValue: Date | undefined) => void;
  testID: string;
}

export function DateTimePickerField({
  label,
  value,
  onChange,
  testID
}: DateTimePickerFieldProps): React.JSX.Element {
  const { t, i18n } = useTranslation("common");
  const [dateOpen, setDateOpen] = useState(false);

  const displayValue = useMemo(() => {
    if (!value) {
      return t("setDate", { defaultValue: "Set date" });
    }

    const formatted = value.toLocaleString(i18n.language, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });

    return formatted;
  }, [i18n.language, t, value]);

  return (
    <View style={styles.root}>
      <Text variant="titleSmall" style={styles.label}>{label}</Text>

      <View style={styles.row}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: !value }}
          accessibilityLabel={t("noDate", { defaultValue: "No date" })}
          onPress={() => onChange(undefined)}
          style={styles.noDateToggle}
        >
          <Icon
            source={!value ? "checkbox-marked" : "checkbox-blank-outline"}
            size={24}
            color={!value ? designTokens.colors.primary : "#000"}
          />
          <Text style={styles.noDateText}>{t("noDate", { defaultValue: "No date" })}</Text>
        </Pressable>

        <Pressable
          testID={`${testID}:Button`}
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={() => setDateOpen(true)}
          style={styles.dateButton}
        >
          <Text variant="bodyMedium" style={styles.dateText}>{displayValue}</Text>
          <Icon source="chevron-right" size={24} color="#000" />
        </Pressable>
      </View>

      <DatePickerModal
        locale={i18n.language || "en"}
        saveLabel={t("selectButtonCaption", { defaultValue: "Select" })}
        mode="single"
        visible={dateOpen}
        date={value}
        onDismiss={() => setDateOpen(false)}
        onConfirm={({ date }) => {
          if (!date) {
            onChange(undefined);
            setDateOpen(false);
            return;
          }

          if (value) {
            date.setHours(value.getHours());
            date.setMinutes(value.getMinutes());
          }

          onChange(date);
          setDateOpen(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: designTokens.spacing.xs
  },
  label: {
    fontFamily: appFontFamilies.altGeneral,
    textTransform: "uppercase",
    letterSpacing: 0.4
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: designTokens.spacing.sm
  },
  noDateToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: designTokens.spacing.xs
  },
  noDateText: {
    fontFamily: appFontFamilies.general
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: designTokens.spacing.xs
  },
  dateText: {
    fontFamily: appFontFamilies.general
  }
});
