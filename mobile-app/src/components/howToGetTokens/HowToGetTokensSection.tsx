import React from "react";
import { StyleSheet, View } from "react-native";
import { Card, Icon, IconButton, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import {
  HOW_TO_GET_TOKENS_OPPORTUNITIES,
  type HowToGetTokensOpportunity,
  type HowToGetTokensOpportunityId,
  type HowToGetTokensProgress
} from "../../features/howToGetTokens";
import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";

export interface HowToGetTokensSectionProps {
  /** Invoked when the user taps "go" on an opportunity. */
  onGoToOpportunity: (id: HowToGetTokensOpportunityId) => void;
  /**
   * Current progress through the opportunities. When omitted, every
   * opportunity is rendered as pending.
   */
  progress?: HowToGetTokensProgress;
  testID?: string;
}

export function HowToGetTokensSection({
  onGoToOpportunity,
  progress,
  testID
}: HowToGetTokensSectionProps): React.JSX.Element {
  const { t } = useTranslation();

  const optionalProps = {
    ...(testID !== undefined ? { testID } : {})
  };

  const completed = new Set(progress?.completed ?? []);
  const remaining = progress?.remaining ?? {};

  const renderOpportunity = (opportunity: HowToGetTokensOpportunity): React.JSX.Element => {
    const isDone = completed.has(opportunity.id);
    const remainingCount = remaining[opportunity.id];

    return (
      <View key={opportunity.id} style={styles.row}>
        <View style={styles.rowTextWrap}>
          <Text variant="bodyMedium" style={styles.rowText}>
            {t(`howToGetTokens.items.${opportunity.id}`, {
              defaultValue: opportunity.id
            })}
          </Text>
          {remainingCount !== undefined && remainingCount > 0 ? (
            <Text variant="bodySmall" style={styles.rewardsRemainingText}>
              {t("howToGetTokens.rewardsRemaining", {
                count: remainingCount,
                defaultValue: "{{count}} reward to reap",
                defaultValue_plural: "{{count}} rewards to reap"
              })}
            </Text>
          ) : null}
        </View>

        <View style={styles.rowAction}>
          {isDone ? (
            <View style={styles.doneIcon} testID="how-to-get-tokens-done">
              <Icon source="check-circle" size={30} color="#4BB543" />
            </View>
          ) : (
            <>
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
            </>
          )}
        </View>
      </View>
    );
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
          {HOW_TO_GET_TOKENS_OPPORTUNITIES.map(renderOpportunity)}
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
    fontFamily: appFontFamilies.general
  },
  rowTextWrap: {
    flex: 1,
    flexDirection: "column",
    gap: designTokens.spacing.xs
  },
  rewardsRemainingText: {
    fontFamily: appFontFamilies.altGeneral,
    color: designTokens.colors.primary,
    fontStyle: "italic"
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
  },
  doneIcon: {
    marginHorizontal: designTokens.spacing.xs
  }
});