import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Checkbox, Chip, Divider, Icon, IconButton, Snackbar, Text, TextInput } from "react-native-paper";
import { useTranslation } from "react-i18next";

import {
  AppSegmentedButtons,
  FormTextInput,
  PickerDialog,
  ScreenContainer
} from "../../components/primitives";
import { EmptyState } from "../../components/state/EmptyState";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { fetchLinkableCampaigns, type LinkableCampaignItem } from "../../services/graphql/campaigns";
import {
  fetchSearchNeeds,
  type NeedItem,
  type SearchNeedsFilters
} from "../../services/graphql/needs";
import { NeedIntensity } from "../../services/graphql/generated";
import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";

export interface SearchNeedsScreenProps {
  needs?: NeedItem[];
  loading?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  onSwitchToResources?: () => void;
  onOpenNeed?: (need: NeedItem) => void;
  currentAccountId?: string | null;
}

function intensityLabelMeta(intensity: NeedIntensity): { key: string; defaultValue: string } {
  if (intensity === NeedIntensity.Commitment) {
    return { key: "needIntensityCommitment", defaultValue: "Commitment" };
  }

  if (intensity === NeedIntensity.LegUp) {
    return { key: "needIntensityLegUp", defaultValue: "Leg up" };
  }

  if (intensity === NeedIntensity.RareContribution) {
    return { key: "needIntensityRareContribution", defaultValue: "Rare contribution" };
  }

  return { key: "needIntensitySharing", defaultValue: "Sharing" };
}

function intensityFilterOptions(): NeedIntensity[] {
  return [NeedIntensity.Sharing, NeedIntensity.Commitment, NeedIntensity.LegUp, NeedIntensity.RareContribution];
}

function formatPublishedDate(value: string | null, locale: string): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [delayMs, value]);

  return debouncedValue;
}

