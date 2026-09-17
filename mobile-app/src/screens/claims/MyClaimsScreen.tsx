import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { ListingContextHeader } from "../../components/listings/ListingContextHeader";
import { ScreenContainer } from "../../components/primitives";
import { MyHubScreenHeader } from "../../components/MyHubScreenHeader";
import { EmptyState } from "../../components/state/EmptyState";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { NeedClaimStatus } from "../../services/graphql/generated";
import {
  cancelNeedClaim,
  declineNeedClaim,
  fetchNeedClaimsForAccount,
  settleNeedClaim,
  type NeedClaimItem
} from "../../services/graphql/needs";
import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";

export type ClaimDirection = "sent" | "received";

export interface MyClaimsScreenProps {
  direction: ClaimDirection;
  accountId?: string | null;
  injectedClaims?: NeedClaimItem[];
  injectedLoading?: boolean;
  injectedErrorMessage?: string | null;
  onOpenDrawer?: () => void;
  onOpenNeed?: (needId: string) => void;
  onOpenCounterparty?: (accountId: string) => void;
  onAcceptClaim?: (claim: NeedClaimItem) => Promise<void>;
  onDeclineClaim?: (claim: NeedClaimItem) => Promise<void>;
  onCancelClaim?: (claim: NeedClaimItem) => Promise<void>;
}

function firstMessageLine(message: string | null): string | null {
  const firstLine = message?.split("\n")[0]?.trim() ?? "";
  return firstLine.length > 0 ? firstLine : null;
}

