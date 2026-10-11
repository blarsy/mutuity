import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { AccordionItem, AppSegmentedButtons, PrimaryButton, ScreenContainer } from "../../components/primitives";
import { MyHubScreenHeader, MyHubScreenState } from "../../components/MyHubScreenHeader";
import { HowToGetTokensSection } from "../../components/howToGetTokens/HowToGetTokensSection";
import { type HowToGetTokensOpportunityId, type HowToGetTokensProgress } from "../../features/howToGetTokens";
import { TokenExplainerDialog } from "../../components/tokenExplainer/TokenExplainerDialog";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { fetchTokenHistoryPage } from "../../services/graphql/economics";
import { useAccountEventSignal } from "../../services/realtime/accountEvents";
import { AccountTokenBalance } from "../../components/contribution/AccountTokenBalance";
import { fetchHowToGetTokensProgress } from "../../services/graphql/howToGetTokens";
import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";

export interface ContributionHistoryItem {
  id: string;
  title: string;
  eventType: string;
  tokenChange: number;
  createdAt: string | null;
}

export interface MyEconomicsScreenProps {
  accountId?: string | null;
  currentTokenBalance?: number | null;
  history?: ContributionHistoryItem[];
  hasNextPage?: boolean;
  onLoadMore?: () => void;
  loading?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  onBack?: () => void;
  onLearnMore?: () => void;
  onBackToHub?: () => void;
  onGoToOpportunity?: (id: HowToGetTokensOpportunityId) => void;
  /** Injected progress for tests/storybook; when omitted it is fetched remotely. */
  progress?: HowToGetTokensProgress;
}

const HISTORY_PAGE_SIZE = 10;