export function SearchNeedsScreen({
  needs,
  loading = false,
  errorMessage = null,
  onRetry,
  onSwitchToResources,
  onOpenNeed,
  currentAccountId = null
}: SearchNeedsScreenProps): React.JSX.Element {
  const { t, i18n } = useTranslation(["common", "us2"]);
  const [searchTerm, setSearchTerm] = useState("");
  const [maxTokenAmount, setMaxTokenAmount] = useState("");
  const [selectedIntensities, setSelectedIntensities] = useState<NeedIntensity[]>([]);
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
  const [showCampaignsDialog, setShowCampaignsDialog] = useState(false);
  const [hideClaimedNeeds, setHideClaimedNeeds] = useState(false);
  const [remoteNeeds, setRemoteNeeds] = useState<NeedItem[]>([]);
  const [campaignOptions, setCampaignOptions] = useState<LinkableCampaignItem[]>([]);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteErrorMessage, setRemoteErrorMessage] = useState<string | null>(null);
  const hasInjectedNeeds = needs !== undefined;

  const filterSnapshot = useMemo(
    () => ({
      searchTerm,
      maxTokenAmount,
      selectedIntensities,
      selectedCampaignIds,
      hideClaimedNeeds
    }),
    [hideClaimedNeeds, maxTokenAmount, searchTerm, selectedCampaignIds, selectedIntensities]
  );
  const debouncedFilters = useDebouncedValue(filterSnapshot, 500);

  const parsedMaxTokenAmount = useMemo(() => {
    const parsed = Number.parseInt(debouncedFilters.maxTokenAmount, 10);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : null;
  }, [debouncedFilters.maxTokenAmount]);

  const loadNeeds = useCallback(async () => {
    if (hasInjectedNeeds) {
      return;
    }

    setRemoteLoading(true);
    setRemoteErrorMessage(null);

    const filters: SearchNeedsFilters = {
      searchTerm: debouncedFilters.searchTerm,
      intensityFilters: debouncedFilters.selectedIntensities,
      maxProposedTokenAmount: parsedMaxTokenAmount,
      hideClaimedNeeds: debouncedFilters.hideClaimedNeeds,
      currentAccountId
    };

    try {
      const nextNeeds = await fetchSearchNeeds(filters);
      setRemoteNeeds(nextNeeds);
    } catch {
      setRemoteErrorMessage(t("needsLoadError", { ns: "us2", defaultValue: "We could not load needs." }));
    } finally {
      setRemoteLoading(false);
    }
  }, [currentAccountId, debouncedFilters, hasInjectedNeeds, parsedMaxTokenAmount, t]);

  useEffect(() => {
    void loadNeeds();
  }, [loadNeeds]);

  useEffect(() => {
    void fetchLinkableCampaigns()
      .then(setCampaignOptions)
      .catch(() => setCampaignOptions([]));
  }, []);

  const sourceNeeds = hasInjectedNeeds ? needs : remoteNeeds;
  const campaignTitleById = useMemo(
    () => new Map(campaignOptions.map((campaign) => [campaign.id, campaign.title])),
    [campaignOptions]
  );

  const filteredNeeds = useMemo(() => {
    const normalizedSearch = debouncedFilters.searchTerm.trim().toLowerCase();

    return sourceNeeds.filter((need) => {
      const matchesSearch =
        normalizedSearch.length === 0 || `${need.title} ${need.description}`.toLowerCase().includes(normalizedSearch);
      const matchesIntensity =
        debouncedFilters.selectedIntensities.length === 0 ||
        debouncedFilters.selectedIntensities.includes(need.intensity);
      const matchesTokenAmount = parsedMaxTokenAmount === null || need.proposedTokenAmount <= parsedMaxTokenAmount;
      const matchesCampaign =
        debouncedFilters.selectedCampaignIds.length === 0 ||
        (need.campaignId !== null &&
          need.campaignId !== undefined &&
          debouncedFilters.selectedCampaignIds.includes(need.campaignId));
      const matchesClaimedVisibility = !debouncedFilters.hideClaimedNeeds || !need.isClaimedByCurrentAccount;

      return matchesSearch && matchesIntensity && matchesTokenAmount && matchesCampaign && matchesClaimedVisibility;
    });
  }, [debouncedFilters, parsedMaxTokenAmount, sourceNeeds]);

  const resolvedLoading = loading || (!hasInjectedNeeds && remoteLoading);
  const resolvedErrorMessage = errorMessage ?? (!hasInjectedNeeds ? remoteErrorMessage : null);

  const toggleIntensity = (intensity: NeedIntensity): void => {
    setSelectedIntensities((previous) =>
      previous.includes(intensity)
        ? previous.filter((value) => value !== intensity)
        : [...previous, intensity]
    );
  };

  const handleRetry = (): void => {
    if (onRetry) {
      onRetry();
      return;
    }

    void loadNeeds();
  };

  const clearFilters = (): void => {
    setSearchTerm("");
    setMaxTokenAmount("");
    setSelectedIntensities([]);
    setSelectedCampaignIds([]);
    setHideClaimedNeeds(false);
  };

  if (resolvedErrorMessage) {
    return <ErrorState message={resolvedErrorMessage} onRetry={handleRetry} />;
  }

  return (
    <ScreenContainer testID="search-needs-screen" style={styles.root}>
      <AppSegmentedButtons
        value="needs"
        onValueChange={(value) => {
          if (value === "resources") {
            onSwitchToResources?.();
          }
        }}
        buttons={[
          {
            value: "resources",
            label: t("resourcesLabel", { defaultValue: "Resources" }),
            accessibilityLabel: t("resourceSearchLabel", { defaultValue: "Search resources" })
          },
          {
            value: "needs",
            label: t("needsLabel", { defaultValue: "Needs" }),
            accessibilityLabel: t("searchNeedsLabel", { ns: "us2", defaultValue: "Search needs" })
          }
        ]}
      />

      <ScrollView style={styles.contentScroll} contentContainerStyle={styles.content}>
        <View style={styles.searchRow}>
          <FormTextInput
            label={t("searchNeedsLabel", { ns: "us2", defaultValue: "Search needs" })}
            placeholder={t("searchNeedsPlaceholder", { ns: "us2", defaultValue: "Search needs" })}
            value={searchTerm}
            onChangeText={setSearchTerm}
            style={styles.searchField}
            right={<TextInput.Icon icon="magnify" />}
          />
          <IconButton
            icon="refresh"
            mode="contained-tonal"
            onPress={handleRetry}
            accessibilityLabel={t("retry", { ns: "common", defaultValue: "Retry" })}
          />
        </View>

        <FormTextInput
          label={t("maxNeedTokenAmountLabel", { ns: "us2", defaultValue: "Max Tope amount" })}
          accessibilityLabel={t("maxNeedTokenAmountLabel", { ns: "us2", defaultValue: "Max Tope amount" })}
          value={maxTokenAmount}
          onChangeText={setMaxTokenAmount}
          keyboardType="number-pad"
        />

        <Divider />

        <Pressable
          accessibilityRole="button"
          onPress={() => setShowCampaignsDialog(true)}
          testID="needs-campaign-filter-button"
        >
          <View style={styles.accordionHeader}>
            <View>
              <Text variant="titleSmall">{t("campaignsLabel", { defaultValue: "Campaigns" })}</Text>
              <Text variant="bodySmall" style={styles.accordionSubtitle}>
                {selectedCampaignIds.length === 0
                  ? t("allCampaignsLabel", { defaultValue: "All campaigns" })
                  : `${selectedCampaignIds.length} ${t("selectedLabel", { defaultValue: "selected" })}`}
              </Text>
            </View>
            <IconButton icon="chevron-right" size={18} onPress={() => setShowCampaignsDialog(true)} />
          </View>
        </Pressable>

        {selectedCampaignIds.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.campaignChipsRow}>
            {selectedCampaignIds.map((campaignId) => (
              <Chip
                key={campaignId}
                mode="flat"
                onClose={() =>
                  setSelectedCampaignIds((previous) => previous.filter((value) => value !== campaignId))
                }
              >
                {campaignTitleById.get(campaignId) ?? campaignId}
              </Chip>
            ))}
          </ScrollView>
        ) : null}

        <Divider />

        <View>
          <Text variant="titleSmall" style={styles.sectionTitle}>
            {t("needIntensityFilterLabel", { ns: "us2", defaultValue: "Need intensity filter" })}
          </Text>
          <View style={styles.chipsRow}>
            {intensityFilterOptions().map((intensity) => (
              <Chip
                key={`intensity-${String(intensity)}`}
                selected={selectedIntensities.includes(intensity)}
                onPress={() => toggleIntensity(intensity)}
                testID={`need-intensity-chip-${String(intensity).toLowerCase()}`}
              >
                {t(intensityLabelMeta(intensity).key, {
                  ns: "us2",
                  defaultValue: intensityLabelMeta(intensity).defaultValue
                })}
              </Chip>
            ))}
          </View>
        </View>

        <Pressable
          accessibilityRole="checkbox"
          accessibilityLabel={t("hideClaimedNeeds", { ns: "us2", defaultValue: "Hide claimed needs" })}
          accessibilityState={{ checked: hideClaimedNeeds }}
          onPress={() => setHideClaimedNeeds((previous) => !previous)}
        >
          <View style={styles.checkboxRow}>
            <Checkbox status={hideClaimedNeeds ? "checked" : "unchecked"} />
            <Text>{t("hideClaimedNeeds", { ns: "us2", defaultValue: "Hide claimed needs" })}</Text>
          </View>
        </Pressable>

        {resolvedLoading ? (
          <LoadingState label={t("loading", { ns: "common", defaultValue: "Loading..." })} />
        ) : filteredNeeds.length === 0 ? (
          <EmptyState
            message={t("searchNeedsEmpty", {
              ns: "us2",
              defaultValue: "No needs found. Try changing your filters."
            })}
            actionLabel={t("clearFiltersLabel", { ns: "common", defaultValue: "Clear filters" })}
            onActionPress={clearFilters}
          />
        ) : (
          <View style={styles.list}>
            {filteredNeeds.map((need) => {
              return (
                <Pressable
                  key={need.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${need.title}. ${need.proposedTokenAmount} Tope.`}
                  onPress={() => onOpenNeed?.(need)}
                  style={styles.needCard}
                  testID={`need-card-${need.id}`}
                >
                  {need.imageUrls?.[0] ? (
                    <Image source={{ uri: need.imageUrls[0] }} style={styles.needCardImage} />
                  ) : (
                    <View style={styles.needCardImageFallback}>
                      <Icon source="image-outline" size={20} color={designTokens.colors.primary} />
                    </View>
                  )}
                  <View style={styles.needCardContent}>
                    <Text variant="labelSmall" style={styles.needCardPublishedAt}>
                      {`${t("publishedAtLabel", { defaultValue: "Published" })} ${formatPublishedDate(need.createdAt, i18n.language) ?? "-"}`}
                    </Text>
                    <View style={styles.needCardBody}>
                      <Text variant="titleMedium" numberOfLines={2} style={styles.needTitle}>
                        {need.title}
                      </Text>
                      <Text variant="labelSmall" style={styles.needCardAuthor}>
                        {`${t("broughtByLabel", { defaultValue: "Brought by" })} ${need.creatorDisplayName ?? t("anonymousLabel", { defaultValue: "Anonymous" })}`}
                      </Text>
                      <Text variant="labelSmall" style={styles.tokenLine}>
                        {t("needTokenAmount", {
                          ns: "us2",
                          defaultValue: "{{amount}} Topes",
                          amount: need.proposedTokenAmount
                        })}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <PickerDialog
        visible={showCampaignsDialog}
        title={t("campaignsLabel", { defaultValue: "Campaigns" })}
        items={campaignOptions.map((campaign) => ({ value: campaign.id, label: campaign.title }))}
        selectedValues={selectedCampaignIds}
        onDismiss={() => setShowCampaignsDialog(false)}
        onConfirm={(nextSelectedCampaignIds) => {
          setSelectedCampaignIds(nextSelectedCampaignIds);
          setShowCampaignsDialog(false);
        }}
        testID="needs-campaign-filter-dialog"
      />

    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingTop: designTokens.spacing.lg,
    paddingBottom: designTokens.spacing.sm
  },
  contentScroll: {
    flex: 1,
    marginTop: designTokens.spacing.sm
  },
  content: {
    gap: designTokens.spacing.sm,
    paddingBottom: designTokens.spacing.md
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: designTokens.spacing.xs
  },
  searchField: {
    flex: 1,
    backgroundColor: "#fff"
  },
  sectionTitle: {
    fontFamily: appFontFamilies.altGeneral,
    textTransform: "uppercase",
    letterSpacing: 0.4
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  accordionSubtitle: {
    opacity: 0.75
  },
  campaignChipsRow: {
    gap: designTokens.spacing.xs,
    paddingVertical: designTokens.spacing.xs
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: designTokens.spacing.xs,
    marginTop: designTokens.spacing.xs
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  list: {
    gap: designTokens.spacing.sm
  },
  needCard: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
    backgroundColor: designTokens.colors.primaryContainer,
    borderRadius: designTokens.radius.md,
    paddingHorizontal: 8,
    paddingVertical: 8
  },
  needCardImage: {
    width: 92,
    height: 92,
    borderRadius: designTokens.radius.md,
    backgroundColor: "#fff"
  },
  needCardImageFallback: {
    width: 92,
    height: 92,
    borderRadius: designTokens.radius.md,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center"
  },
  needCardContent: {
    flex: 1,
    marginRight: 4,
    gap: designTokens.spacing.xs
  },
  needCardPublishedAt: {
    color: designTokens.colors.primary,
    alignSelf: "flex-end",
    fontFamily: appFontFamilies.general,
    fontSize: 10,
    lineHeight: 12
  },
  needCardBody: {
    flex: 1,
    justifyContent: "center",
    gap: 2
  },
  needTitle: {
    fontFamily: appFontFamilies.altGeneral,
    flex: 1,
    fontSize: 16,
    lineHeight: 20
  },
  needCardAuthor: {
    color: designTokens.colors.primary,
    fontSize: 10,
    lineHeight: 12,
    fontFamily: appFontFamilies.general
  },
  tokenLine: {
    color: designTokens.colors.primary,
    fontFamily: appFontFamilies.general
  }
});
