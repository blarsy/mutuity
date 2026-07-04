import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { useTranslation } from "react-i18next";

export interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label }: LoadingStateProps): React.JSX.Element {
  const { t } = useTranslation();
  const resolvedLabel = label ?? t("loading");

  return (
    <View accessibilityRole="progressbar" style={styles.container}>
      <ActivityIndicator size="large" />
      <Text style={styles.label}>{resolvedLabel}</Text>
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
  label: {
    marginTop: 12
  }
});
