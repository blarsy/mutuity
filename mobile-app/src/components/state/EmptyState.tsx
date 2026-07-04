import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTranslation } from "react-i18next";

export interface EmptyStateProps {
  message?: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export function EmptyState({ message, actionLabel, onActionPress }: EmptyStateProps): React.JSX.Element {
  const { t } = useTranslation();
  const resolvedMessage = message ?? t("emptyState.defaultMessage", { defaultValue: "Nothing here yet" });
  const resolvedActionLabel = actionLabel ?? t("retry");

  return (
    <View style={styles.container} accessibilityRole="alert">
      <Text style={styles.message}>{resolvedMessage}</Text>
      {onActionPress ? (
        <Pressable accessibilityRole="button" onPress={onActionPress} style={styles.button}>
          <Text style={styles.buttonLabel}>{resolvedActionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 160,
    padding: 24
  },
  message: {
    textAlign: "center"
  },
  button: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  buttonLabel: {
    fontWeight: "600"
  }
});
