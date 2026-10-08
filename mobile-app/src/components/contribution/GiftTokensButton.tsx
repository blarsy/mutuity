import React, { useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, IconButton, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { FormTextInput, ThemedDialog } from "../primitives";
import { useCurrentAccount } from "../../services/auth/useCurrentAccount";
import { getGiftErrorMessage, giftTokens } from "../../services/graphql/contribution";

type GiftTokensButtonProps = {
  recipientAccountId: string;
  recipientDisplayName?: string | null | undefined;
};

export function parseGiftAmount(value: string): number | null {
  const amount = Number(value);
  return Number.isInteger(amount) && amount > 0 && amount <= 2147483647 ? amount : null;
}

export function GiftTokensButton({ recipientAccountId, recipientDisplayName }: GiftTokensButtonProps): React.JSX.Element | null {
  const { authenticated, accountId } = useCurrentAccount();
  const { t } = useTranslation("us4");
  const [open, setOpen] = useState(false);

  if (!authenticated || !accountId || !recipientAccountId || accountId === recipientAccountId) return null;

  return (
    <>
      <IconButton
        icon="hand-heart"
        size={32}
        accessibilityLabel={t("giftForm.title")}
        onPress={() => setOpen(true)}
      />
      {open ? (
        <GiftTokensDialog
          key={recipientAccountId}
          recipientAccountId={recipientAccountId}
          recipientDisplayName={recipientDisplayName}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

export function GiftTokensDialog({ recipientAccountId, recipientDisplayName, onClose }: GiftTokensButtonProps & { onClose: () => void }): React.JSX.Element {
  const { t } = useTranslation("us4");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inFlight = useRef(false);
  const parsedAmount = parseGiftAmount(amount);

  const handleGift = async (): Promise<void> => {
    if (inFlight.current || sent || parsedAmount === null) return;
    inFlight.current = true;
    setLoading(true);
    setErrorMessage(null);
    try {
      await giftTokens(recipientAccountId, parsedAmount, message);
      setSent(true);
    } catch (error) {
      setErrorMessage(getGiftErrorMessage(error, t("giftForm.error"), t("giftForm.signInRequired")));
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  };

  const handleClose = (): void => {
    if (!inFlight.current) onClose();
  };

  return (
    <ThemedDialog
      visible
      title={t("giftForm.title")}
      onDismiss={handleClose}
      content={
        <ScrollView keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <Text variant="bodyMedium">
              {recipientDisplayName ? t("giftForm.recipient", { name: recipientDisplayName }) : t("giftForm.subtitle")}
            </Text>
            {sent ? <Text accessibilityRole="alert">{t("giftSent")}</Text> : (
              <>
                {errorMessage ? <Text accessibilityRole="alert">{errorMessage}</Text> : null}
                <FormTextInput
                  autoFocus
                  label={t("giftForm.amountLabel")}
                  accessibilityLabel={t("giftForm.amountLabel")}
                  keyboardType="number-pad"
                  disabled={loading}
                  value={amount}
                  onChangeText={setAmount}
                />
                <FormTextInput
                  label={t("giftForm.messageLabel")}
                  accessibilityLabel={t("giftForm.messageLabel")}
                  multiline
                  numberOfLines={2}
                  disabled={loading}
                  value={message}
                  onChangeText={setMessage}
                />
              </>
            )}
          </View>
        </ScrollView>
      }
      actions={[
        <Button key="close" disabled={loading} onPress={handleClose}>{t("giftForm.closeButton")}</Button>,
        ...(!sent ? [
          <Button key="send" mode="contained" loading={loading} disabled={loading || parsedAmount === null} onPress={() => void handleGift()}>
            {loading ? t("giftForm.sendingButton") : t("giftForm.sendButton")}
          </Button>
        ] : [])
      ]}
    />
  );
}

const styles = StyleSheet.create({
  content: { gap: 16, paddingTop: 12 }
});