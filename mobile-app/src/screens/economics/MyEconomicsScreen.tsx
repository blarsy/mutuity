import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { AppSegmentedButtons, PrimaryButton, ScreenContainer } from "../../components/primitives";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { fetchCurrentTokenBalance, fetchTokenHistory } from "../../services/graphql/economics";
import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";

export interface ContributionHistoryItem {
  id: string;
  title: string;
  tokenChange: number;
  createdAt: string | null;
}

export interface MyEconomicsScreenProps {
  accountId?: string | null;
  currentTokenBalance?: number;
  history?: ContributionHistoryItem[];
  loading?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  onBack?: () => void;
  onLearnMore?: () => void;
}

export function MyEconomicsScreen({
  accountId = null,
  currentTokenBalance = 0,
  history,
  loading = false,
  errorMessage = null,
  onRetry,
  onBack,
  onLearnMore
}: MyEconomicsScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const [historyExpanded, setHistoryExpanded] = useState(true);
  const [historyScope, setHistoryScope] = useState<"all" | "earnings" | "spend">("all");
  const [remoteBalance, setRemoteBalance] = useState(0);
  const [remoteHistory, setRemoteHistory] = useState<ContributionHistoryItem[]>([]);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteErrorMessage, setRemoteErrorMessage] = useState<string | null>(null);

  const hasInjectedData = history !== undefined;

  const loadEconomics = useCallback(async (): Promise<void> => {
    if (hasInjectedData || !accountId) {
      return;
    }

    setRemoteLoading(true);
    setRemoteErrorMessage(null);
    try {
      const [nextBalance, nextHistory] = await Promise.all([
        fetchCurrentTokenBalance(),
        fetchTokenHistory(accountId)
      ]);
      setRemoteBalance(nextBalance);
      setRemoteHistory(nextHistory);
    } catch {
      setRemoteErrorMessage(t("contributionLoadError", { defaultValue: "We could not load contribution details." }));
    } finally {
      setRemoteLoading(false);
    }
  }, [accountId, hasInjectedData, t]);

  useEffect(() => {
    void loadEconomics();
  }, [loadEconomics]);

  const resolvedBalance = hasInjectedData ? currentTokenBalance : remoteBalance;
  const resolvedHistory = history ?? remoteHistory;
  const resolvedLoading = loading || (!hasInjectedData && remoteLoading);
  const resolvedErrorMessage = errorMessage ?? (!hasInjectedData ? remoteErrorMessage : null);

  const visibleHistory = useMemo(() => {
    const sourceHistory = resolvedHistory;

    return sourceHistory.filter((item) => {
      if (historyScope === "earnings") {
        return item.tokenChange > 0;
      }

      if (historyScope === "spend") {
        return item.tokenChange < 0;
      }

      return true;
    });
  }, [historyScope, resolvedHistory]);

  if (resolvedLoading) {
    return <LoadingState label={t("contributionLoading", { defaultValue: "Loading contribution details..." })} />;
  }

  if (resolvedErrorMessage) {
    return <ErrorState message={resolvedErrorMessage} {...(onRetry ? { onRetry } : { onRetry: () => void loadEconomics() })} />;
  }

  return (
    <ScreenContainer testID="my-economics-screen" style={styles.root}>
      <View style={styles.headerRow}>
        <Text accessibilityRole="header" variant="headlineSmall" style={styles.title}>
          {t("contributionLabel", { defaultValue: "Contribution" })}
        </Text>
        {onBack ? <PrimaryButton label={t("backLabel", { defaultValue: "Back" })} onPress={onBack} /> : null}
      </View>

      <View style={styles.balanceCard}>
        <Text variant="labelSmall" style={styles.balanceLabel}>
          {t("contributionBalanceLabel", { defaultValue: "You have" })}
        </Text>
        <Text variant="headlineMedium" style={styles.balanceValue}>
          {resolvedBalance}
        </Text>
        <Text variant="bodyMedium" style={styles.balanceUnit}>
          {t("tokenLabel", { defaultValue: "Token" })}
        </Text>
      </View>

      <PrimaryButton
        label={t("contributionHowItWorksLabel", { defaultValue: "How it works" })}
        onPress={() => {
          if (onLearnMore) {
            onLearnMore();
          }
        }}
      />

      <AppSegmentedButtons
        value={historyScope}
        onValueChange={(value) => {
          if (value === "all" || value === "earnings" || value === "spend") {
            setHistoryScope(value);
          }
        }}
        buttons={[
          { value: "all", label: t("historyAllLabel", { defaultValue: "History" }) },
          { value: "earnings", label: t("historyEarningsLabel", { defaultValue: "Earned" }) },
          { value: "spend", label: t("historySpendLabel", { defaultValue: "Spent" }) }
        ]}
      />

      <View style={styles.accordionRow}>
        <PrimaryButton
          label={historyExpanded ? t("collapseLabel", { defaultValue: "Collapse" }) : t("expandLabel", { defaultValue: "Expand" })}
          onPress={() => setHistoryExpanded((previous) => !previous)}
        />
      </View>

      {historyExpanded ? (
        <ScrollView contentContainerStyle={styles.historyContent}>
          {visibleHistory.length === 0 ? (
            <Text variant="bodyMedium" style={styles.emptyText}>
              {t("contributionEmpty", { defaultValue: "No contribution history yet." })}
            </Text>
          ) : (
            visibleHistory.map((item) => {
              const formattedDate = item.createdAt
                ? new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(item.createdAt))
                : t("dateUnknown", { defaultValue: "Unknown date" });

              return (
                <View key={item.id} style={styles.historyCard} testID={`contribution-history-${item.id}`}>
                  <Text variant="titleMedium" style={styles.historyTitle}>
                    {item.title}
                  </Text>
                  <Text variant="bodySmall" style={styles.historyMeta}>
                    {formattedDate}
                  </Text>
                  <Text variant="bodyMedium" style={styles.historyAmount}>
                    {item.tokenChange >= 0 ? "+" : ""}{item.tokenChange} {t("tokenLabel", { defaultValue: "Token" })}
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>
      ) : null}
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
  },
  balanceCard: {
    borderRadius: designTokens.radius.md,
    backgroundColor: designTokens.colors.secondary,
    padding: designTokens.spacing.md,
    gap: designTokens.spacing.xs,
    alignItems: "center"
  },
  balanceLabel: {
    opacity: 0.8,
    textTransform: "uppercase",
    letterSpacing: 0.35
  },
  balanceValue: {
    fontFamily: appFontFamilies.title
  },
  balanceUnit: {
    opacity: 0.8
  },
  accordionRow: {
    flexDirection: "row",
    justifyContent: "flex-start"
  },
  historyContent: {
    gap: designTokens.spacing.sm,
    paddingBottom: designTokens.spacing.md
  },
  historyCard: {
    borderRadius: designTokens.radius.md,
    backgroundColor: "#fff",
    padding: designTokens.spacing.md,
    gap: designTokens.spacing.xs,
    borderWidth: 1,
    borderColor: designTokens.colors.secondary
  },
  historyTitle: {
    fontFamily: appFontFamilies.altGeneral
  },
  historyMeta: {
    opacity: 0.65
  },
  historyAmount: {
    fontFamily: appFontFamilies.general
  },
  emptyText: {
    textAlign: "center",
    paddingVertical: designTokens.spacing.lg,
    opacity: 0.75
  }
});
