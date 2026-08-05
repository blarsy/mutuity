import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";

import { designTokens } from "../../theme/tokens";

export type SocialProvider = "google" | "apple";

export interface SocialAuthButtonsProps {
  onPress?: ((provider: SocialProvider) => void | Promise<void>) | undefined;
  loadingProvider?: SocialProvider | null;
}

const socialProviders: ReadonlyArray<SocialProvider> = ["apple", "google"];

export function SocialAuthButtons({ onPress, loadingProvider = null }: SocialAuthButtonsProps): React.JSX.Element {
  const hasAtLeastOneProvider = typeof onPress === "function";

  return (
    <View style={styles.root}>
      <Text variant="bodyMedium" style={styles.label}>
        Or continue with
      </Text>

      {socialProviders.map((provider) => {
        const isLoading = loadingProvider === provider;

        return (
          <Button
            key={provider}
            mode="contained"
            icon={provider}
            buttonColor={designTokens.colors.secondary}
            textColor="#111111"
            disabled={!hasAtLeastOneProvider || loadingProvider !== null}
            loading={isLoading}
            contentStyle={styles.buttonContent}
            style={styles.button}
            accessibilityLabel={provider === "google" ? "Continue with Google" : "Continue with Apple"}
            onPress={() => {
              if (onPress) {
                void onPress(provider);
              }
            }}
            testID={`auth-social-${provider}`}
          >
            {provider === "google" ? "Continue with Google" : "Continue with Apple"}
          </Button>
        );
      })}

      {!hasAtLeastOneProvider ? (
        <Text variant="bodySmall" style={styles.helpText}>
          Social sign-in is not available on mobile yet.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: designTokens.spacing.sm,
    marginTop: designTokens.spacing.sm,
    marginBottom: designTokens.spacing.xs
  },
  label: {
    color: "#111111",
    textAlign: "center"
  },
  button: {
    borderRadius: 15
  },
  buttonContent: {
    minHeight: 46
  },
  helpText: {
    color: "#111111",
    opacity: 0.75,
    textAlign: "center"
  }
});