export function MyClaimsScreen({
  direction,
  accountId = null,
  injectedClaims,
  injectedLoading,
  injectedErrorMessage,
  onOpenDrawer,
  onOpenNeed,
  onOpenCounterparty,
  onAcceptClaim,
  onDeclineClaim,
  onCancelClaim
}: MyClaimsScreenProps): React.JSX.Element {
  const { t } = useTranslation(["common", "us2"]);
  const [claims, setClaims] = useState<NeedClaimItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);
  const [pendingActionClaimId, setPendingActionClaimId] = useState<string | null>(null);

  const hasInjectedState =
    injectedClaims !== undefined || injectedLoading !== undefined || injectedErrorMessage !== undefined;

  const loadClaims = useCallback(async (): Promise<void> => {
    if (!accountId) {
      setClaims([]);
      setLoading(false);
      setErrorMessage(t("myClaimsMissingAccountError", { ns: "us2", defaultValue: "We could not load claims." }));
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const nextClaims = await fetchNeedClaimsForAccount({ accountId, direction });
      setClaims(nextClaims);
    } catch {
      setErrorMessage(t("myClaimsLoadError", { ns: "us2", defaultValue: "We could not load claims." }));
    } finally {
      setLoading(false);
    }
  }, [accountId, direction, t]);

  useEffect(() => {
    if (hasInjectedState) {
      setLoading(false);
      return;
    }

    void loadClaims();
  }, [hasInjectedState, loadClaims]);

  const runClaimAction = useCallback(
    async (claim: NeedClaimItem, action: (item: NeedClaimItem) => Promise<void>): Promise<void> => {
      setActionErrorMessage(null);
      setPendingActionClaimId(claim.id);
      try {
        await action(claim);
        await loadClaims();
      } catch {
        setActionErrorMessage(t("myClaimsActionError", { ns: "us2", defaultValue: "We could not complete this action." }));
      } finally {
        setPendingActionClaimId(null);
      }
    },
    [loadClaims, t]
  );

  const acceptClaim = onAcceptClaim ?? (async (claim: NeedClaimItem) => { await settleNeedClaim(claim.id); });
  const declineClaim = onDeclineClaim ?? (async (claim: NeedClaimItem) => { await declineNeedClaim(claim.id); });
  const cancelClaim = onCancelClaim ?? (async (claim: NeedClaimItem) => { await cancelNeedClaim(claim.id); });

  const sourceClaims = injectedClaims ?? claims;
  const resolvedLoading = injectedLoading ?? loading;
  const resolvedErrorMessage = injectedErrorMessage ?? errorMessage;

  if (resolvedLoading) {
    return <LoadingState label={t("loading", { ns: "common", defaultValue: "Loading..." })} />;
  }

  if (resolvedErrorMessage) {
    return <ErrorState message={resolvedErrorMessage} onRetry={() => void loadClaims()} />;
  }

  return (
    <ScreenContainer testID={`my-claims-screen-${direction}`} style={styles.root}>
      <MyHubScreenHeader
        title={
          direction === "received"
            ? t("myClaimsReceivedTitle", { defaultValue: "Received claims" })
            : t("myClaimsSentTitle", { defaultValue: "Sent claims" })
        }
        onOpenDrawer={onOpenDrawer}
      />

      {actionErrorMessage ? (
        <View style={styles.actionErrorContainer}>
          <Text accessibilityRole="alert" style={styles.actionErrorText}>{actionErrorMessage}</Text>
        </View>
      ) : null}

      {sourceClaims.length === 0 ? (
        <EmptyState
          message={t("myClaimsEmpty", { ns: "us2", defaultValue: "No claims found." })}
          actionLabel={t("refreshLabel", { ns: "common", defaultValue: "Refresh" })}
          onActionPress={() => void loadClaims()}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {sourceClaims.map((claim) => {
            const counterpartyDisplayName = direction === "received" ? claim.claimerDisplayName : claim.ownerDisplayName;
            const counterpartyAvatarUrl = direction === "received" ? claim.claimerAvatarUrl : claim.ownerAvatarUrl;
            const counterpartyAccountId = direction === "received" ? claim.claimerAccountId : claim.ownerAccountId;
            const messageLine = firstMessageLine(claim.message);
            const isActionPending = pendingActionClaimId === claim.id;
            const showReceivedActions = direction === "received" && claim.status === NeedClaimStatus.Open;
            const showSentActions = direction === "sent" && claim.status === NeedClaimStatus.Open;

            return (
              <View key={claim.id} testID={`my-claim-card-${claim.id}`} style={styles.claimCard}>
                <ListingContextHeader
                  kind="need"
                  title={claim.needTitle || t("claimNeedMissingTitle", { ns: "us2", defaultValue: "Need" })}
                  authorDisplayName={counterpartyDisplayName}
                  authorAvatarUrl={counterpartyAvatarUrl}
                  listingImageUrl={claim.needImageUrl}
                  onPressListing={onOpenNeed ? () => onOpenNeed(claim.needId) : undefined}
                  onPressAuthor={
                    onOpenCounterparty && counterpartyAccountId
                      ? () => onOpenCounterparty(counterpartyAccountId)
                      : undefined
                  }
                />

                <View style={styles.statusRow}>
                  <Text style={styles.statusChip}>
                    {t(`claimStatuses.${claim.status}`, { ns: "us2", defaultValue: claim.status.toLowerCase() })}
                  </Text>
                </View>

                {messageLine ? (
                  <Text variant="bodySmall" numberOfLines={1} ellipsizeMode="tail" style={styles.messageText}>
                    {messageLine}
                  </Text>
                ) : null}

                {showReceivedActions ? (
                  <View style={styles.actionsRow}>
                    <Button
                      icon="thumb-up"
                      compact
                      mode="contained"
                      style={styles.mainButton}
                      contentStyle={styles.mainButtonContent}
                      onPress={() => void runClaimAction(claim, acceptClaim)}
                      loading={isActionPending}
                      disabled={isActionPending}
                    >
                      {t("actions.accept", { defaultValue: "Accept" })}
                    </Button>
                    <Button
                      icon="thumb-down"
                      compact
                      mode="contained"
                      style={styles.mainButton}
                      contentStyle={styles.mainButtonContent}
                      onPress={() => void runClaimAction(claim, declineClaim)}
                      loading={isActionPending}
                      disabled={isActionPending}
                    >
                      {t("actions.decline", { defaultValue: "Decline" })}
                    </Button>
                  </View>
                ) : null}

                {showSentActions ? (
                  <View style={styles.actionsRow}>
                    <Button
                      icon="cancel"
                      compact
                      mode="contained"
                      style={styles.mainButton}
                      contentStyle={styles.mainButtonContent}
                      onPress={() => void runClaimAction(claim, cancelClaim)}
                      loading={isActionPending}
                      disabled={isActionPending}
                    >
                      {t("actions.cancel", { defaultValue: "Cancel" })}
                    </Button>
                  </View>
                ) : null}
              </View>
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
  claimCard: {
    borderRadius: designTokens.radius.md,
    backgroundColor: designTokens.colors.primaryContainer,
    padding: designTokens.spacing.md,
    gap: designTokens.spacing.xs
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
  messageText: {
    fontFamily: appFontFamilies.general,
    opacity: 0.9
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: designTokens.spacing.xs
  },
  mainButton: {
    marginTop: designTokens.spacing.sm,
    alignSelf: "center",
    borderRadius: 15
  },
  mainButtonContent: {
    minHeight: 46,
    backgroundColor: designTokens.colors.primary
  }
});
