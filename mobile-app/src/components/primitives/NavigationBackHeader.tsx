import React from "react";
import { StyleSheet, View } from "react-native";
import { IconButton } from "react-native-paper";
import { useTranslation } from "react-i18next";

export interface NavigationBackHeaderProps {
  onBack?: (() => void) | undefined;
  accessibilityLabel?: string | undefined;
  children?: React.ReactNode;
}

export function NavigationBackHeader({ children, onBack, accessibilityLabel }: NavigationBackHeaderProps): React.JSX.Element | null {
  const { t } = useTranslation();

  if (!onBack) {
    return null;
  }

  return (
    <View style={styles.root}>
      <IconButton
        icon="arrow-left"
        size={ICON_SIZE}
        onPress={onBack}
        accessibilityLabel={accessibilityLabel ?? t("backLabel", { defaultValue: "Back" })}
        style={styles.backButton}
      />
      {children}
    </View>
  );
}

const ICON_SIZE = 32;
// Paper adds 6 of margin and a 1.5x container around the icon; halve that vertical blank space.
const BACK_BUTTON_MARGIN_VERTICAL = 3;
const BACK_BUTTON_HEIGHT = ICON_SIZE + 8;

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    flexDirection: "row"
  },
  backButton: {
    marginVertical: BACK_BUTTON_MARGIN_VERTICAL,
    height: BACK_BUTTON_HEIGHT
  }
});