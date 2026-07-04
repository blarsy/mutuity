import React from "react";
import { Button, StyleSheet, Text, View } from "react-native";

export interface UpdateRequiredScreenProps {
  onDismiss?: () => void;
}

export function UpdateRequiredScreen({ onDismiss }: UpdateRequiredScreenProps): React.JSX.Element {
  return (
    <View style={styles.container} accessibilityRole="alert">
      <Text style={styles.title}>Update required</Text>
      <Text style={styles.body}>Please update the app to continue.</Text>
      {onDismiss ? <Button title="Dismiss" onPress={onDismiss} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    padding: 24
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12
  },
  body: {
    marginBottom: 16,
    textAlign: "center"
  }
});
