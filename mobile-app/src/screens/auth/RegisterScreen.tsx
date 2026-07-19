import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { AuthDialog } from "../../components/primitives";
import { designTokens } from "../../theme/tokens";

export interface RegisterScreenProps {
  onSubmit: (value: { fullName: string; email: string; password: string; confirmPassword: string }) => Promise<void> | void;
  onSwitchToSignIn: () => void;
  onCancel: () => void;
}

export function RegisterScreen({ onSubmit, onSwitchToSignIn, onCancel }: RegisterScreenProps): React.JSX.Element {
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
    >
        <TextInput
          mode="flat"
          label={t("fullNameLabel", { ns: "us1" })}
          accessibilityLabel={t("fullNameLabel", { ns: "us1" })}
          value={fullName}
          onChangeText={setFullName}
          textContentType="name"
          underlineColor="#ffffff"
          activeUnderlineColor="#ffffff"
          textColor="#ffffff"
          theme={{ colors: { onSurfaceVariant: "#f6d2c6" } }}
          placeholderTextColor="#f6d2c6"
          style={styles.input}
          testID="auth-register-full-name"
        />
        <TextInput
          mode="flat"
          label={t("emailLabel", { ns: "us1" })}
          accessibilityLabel={t("emailLabel", { ns: "us1" })}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
          underlineColor="#ffffff"
          activeUnderlineColor="#ffffff"
          textColor="#ffffff"
          theme={{ colors: { onSurfaceVariant: "#f6d2c6" } }}
          placeholderTextColor="#f6d2c6"
          style={styles.input}
          testID="auth-register-email"
        />
        <TextInput
          mode="flat"
          label={t("passwordLabel", { ns: "us1" })}
          accessibilityLabel={t("passwordLabel", { ns: "us1" })}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="newPassword"
          underlineColor="#ffffff"
          activeUnderlineColor="#ffffff"
          textColor="#ffffff"
          theme={{ colors: { onSurfaceVariant: "#f6d2c6" } }}
          placeholderTextColor="#f6d2c6"
          style={styles.input}
          testID="auth-register-password"
        />
        <TextInput
          mode="flat"
          label={t("confirmPasswordLabel", { ns: "us1" })}
          accessibilityLabel={t("confirmPasswordLabel", { ns: "us1" })}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          textContentType="newPassword"
          underlineColor="#ffffff"
          activeUnderlineColor="#ffffff"
          textColor="#ffffff"
          theme={{ colors: { onSurfaceVariant: "#f6d2c6" } }}
          placeholderTextColor="#f6d2c6"
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
        <Button mode="text" icon="login" textColor="#ffffff" onPress={onSwitchToSignIn}>
          {t("signIn", { ns: "us1" })}
        </Button>
        <Button mode="text" icon="close" textColor="#ffffff" onPress={onCancel}>
          {t("cancel", { ns: "us1" })}
        </Button>
    </AuthDialog>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: designTokens.colors.primary,
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