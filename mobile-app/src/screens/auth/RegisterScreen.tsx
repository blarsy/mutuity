import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { Button } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { AuthDialog, FormTextInput } from "../../components/primitives";
import { designTokens } from "../../theme/tokens";

export interface RegisterScreenProps {
  onSubmit: (value: { fullName: string; email: string; password: string; confirmPassword: string }) => Promise<void> | void;
  onDismiss: () => void;
}

export function RegisterScreen({ onSubmit, onDismiss }: RegisterScreenProps): React.JSX.Element {
  const { t } = useTranslation(["common", "us1"]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <AuthDialog
      testID="auth-register-screen"
      title={t("registerTitle", { ns: "us1" })}
      subtitle={t("restrictedSurfaceBody", { ns: "us1" })}
      accessibilityLabel={t("registerTitle", { ns: "us1" })}
      onDismiss={onDismiss}
    >
        <FormTextInput
          label={t("fullNameLabel", { ns: "us1" })}
          accessibilityLabel={t("fullNameLabel", { ns: "us1" })}
          value={fullName}
          onChangeText={setFullName}
          textContentType="name"
          style={styles.input}
          testID="auth-register-full-name"
        />
        <FormTextInput
          label={t("emailLabel", { ns: "us1" })}
          accessibilityLabel={t("emailLabel", { ns: "us1" })}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
          style={styles.input}
          testID="auth-register-email"
        />
        <FormTextInput
          label={t("passwordLabel", { ns: "us1" })}
          accessibilityLabel={t("passwordLabel", { ns: "us1" })}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="newPassword"
          style={styles.input}
          testID="auth-register-password"
        />
        <FormTextInput
          label={t("confirmPasswordLabel", { ns: "us1" })}
          accessibilityLabel={t("confirmPasswordLabel", { ns: "us1" })}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          textContentType="newPassword"
          style={styles.input}
          testID="auth-register-confirm-password"
        />
        <Button
          mode="contained"
          icon="account-plus-outline"
          buttonColor="#fef0e3"
          textColor="#111111"
          contentStyle={styles.mainButtonContent}
          style={styles.mainButton}
          accessibilityLabel={t("createAccount", { ns: "us1" })}
          loading={submitting}
          onPress={() => {
            setSubmitting(true);
            void Promise.resolve(onSubmit({ fullName, email, password, confirmPassword })).finally(() => setSubmitting(false));
          }}
          testID="auth-register-submit"
        >
          {t("createAccount", { ns: "us1" })}
        </Button>
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
    alignSelf: "center",
    borderRadius: 15
  },
  mainButtonContent: {
    minHeight: 46
  }
});