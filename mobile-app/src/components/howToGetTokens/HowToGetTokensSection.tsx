import React from "react";
import { StyleSheet, View } from "react-native";
import { Card, IconButton, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { HOW_TO_GET_TOKENS_OPPORTUNITIES, type HowToGetTokensOpportunityId } from "../../features/howToGetTokens";
import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";

export interface HowToGetTokensSectionProps {
  /** Invoked when the user taps "go" on an opportunity. */
  onGoToOpportunity: (id: HowToGetTokensOpportunityId) => void;
  testID?: string;
}

export function HowToGetTokensSection({
  onGoToOpportunity,
  testID
}: HowToGetTokensSectionProps): React.JSX.Element {
  const { t } = useTranslation();

  const optionalProps = {
    ...(testID !== undefined ? { testID } : {})
  };

  return (
    <Card style={styles.card} {...optionalProps}>
      <Card.Content style={styles.cardContent}>
        <Text variant="titleMedium" style={styles.title}>
          {t("howToGetTokens.title", { defaultValue: "Topes earning opportunities" })}
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {t("howToGetTokens.subtitle", {
            defaultValue: "Use these actions to earn Topes through profile milestones, resource activity, needs, and campaigns."
          })}
        </Text>

        <View style={styles.list}>
          {HOW_TO_GET_TOKENS_OPPORTUNITIES.map((opportunity) => (
            <View key={opportunity.id} style={styles.row}>
              <Text variant="bodyMedium" style={styles.rowText}>
                {t(`howToGetTokens.items.${opportunity.id}`, {
                  defaultValue: opportunity.id
                })}
              </Text>

              <View style={styles.rowAction}>
                <Text variant="bodyMedium" style={styles.rewardText}>
                  {opportunity.amount === null
                    ? t("howToGetTokens.variableAmount", { defaultValue: "Variable" })
                    : `+ ${opportunity.amount}`}
                </Text>
                <IconButton
                  accessibilityLabel={t("howToGetTokens.goButton", {
                    defaultValue: "Go"
                  })}
                  accessibilityRole="button"
                  icon="arrow-right"
                  size={30}
                  style={styles.goButton}
                  onPress={() => onGoToOpportunity(opportunity.id)}
                />
              </View>
            </View>
          ))}
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: designTokens.colors.secondary,
    borderRadius: designTokens.radius.md
  },
  cardContent: {
    gap: designTokens.spacing.sm
  },
  title: {
    fontFamily: appFontFamilies.altGeneral
  },
  subtitle: {
    opacity: 0.8
  },
  list: {
    gap: designTokens.spacing.xs
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: designTokens.spacing.sm
  },
  rowText: {
    flex: 1,
    fontFamily: appFontFamilies.general
  },
  rowAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: designTokens.spacing.xs
  },
  rewardText: {
    fontFamily: appFontFamilies.altGeneral,
    minWidth: 44,
    textAlign: "right"
  },
  goButton: {
    margin: 0
  }
});