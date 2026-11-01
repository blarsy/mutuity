import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import { Button, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { AuthDialog, FormTextInput } from "../../components/primitives";
import { isPasswordResetRequiredError } from "../../services/auth/errors";
import { SocialLinkConfirmationError } from "../../services/socialAuth/confirmLink";
import { designTokens } from "../../theme/tokens";
import { SocialAuthButtons, type SocialProvider } from "./SocialAuthButtons";

const authInputTheme = { colors: { onSurfaceVariant: "rgba(255, 255, 255, 0.78)" } };

export interface SocialAuthNotice {
  status: "link_confirmation_required" | "password_reset_required" | "error" | "cancelled";
  provider: SocialProvider;
  email: string;
}

export interface LoginScreenProps {
  initialEmail?: string;
  socialAuthNotice?: SocialAuthNotice | undefined;
  onSubmit: (value: { email: string; password: string }) => Promise<void> | void;
  onSocialSignIn?: ((provider: SocialProvider) => Promise<void> | void) | undefined;
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: (email: string) => void;
  onDismiss: () => void;
}

export function LoginScreen({ initialEmail = "", socialAuthNotice, onSubmit, onSocialSignIn, onSwitchToRegister, onSwitchToForgotPassword, onDismiss }: LoginScreenProps): React.JSX.Element {
  const { t } = useTranslation(["common", "us1"]);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [socialProviderLoading, setSocialProviderLoading] = useState<SocialProvider | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [passwordResetRequired, setPasswordResetRequired] = useState(false);

  useEffect(() => {
    setEmail(initialEmail);
    setPassword("");
    setSubmitError(null);
    setPasswordResetRequired(false);
  }, [initialEmail, socialAuthNotice]);

  const noticeKey = socialAuthNotice?.status === "link_confirmation_required"
    ? "socialLinkRequiredMessage"
    : socialAuthNotice?.status === "password_reset_required"
      ? "passwordResetRequiredMessage"
      : socialAuthNotice?.status === "cancelled"
        ? "socialAuthCancelledMessage"
        : "socialAuthErrorMessage";

  return (
    <AuthDialog
      testID="auth-login-screen"
      title={t("loginTitle", { ns: "us1" })}
      accessibilityLabel={t("loginTitle", { ns: "us1" })}
      onDismiss={onDismiss}
    >
        {socialAuthNotice ? (
          <Text accessibilityRole="alert" style={styles.errorText} testID="auth-social-notice">
            {t(noticeKey, {
              ns: "us1",
              provider: socialAuthNotice.provider === "apple" ? "Apple" : "Google",
              email: socialAuthNotice.email || t("socialLinkRequiredNoEmail", { ns: "us1" })
            })}
          </Text>
        ) : null}
        <SocialAuthButtons
          loadingProvider={socialProviderLoading}
          onPress={onSocialSignIn ? async (provider) => {
            setSubmitError(null);
            setPasswordResetRequired(false);
            setSocialProviderLoading(provider);

            try {
              await onSocialSignIn(provider);
            } catch {
              setSubmitError(t("socialAuthErrorMessage", { ns: "us1" }));
            } finally {
              setSocialProviderLoading(null);
            }
          } : undefined}
        />
        <FormTextInput
          label={t("emailLabel", { ns: "us1" })}
          accessibilityLabel={t("emailLabel", { ns: "us1" })}
          value={email}
          onChangeText={(value) => {
            setSubmitError(null);
            setPasswordResetRequired(false);
            setEmail(value);
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
          textColor="#ffffff"
          placeholderTextColor="rgba(255, 255, 255, 0.78)"
          underlineColor="rgba(255, 255, 255, 0.7)"
          activeUnderlineColor="#ffffff"
          theme={authInputTheme}
          style={styles.input}
          testID="auth-login-email"
        />
        <FormTextInput
          label={t("passwordLabel", { ns: "us1" })}
          accessibilityLabel={t("passwordLabel", { ns: "us1" })}
          value={password}
          onChangeText={(value) => {
            setSubmitError(null);
            setPasswordResetRequired(false);
            setPassword(value);
          }}
          secureTextEntry
          textContentType="password"
          textColor="#ffffff"
          placeholderTextColor="rgba(255, 255, 255, 0.78)"
          underlineColor="rgba(255, 255, 255, 0.7)"
          activeUnderlineColor="#ffffff"
          theme={authInputTheme}
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
          disabled={submitting || socialProviderLoading !== null}
          onPress={async () => {
            setSubmitError(null);
            setPasswordResetRequired(false);
            setSubmitting(true);
            try {
              await onSubmit({ email, password });
            } catch (error) {
              if (isPasswordResetRequiredError(error)) {
                setPasswordResetRequired(true);
                setSubmitError(t("passwordResetRequiredMessage", { ns: "us1" }));
              } else if (error instanceof SocialLinkConfirmationError) {
                setSubmitError(t("socialLinkFailedMessage", { ns: "us1" }));
              } else {
                setSubmitError(t("authFailedMessage", { ns: "us1", defaultValue: "Sign in failed. Please verify your credentials and try again." }));
              }
            } finally {
              setSubmitting(false);
            }
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
        {passwordResetRequired || socialAuthNotice?.status === "password_reset_required" ? (
          <Button
            mode="contained"
            icon="lock-reset"
            buttonColor="#fef0e3"
            textColor="#111111"
            onPress={() => onSwitchToForgotPassword(email.trim())}
            testID="auth-login-reset-password"
          >
            {t("passwordResetRequiredButton", { ns: "us1" })}
          </Button>
        ) : null}
        <Button mode="text" icon="account-plus-outline" textColor="#ffffff" onPress={onSwitchToRegister}>
          {t("createAccount", { ns: "us1" })}
        </Button>
        <Button mode="text" icon="lock-reset" textColor="#ffffff" onPress={() => onSwitchToForgotPassword(email.trim())}>
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