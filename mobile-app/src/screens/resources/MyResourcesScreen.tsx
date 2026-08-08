import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button, Icon, IconButton, Portal, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { TokenAmount } from "../../components/TokenAmount";
import { PrimaryButton, ScreenContainer, ThemedDialog } from "../../components/primitives";
import { EmptyState } from "../../components/state/EmptyState";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { deleteResourceById, fetchMyResources, type MyResourceItem } from "../../services/graphql/resources";
import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";

export interface MyResourcesScreenProps {
  creatorAccountId: string | null;
  refreshToken?: number;
  onAddResource: () => void;
  onEditResource: (resource: MyResourceItem) => void;
  injectedResources?: MyResourceItem[];
  injectedLoading?: boolean;
  injectedErrorMessage?: string | null;
}

export function MyResourcesScreen({
  creatorAccountId,
  refreshToken = 0,
  onAddResource,
  onEditResource,
  injectedResources,
  injectedLoading,
  injectedErrorMessage
}: MyResourcesScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const [resources, setResources] = useState<MyResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingDeleteResource, setPendingDeleteResource] = useState<MyResourceItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  const loadResources = useCallback(async (): Promise<void> => {
    if (!creatorAccountId) {
      setResources([]);
      setLoading(false);
      setErrorMessage(t("resourceLoadMissingAccountError", { defaultValue: "We could not load your resources." }));
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const result = await fetchMyResources({ creatorAccountId });
      setResources(result.filter((resource) => resource.isActive));
    } catch {
      setErrorMessage(t("myResourcesLoadError", { defaultValue: "We could not load your resources." }));
    } finally {
      setLoading(false);
    }
  }, [creatorAccountId, t]);

  const hasInjectedState = injectedResources !== undefined || injectedLoading !== undefined || injectedErrorMessage !== undefined;

  useEffect(() => {
    if (hasInjectedState) {
      return;
    }

    void loadResources();
  }, [hasInjectedState, loadResources, refreshToken]);

  const sortedResources = useMemo(
    () => [...(injectedResources ?? resources)].sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "")),
    [injectedResources, resources]
  );

  const effectiveLoading = injectedLoading ?? (hasInjectedState ? false : loading);
  const effectiveErrorMessage = injectedErrorMessage ?? errorMessage;

  const handleDeleteConfirm = useCallback(async () => {
    if (!pendingDeleteResource) {
      return;
    }

    setDeleting(true);
    setDeleteErrorMessage(null);

    try {
      const result = await deleteResourceById(pendingDeleteResource.id);
      if (!result.ok) {
        throw new Error("Delete failed");
      }

      setResources((previous) => previous.filter((resource) => resource.id !== pendingDeleteResource.id));
      setPendingDeleteResource(null);
    } catch {
      setDeleteErrorMessage(t("deleteResourceError", { defaultValue: "We could not delete this resource." }));
    } finally {
      setDeleting(false);
    }
  }, [pendingDeleteResource, t]);

  const resolveResourceStatus = useCallback(
    (resource: MyResourceItem): string => {
      if (!resource.isActive) {
        return t("resourceStatusInactive", { defaultValue: "Inactive" });
      }

      if (resource.expiresAt) {
        const expiration = new Date(resource.expiresAt);
        if (!Number.isNaN(expiration.getTime()) && expiration.getTime() < Date.now()) {
          return t("resourceStatusExpired", { defaultValue: "Expired" });
        }
      }

      return "";
    },
    [t]
  );

  if (effectiveLoading) {
    return <LoadingState label={t("loading", { defaultValue: "Loading..." })} />;
  }

  if (effectiveErrorMessage) {
    return <ErrorState message={effectiveErrorMessage} onRetry={() => void loadResources()} />;
  }

  return (
    <ScreenContainer testID="my-resources-screen" style={styles.root}>
      <View style={styles.headerRow}>
        <Text accessibilityRole="header" variant="headlineSmall" style={styles.pageTitle}>
          {t("myResourcesTitle", { defaultValue: "My resources" })}
        </Text>
        <PrimaryButton
          label={t("addResourceLabel", { defaultValue: "Add Resource" })}
          accessibilityLabel={t("addResourceLabel", { defaultValue: "Add Resource" })}
          onPress={onAddResource}
        />
      </View>

      {deleteErrorMessage ? (
        <View style={styles.inlineError}>
          <Text style={styles.inlineErrorText}>{deleteErrorMessage}</Text>
        </View>
      ) : null}

      {sortedResources.length === 0 ? (
        <EmptyState
          message={t("myResourcesEmpty", { defaultValue: "You have no resources yet." })}
          actionLabel={t("addResourceLabel", { defaultValue: "Add Resource" })}
          onActionPress={onAddResource}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {sortedResources.map((resource) => (
            <View key={resource.id} style={styles.resourceCard} testID={`my-resource-card-${resource.id}`}>
              <View style={styles.cardTopRow}>
                <View style={styles.cardSpacer} />
                <IconButton
                  icon="delete-outline"
                  size={28}
                  style={styles.cardDeleteButton}
                  onPress={() => setPendingDeleteResource(resource)}
                  accessibilityLabel={t("deleteResourceLabel", { defaultValue: "Delete Resource" })}
                  disabled={deleting}
                />
              </View>

              {resource.imageUrls[0] ? (
                <Image source={{ uri: resource.imageUrls[0] }} style={styles.cardImage} resizeMode="cover" />
              ) : (
                <View style={styles.cardImageFallback}>
                  <Icon source="image-outline" size={20} color={designTokens.colors.primary} />
                </View>
              )}

              <TokenAmount amount={resource.defaultTokenAmount} />

              <Text variant="titleMedium" numberOfLines={2} style={styles.cardTitle}>
                {resource.title}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

      <Portal>
        <ThemedDialog visible={Boolean(pendingDeleteResource)} onDismiss={() => setPendingDeleteResource(null)}
          title={t("deleteResourceConfirmTitle", { defaultValue: "Delete resource?" })}
          content={<Text variant="bodyMedium">
            {t("deleteResourceConfirmBody", {
              defaultValue: "This will remove \"{{title}}\" from your active listings.",
              title: pendingDeleteResource?.title ?? ""
            })}
          </Text>}
          actions={[
            <Button key="cancel" onPress={() => setPendingDeleteResource(null)} disabled={deleting}>
              {t("cancelLabel", { defaultValue: "Cancel" })}
            </Button>,
            <Button key="delete" textColor="#d32f2f" onPress={() => void handleDeleteConfirm()} loading={deleting} disabled={deleting}>
              {t("deleteResourceLabel", { defaultValue: "Delete Resource" })}
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
  resourceCard: {
    width: "48%",
    borderRadius: designTokens.radius.md,
    backgroundColor: designTokens.colors.secondary,
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.sm,
    gap: designTokens.spacing.sm,
    minHeight: 252,
    position: "relative"
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
