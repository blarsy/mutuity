import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { AuthDialog } from "../../components/primitives";
import { designTokens } from "../../theme/tokens";

export interface ForgotPasswordScreenProps {
  onSubmit: (value: { email: string }) => Promise<void> | void;
  onSwitchToSignIn: () => void;
  onCancel: () => void;
}

export function ForgotPasswordScreen({ onSubmit, onSwitchToSignIn, onCancel }: ForgotPasswordScreenProps): React.JSX.Element {
  const { t } = useTranslation(["common", "us1"]);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <AuthDialog
      testID="auth-forgot-password-screen"
      title={t("forgotPasswordTitle", { ns: "us1" })}
      subtitle={t("restrictedSurfaceBody", { ns: "us1" })}
      accessibilityLabel={t("forgotPasswordTitle", { ns: "us1" })}
    >
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
          testID="auth-forgot-password-email"
        />
        <Button
          mode="contained"
          icon="email-fast-outline"
          buttonColor="#fef0e3"
          textColor="#111111"
          contentStyle={styles.mainButtonContent}
          style={styles.mainButton}
          accessibilityLabel={t("sendResetLink", { ns: "us1" })}
          loading={submitting}
          onPress={() => {
            setSubmitting(true);
            void Promise.resolve(onSubmit({ email })).finally(() => setSubmitting(false));
          }}
          testID="auth-forgot-submit"
        >
          {t("sendResetLink", { ns: "us1" })}
        </Button>
        <Button mode="text" icon="login" textColor="#ffffff" onPress={onSwitchToSignIn}>
          {t("backToSignIn", { ns: "us1" })}
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