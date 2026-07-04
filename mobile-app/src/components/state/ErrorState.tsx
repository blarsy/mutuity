import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTranslation } from "react-i18next";

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps): React.JSX.Element {
  const { t } = useTranslation();
  const resolvedMessage = message ?? t("error");
  const retryLabel = t("retry");

  return (
    <View accessibilityRole="alert" style={styles.container}>
      <Text style={styles.message}>{resolvedMessage}</Text>
      {onRetry ? (
        <Pressable accessibilityRole="button" onPress={onRetry} style={styles.button}>
          <Text style={styles.buttonLabel}>{retryLabel}</Text>
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
