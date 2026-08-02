import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { designTokens } from "../../theme/tokens";

export type SocialProvider = "google" | "apple";

export interface SocialAuthButtonsProps {
  onPress?: (provider: SocialProvider) => void | Promise<void>;
  loadingProvider?: SocialProvider | null;
}

function providerLabel(provider: SocialProvider, t: (key: string, options?: Record<string, unknown>) => string): string {
  return provider === "google"
    ? t("continueWithGoogle", { ns: "us1", defaultValue: "Continue with Google" })
    : t("continueWithApple", { ns: "us1", defaultValue: "Continue with Apple" });
}

const socialProviders: ReadonlyArray<SocialProvider> = ["apple", "google"];

export function SocialAuthButtons({ onPress, loadingProvider = null }: SocialAuthButtonsProps): React.JSX.Element {
  const { t } = useTranslation(["common", "us1"]);
  const hasAtLeastOneProvider = typeof onPress === "function";

  return (
    <View style={styles.root}>
      <Text variant="bodyMedium" style={styles.label}>
        {t("socialActions", { ns: "us1", defaultValue: "Or continue with" })}
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
            accessibilityLabel={providerLabel(provider, t)}
            onPress={() => {
              if (onPress) {
                void onPress(provider);
              }
            }}
            testID={`auth-social-${provider}`}
          >
            {providerLabel(provider, t)}
          </Button>
        );
      })}

      {!hasAtLeastOneProvider ? (
        <Text variant="bodySmall" style={styles.helpText}>
          {t("socialUnavailable", {
            ns: "us1",
            defaultValue: "Social sign-in is not available on mobile yet."
          })}
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