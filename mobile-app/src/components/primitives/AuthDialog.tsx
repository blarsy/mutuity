import React from "react";
import type { PropsWithChildren } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Icon, Text } from "react-native-paper";

import { designTokens } from "../../theme/tokens";
import { appFontFamilies } from "../../theme/fonts";
import { ScreenContainer } from "./ScreenContainer";

export interface AuthDialogProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  accessibilityLabel?: string;
  testID?: string;
  onDismiss?: () => void;
}

export function AuthDialog({ title, subtitle, accessibilityLabel, testID, onDismiss, children }: AuthDialogProps): React.JSX.Element {
  return (
    <ScreenContainer testID={testID} style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View accessibilityLabel={accessibilityLabel ?? title} style={styles.dialog}>
          {onDismiss ? (
            <Pressable
              accessibilityLabel="Close"
              accessibilityRole="button"
              onPress={onDismiss}
              style={styles.dismissButton}
              hitSlop={8}
            >
              <Icon source="close" size={36} color="#ffffff" />
            </Pressable>
          ) : null}
          <Text accessibilityRole="header" variant="titleLarge" style={styles.title}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="bodyMedium" style={styles.subtitle}>
              {subtitle}
            </Text>
          ) : null}
          {children}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    justifyContent: "center"
  },
  scroll: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: designTokens.spacing.md
  },
  dialog: {
    backgroundColor: designTokens.colors.primary,
    borderRadius: 20,
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.xl,
    gap: designTokens.spacing.sm,
    marginHorizontal: designTokens.spacing.xs
  },
  dismissButton: {
    position: "absolute",
    top: designTokens.spacing.md,
    right: designTokens.spacing.md,
    zIndex: 1
  },
  title: {
    color: "#ffffff",
    fontSize: 38,
    lineHeight: 38,
    textTransform: "uppercase",
    textAlign: "center",
    fontFamily: appFontFamilies.title,
    marginBottom: designTokens.spacing.sm
  },
  subtitle: {
    color: "#ffffff",
    textAlign: "center",
    marginBottom: designTokens.spacing.md
  }
});