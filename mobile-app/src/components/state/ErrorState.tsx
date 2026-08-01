import React from "react";
import { StyleSheet } from "react-native";
import { IconButton, Text } from "react-native-paper";

import { useTranslation } from "react-i18next";
import { ScreenContainer } from "../primitives";

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps): React.JSX.Element {
  const { t } = useTranslation();
  const resolvedMessage = message ?? t("error");
  const retryLabel = t("retry");

  return (
    <ScreenContainer>
      <Text accessibilityRole="alert" style={styles.message} variant="bodyMedium">
        {resolvedMessage}
      </Text>
      {onRetry ? (
        <IconButton
          accessibilityLabel={retryLabel}
          icon="refresh"
          onPress={onRetry}
          style={styles.actionButton}
        />
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignSelf: "center"
  },
  message: {
    textAlign: "center"
  }
});
