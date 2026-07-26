import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { ScreenContainer } from "../../components/primitives";
import { EmptyState } from "../../components/state/EmptyState";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { fetchNeedClaimsForAccount, type NeedClaimItem } from "../../services/graphql/needs";
import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";

export type ClaimDirection = "sent" | "received";

export interface MyClaimsScreenProps {
  direction: ClaimDirection;
  accountId?: string | null;
  injectedClaims?: NeedClaimItem[];
  injectedLoading?: boolean;
  injectedErrorMessage?: string | null;
}

export function MyClaimsScreen({
  direction,
  accountId = null,
  injectedClaims,
  injectedLoading,
  injectedErrorMessage
}: MyClaimsScreenProps): React.JSX.Element {
  const { t } = useTranslation(["common", "us2"]);
  const [claims, setClaims] = useState<NeedClaimItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      return;
    }

    void loadClaims();
  }, [hasInjectedState, loadClaims]);

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
      <View style={styles.headerRow}>
        <Text accessibilityRole="header" variant="headlineSmall" style={styles.title}>
          {direction === "received"
            ? t("myClaimsReceivedTitle", { defaultValue: "Received claims" })
            : t("myClaimsSentTitle", { defaultValue: "Sent claims" })}
        </Text>
      </View>

      {sourceClaims.length === 0 ? (
        <EmptyState
          message={t("myClaimsEmpty", { ns: "us2", defaultValue: "No claims found." })}
          actionLabel={t("refreshLabel", { ns: "common", defaultValue: "Refresh" })}
          onActionPress={() => void loadClaims()}
        />
      ) : (
        <View style={styles.list}>
          {sourceClaims.map((claim) => (
            <View key={claim.id} style={styles.claimCard}>
              <Text variant="titleSmall" style={styles.claimTitle}>
                {claim.needTitle || t("claimNeedMissingTitle", { ns: "us2", defaultValue: "Need" })}
              </Text>
              <Text variant="labelSmall" style={styles.claimMeta}>
                {`${t("claimStatusLabel", { ns: "us2", defaultValue: "Status" })}: ${claim.status}`}
              </Text>
            </View>
          ))}
        </View>
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
  list: {
    gap: designTokens.spacing.xs
  },
  claimCard: {
    borderRadius: designTokens.radius.md,
    backgroundColor: designTokens.colors.primaryContainer,
    padding: designTokens.spacing.sm,
    gap: designTokens.spacing.xs
  },
  claimTitle: {
    fontFamily: appFontFamilies.altGeneral
  },
  claimMeta: {
    color: designTokens.colors.primary,
    textTransform: "uppercase"
  }
});
