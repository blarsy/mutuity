import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Chip, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { PrimaryButton, ScreenContainer } from "../../components/primitives";
import { EmptyState } from "../../components/state/EmptyState";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { fetchMyNeeds, type NeedItem } from "../../services/graphql/needs";
import { NeedIntensity } from "../../services/graphql/generated";
import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";

export interface MyNeedsScreenProps {
  creatorAccountId: string | null;
  refreshToken?: number;
  onAddNeed: () => void;
  onEditNeed: (need: NeedItem) => void;
  injectedNeeds?: NeedItem[];
  injectedLoading?: boolean;
  injectedErrorMessage?: string | null;
}

function intensityLabelMeta(intensity: NeedIntensity): { key: string; defaultValue: string } {
  if (intensity === NeedIntensity.Commitment) {
    return { key: "needIntensityCommitment", defaultValue: "Commitment" };
  }

  if (intensity === NeedIntensity.LegUp) {
    return { key: "needIntensityLegUp", defaultValue: "Leg up" };
  }

  if (intensity === NeedIntensity.RareContribution) {
    return { key: "needIntensityRareContribution", defaultValue: "Rare contribution" };
  }

  return { key: "needIntensitySharing", defaultValue: "Sharing" };
}

export function MyNeedsScreen({
  creatorAccountId,
  refreshToken = 0,
  onAddNeed,
  onEditNeed,
  injectedNeeds,
  injectedLoading,
  injectedErrorMessage
}: MyNeedsScreenProps): React.JSX.Element {
  const { t } = useTranslation(["common", "us2"]);
  const [needs, setNeeds] = useState<NeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasInjectedState =
    injectedNeeds !== undefined || injectedLoading !== undefined || injectedErrorMessage !== undefined;

  const loadNeeds = useCallback(async () => {
    if (!creatorAccountId) {
      setNeeds([]);
      setLoading(false);
      setErrorMessage(t("myNeedsMissingAccountError", { ns: "us2", defaultValue: "We could not load your needs." }));
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const nextNeeds = await fetchMyNeeds(creatorAccountId);
      setNeeds(nextNeeds);
    } catch {
      setErrorMessage(t("myNeedsLoadError", { ns: "us2", defaultValue: "We could not load your needs." }));
    } finally {
      setLoading(false);
    }
  }, [creatorAccountId, t]);

  useEffect(() => {
    if (hasInjectedState) {
      return;
    }

    void loadNeeds();
  }, [hasInjectedState, loadNeeds, refreshToken]);

  const sortedNeeds = useMemo(
    () => [...(injectedNeeds ?? needs)].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")),
    [injectedNeeds, needs]
  );

  const resolvedLoading = injectedLoading ?? (hasInjectedState ? false : loading);
  const resolvedErrorMessage = injectedErrorMessage ?? errorMessage;

  if (resolvedLoading) {
    return <LoadingState label={t("loading", { ns: "common", defaultValue: "Loading..." })} />;
  }

  if (resolvedErrorMessage) {
    return <ErrorState message={resolvedErrorMessage} onRetry={() => void loadNeeds()} />;
  }

  return (
    <ScreenContainer testID="my-needs-screen" style={styles.root}>
      <View style={styles.headerRow}>
        <Text accessibilityRole="header" variant="headlineSmall" style={styles.pageTitle}>
          {t("myNeedsTitle", { ns: "us2", defaultValue: "My needs" })}
        </Text>
        <PrimaryButton
          label={t("addNeedLabel", { ns: "us2", defaultValue: "Add need" })}
          onPress={onAddNeed}
        />
      </View>

      {sortedNeeds.length === 0 ? (
        <EmptyState
          message={t("myNeedsEmpty", { ns: "us2", defaultValue: "You have no needs yet." })}
          actionLabel={t("addNeedLabel", { ns: "us2", defaultValue: "Add need" })}
          onActionPress={onAddNeed}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {sortedNeeds.map((need) => (
            <Pressable
              key={need.id}
              accessibilityRole="button"
              accessibilityLabel={`${need.title}. ${need.proposedTokenAmount} token.`}
              onPress={() => onEditNeed(need)}
              style={styles.needCard}
              testID={`my-need-card-${need.id}`}
            >
              <View style={styles.cardHeader}>
                <Text variant="titleMedium" style={styles.needTitle}>
                  {need.title}
                </Text>
                <Chip compact>
                  {t(intensityLabelMeta(need.intensity).key, {
                    ns: "us2",
                    defaultValue: intensityLabelMeta(need.intensity).defaultValue
                  })}
                </Chip>
              </View>

              <Text variant="labelSmall" style={styles.tokenAmountText}>
                {t("needTokenAmount", {
                  ns: "us2",
                  defaultValue: "{{amount}} token",
                  amount: need.proposedTokenAmount
                })}
              </Text>

              <Text variant="bodySmall" numberOfLines={2}>
                {need.description || t("needDescriptionEmpty", { ns: "us2", defaultValue: "No description yet." })}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
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
    alignItems: "center",
    justifyContent: "space-between",
    gap: designTokens.spacing.md
  },
  pageTitle: {
    fontFamily: appFontFamilies.title,
    textTransform: "uppercase",
    letterSpacing: 0.6
  },
  listContent: {
    gap: designTokens.spacing.sm,
    paddingBottom: designTokens.spacing.md
  },
  needCard: {
    backgroundColor: designTokens.colors.primaryContainer,
    borderRadius: designTokens.radius.md,
    padding: designTokens.spacing.sm,
    gap: designTokens.spacing.xs
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: designTokens.spacing.sm
  },
  needTitle: {
    fontFamily: appFontFamilies.altGeneral,
    flex: 1
  },
  tokenAmountText: {
    color: designTokens.colors.primary,
    fontFamily: appFontFamilies.general,
    textTransform: "uppercase"
  }
});
