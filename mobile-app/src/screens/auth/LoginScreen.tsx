import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { Button, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { AuthDialog, FormTextInput } from "../../components/primitives";
import { designTokens } from "../../theme/tokens";

export interface LoginScreenProps {
  onSubmit: (value: { email: string; password: string }) => Promise<void> | void;
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
  onDismiss: () => void;
}

export function LoginScreen({ onSubmit, onSwitchToRegister, onSwitchToForgotPassword, onDismiss }: LoginScreenProps): React.JSX.Element {
  const { t } = useTranslation(["common", "us1"]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  return (
    <AuthDialog
      testID="auth-login-screen"
      title={t("loginTitle", { ns: "us1" })}
      subtitle={t("restrictedSurfaceBody", { ns: "us1" })}
      accessibilityLabel={t("loginTitle", { ns: "us1" })}
      onDismiss={onDismiss}
    >
        <FormTextInput
          label={t("emailLabel", { ns: "us1" })}
          accessibilityLabel={t("emailLabel", { ns: "us1" })}
          value={email}
          onChangeText={(value) => {
            setSubmitError(null);
            setEmail(value);
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
          style={styles.input}
          testID="auth-login-email"
        />
        <FormTextInput
          label={t("passwordLabel", { ns: "us1" })}
          accessibilityLabel={t("passwordLabel", { ns: "us1" })}
          value={password}
          onChangeText={(value) => {
            setSubmitError(null);
            setPassword(value);
          }}
          secureTextEntry
          textContentType="password"
          style={styles.input}
          testID="auth-login-password"
        />
        <Button
          mode="contained"
          icon="login"
          buttonColor="#fef0e3"
          textColor="#111111"
          contentStyle={styles.mainButtonContent}
          style={styles.mainButton}
          accessibilityLabel={t("signIn", { ns: "us1" })}
          loading={submitting}
          onPress={() => {
            setSubmitError(null);
            setSubmitting(true);
            void Promise.resolve(onSubmit({ email, password }))
              .catch(() => {
                setSubmitError(t("authFailedMessage", { ns: "us1", defaultValue: "Sign in failed. Please verify your credentials and try again." }));
              })
              .finally(() => setSubmitting(false));
          }}
          testID="auth-login-submit"
        >
          {t("signIn", { ns: "us1" })}
        </Button>
        {submitError ? (
          <Text accessibilityRole="alert" style={styles.errorText}>
            {submitError}
          </Text>
        ) : null}
        <Button mode="text" icon="account-plus-outline" textColor="#ffffff" onPress={onSwitchToRegister}>
          {t("createAccount", { ns: "us1" })}
        </Button>
        <Button mode="text" icon="lock-reset" textColor="#ffffff" onPress={onSwitchToForgotPassword}>
          {t("forgotPassword", { ns: "us1" })}
        </Button>
    </AuthDialog>
  );
}

const styles = StyleSheet.create({
  input: {
    marginTop: designTokens.spacing.xs
  },
  errorText: {
    color: "#ffffff",
    textAlign: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: designTokens.radius.sm,
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.xs,
    marginTop: designTokens.spacing.sm
  },
  mainButton: {
    marginTop: designTokens.spacing.lg,
    width: "82%",
    alignSelf: "center",
    borderRadius: 15
  },
  mainButtonContent: {
    minHeight: 46
  }
});