export function MyEconomicsScreen({
  accountId = null,
  currentTokenBalance,
  history,
  hasNextPage,
  onLoadMore,
  loading = false,
  errorMessage = null,
  onRetry,
  onBack,
  onLearnMore,
  onBackToHub,
  onGoToOpportunity,
  progress
}: MyEconomicsScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const [historyScope, setHistoryScope] = useState<"all" | "earnings" | "spend">("all");
  const [isExplainerOpen, setIsExplainerOpen] = useState(false);
  const [remoteHistory, setRemoteHistory] = useState<ContributionHistoryItem[]>([]);
  const [remoteHasNextPage, setRemoteHasNextPage] = useState(false);
  const [loadedAccount, setLoadedAccount] = useState<string | null>(null);
  const requestId = useRef(0);
  const historyWindow = useRef(HISTORY_PAGE_SIZE);
  const [remoteLoadingMore, setRemoteLoadingMore] = useState(false);
  const [remoteErrorMessage, setRemoteErrorMessage] = useState<string | null>(null);
  const [remoteProgress, setRemoteProgress] = useState<HowToGetTokensProgress | null>(null);

  const hasInjectedData = history !== undefined;

  const loadEconomics = useCallback(async (expand = false): Promise<void> => {
    if (hasInjectedData || !accountId) {
      return;
    }

    // Fetch the whole retained window. A newer refresh/pagination request wins,
    // never appending a stale cursor page over a more recent event response.
    if (expand) historyWindow.current += HISTORY_PAGE_SIZE;
    const request = ++requestId.current;
    setRemoteLoadingMore(expand);
    setRemoteErrorMessage(null);
    try {
      const nextHistoryPage = await fetchTokenHistoryPage(accountId, historyWindow.current);
      if (request !== requestId.current) return;
      const unique = new Map<string, ContributionHistoryItem>();
      nextHistoryPage.items.forEach((item) => {
        if (!unique.has(item.id)) unique.set(item.id, item);
      });
      setRemoteHistory([...unique.values()].sort((a, b) =>
        (b.createdAt ?? "").localeCompare(a.createdAt ?? "") || b.id.localeCompare(a.id)
      ));
      setRemoteHasNextPage(nextHistoryPage.hasNextPage);
      setLoadedAccount(accountId);
    } catch {
      if (request !== requestId.current) return;
      setRemoteErrorMessage(t("contributionLoadError", { defaultValue: "We could not load contribution details." }));
    } finally {
      if (request === requestId.current) setRemoteLoadingMore(false);
    }
  }, [accountId, hasInjectedData, t]);

  useAccountEventSignal(loadEconomics, !hasInjectedData && Boolean(accountId));

  useEffect(() => {
    setRemoteProgress(null);
    if (hasInjectedData || progress !== undefined || !accountId) {
      return;
    }

    let isMounted = true;
    void fetchHowToGetTokensProgress(accountId).then((nextProgress) => {
      if (isMounted) {
        setRemoteProgress(nextProgress);
      }
    }).catch(() => {
      // Optional opportunity progress must not cause an unhandled rejection
      // offline or during an account reset. Balance/history remain usable.
    });

    return () => {
      isMounted = false;
    };
  }, [accountId, progress, hasInjectedData]);

  const resolvedProgress = progress ?? remoteProgress ?? undefined;

  useEffect(() => {
    historyWindow.current = HISTORY_PAGE_SIZE;
    setRemoteHistory([]);
    setRemoteHasNextPage(false);
    setLoadedAccount(null);
    setRemoteErrorMessage(null);
    void loadEconomics();
    return () => { requestId.current += 1; };
  }, [loadEconomics]);

  const loadMoreHistory = useCallback(async (): Promise<void> => {
    if (!accountId || remoteLoadingMore || !remoteHasNextPage) {
      return;
    }
    await loadEconomics(true);
  }, [accountId, remoteLoadingMore, remoteHasNextPage, loadEconomics]);

  const resolvedHistory = history ?? (loadedAccount === accountId ? remoteHistory : []);
  const resolvedHasNextPage = hasInjectedData ? (hasNextPage ?? false) : remoteHasNextPage;
  const resolvedLoading = loading || (!errorMessage && !hasInjectedData && Boolean(accountId) && loadedAccount !== accountId && !remoteErrorMessage);
  const resolvedLoadingMore = !hasInjectedData && remoteLoadingMore;
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
    return (
      <MyHubScreenState title={t("contributionLabel", { defaultValue: "Contribution" })} onBackToHub={onBackToHub}>
        <LoadingState label={t("contributionLoading", { defaultValue: "Loading contribution details..." })} />
      </MyHubScreenState>
    );
  }

  if (resolvedErrorMessage && (hasInjectedData || loadedAccount !== accountId)) {
    return (
      <MyHubScreenState title={t("contributionLabel", { defaultValue: "Contribution" })} onBackToHub={onBackToHub}>
        <ErrorState message={resolvedErrorMessage} {...(onRetry ? { onRetry } : { onRetry: () => void loadEconomics() })} />
      </MyHubScreenState>
    );
  }

  return (
    <ScreenContainer testID="my-economics-screen" style={styles.root}>
      <MyHubScreenHeader
        title={t("contributionLabel", { defaultValue: "Contribution" })}
        onBackToHub={onBackToHub}
        right={onBack ? <PrimaryButton label={t("backLabel", { defaultValue: "Back" })} onPress={onBack} /> : undefined}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {resolvedErrorMessage ? <Text accessibilityRole="alert">{resolvedErrorMessage}</Text> : null}
        <View style={styles.balanceCard}>
          <Text variant="labelSmall" style={styles.balanceLabel}>
            {t("contributionBalanceLabel", { defaultValue: "You have" })}
          </Text>
          <AccountTokenBalance
            accountId={accountId}
            enabled={!hasInjectedData}
            {...(currentTokenBalance !== undefined ? { balance: currentTokenBalance } : hasInjectedData ? { balance: null } : {})}
            style={styles.balanceValue}
          />
          <Text variant="bodyMedium" style={styles.balanceUnit}>
            {t("tokenLabel", { defaultValue: "Tope" })}
          </Text>
          <Button
            icon="information"
            mode="text"
            onPress={() => {
              if (onLearnMore) {
                onLearnMore();
                return;
              }

              setIsExplainerOpen(true);
            }}
          >{t("contributionHowItWorksLabel", { defaultValue: "How it works" })}</Button>
        </View>

        <AccordionItem
          testID="history-accordion"
          title={t("historyAccordionTitle", { defaultValue: "History" })}
        >
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

          {visibleHistory.length === 0 ? (
            <Text variant="bodyMedium" style={styles.emptyText}>
              {t("contributionEmpty", { defaultValue: "No contribution history yet." })}
            </Text>
          ) : (
            <View style={styles.historyList}>
              {visibleHistory.map((item) => {
                const formattedDate = item.createdAt
                  ? new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(item.createdAt))
                  : t("dateUnknown", { defaultValue: "Unknown date" });

                return (
                  <View key={item.id} style={styles.historyCard} testID={`contribution-history-${item.id}`}>
                    <View style={styles.historyHeader}>
                      <Text variant="titleMedium" style={styles.historyAmount}>
                        {item.tokenChange >= 0 ? "+" : ""}{item.tokenChange} {t("tokenLabel", { defaultValue: "Tope" })}
                      </Text>
                      <Text variant="bodySmall" style={styles.historyMeta}>
                        {formattedDate}
                      </Text>
                    </View>
                    <Text variant="bodyMedium" style={styles.historyTitle}>
                      {t(`movements.${item.eventType}`, {
                        defaultValue: item.title.replaceAll("_", " ").toLowerCase()
                      })}
                    </Text>
                  </View>
                );
              })}

              {resolvedHasNextPage ? (
                <Button
                  style={styles.loadMoreButton}
                  mode="text"
                  icon="reload"
                  onPress={() => {
                    if (onLoadMore) {
                      onLoadMore();
                      return;
                    }

                    void loadMoreHistory();
                  }}
                  loading={resolvedLoadingMore}
                  testID="history-load-more"
                >{resolvedLoadingMore
                    ? t("historyLoadingMoreLabel", { defaultValue: "Loading more…" })
                    : t("historyLoadMoreLabel", { defaultValue: "Load more" })}</Button>
              ) : null}
            </View>
          )}
        </AccordionItem>

        {onGoToOpportunity ? (
          <HowToGetTokensSection
            onGoToOpportunity={onGoToOpportunity}
            {...(resolvedProgress ? { progress: resolvedProgress } : {})}
            testID="how-to-get-tokens-section"
          />
        ) : null}
      </ScrollView>

      <TokenExplainerDialog
        visible={isExplainerOpen}
        onClose={() => setIsExplainerOpen(false)}
        testID="token-explainer-dialog"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: designTokens.spacing.md,
    paddingTop: designTokens.spacing.lg
  },
  scrollContent: {
    gap: designTokens.spacing.md,
    paddingBottom: designTokens.spacing.md
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
  historyList: {
    gap: designTokens.spacing.sm
  },
  historyCard: {
    borderRadius: designTokens.radius.md,
    backgroundColor: "#fff",
    padding: designTokens.spacing.xs,
    borderBottomWidth: 1,
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
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  loadMoreButton: {
    alignSelf: "center"
  }
});
