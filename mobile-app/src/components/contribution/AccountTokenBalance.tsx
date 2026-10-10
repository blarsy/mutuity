import React from "react";
import { Text, type TextProps } from "react-native-paper";
import { useTokenBalance } from "../../services/realtime/useTokenBalance";

export interface AccountTokenBalanceProps {
  accountId?: string | null;
  /** Explicit null displays an unknown balance and disables remote loading. */
  balance?: number | null;
  enabled?: boolean;
  style?: TextProps<React.JSX.Element>["style"];
  testID?: string;
}

export function AccountTokenBalance({
  accountId = null,
  balance,
  enabled = true,
  style,
  testID = "account-token-balance"
}: AccountTokenBalanceProps): React.JSX.Element {
  const remote = useTokenBalance(accountId, enabled && balance === undefined && Boolean(accountId));
  const value = balance !== undefined ? balance : remote.balance;
  return (
    <Text variant="headlineMedium" style={style} testID={testID}>
      {typeof value === "number" && Number.isFinite(value) ? value : "—"}
    </Text>
  );
}