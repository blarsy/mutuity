import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button, Icon, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { TokenAmount } from "../../components/TokenAmount";
import { ListingContextHeader } from "../../components/listings/ListingContextHeader";
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
  onOpenResource?: (resourceId: string) => void;
  onOpenCounterparty?: (accountId: string) => void;
  onOpenConversation?: (conversationId: string) => void;
  onCancelBid?: (bid: BidWorkspaceItem) => Promise<void>;
  onAcceptBid?: (bid: BidWorkspaceItem) => Promise<void>;
  onDeclineBid?: (bid: BidWorkspaceItem) => Promise<void>;
}

function formatDate(value: string | null, fallbackLabel: string): string {
  if (!value) {
    return fallbackLabel;
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return fallbackLabel;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(parsedDate);
}

function statusChipLabel(status: BidWorkspaceItem["status"], t: (k: string, o?: Record<string, unknown>) => string): string {
  return t(`statuses.${status}`, { defaultValue: status.toLowerCase() });
}

function inactiveExplanationLabel(
  bid: BidWorkspaceItem,
  unknownDateLabel: string,
  t: (k: string, o?: Record<string, unknown>) => string
): string {
  if (bid.status === "WITHDRAWN") {
    return t("inactive.withdrawn", {
      defaultValue: "Withdrawn on {{date}}",
      date: formatDate(bid.updatedAt, unknownDateLabel)
    });
  }

  if (bid.status === "ACCEPTED") {
    return t("inactive.accepted", {
      defaultValue: "Accepted on {{date}}",
      date: formatDate(bid.respondedAt ?? bid.updatedAt, unknownDateLabel)
    });
  }

  if (bid.status === "DECLINED") {
    return t("inactive.declined", {
      defaultValue: "Declined on {{date}}",
      date: formatDate(bid.respondedAt ?? bid.updatedAt, unknownDateLabel)
    });
  }

  return t("inactive.expired", {
    defaultValue: "Expired on {{date}}",
    date: formatDate(bid.validUntil ?? bid.updatedAt, unknownDateLabel)
  });
}

function formatElapsedFromDate(value: string | null, fallbackLabel: string): string {
  if (!value) {
    return fallbackLabel;
  }

  const updatedAt = new Date(value);
  if (Number.isNaN(updatedAt.getTime())) {
    return fallbackLabel;
  }

  const deltaInSeconds = Math.round((updatedAt.getTime() - Date.now()) / 1000);
  const absSeconds = Math.abs(deltaInSeconds);
  const formatter =
    typeof Intl !== "undefined" && typeof Intl.RelativeTimeFormat === "function"
      ? new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })
      : null;

  const formatRelative = (amount: number, unit: Intl.RelativeTimeFormatUnit): string => {
    if (formatter) {
      return formatter.format(amount, unit);
    }

    if (amount === 0) {
      return "now";
    }

    const absoluteAmount = Math.abs(amount);
    const unitLabel = absoluteAmount === 1 ? unit : `${unit}s`;
    return amount > 0 ? `in ${absoluteAmount} ${unitLabel}` : `${absoluteAmount} ${unitLabel} ago`;
  };

  if (absSeconds < 60) {
    return formatRelative(deltaInSeconds, "second");
  }

  const deltaInMinutes = Math.round(deltaInSeconds / 60);
  if (Math.abs(deltaInMinutes) < 60) {
    return formatRelative(deltaInMinutes, "minute");
  }

  const deltaInHours = Math.round(deltaInMinutes / 60);
  if (Math.abs(deltaInHours) < 24) {
    return formatRelative(deltaInHours, "hour");
  }

  const deltaInDays = Math.round(deltaInHours / 24);
  if (Math.abs(deltaInDays) < 7) {
    return formatRelative(deltaInDays, "day");
  }

  const deltaInWeeks = Math.round(deltaInDays / 7);
  if (Math.abs(deltaInWeeks) < 5) {
    return formatRelative(deltaInWeeks, "week");
  }

  const deltaInMonths = Math.round(deltaInDays / 30);
  if (Math.abs(deltaInMonths) < 12) {
    return formatRelative(deltaInMonths, "month");
  }

  const deltaInYears = Math.round(deltaInDays / 365);
  return formatRelative(deltaInYears, "year");
}

function formatFullDateTime(value: string | null, fallbackLabel: string): string {
  if (!value) {
    return fallbackLabel;
  }

  const updatedAt = new Date(value);
  if (Number.isNaN(updatedAt.getTime())) {
    return fallbackLabel;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "full",
    timeStyle: "short"
  }).format(updatedAt);
}

