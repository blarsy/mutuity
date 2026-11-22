import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Icon, Portal, Snackbar, Text } from "react-native-paper";

import { AppButton as Button } from "../../components/primitives/AppButton";
import { useTranslation } from "react-i18next";

import { AuthDialog, FormTextInput } from "../../components/primitives";
import { designTokens } from "../../theme/tokens";

const authInputTheme = { colors: { onSurfaceVariant: "rgba(255, 255, 255, 0.78)" } };
const successTextColor = "#1b5e32";

export interface ForgotPasswordScreenProps {
  initialEmail?: string;
  onSubmit: (value: { email: string }) => Promise<void> | void;
  onSwitchToSignIn?: () => void;
  onDismiss: () => void;
}

export function ForgotPasswordScreen({ initialEmail = "", onSubmit, onSwitchToSignIn, onDismiss }: ForgotPasswordScreenProps): React.JSX.Element {
  const { t } = useTranslation(["common", "us1"]);
  const [email, setEmail] = useState(initialEmail);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<"success" | "error" | null>(null);

  return (
    <>
      <AuthDialog
        testID="auth-forgot-password-screen"
        title={t("forgotPasswordTitle", { ns: "us1" })}
        accessibilityLabel={t("forgotPasswordTitle", { ns: "us1" })}
        onDismiss={onDismiss}
      >
        <FormTextInput
          label={t("emailLabel", { ns: "us1" })}
          accessibilityLabel={t("emailLabel", { ns: "us1" })}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
          textColor="#ffffff"
          placeholderTextColor="rgba(255, 255, 255, 0.78)"
          underlineColor="rgba(255, 255, 255, 0.7)"
          activeUnderlineColor="#ffffff"
          theme={authInputTheme}
          style={styles.input}
          testID="auth-forgot-password-email"
        />
        <Button
          mode="contained"
          flavor="authPrimary"
          icon="email-fast-outline"
          contentStyle={styles.mainButtonContent}
          style={styles.mainButton}
          accessibilityLabel={t("sendResetLink", { ns: "us1" })}
          loading={submitting}
          disabled={submitting || submitted}
          onPress={async () => {
            setSubmitting(true);
            setFeedback(null);
            try {
              await onSubmit({ email: email.trim() });
              setSubmitted(true);
              setFeedback("success");
            } catch {
              setFeedback("error");
            } finally {
              setSubmitting(false);
            }
          }}
          testID="auth-forgot-submit"
        >
          {t("sendResetLink", { ns: "us1" })}
        </Button>
        {onSwitchToSignIn ? (
          <Button mode="text" flavor="inverse" icon="login" onPress={onSwitchToSignIn}>
            {t("backToSignIn", { ns: "us1" })}
          </Button>
        ) : null}
      </AuthDialog>
      <Portal>
        <Snackbar
          duration={Infinity}
          visible={feedback !== null}
          onDismiss={() => setFeedback(null)}
          style={feedback === "success" ? styles.successSnackbar : undefined}
          testID="auth-forgot-feedback"
          {...(feedback === "success" && onSwitchToSignIn
            ? { action: { label: t("backToSignIn", { ns: "us1" }), onPress: onSwitchToSignIn, textColor: successTextColor } }
            : {})}
        >
          {feedback === "success" ? (
            <View style={styles.successContent}>
              <View testID="auth-forgot-success-icon" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <Icon source="email-outline" size={24} color={successTextColor} />
              </View>
              <Text variant="bodyMedium" style={styles.successMessage}>
                {t("forgotPasswordSuccessMessage", { ns: "us1" })}
              </Text>
            </View>
          ) : feedback === "error" ? t("forgotPasswordErrorMessage", { ns: "us1" }) : ""}
        </Snackbar>
      </Portal>
    </>
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
  successSnackbar: {
    backgroundColor: "#dff2e3"
  },
  successContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: designTokens.spacing.sm
  },
  successMessage: {
    color: successTextColor,
    flexShrink: 1
  }
});