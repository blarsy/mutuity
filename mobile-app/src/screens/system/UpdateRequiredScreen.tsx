import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { Button, Icon, Surface, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { designTokens } from "../../theme/tokens";

export interface UpdateRequiredScreenProps {
  onDismiss?: () => void;
}

export function UpdateRequiredScreen({ onDismiss }: UpdateRequiredScreenProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Image source={require("../../assets/img/logo.jpeg")} style={styles.logo} />
      <Surface accessible accessibilityRole="alert" elevation={5} style={styles.card}>
        <Icon source="wrench" size={40} />
        <Text variant="titleSmall">{t("updateRequiredTitle", { defaultValue: "Update required" })}</Text>
        <Text variant="bodySmall" style={styles.body}>
          {t("updateRequiredBody", { defaultValue: "Please update the app to continue." })}
        </Text>
        {onDismiss ? (
          <Button
            mode="outlined"
            textColor="#000"
            style={styles.button}
            onPress={onDismiss}
          >
            {t("updateRequiredDismiss", { defaultValue: "Dismiss" })}
          </Button>
        ) : null}
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: designTokens.colors.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  logo: {
    width: 200,
    height: 200
  },
  card: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 20,
    backgroundColor: designTokens.colors.secondary,
    borderRadius: 10
  },
  body: {
    textAlign: "center"
  },
  button: {
    borderRadius: 15
  }
});
