import React from "react";
import { StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { PrimaryButton, ScreenContainer } from "../../components/primitives";

export interface UpdateRequiredScreenProps {
  onDismiss?: () => void;
}

export function UpdateRequiredScreen({ onDismiss }: UpdateRequiredScreenProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <ScreenContainer>
      <Text accessibilityRole="alert" style={styles.title} variant="headlineSmall">
        {t("updateRequiredTitle", { defaultValue: "Update required" })}
      </Text>
      <Text style={styles.body} variant="bodyMedium">
        {t("updateRequiredBody", { defaultValue: "Please update the app to continue." })}
      </Text>
      {onDismiss ? (
        <PrimaryButton
          label={t("updateRequiredDismiss", { defaultValue: "Dismiss" })}
          onPress={onDismiss}
        />
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    marginBottom: 12
  },
  body: {
    marginBottom: 16,
    textAlign: "center"
  }
});