export function BidsListScreen({
  title,
  testID,
  fetchBids,
  includeInactiveDefault = false,
  onRetry,
  onOpenBid,
  onBackToMyHub,
  onOpenResource,
  onOpenCounterparty,
  onOpenConversation,
  onCancelBid,
  onAcceptBid,
  onDeclineBid
}: BidsListScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const [includeInactive, setIncludeInactive] = useState(includeInactiveDefault);
  const [remoteBids, setRemoteBids] = useState<BidWorkspaceItem[]>([]);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteErrorMessage, setRemoteErrorMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);
  const [pendingActionBidId, setPendingActionBidId] = useState<string | null>(null);
  const [openUpdatedTooltipBidId, setOpenUpdatedTooltipBidId] = useState<string | null>(null);

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

  const runBidAction = useCallback(async (bid: BidWorkspaceItem, action: ((item: BidWorkspaceItem) => Promise<void>) | undefined): Promise<void> => {
    if (!action) {
      return;
    }

    setActionErrorMessage(null);
    setPendingActionBidId(bid.id);
    try {
      await action(bid);
      await loadBids();
    } catch {
      setActionErrorMessage(t("myBidsActionError", { defaultValue: "We could not complete this action." }));
    } finally {
      setPendingActionBidId(null);
    }
  }, [loadBids, t]);

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

      {actionErrorMessage ? (
        <View style={styles.actionErrorContainer}>
          <Text accessibilityRole="alert" style={styles.actionErrorText}>{actionErrorMessage}</Text>
        </View>
      ) : null}

      {filteredBids.length === 0 ? (
        <EmptyState
          message={t("myBidsEmpty", { defaultValue: "No bids found." })}
          actionLabel={t("refreshLabel", { defaultValue: "Refresh" })}
          onActionPress={() => void loadBids()}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {filteredBids.map((bid) => {
            const unknownDateLabel = t("dateUnknown", { defaultValue: "Unknown date" });
            const updatedAtElapsedLabel = formatElapsedFromDate(bid.updatedAt, unknownDateLabel);
            const updatedAtFullLabel = formatFullDateTime(bid.updatedAt, unknownDateLabel);
            const isUpdatedTooltipOpen = openUpdatedTooltipBidId === bid.id;
            const sentAtLabel = formatDate(bid.createdAt ?? null, unknownDateLabel);
            const reviewedAtLabel = formatDate(bid.respondedAt ?? null, unknownDateLabel);
            const validityLabel = formatDate(bid.validUntil ?? null, unknownDateLabel);
            const isActionPending = pendingActionBidId === bid.id;
            const showChatButton = Boolean(bid.conversationId) && onOpenConversation;
            const showSentActions = bid.direction === "sent" && bid.isActive;
            const showReceivedActions = bid.direction === "received" && bid.isActive;

            return (
              <Pressable
                key={bid.id}
                testID={`my-bid-card-${bid.id}`}
                accessibilityRole="button"
                accessibilityLabel={`${bid.title}. ${bid.tokenAmount} token.`}
                onPress={() => {
                  setOpenUpdatedTooltipBidId(null);
                  if (onOpenBid) {
                    onOpenBid(bid);
                  }
                }}
                style={styles.bidCard}
              >
                <ListingContextHeader
                  kind="resource"
                  title={bid.title}
                  authorDisplayName={bid.counterpartyDisplayName}
                  authorAvatarUrl={bid.counterpartyAvatarUrl ?? null}
                  listingImageUrl={bid.listingImageUrl ?? null}
                  onPressListing={onOpenResource ? () => onOpenResource(bid.resourceId) : undefined}
                  onPressAuthor={onOpenCounterparty ? () => onOpenCounterparty(bid.counterpartyAccountId) : undefined}
                />

                <View style={styles.statusRow}>
                  <Text style={styles.statusChip}>{statusChipLabel(bid.status, t)}</Text>
                </View>

                <TokenAmount amount={bid.tokenAmount} containerStyle={styles.tokenAmount} />

                <View style={styles.metaLineWrap}>
                  <Text variant="bodySmall" style={styles.metaText}>
                    {t("sentAt", { defaultValue: "Sent {{date}}", date: sentAtLabel })}
                    {bid.respondedAt ? ` · ${t("reviewedAt", { defaultValue: "Reviewed {{date}}", date: reviewedAtLabel })}` : ""}
                    {bid.isActive ? ` · ${t("validity", { defaultValue: "Valid until {{date}}", date: validityLabel })}` : ""}
                  </Text>
                </View>

                {bid.message ? (
                  <Text variant="bodySmall" style={styles.messageText}>{bid.message}</Text>
                ) : null}

                <View style={styles.updatedAtWrap}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t("myBidsLastUpdate", { defaultValue: "Updated {{date}}", date: updatedAtElapsedLabel })}
                    onPress={(event) => {
                      event.stopPropagation();
                      setOpenUpdatedTooltipBidId((previous) => (previous === bid.id ? null : bid.id));
                    }}
                  >
                    <Text variant="bodySmall" style={styles.metaText}>
                      {t("myBidsLastUpdate", { defaultValue: "Updated {{date}}", date: updatedAtElapsedLabel })}
                    </Text>
                  </Pressable>

                  {isUpdatedTooltipOpen ? (
                    <View style={styles.tooltipBubble}>
                      <Text variant="bodySmall" style={styles.tooltipText}>
                        {updatedAtFullLabel}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.actionsRow}>
                  {showChatButton ? (
                    <Button
                      compact
                      mode="text"
                      onPress={(event) => {
                        event.stopPropagation();
                        onOpenConversation(bid.conversationId!);
                      }}
                      disabled={isActionPending}
                    >
                      {t("actions.chat", { defaultValue: "Chat" })}
                    </Button>
                  ) : null}

                  {showSentActions ? (
                    <Button
                      compact
                      mode="outlined"
                      textColor="#B00020"
                      onPress={(event) => {
                        event.stopPropagation();
                        void runBidAction(bid, onCancelBid);
                      }}
                      loading={isActionPending}
                      disabled={isActionPending}
                    >
                      {t("actions.cancel", { defaultValue: "Cancel" })}
                    </Button>
                  ) : null}

                  {showReceivedActions ? (
                    <>
                      <Button
                        compact
                        mode="contained"
                        buttonColor="#2e7d32"
                        onPress={(event) => {
                          event.stopPropagation();
                          void runBidAction(bid, onAcceptBid);
                        }}
                        loading={isActionPending}
                        disabled={isActionPending}
                      >
                        {t("actions.accept", { defaultValue: "Accept" })}
                      </Button>
                      <Button
                        compact
                        mode="outlined"
                        textColor="#B00020"
                        onPress={(event) => {
                          event.stopPropagation();
                          void runBidAction(bid, onDeclineBid);
                        }}
                        loading={isActionPending}
                        disabled={isActionPending}
                      >
                        {t("actions.decline", { defaultValue: "Decline" })}
                      </Button>
                    </>
                  ) : null}
                </View>

                {!bid.isActive ? (
                  <Text variant="labelSmall" style={styles.inactiveLabel}>
                    {inactiveExplanationLabel(bid, unknownDateLabel, t)}
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
  actionErrorContainer: {
    borderRadius: designTokens.radius.sm,
    backgroundColor: "#fdecea",
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.xs
  },
  actionErrorText: {
    color: "#B00020",
    fontFamily: appFontFamilies.general
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
  tokenAmount: {
    alignSelf: "center"
  },
  statusRow: {
    alignSelf: "flex-start"
  },
  statusChip: {
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: 2,
    borderRadius: designTokens.radius.sm,
    backgroundColor: "#ffffff",
    fontFamily: appFontFamilies.altGeneral,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontSize: 12
  },
  metaLineWrap: {
    alignSelf: "flex-start"
  },
  messageText: {
    fontFamily: appFontFamilies.general,
    opacity: 0.9
  },
  updatedAtWrap: {
    alignSelf: "flex-start",
    position: "relative"
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: designTokens.spacing.xs
  },
  metaText: {
    fontFamily: appFontFamilies.general,
    opacity: 0.8
  },
  tooltipBubble: {
    marginTop: designTokens.spacing.xs,
    maxWidth: 260,
    backgroundColor: "#1f1f1f",
    borderRadius: designTokens.radius.sm,
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.xs
  },
  tooltipText: {
    color: "#ffffff",
    fontFamily: appFontFamilies.general
  },
  inactiveLabel: {
    marginTop: designTokens.spacing.xs,
    color: designTokens.colors.primary,
    fontFamily: appFontFamilies.altGeneral
  }
});