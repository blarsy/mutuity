import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { DatePickerModal, TimePickerModal } from "react-native-paper-dates";
import { Icon, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";
import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";
import { FormFieldLabel } from "./FormFieldLabel";

export interface DateTimePickerFieldProps {
  label: string;
  value: Date | undefined;
  onChange: (nextValue: Date | undefined) => void;
  testID: string;
  allowClear?: boolean;
}

export function DateTimePickerField({
  label,
  value,
  onChange,
  testID,
  allowClear = true
}: DateTimePickerFieldProps): React.JSX.Element {
  const { t, i18n } = useTranslation("common");
  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date | undefined>(undefined);

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

  const onDateConfirm = ({ date }: { date: Date | undefined }) => {
    setDateOpen(false);
    if (date) {
      setTempDate(date);
      setTimeOpen(true);
    } else {
      onChange(undefined);
    }
  };

  const onTimeConfirm = ({ hours, minutes }: { hours: number, minutes: number }) => {
    setTimeOpen(false);
    if (tempDate) {
      const newDateTime = new Date(tempDate);
      newDateTime.setHours(hours);
      newDateTime.setMinutes(minutes);
      onChange(newDateTime);
    }
    setTempDate(undefined); // Clear tempDate after use
  };

  return (
    <View style={styles.root}>
      <FormFieldLabel>{label}</FormFieldLabel>

      <View style={styles.row}>
        {allowClear && (
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
        )}

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
        onConfirm={onDateConfirm}
      />

      <TimePickerModal
        locale={i18n.language || "en"}
        saveLabel={t("selectButtonCaption", { defaultValue: "Select" })}
        visible={timeOpen}
        onDismiss={() => setTimeOpen(false)}
        onConfirm={onTimeConfirm}
        hours={value?.getHours() ?? new Date().getHours()}
        minutes={value?.getMinutes() ?? new Date().getMinutes()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: designTokens.spacing.xs
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
