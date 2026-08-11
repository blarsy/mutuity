import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button, Checkbox, Divider, RadioButton, Text } from "react-native-paper";

import { designTokens } from "../../theme/tokens";
import { ThemedDialog } from "./ThemedDialog";

export interface PickerDialogItem<TValue extends string = string> {
  value: TValue;
  label: string;
  disabled?: boolean;
}

export interface PickerDialogProps<TValue extends string = string> {
  visible: boolean;
  title: string;
  items: PickerDialogItem<TValue>[];
  selectedValues: TValue[];
  onConfirm: (selectedValues: TValue[]) => void;
  onDismiss: () => void;
  multiple?: boolean;
  testID?: string | undefined;
}

export function PickerDialog<TValue extends string = string>({
  visible,
  title,
  items,
  selectedValues,
  onConfirm,
  onDismiss,
  multiple = true,
  testID
}: PickerDialogProps<TValue>): React.JSX.Element {
  const [draftSelectedValues, setDraftSelectedValues] = useState<TValue[]>(selectedValues);

  useEffect(() => {
    if (visible) {
      setDraftSelectedValues(selectedValues);
    }
  }, [selectedValues, visible]);

  const selectedSet = useMemo(() => new Set(draftSelectedValues), [draftSelectedValues]);

  const toggleValue = (value: TValue): void => {
    if (!multiple) {
      setDraftSelectedValues([value]);
      return;
    }

    setDraftSelectedValues((previous) =>
      previous.includes(value) ? previous.filter((current) => current !== value) : [...previous, value]
    );
  };

  return (
    <ThemedDialog
      visible={visible}
      title={title}
      testID={testID}
      onDismiss={onDismiss}
      content={
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {items.map((item, index) => {
            const selected = selectedSet.has(item.value);

            return (
              <View key={item.value}>
                {index > 0 ? <Divider /> : null}
                <Pressable
                  accessibilityRole={multiple ? "checkbox" : "radio"}
                  accessibilityState={{ checked: selected, disabled: item.disabled }}
                  disabled={item.disabled}
                  onPress={() => toggleValue(item.value)}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
                >
                  {multiple ? (
                    <Checkbox
                      status={selected ? "checked" : "unchecked"}
                      onPress={() => toggleValue(item.value)}
                      color={designTokens.colors.primary}
                      uncheckedColor={designTokens.colors.primary}
                      disabled={item.disabled ?? false}
                    />
                  ) : (
                    <RadioButton
                      value={item.value}
                      status={selected ? "checked" : "unchecked"}
                      onPress={() => toggleValue(item.value)}
                      color={designTokens.colors.primary}
                      uncheckedColor={designTokens.colors.primary}
                      disabled={item.disabled ?? false}
                    />
                  )}
                  <Text
                    variant="bodyMedium"
                    numberOfLines={1}
                    style={[styles.label, item.disabled && styles.disabledLabel]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      }
      actions={[
        <Button key="cancel" onPress={onDismiss}>
          Cancel
        </Button>,
        <Button key="confirm" mode="contained" onPress={() => onConfirm(draftSelectedValues)}>
          OK
        </Button>
      ]}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 0
  },
  row: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 0
  },
  rowPressed: {
    opacity: 0.75
  },
  label: {
    flex: 1,
    textAlign: "center"
  },
  disabledLabel: {
    opacity: 0.5
  }
});