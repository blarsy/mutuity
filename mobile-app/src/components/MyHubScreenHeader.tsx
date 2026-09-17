import React, { type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { appFontFamilies } from "../theme/fonts";
import { designTokens } from "../theme/tokens";

export interface MyHubScreenHeaderProps {
  title: string;
  onOpenDrawer?: (() => void) | undefined;
  right?: ReactNode;
  testID?: string;
}

export function MyHubScreenHeader({
  title,
  onOpenDrawer,
  right,
  testID
}: MyHubScreenHeaderProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <View style={styles.headerRow} testID={testID}>
      <View style={styles.headerTitleGroup}>
        {onOpenDrawer ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={t("myHubLabel", { ns: "us1" })}
            onPress={onOpenDrawer}
            style={styles.breadcrumbRootLink}
            testID="my-hub-drawer-open-button"
          >
            <Text variant="headlineSmall" style={styles.breadcrumbRootLinkText}>
              {t("myHubLabel", { ns: "us1" })}
            </Text>
          </Pressable>
        ) : null}
        <Text accessibilityRole="header" variant="headlineSmall" style={styles.title}>
           - {title}
        </Text>
      </View>
      {right ? <View style={styles.rightZone}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: designTokens.spacing.sm
  },
  headerTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: designTokens.spacing.xs
  },
  breadcrumbRootLink: {
    paddingVertical: designTokens.spacing.xs
  },
  breadcrumbRootLinkText: {
    fontFamily: appFontFamilies.title,
    color: designTokens.colors.primary,
    textDecorationLine: "underline",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    textAlignVertical: "center",
    paddingTop: 8
  },
  rightZone: {
    flexDirection: "row",
    alignItems: "center",
    gap: designTokens.spacing.sm
  },
  title: {
    fontFamily: appFontFamilies.title,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    includeFontPadding: false,
    textAlignVertical: "center",
    paddingTop: 8
  }
});