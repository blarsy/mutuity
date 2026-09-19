import React, { useState } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Icon, Text } from "react-native-paper";
import TokenSymbolSvg from '../assets/img/TOKENS.svg';
import { TokenExplainerDialog } from "./tokenExplainer/TokenExplainerDialog";
import { designTokens } from "../theme/tokens";

export interface TokenAmountProps {
  amount: number;
  size?: number;
  textColor?: string;
  containerStyle?: StyleProp<ViewStyle>;
  showExplainer?: boolean;
  explainerAccessibilityLabel?: string;
}

export function TokenAmount({
  amount,
  size = 36,
  textColor = "#2F241D",
  containerStyle,
  showExplainer = true,
  explainerAccessibilityLabel
}: TokenAmountProps): React.JSX.Element {
  const safeAmount = Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0;
  const [explainerVisible, setExplainerVisible] = useState(false);
  const [explainerPressed, setExplainerPressed] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      <Text variant="labelMedium" style={[styles.text, { color: textColor }]}>
        {safeAmount}
      </Text>
      <View testID="token-amount-icon" style={styles.icon}>
        <TokenSymbolSvg width={size} height={size} color="#FE6E4E" />
      </View>
      {showExplainer ? (
        <Pressable
          accessibilityRole="button"
          {...(explainerAccessibilityLabel ? { accessibilityLabel: explainerAccessibilityLabel } : {})}
          testID="token-amount-explainer-button"
          onPressIn={() => setExplainerPressed(true)}
          onPressOut={() => setExplainerPressed(false)}
          onPress={() => setExplainerVisible(true)}
          hitSlop={8}
          style={styles.explainerButton}
        >
          <Icon
            source="help"
            size={15}
            color={explainerPressed ? designTokens.colors.primary : textColor}
          />
        </Pressable>
      ) : null}

      <TokenExplainerDialog
        visible={explainerVisible}
        onClose={() => setExplainerVisible(false)}
        testID="token-amount-explainer-dialog"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start"
  },
  text: {
    fontWeight: "700",
    fontSize: 22,
    lineHeight: 28
  },
  icon: {
    marginLeft: 2
  },
  explainerButton: {
    alignItems: "flex-start",
    justifyContent: "center"
  }
});
