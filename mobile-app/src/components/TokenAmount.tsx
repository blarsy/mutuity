import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Text } from "react-native-paper";
import TokenSymbolSvg from '../assets/img/TOKENS.svg';

export interface TokenAmountProps {
  amount: number;
  size?: number;
  textColor?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function TokenAmount({ amount, size = 36, textColor = "#2F241D", containerStyle }: TokenAmountProps): React.JSX.Element {
  const safeAmount = Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0;

  return (
    <View style={[styles.container, containerStyle]}>
      <Text variant="labelMedium" style={[styles.text, { color: textColor }]}>
        {safeAmount}
      </Text>
      <View testID="token-amount-icon" style={styles.icon}>
        <TokenSymbolSvg width={size} height={size} color="#FE6E4E" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4
  },
  text: {
    fontWeight: "700",
    fontSize: 22,
    lineHeight: 28
  },
  icon: {
    marginLeft: 2
  }
});
