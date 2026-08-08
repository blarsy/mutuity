import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { Chip, Portal, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { PrimaryButton, ScreenContainer, ThemedDialog } from "../../components/primitives";
import { EmptyState } from "../../components/state/EmptyState";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { fetchInspirationCampaigns, fetchMyCampaigns, type CampaignItem } from "../../services/graphql/campaigns";
import { CampaignModerationStatus } from "../../services/graphql/generated";
import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";

export interface MyCampaignsScreenProps {
  creatorAccountId: string | null;
  refreshToken?: number;
  onAddCampaign: () => void;
  onEditCampaign: (campaign: CampaignItem) => void;
  injectedCampaigns?: CampaignItem[];
  injectedLoading?: boolean;
  injectedErrorMessage?: string | null;
}

function isCampaignActive(now: Date, startAtIso: string, endAtIso: string): boolean {
  const startAt = new Date(startAtIso);
  const endAt = new Date(endAtIso);

  return now >= startAt && now <= endAt;
}

function isCampaignEnded(now: Date, endAtIso: string): boolean {
  return now > new Date(endAtIso);
}

function statusLabelMeta(status: CampaignModerationStatus): { key: string; defaultValue: string; color: string } {
  if (status === CampaignModerationStatus.Approved) {
    return { key: "campaignStatusApproved", defaultValue: "Approved", color: designTokens.colors.primary };
  }

  if (status === CampaignModerationStatus.AwaitingAdaptation) {
    return { key: "campaignStatusAwaitingAdaptation", defaultValue: "Awaiting Adaptation", color: designTokens.colors.secondary };
  }

  return { key: "campaignStatusPending", defaultValue: "Pending", color: designTokens.colors.primaryContainer };
}

export function MyCampaignsScreen({
  creatorAccountId,
  refreshToken = 0,
  onAddCampaign,
  onEditCampaign,
  injectedCampaigns,
  injectedLoading,
  injectedErrorMessage
}: MyCampaignsScreenProps): React.JSX.Element {
  const { t } = useTranslation(["common", "us3"]);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pageInfo, setPageInfo] = useState({ hasNextPage: false, endCursor: null as string | null });
  const [loadingMore, setLoadingMore] = useState(false);
  const [inspirationOpen, setInspirationOpen] = useState(false);
  const [inspirationCampaigns, setInspirationCampaigns] = useState<CampaignItem[]>([]);
  const [inspirationLoading, setInspirationLoading] = useState(false);

  const hasInjectedState =
    injectedCampaigns !== undefined || injectedLoading !== undefined || injectedErrorMessage !== undefined;

  const loadCampaigns = useCallback(async () => {
    if (!creatorAccountId) {
      setCampaigns([]);
      setLoading(false);
      setErrorMessage(t("myCampaignsMissingAccountError", { ns: "us3", defaultValue: "We could not load your campaigns." }));
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const result = await fetchMyCampaigns(creatorAccountId);
      setCampaigns(result.campaigns);
      setPageInfo(result.pageInfo);
    } catch {
      setErrorMessage(t("myCampaignsLoadError", { ns: "us3", defaultValue: "We could not load your campaigns." }));
    } finally {
      setLoading(false);
    }
  }, [creatorAccountId, t]);

  useEffect(() => {
    if (hasInjectedState) {
      return;
    }

    void loadCampaigns();
  }, [hasInjectedState, loadCampaigns, refreshToken]);

  const handleLoadMore = useCallback(async () => {
    if (!creatorAccountId || !pageInfo.hasNextPage || loadingMore) {
      return;
    }

    setLoadingMore(true);

    try {
      const result = await fetchMyCampaigns(creatorAccountId, pageInfo.endCursor);
      setCampaigns((prev) => [...prev, ...result.campaigns]);
      setPageInfo(result.pageInfo);
    } catch {
      // silently ignore pagination errors
    } finally {
      setLoadingMore(false);
    }
  }, [creatorAccountId, loadingMore, pageInfo.endCursor, pageInfo.hasNextPage]);

  const openInspiration = useCallback(async () => {
    setInspirationOpen(true);

    if (inspirationCampaigns.length > 0) {
      return;
    }

    setInspirationLoading(true);

    try {
      const items = await fetchInspirationCampaigns();
      setInspirationCampaigns(items);
    } catch {
      // ignore
    } finally {
      setInspirationLoading(false);
    }
  }, [inspirationCampaigns.length]);

  const resolvedCampaigns = injectedCampaigns ?? campaigns;
  const resolvedLoading = injectedLoading ?? (hasInjectedState ? false : loading);
  const resolvedErrorMessage = injectedErrorMessage ?? errorMessage;

  const now = new Date();

  if (resolvedLoading) {
    return <LoadingState label={t("loading", { ns: "common", defaultValue: "Loading..." })} />;
  }

  if (resolvedErrorMessage) {
    return <ErrorState message={resolvedErrorMessage} onRetry={() => void loadCampaigns()} />;
  }

  const renderCampaignCard = ({ item: campaign }: { item: CampaignItem }): React.JSX.Element => {
            const statusMeta = statusLabelMeta(campaign.moderationStatus);
    const active = isCampaignActive(now, campaign.startAt, campaign.endAt);
    const ended = isCampaignEnded(now, campaign.endAt);

            return (
              <Pressable
                accessibilityRole="button"
        accessibilityLabel={`${campaign.title}. ${t("labels.status", { ns: "us3", defaultValue: "Status" })}: ${active ? t("statuses.active", { ns: "us3", defaultValue: "Active" }) : ended ? t("statuses.ended", { ns: "us3", defaultValue: "Ended" }) : t("statuses.upcoming", { ns: "us3", defaultValue: "Upcoming" })}.`}
                onPress={() => onEditCampaign(campaign)}
                style={styles.campaignCard}
                testID={`campaign-card-${campaign.id}`}
              >
                <View style={styles.cardHeader}>
          <Text variant="titleMedium" style={styles.campaignTitle} numberOfLines={1}>
                    {campaign.title}
                  </Text>
                </View>

        <View style={styles.chipRow}>
          <Chip
            compact
            style={{ backgroundColor: active ? "#2e7d32" : ended ? "#9e9e9e" : "#1565c0" }}
            textStyle={{ color: "#fff", fontSize: 11 }}
          >
            {active ? t("statuses.active", { ns: "us3", defaultValue: "Active" }) : ended ? t("statuses.ended", { ns: "us3", defaultValue: "Ended" }) : t("statuses.upcoming", { ns: "us3", defaultValue: "Upcoming" })}
          </Chip>
          <Chip
            compact
            style={{ backgroundColor: statusMeta.color }}
            textStyle={{ color: "#fff", fontSize: 11 }}
          >
            {t(statusMeta.key, { ns: "us3", defaultValue: statusMeta.defaultValue })}
          </Chip>
                </View>

        {campaign.description ? (
          <Text variant="bodySmall" numberOfLines={2}>
            {campaign.description}
          </Text>
        ) : null}

        {campaign.theme ? (
          <Text variant="bodySmall" numberOfLines={2} style={styles.themeText}>
            {campaign.theme}
          </Text>
        ) : null}

        <View style={styles.datesRow}>
          <Text variant="labelSmall">
            {t("labels.created", { ns: "us3", defaultValue: "Created" })}: {new Date(campaign.createdAt).toLocaleDateString()}
          </Text>
          <Text variant="labelSmall">
            {t("labels.start", { ns: "us3", defaultValue: "Start" })}: {new Date(campaign.startAt).toLocaleDateString()}
          </Text>
          {campaign.airdropAt ? (
            <Text variant="labelSmall">
              {t("labels.airdrop", { ns: "us3", defaultValue: "Airdrop" })}: {new Date(campaign.airdropAt).toLocaleDateString()}
            </Text>
          ) : null}
          <Text variant="labelSmall">
            {t("labels.end", { ns: "us3", defaultValue: "End" })}: {new Date(campaign.endAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.countRow}>
          <Text variant="labelSmall">
            {t("campaignResourcesCount", {
              ns: "us3",
              defaultValue: "{{count}} resource",
              count: campaign.resourceCount
            })}
          </Text>
          <Text variant="labelSmall" style={styles.countSeparator}>
            •
          </Text>
          <Text variant="labelSmall">
            {t("campaignNeedsCount", {
              ns: "us3",
              defaultValue: "{{count}} need",
              count: campaign.needCount
            })}
          </Text>
        </View>
      </Pressable>
  );
  };

  return (
    <ScreenContainer testID="my-campaigns-screen" style={styles.root}>
      <View style={styles.headerRow}>
        <Text accessibilityRole="header" variant="headlineSmall" style={styles.pageTitle}>
          {t("myCampaignsTitle", { ns: "us3", defaultValue: "My campaigns" })}
        </Text>
        <PrimaryButton
          label={t("createCampaignLabel", { ns: "us3", defaultValue: "Create campaign" })}
          onPress={onAddCampaign}
        />
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => void openInspiration()}
        style={styles.inspirationLink}
      >
        <Text variant="labelSmall" style={styles.inspirationLinkText}>
          {t("seeInspiration", { ns: "us3", defaultValue: "See inspiration" })}
        </Text>
      </Pressable>

      {resolvedCampaigns.length === 0 ? (
        <EmptyState
          message={t("myCampaignsEmpty", { ns: "us3", defaultValue: "You have no campaigns yet." })}
          actionLabel={t("createCampaignLabel", { ns: "us3", defaultValue: "Create campaign" })}
          onActionPress={onAddCampaign}
        />
      ) : (
        <FlatList
          data={resolvedCampaigns}
          renderItem={renderCampaignCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onEndReachedThreshold={0.5}
          onEndReached={() => void handleLoadMore()}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadMoreContainer}>
                <Chip icon="loading" compact>
                  {t("loading", { ns: "common", defaultValue: "Loading..." })}
                </Chip>
              </View>
            ) : null
}
        />
      )}

      <Portal>
        <ThemedDialog visible={inspirationOpen} 
          onDismiss={() => setInspirationOpen(false)} style={styles.inspirationDialog}
          title={t("inspirationTitle", { ns: "us3", defaultValue: "Inspiration campaigns" })}
          content={
            inspirationLoading ? (
              <LoadingState label={t("loading", { ns: "common", defaultValue: "Loading..." })} />
            ) : inspirationCampaigns.length === 0 ? (
              <Text variant="bodySmall">
                {t("inspirationEmpty", { ns: "us3", defaultValue: "No public campaigns available." })}
              </Text>
            ) : (
              <FlatList
                data={inspirationCampaigns}
                renderItem={({ item }) => {
                  const active = isCampaignActive(now, item.startAt, item.endAt);
                  const ended = isCampaignEnded(now, item.endAt);

                  return (
                    <View style={styles.inspirationCard}>
                      <Text variant="titleSmall">{item.title}</Text>
                      <View style={styles.chipRow}>
                        <Chip
                          compact
                          style={{ backgroundColor: active ? "#2e7d32" : ended ? "#9e9e9e" : "#1565c0" }}
                          textStyle={{ color: "#fff", fontSize: 11 }}
                        >
                          {active ? t("statuses.active", { ns: "us3", defaultValue: "Active" }) : ended ? t("statuses.ended", { ns: "us3", defaultValue: "Ended" }) : t("statuses.upcoming", { ns: "us3", defaultValue: "Upcoming" })}
                        </Chip>
                      </View>
                      {item.theme ? (
                        <Text variant="bodySmall" numberOfLines={3}>
                          {item.theme}
                        </Text>
                      ) : null}
                      {item.description ? (
                        <Text variant="bodySmall" numberOfLines={2}>
                          {item.description}
                        </Text>
                      ) : null}
                    </View>
                  );
                }}
                keyExtractor={(item) => item.id}
                style={styles.inspirationList}
              />
            )
        } />
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
  inspirationLink: {
    alignSelf: "flex-start"
  },
  inspirationLinkText: {
    color: designTokens.colors.primary,
    textDecorationLine: "underline",
    fontFamily: appFontFamilies.general
  },
  listContent: {
    gap: designTokens.spacing.sm,
    paddingBottom: designTokens.spacing.md
  },
  campaignCard: {
    backgroundColor: designTokens.colors.primaryContainer,
    borderRadius: designTokens.radius.md,
    padding: designTokens.spacing.sm,
    gap: designTokens.spacing.xs
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: designTokens.spacing.sm
  },
  campaignTitle: {
    fontFamily: appFontFamilies.altGeneral,
    flex: 1
  },
  chipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: designTokens.spacing.xs,
    flexWrap: "wrap"
  },
  themeText: {
    fontStyle: "italic",
    color: designTokens.colors.primary
  },
  datesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: designTokens.spacing.xs,
    alignItems: "center"
  },
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: designTokens.spacing.xs
  },
  countSeparator: {
    color: designTokens.colors.primary
  },
  loadMoreContainer: {
    alignItems: "center",
    paddingVertical: designTokens.spacing.sm
  },
  inspirationDialog: {
    maxHeight: "80%"
  },
  inspirationList: {
    maxHeight: 400
  },
  inspirationCard: {
    backgroundColor: designTokens.colors.primaryContainer,
    borderRadius: designTokens.radius.sm,
    padding: designTokens.spacing.sm,
    gap: designTokens.spacing.xs,
    marginBottom: designTokens.spacing.sm
  }
});


