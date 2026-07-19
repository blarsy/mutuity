import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Icon, IconButton, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { PrimaryButton, ScreenContainer } from "../../components/primitives";
import { EmptyState } from "../../components/state/EmptyState";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { fetchMyResources, type MyResourceItem } from "../../services/graphql/resources";
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

  const effectiveLoading = injectedLoading ?? loading;
  const effectiveErrorMessage = injectedErrorMessage ?? errorMessage;

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

      {sortedResources.length === 0 ? (
        <EmptyState
          message={t("myResourcesEmpty", { defaultValue: "You have no resources yet." })}
          actionLabel={t("addResourceLabel", { defaultValue: "Add Resource" })}
          onActionPress={onAddResource}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {sortedResources.map((resource) => (
            <Pressable
              key={resource.id}
              accessibilityRole="button"
              accessibilityLabel={`${resource.title}. ${resource.defaultTokenAmount} token.`}
              onPress={() => onEditResource(resource)}
              style={styles.resourceCard}
              testID={`my-resource-card-${resource.id}`}
            >
              <View style={styles.cardTopBar}>
                <Text variant="labelSmall" style={styles.cardStatusText} numberOfLines={1}>
                  {resolveResourceStatus(resource)}
                </Text>
              </View>

              {resource.imageUrls[0] ? (
                <Image source={{ uri: resource.imageUrls[0] }} style={styles.cardImage} resizeMode="cover" />
              ) : (
                <View style={styles.cardImageFallback}>
                  <Icon source="image-outline" size={20} color={designTokens.colors.primary} />
                </View>
              )}

              <Text variant="titleMedium" numberOfLines={2} style={styles.cardTitle}>
                {resource.title}
              </Text>
              <Text variant="labelSmall" style={styles.cardMetaText}>
                {t("resourceTokenAmount", {
                  defaultValue: "{{amount}} token",
                  amount: resource.defaultTokenAmount
                })}
              </Text>
              <Text variant="bodySmall" numberOfLines={2} style={styles.cardDescription}>
                {resource.description || t("resourceDescriptionEmpty", { defaultValue: "No description yet." })}
              </Text>

              <IconButton
                icon="pencil-outline"
                size={18}
                style={styles.cardEditButton}
                onPress={() => onEditResource(resource)}
                accessibilityLabel={t("editResourceLabel", { defaultValue: "Edit Resource" })}
              />
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
  cardTopBar: {
    minHeight: 16,
    justifyContent: "center"
  },
  cardStatusText: {
    textAlign: "center",
    fontStyle: "italic",
    fontFamily: appFontFamilies.general,
    opacity: 0.8
  },
  cardImage: {
    width: "100%",
    height: 116,
    borderRadius: designTokens.radius.sm,
    backgroundColor: "#fff"
  },
  cardImageFallback: {
    width: "100%",
    height: 116,
    borderRadius: designTokens.radius.sm,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center"
  },
  cardTitle: {
    textAlign: "center",
    minHeight: 48,
    fontFamily: appFontFamilies.altGeneral,
    fontSize: 18,
    lineHeight: 23
  },
  cardMetaText: {
    textAlign: "center",
    color: designTokens.colors.primary,
    fontFamily: appFontFamilies.altGeneral,
    textTransform: "uppercase",
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.35
  },
  cardDescription: {
    opacity: 0.75,
    fontFamily: appFontFamilies.general,
    fontSize: 12,
    lineHeight: 16
  },
  cardEditButton: {
    position: "absolute",
    right: 0,
    top: 0
  }
});
