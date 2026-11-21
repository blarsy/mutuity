import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { AppButton as Button } from "../../components/primitives/AppButton";
import { useTranslation } from "react-i18next";

import { AuthDialog, FormTextInput } from "../../components/primitives";
import { designTokens } from "../../theme/tokens";

const authInputTheme = { colors: { onSurfaceVariant: "rgba(255, 255, 255, 0.78)" } };

export interface RegisterScreenProps {
  onSubmit: (value: { fullName: string; email: string; password: string; confirmPassword: string }, context?: { provider?: "google" | "apple" | undefined; providerSubject?: string | undefined; providerEmail?: string | undefined; providerEmailVerified?: boolean | undefined; pendingRegistrationToken?: string | undefined }) => Promise<void> | void;
  initialValues?: { fullName?: string | undefined; email?: string | undefined };
  socialContext?: { provider?: "google" | "apple" | undefined; providerSubject?: string | undefined; providerEmail?: string | undefined; providerEmailVerified?: boolean | undefined; pendingRegistrationToken?: string | undefined } | undefined;
  onSwitchToSignIn?: () => void;
  onDismiss: () => void;
}

export function RegisterScreen({ onSubmit, initialValues, socialContext, onSwitchToSignIn, onDismiss }: RegisterScreenProps): React.JSX.Element {
  const { t } = useTranslation(["common", "us1"]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const socialRegistration = Boolean(socialContext?.provider && socialContext.providerSubject);

  const normalizedEmail = email.trim().toLowerCase();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
  const validPassword = socialRegistration
    ? (!password && !confirmPassword) || (password.length >= 8 && password === confirmPassword)
    : password.length >= 8 && password === confirmPassword;
  const canSubmit = fullName.trim().length > 0 && validEmail && validPassword && !submitting;

  useEffect(() => {
    setFullName(initialValues?.fullName ?? "");
    setEmail(initialValues?.email ?? "");
  }, [initialValues?.fullName, initialValues?.email]);

  return (
    <AuthDialog
      testID="auth-register-screen"
      title={t("registerTitle", { ns: "us1" })}
      accessibilityLabel={t("registerTitle", { ns: "us1" })}
      onDismiss={onDismiss}
    >
        <FormTextInput
          label={t("fullNameLabel", { ns: "us1" })}
          accessibilityLabel={t("fullNameLabel", { ns: "us1" })}
          value={fullName}
          onChangeText={setFullName}
          textContentType="name"
          textColor="#ffffff"
          placeholderTextColor="rgba(255, 255, 255, 0.78)"
          underlineColor="rgba(255, 255, 255, 0.7)"
          activeUnderlineColor="#ffffff"
          theme={authInputTheme}
          style={styles.input}
          testID="auth-register-full-name"
        />
        <FormTextInput
          label={t("emailLabel", { ns: "us1" })}
          accessibilityLabel={t("emailLabel", { ns: "us1" })}
          value={email}
          onChangeText={(value) => {
            setSubmitError(null);
            setEmail(value);
          }}
          editable={!socialRegistration || !socialContext?.providerEmailVerified}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
          textColor="#ffffff"
          placeholderTextColor="rgba(255, 255, 255, 0.78)"
          underlineColor="rgba(255, 255, 255, 0.7)"
          activeUnderlineColor="#ffffff"
          theme={authInputTheme}
          style={styles.input}
          testID="auth-register-email"
        />
        <FormTextInput
          label={socialRegistration ? t("optionalPasswordLabel", { ns: "us1" }) : t("passwordLabel", { ns: "us1" })}
          accessibilityLabel={t("passwordLabel", { ns: "us1" })}
          value={password}
          onChangeText={(value) => {
            setSubmitError(null);
            setPassword(value);
          }}
          secureTextEntry
          textContentType="newPassword"
          textColor="#ffffff"
          placeholderTextColor="rgba(255, 255, 255, 0.78)"
          underlineColor="rgba(255, 255, 255, 0.7)"
          activeUnderlineColor="#ffffff"
          theme={authInputTheme}
          style={styles.input}
          testID="auth-register-password"
        />
        <FormTextInput
          label={t("confirmPasswordLabel", { ns: "us1" })}
          accessibilityLabel={t("confirmPasswordLabel", { ns: "us1" })}
          value={confirmPassword}
          onChangeText={(value) => {
            setSubmitError(null);
            setConfirmPassword(value);
          }}
          secureTextEntry
          textContentType="newPassword"
          textColor="#ffffff"
          placeholderTextColor="rgba(255, 255, 255, 0.78)"
          underlineColor="rgba(255, 255, 255, 0.7)"
          activeUnderlineColor="#ffffff"
          theme={authInputTheme}
          style={styles.input}
          testID="auth-register-confirm-password"
        />
        <Button
          mode="contained"
          flavor="authPrimary"
          icon="account-plus-outline"
          contentStyle={styles.mainButtonContent}
          style={styles.mainButton}
          accessibilityLabel={t("createAccount", { ns: "us1" })}
          loading={submitting}
          disabled={!canSubmit}
          onPress={async () => {
            setSubmitting(true);
            setSubmitError(null);
            try {
              if (socialRegistration && !socialContext?.pendingRegistrationToken) {
                throw new Error(t("socialAuthErrorMessage", { ns: "us1" }));
              }
              await onSubmit({ fullName: fullName.trim(), email: normalizedEmail, password, confirmPassword }, socialContext);
            } catch (error) {
              setSubmitError(error instanceof Error ? error.message : t("authFailedMessage", { ns: "us1" }));
            } finally {
              setSubmitting(false);
            }
          }}
          testID="auth-register-submit"
        >
          {t("createAccount", { ns: "us1" })}
        </Button>
        {submitError ? <Text accessibilityRole="alert" style={styles.errorText}>{submitError}</Text> : null}
        {onSwitchToSignIn ? (
          <Button mode="text" flavor="inverse" icon="login" onPress={onSwitchToSignIn}>
            {t("backToSignIn", { ns: "us1" })}
          </Button>
        ) : null}
    </AuthDialog>
  );
}

const styles = StyleSheet.create({
  input: {
    marginTop: designTokens.spacing.xs
  },
  mainButton: {
    marginTop: designTokens.spacing.lg,
    width: "82%",
    alignSelf: "center"
  },
  mainButtonContent: {
    minHeight: 46
  },
  errorText: {
    color: "#ffd2cc",
    textAlign: "center",
    marginTop: designTokens.spacing.sm
  }
});