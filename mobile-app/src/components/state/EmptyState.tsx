import React from "react";
import { StyleSheet } from "react-native";
import { Text } from "react-native-paper";

import { useTranslation } from "react-i18next";
import { PrimaryButton, ScreenContainer } from "../primitives";

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
    <ScreenContainer>
      <Text accessibilityRole="alert" style={styles.message} variant="bodyMedium">
        {resolvedMessage}
      </Text>
      {onActionPress ? (
        <PrimaryButton label={resolvedActionLabel} onPress={onActionPress} />
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  message: {
    textAlign: "center"
  }
});
