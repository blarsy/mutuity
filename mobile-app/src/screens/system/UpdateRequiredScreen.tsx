import React from "react";
import { StyleSheet } from "react-native";
import { Text } from "react-native-paper";

import { PrimaryButton, ScreenContainer } from "../../components/primitives";

export interface UpdateRequiredScreenProps {
  onDismiss?: () => void;
}

export function UpdateRequiredScreen({ onDismiss }: UpdateRequiredScreenProps): React.JSX.Element {
  return (
    <ScreenContainer>
      <Text accessibilityRole="alert" style={styles.title} variant="headlineSmall">
        Update required
      </Text>
      <Text style={styles.body} variant="bodyMedium">
        Please update the app to continue.
      </Text>
      {onDismiss ? <PrimaryButton label="Dismiss" onPress={onDismiss} /> : null}
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
