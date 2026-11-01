import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { useTranslation } from "react-i18next";
import TokenSymbolSvg from "../../assets/img/TOKENS.svg";

interface TokenBalanceInfoProps {
  balance: number | null;
  loading?: boolean;
  error?: unknown;
  summary?: boolean;
  testID?: string;
}

/** Informational only: never a disabled button or an amount constraint. */
export function TokenBalanceInfo({
  balance,
  loading = false,
  error,
  summary = false,
  testID = "available-token-balance"
}: TokenBalanceInfoProps): React.JSX.Element {
  const { t, i18n } = useTranslation("common");
  const formattedBalance = typeof balance === "number" && Number.isFinite(balance)
    ? new Intl.NumberFormat(i18n.language).format(balance)
    : "—";

  return (
    <View style={styles.container}>
      {summary ? (
        <>
          <Text variant="labelMedium" style={styles.text}>
            {t("tokenBalanceLabel", { defaultValue: "Token balance" })}
          </Text>
          <View style={styles.amountRow}>
            <Text variant="headlineSmall" style={styles.text} testID={testID}>
              {formattedBalance}
            </Text>
            <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <TokenSymbolSvg width={28} height={28} color="#FE6E4E" />
            </View>
          </View>
        </>
      ) : (
        <Text variant="bodySmall" style={styles.text} testID={testID}>
          {t("tokenBalanceAvailableLabel", {
            defaultValue: "Available balance: {{balance}}",
            balance: formattedBalance
          })}
        </Text>
      )}
      {loading ? (
        <Text variant="bodySmall" style={styles.text}>
          {t("tokenBalanceLoadingLabel", { defaultValue: "Loading token balance..." })}
        </Text>
      ) : null}
      {error ? (
        <Text variant="bodySmall" style={styles.text}>
          {t("tokenBalanceLoadError", { defaultValue: "We could not update your balance." })}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  amountRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  text: { color: "#000000" }
});