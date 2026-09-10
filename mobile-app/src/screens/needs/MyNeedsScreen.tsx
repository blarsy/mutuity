import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button, Icon, IconButton, Portal, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { TokenAmount } from "../../components/TokenAmount";
import { PrimaryButton, ScreenContainer, ThemedDialog } from "../../components/primitives";
import { EmptyState } from "../../components/state/EmptyState";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { deleteNeedById, fetchMyNeeds, type NeedItem } from "../../services/graphql/needs";
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
  const [pendingDeleteNeed, setPendingDeleteNeed] = useState<NeedItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

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

  const handleDeleteConfirm = useCallback(async () => {
    if (!pendingDeleteNeed) {
      return;
    }

    setDeleting(true);
    setDeleteErrorMessage(null);

    try {
      const result = await deleteNeedById(pendingDeleteNeed.id);
      if (!result.ok) {
        throw new Error("Delete failed");
      }

      setNeeds((previous) => previous.filter((need) => need.id !== pendingDeleteNeed.id));
      setPendingDeleteNeed(null);
    } catch {
      setDeleteErrorMessage(t("deleteNeedError", { ns: "us2", defaultValue: "We could not delete this need." }));
    } finally {
      setDeleting(false);
    }
  }, [pendingDeleteNeed, t]);

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

      {deleteErrorMessage ? (
        <View style={styles.inlineError}>
          <Text style={styles.inlineErrorText}>{deleteErrorMessage}</Text>
        </View>
      ) : null}

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
              accessibilityLabel={t("editNeedAccessibilityLabel", {
                ns: "us2",
                defaultValue: "Edit {{title}}",
                title: need.title
              })}
              onPress={() => onEditNeed(need)}
              style={({ pressed }) => [styles.needCard, pressed && styles.needCardPressed]}
              testID={`my-need-card-${need.id}`}
            >
              <View style={styles.cardTopRow}>
                <View style={styles.cardSpacer} />
                <IconButton
                  icon="delete-outline"
                  size={28}
                  style={styles.cardDeleteButton}
                  onPress={(event) => {
                    event.stopPropagation();
                    setPendingDeleteNeed(need);
                  }}
                  accessibilityLabel={t("deleteNeedLabel", { ns: "us2", defaultValue: "Delete need" })}
                  disabled={deleting}
                />
              </View>

              {need.imageUrls?.[0] ? (
                <Image source={{ uri: need.imageUrls[0] }} style={styles.cardImage} resizeMode="cover" />
              ) : (
                <View style={styles.cardImageFallback}>
                  <Icon source="image-outline" size={20} color={designTokens.colors.primary} />
                </View>
              )}

              <TokenAmount amount={need.proposedTokenAmount} />

              <Text variant="titleMedium" numberOfLines={2} style={styles.cardTitle}>
                {need.title}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <Portal>
        <ThemedDialog
          visible={Boolean(pendingDeleteNeed)}
          onDismiss={() => setPendingDeleteNeed(null)}
          title={t("deleteNeedConfirmTitle", { ns: "us2", defaultValue: "Delete need?" })}
          content={
            <Text variant="bodyMedium">
              {t("deleteNeedConfirmBody", {
                ns: "us2",
                defaultValue: 'This will remove "{{title}}" from your needs.',
                title: pendingDeleteNeed?.title ?? ""
              })}
            </Text>
          }
          actions={[
            <Button key="cancel" onPress={() => setPendingDeleteNeed(null)} disabled={deleting}>
              {t("cancelLabel", { ns: "common", defaultValue: "Cancel" })}
            </Button>,
            <Button
              key="delete"
              textColor="#d32f2f"
              onPress={() => void handleDeleteConfirm()}
              loading={deleting}
              disabled={deleting}
            >
              {t("deleteNeedLabel", { ns: "us2", defaultValue: "Delete need" })}
            </Button>
          ]}
        />
      </Portal>
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
    gap: designTokens.spacing.md,
    paddingBottom: designTokens.spacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between"
  },
  needCard: {
    width: "48%",
    borderRadius: designTokens.radius.md,
    backgroundColor: designTokens.colors.secondary,
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.sm,
    gap: designTokens.spacing.sm,
    minHeight: 252,
    position: "relative"
  },
  needCardPressed: {
    opacity: 0.8
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    minHeight: 24
  },
  cardSpacer: {
    flex: 1
  },
  cardDeleteButton: {
    marginRight: -8,
    marginTop: -8
  },
  cardImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: designTokens.radius.sm,
    backgroundColor: "#fff"
  },
  cardImageFallback: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: designTokens.radius.sm,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center"
  },
  cardTitle: {
    textAlign: "left",
    minHeight: 48,
    fontFamily: appFontFamilies.altGeneral,
    fontSize: 18,
    lineHeight: 23
  },
  inlineError: {
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.xs,
    borderRadius: designTokens.radius.sm,
    backgroundColor: "#fde8e8"
  },
  inlineErrorText: {
    color: "#b42318",
    fontSize: 14
  }
});
