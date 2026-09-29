import React, { useState } from "react";
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { Icon } from "react-native-paper";

import { CampaignExplainerDialog } from "../campaignExplainer/CampaignExplainerDialog";
import { designTokens } from "../../theme/tokens";

export interface CampaignExplainerButtonProps {
  /** Optional accessibility label for the help icon. */
  accessibilityLabel?: string;
  /** Optional testID for the help icon. */
  testID?: string;
  /** Optional style applied to the pressable icon. */
  style?: StyleProp<ViewStyle>;
  /** Optional color for the help icon. Defaults to the primary color. */
  color?: string;
  /** Optional icon size. Defaults to 15. */
  size?: number;
}

/**
 * A small "help" pressable icon that opens the campaign explainer dialog.
 * Mirrors the explainer affordance used on the TokenAmount component.
 */
export function CampaignExplainerButton({
  accessibilityLabel,
  testID,
  style,
  color = designTokens.colors.primary,
  size = 15
}: CampaignExplainerButtonProps): React.JSX.Element {
  const [explainerVisible, setExplainerVisible] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        {...(accessibilityLabel ? { accessibilityLabel } : {})}
        {...(testID ? { testID } : {})}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        onPress={() => setExplainerVisible(true)}
        hitSlop={8}
        style={[styles.explainerButton, style]}
      >
        <Icon source="help" size={size} color={pressed ? designTokens.colors.primary : color} />
      </Pressable>

      <CampaignExplainerDialog
        visible={explainerVisible}
        onClose={() => setExplainerVisible(false)}
        testID="campaign-explainer-dialog"
      />
    </>
  );
}

const styles = StyleSheet.create({
  explainerButton: {
    padding: 2
  }
});