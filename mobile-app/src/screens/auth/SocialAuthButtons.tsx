import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { designTokens } from "../../theme/tokens";

export type SocialProvider = "google" | "apple";

export interface SocialAuthButtonsProps {
  onPress?: ((provider: SocialProvider) => void | Promise<void>) | undefined;
  loadingProvider?: SocialProvider | null;
}

const socialProviders: ReadonlyArray<SocialProvider> = ["apple", "google"];

export function SocialAuthButtons({ onPress, loadingProvider = null }: SocialAuthButtonsProps): React.JSX.Element {
  const { t } = useTranslation("us1");
  const hasAtLeastOneProvider = typeof onPress === "function";

  return (
    <View style={styles.root}>
      <Text variant="bodyMedium" style={styles.label}>
        {t("socialAuthOrContinueWith", { defaultValue: "Or continue with" })}
      </Text>

      {socialProviders.map((provider) => {
        const isLoading = loadingProvider === provider;
        const providerLabel =
          provider === "google"
            ? t("socialAuthContinueWithGoogle", { defaultValue: "Continue with Google" })
            : t("socialAuthContinueWithApple", { defaultValue: "Continue with Apple" });

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
            accessibilityLabel={providerLabel}
            onPress={() => {
              if (onPress) {
                void onPress(provider);
              }
            }}
            testID={`auth-social-${provider}`}
          >
            {providerLabel}
          </Button>
        );
      })}

      {!hasAtLeastOneProvider ? (
        <Text variant="bodySmall" style={styles.helpText}>
          {t("socialAuthUnavailableMessage", { defaultValue: "Social sign-in is not available on mobile yet." })}
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
    color: "#ffffff",
    textAlign: "center"
  },
  button: {
    borderRadius: 15
  },
  buttonContent: {
    minHeight: 46
  },
  helpText: {
    color: "#ffffff",
    opacity: 0.75,
    textAlign: "center"
  }
});