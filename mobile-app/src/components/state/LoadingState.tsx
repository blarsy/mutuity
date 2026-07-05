import React from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import { Text } from "react-native-paper";

import { useTranslation } from "react-i18next";
import { ScreenContainer } from "../primitives";

export interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label }: LoadingStateProps): React.JSX.Element {
  const { t } = useTranslation();
  const resolvedLabel = label ?? t("loading");

  return (
    <ScreenContainer accessibilityRole="progressbar">
      <ActivityIndicator size="large" />
      <Text style={styles.label} variant="bodyMedium">
        {resolvedLabel}
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  label: {
    marginTop: 12
  }
});
