import React from "react";
import { IconButton } from "react-native-paper";
import { useTranslation } from "react-i18next";

export interface MyHubDrawerButtonProps {
  onPress: () => void;
}

// Left header element of every "My Hub" child screen, opens the section drawer.
export function MyHubDrawerButton({ onPress }: MyHubDrawerButtonProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <IconButton
      icon="apps"
      size={24}
      accessibilityLabel={t("openMyHubDrawerLabel", { ns: "us1", defaultValue: "Open menu" })}
      onPress={onPress}
      style={{ margin: 0 }}
      testID="my-hub-drawer-open-button"
    />
  );
}
