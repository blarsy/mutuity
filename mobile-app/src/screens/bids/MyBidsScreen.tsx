import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Icon, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { PrimaryButton, ScreenContainer } from "../../components/primitives";
import { EmptyState } from "../../components/state/EmptyState";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { fetchMyBids } from "../../services/graphql/bids";
import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";

export type BidDirection = "sent" | "received";

export interface BidWorkspaceItem {
  id: string;
  direction: BidDirection;
  title: string;
  counterpartyDisplayName: string;
  tokenAmount: number;
  isActive: boolean;
  updatedAt: string | null;
}

export interface MyBidsScreenProps {
  direction: BidDirection;
  bids?: BidWorkspaceItem[];
  loading?: boolean;
  errorMessage?: string | null;
  includeInactiveDefault?: boolean;
  onRetry?: () => void;
  onOpenBid?: (bid: BidWorkspaceItem) => void;
  onBackToMyHub?: () => void;
}

export function MyBidsScreen({
  direction,
  bids,
  loading = false,
  errorMessage = null,
  includeInactiveDefault = false,
  onRetry,
  onOpenBid,
  onBackToMyHub
}: MyBidsScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const [includeInactive, setIncludeInactive] = useState(includeInactiveDefault);
  const [remoteBids, setRemoteBids] = useState<BidWorkspaceItem[]>([]);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteErrorMessage, setRemoteErrorMessage] = useState<string | null>(null);

  const hasInjectedBids = bids !== undefined;

  const loadBids = useCallback(async (): Promise<void> => {
    if (hasInjectedBids) {
      return;
    }

    setRemoteLoading(true);
    setRemoteErrorMessage(null);
    try {
      const nextBids = await fetchMyBids(includeInactive);
      setRemoteBids(nextBids);
    } catch {
      setRemoteErrorMessage(t("myBidsLoadError", { defaultValue: "We could not load your bids." }));
    } finally {
      setRemoteLoading(false);
    }
  }, [hasInjectedBids, includeInactive, t]);

  useEffect(() => {
    void loadBids();
  }, [loadBids]);

  const sourceBids = bids ?? remoteBids;

  const filteredBids = useMemo(() => {
    return sourceBids
      .filter((bid) => bid.direction === direction)
      .filter((bid) => includeInactive || bid.isActive)
      .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
  }, [direction, includeInactive, sourceBids]);

  const resolvedLoading = loading || (!hasInjectedBids && remoteLoading);
  const resolvedErrorMessage = errorMessage ?? (!hasInjectedBids ? remoteErrorMessage : null);

  if (resolvedLoading) {
    return <LoadingState label={t("myBidsLoading", { defaultValue: "Loading your bids..." })} />;
  }

  if (resolvedErrorMessage) {
    return (
      <ErrorState
        message={resolvedErrorMessage}
        {...(onRetry ? { onRetry } : { onRetry: () => void loadBids() })}
      />
    );
  }

  return (
    <ScreenContainer testID="my-bids-screen" style={styles.root}>
      <View style={styles.headerRow}>
        <Text accessibilityRole="header" variant="headlineSmall" style={styles.title}>
          {direction === "received"
            ? t("myBidsReceivedTitle", { defaultValue: "Received bids" })
            : t("myBidsSentTitle", { defaultValue: "Sent bids" })}
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
        <Icon source={includeInactive ? "checkbox-marked" : "checkbox-blank-outline"} size={22} color={designTokens.colors.primary} />
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
