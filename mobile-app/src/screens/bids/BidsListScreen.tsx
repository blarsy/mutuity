import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Icon, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { PrimaryButton, ScreenContainer } from "../../components/primitives";
import { EmptyState } from "../../components/state/EmptyState";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";
import type { BidWorkspaceItem } from "./types";

export interface BidsListScreenProps {
  title: string;
  testID: string;
  fetchBids: (includeInactive: boolean) => Promise<BidWorkspaceItem[]>;
  includeInactiveDefault?: boolean;
  onRetry?: () => void;
  onOpenBid?: (bid: BidWorkspaceItem) => void;
  onBackToMyHub?: () => void;
}

export function BidsListScreen({
  title,
  testID,
  fetchBids,
  includeInactiveDefault = false,
  onRetry,
  onOpenBid,
  onBackToMyHub
}: BidsListScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const [includeInactive, setIncludeInactive] = useState(includeInactiveDefault);
  const [remoteBids, setRemoteBids] = useState<BidWorkspaceItem[]>([]);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteErrorMessage, setRemoteErrorMessage] = useState<string | null>(null);

  const loadBids = useCallback(async (): Promise<void> => {
    setRemoteLoading(true);
    setRemoteErrorMessage(null);
    try {
      const nextBids = await fetchBids(includeInactive);
      setRemoteBids(nextBids);
    } catch {
      setRemoteErrorMessage(t("myBidsLoadError", { defaultValue: "We could not load your bids." }));
    } finally {
      setRemoteLoading(false);
    }
  }, [fetchBids, includeInactive, t]);

  useEffect(() => {
    void loadBids();
  }, [loadBids]);

  const filteredBids = useMemo(() => {
    return remoteBids
      .filter((bid) => includeInactive || bid.isActive)
      .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
  }, [includeInactive, remoteBids]);

  if (remoteLoading) {
    return <LoadingState label={t("myBidsLoading", { defaultValue: "Loading your bids..." })} />;
  }

  if (remoteErrorMessage) {
    return (
      <ErrorState
        message={remoteErrorMessage}
        {...(onRetry ? { onRetry } : { onRetry: () => void loadBids() })}
      />
    );
  }

  return (
    <ScreenContainer testID={testID} style={styles.root}>
      <View style={styles.headerRow}>
        <Text accessibilityRole="header" variant="headlineSmall" style={styles.title}>
          {title}
        </Text>
        {onBackToMyHub ? (
          <PrimaryButton
            label={t("backToMyHubLabel", { defaultValue: "Back to My Hub" })}
            onPress={onBackToMyHub}
          />
        ) : null}
      </View>

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: includeInactive }}
        accessibilityLabel={t("myBidsIncludeInactive", { defaultValue: "Include inactive bids" })}
        onPress={() => setIncludeInactive((previous) => !previous)}
        style={styles.includeInactiveRow}
      >
        <Icon
          source={includeInactive ? "checkbox-marked" : "checkbox-blank-outline"}
          size={22}
          color={designTokens.colors.primary}
        />
        <Text variant="bodyMedium">{t("myBidsIncludeInactive", { defaultValue: "Include inactive bids" })}</Text>
      </Pressable>

      {filteredBids.length === 0 ? (
        <EmptyState
          message={t("myBidsEmpty", { defaultValue: "No bids found." })}
          actionLabel={t("refreshLabel", { defaultValue: "Refresh" })}
          onActionPress={() => void loadBids()}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {filteredBids.map((bid) => {
            const updatedAtLabel = bid.updatedAt
              ? new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(bid.updatedAt))
              : t("dateUnknown", { defaultValue: "Unknown date" });

            return (
              <Pressable
                key={bid.id}
                testID={`my-bid-card-${bid.id}`}
                accessibilityRole="button"
                accessibilityLabel={`${bid.title}. ${bid.tokenAmount} token.`}
                onPress={() => {
                  if (onOpenBid) {
                    onOpenBid(bid);
                  }
                }}
                style={styles.bidCard}
              >
                <Text variant="titleMedium" style={styles.bidTitle} numberOfLines={2}>
                  {bid.title}
                </Text>
                <Text variant="bodySmall" style={styles.metaText}>
                  {t("myBidsCounterparty", {
                    defaultValue: "With {{name}}",
                    name: bid.counterpartyDisplayName
                  })}
                </Text>
                <Text variant="bodySmall" style={styles.metaText}>
                  {t("myBidsTokenAmount", { defaultValue: "{{amount}} token", amount: bid.tokenAmount })}
                </Text>
                <Text variant="bodySmall" style={styles.metaText}>
                  {t("myBidsLastUpdate", { defaultValue: "Updated {{date}}", date: updatedAtLabel })}
                </Text>
                {!bid.isActive ? (
                  <Text variant="labelSmall" style={styles.inactiveLabel}>
                    {t("myBidsInactive", { defaultValue: "Inactive" })}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
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
    justifyContent: "space-between",
    alignItems: "center",
    gap: designTokens.spacing.sm
  },
  title: {
    fontFamily: appFontFamilies.title,
    textTransform: "uppercase",
    letterSpacing: 0.6
  },
  includeInactiveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: designTokens.spacing.sm
  },
  listContent: {
    gap: designTokens.spacing.sm,
    paddingBottom: designTokens.spacing.md
  },
  bidCard: {
    borderRadius: designTokens.radius.md,
    backgroundColor: designTokens.colors.secondary,
    padding: designTokens.spacing.md,
    gap: designTokens.spacing.xs
  },
  bidTitle: {
    fontFamily: appFontFamilies.altGeneral,
    fontSize: 18,
    lineHeight: 22
  },
  metaText: {
    fontFamily: appFontFamilies.general,
    opacity: 0.8
  },
  inactiveLabel: {
    marginTop: designTokens.spacing.xs,
    color: designTokens.colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    fontFamily: appFontFamilies.altGeneral
  }
});