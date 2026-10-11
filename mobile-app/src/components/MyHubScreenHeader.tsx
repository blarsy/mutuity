import React, { type PropsWithChildren, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";

import { appFontFamilies } from "../theme/fonts";
import { designTokens } from "../theme/tokens";
import { ScreenContainer } from "./primitives";

export interface MyHubScreenHeaderProps {
  title: string;
  onBackToHub?: (() => void) | undefined;
  right?: ReactNode;
  testID?: string;
}

export function MyHubScreenHeader({
  title,
  onBackToHub,
  right,
  testID
}: MyHubScreenHeaderProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <View style={styles.headerRow} testID={testID}>
      <View style={styles.headerTitleGroup}>
        {onBackToHub ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("myHubBack", { ns: "us1" })}
            onPress={onBackToHub}
            style={styles.backButton}
            testID="my-hub-back-button"
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={designTokens.colors.primary} />
            <Text variant="labelLarge" style={styles.backLabel}>
              {t("myHubBack", { ns: "us1" })}
            </Text>
          </Pressable>
        ) : null}
        <Text accessibilityRole="header" variant="headlineSmall" style={styles.title}>
          {title}
        </Text>
      </View>
      {right ? <View style={styles.rightZone}>{right}</View> : null}
    </View>
  );
}

// Loading and error states must keep the spoke's escape route available.
export function MyHubScreenState({ children, ...headerProps }: PropsWithChildren<MyHubScreenHeaderProps>): React.JSX.Element {
  return (
    <ScreenContainer>
      <MyHubScreenHeader {...headerProps} />
      {children}
    </ScreenContainer>
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
    flex: 1,
    alignItems: "flex-start",
    gap: designTokens.spacing.xs
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
    gap: designTokens.spacing.xs
  },
  backLabel: {
    color: designTokens.colors.primary
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