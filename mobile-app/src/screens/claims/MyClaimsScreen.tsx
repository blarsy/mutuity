import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { ScreenContainer } from "../../components/primitives";
import { EmptyState } from "../../components/state/EmptyState";
import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";

export type ClaimDirection = "sent" | "received";

export interface MyClaimsScreenProps {
  direction: ClaimDirection;
}

export function MyClaimsScreen({ direction }: MyClaimsScreenProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <ScreenContainer testID={`my-claims-screen-${direction}`} style={styles.root}>
      <View style={styles.headerRow}>
        <Text accessibilityRole="header" variant="headlineSmall" style={styles.title}>
          {direction === "received"
            ? t("myClaimsReceivedTitle", { defaultValue: "Received claims" })
            : t("myClaimsSentTitle", { defaultValue: "Sent claims" })}
        </Text>
      </View>

      <EmptyState
        message={t("myClaimsEmpty", { defaultValue: "No claims found." })}
        actionLabel={t("refreshLabel", { defaultValue: "Refresh" })}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: designTokens.spacing.md,
    paddingTop: designTokens.spacing.lg
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: designTokens.spacing.sm
  },
  title: {
    fontFamily: appFontFamilies.title,
    textTransform: "uppercase",
    letterSpacing: 0.6
  }
});
