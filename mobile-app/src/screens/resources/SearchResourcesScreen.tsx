import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View
} from "react-native";
import { Button, Checkbox, Chip, Divider, IconButton, SegmentedButtons, Text, TextInput } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { AppCard, PrimaryButton, ScreenContainer } from "../../components/primitives";
import { EmptyState } from "../../components/state/EmptyState";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { designTokens } from "../../theme/tokens";

export interface SearchResourceItem {
  id: string;
  title: string;
  description: string;
  category: string;
  distanceKm: number;
  type: "product" | "service";
  canBeTakenAway: boolean;
  canBeDelivered: boolean;
  canBeExchanged: boolean;
  canBeGifted: boolean;
  located: boolean;
  campaignIds: string[];
}

export interface SearchResourcesScreenProps {
  resources?: SearchResourceItem[];
  loading?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  onSwitchToNeeds?: () => void;
  onOpenResource?: (resource: SearchResourceItem) => void;
}

const DEFAULT_RESOURCES: SearchResourceItem[] = [
  {
    id: "res-1",
    title: "Community Pantry Basket",
    description: "Weekly basket with fresh produce and pantry staples.",
    category: "Food",
    distanceKm: 2.1,
    type: "product",
    canBeTakenAway: true,
    canBeDelivered: true,
    canBeExchanged: false,
    canBeGifted: true,
    located: true,
    campaignIds: ["camp-solidarity"]
  },
  {
    id: "res-2",
    title: "Bike Repair Session",
    description: "Two-hour repair help for flat tires and brake checks.",
    category: "Services",
    distanceKm: 4.3,
    type: "service",
    canBeTakenAway: false,
    canBeDelivered: true,
    canBeExchanged: true,
    canBeGifted: false,
    located: true,
    campaignIds: ["camp-mobility", "camp-solidarity"]
  },
  {
    id: "res-3",
    title: "Children Books Bundle",
    description: "Illustrated books for ages 5 to 9.",
    category: "Education",
    distanceKm: 7.6,
    type: "product",
    canBeTakenAway: true,
    canBeDelivered: false,
    canBeExchanged: true,
    canBeGifted: true,
    located: false,
    campaignIds: ["camp-literacy"]
  }
];

function resolveCampaignIds(resources: SearchResourceItem[]): string[] {
  return Array.from(new Set(resources.flatMap((resource) => resource.campaignIds))).sort();
}

function resolveCategories(resources: SearchResourceItem[]): string[] {
  return Array.from(new Set(resources.map((resource) => resource.category))).sort();
}

export function SearchResourcesScreen({
  resources = DEFAULT_RESOURCES,
  loading = false,
  errorMessage,
  onRetry,
  onSwitchToNeeds,
  onOpenResource
}: SearchResourcesScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [distanceFilter, setDistanceFilter] = useState("10");
  const [excludeUnlocated, setExcludeUnlocated] = useState(false);
  const [natureOptions, setNatureOptions] = useState({ isProduct: false, isService: false });
  const [transportOptions, setTransportOptions] = useState({ canBeTakenAway: false, canBeDelivered: false });
  const [exchangeOptions, setExchangeOptions] = useState({ canBeExchanged: false, canBeGifted: false });
  const [showOptions, setShowOptions] = useState(true);
  const [showProximity, setShowProximity] = useState(true);
  const [activeCampaignOnly, setActiveCampaignOnly] = useState(false);
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);

  const allCampaignIds = useMemo(() => resolveCampaignIds(resources), [resources]);
  const allCategories = useMemo(() => resolveCategories(resources), [resources]);

  const filteredResources = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const maxDistance = Number.parseFloat(distanceFilter);
    const hasDistanceFilter = Number.isFinite(maxDistance);
    const hasNatureFilter = natureOptions.isProduct || natureOptions.isService;
    const hasTransportFilter = transportOptions.canBeTakenAway || transportOptions.canBeDelivered;
    const hasExchangeFilter = exchangeOptions.canBeExchanged || exchangeOptions.canBeGifted;
    const activeCampaign = selectedCampaignIds[0];

    return resources.filter((resource) => {
      const searchableText = `${resource.title} ${resource.description}`.toLowerCase();
      const matchesSearch = normalizedSearch.length === 0 || searchableText.includes(normalizedSearch);
      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(resource.category);
      const matchesDistance = !hasDistanceFilter || (resource.located && resource.distanceKm <= maxDistance);
      const matchesUnlocated = !excludeUnlocated || resource.located;
      const matchesNature =
        !hasNatureFilter ||
        (natureOptions.isProduct && resource.type === "product") ||
        (natureOptions.isService && resource.type === "service");
      const matchesTransport =
        !hasTransportFilter ||
        (transportOptions.canBeTakenAway && resource.canBeTakenAway) ||
        (transportOptions.canBeDelivered && resource.canBeDelivered);
      const matchesExchange =
        !hasExchangeFilter ||
        (exchangeOptions.canBeExchanged && resource.canBeExchanged) ||
        (exchangeOptions.canBeGifted && resource.canBeGifted);
      const matchesCampaigns =
        selectedCampaignIds.length === 0 ||
        selectedCampaignIds.every((campaignId) => resource.campaignIds.includes(campaignId));
      const matchesActiveCampaign =
        !activeCampaignOnly || (activeCampaign !== undefined && resource.campaignIds.includes(activeCampaign));

      return (
        matchesSearch &&
        matchesCategory &&
        matchesDistance &&
        matchesUnlocated &&
        matchesNature &&
        matchesTransport &&
        matchesExchange &&
        matchesCampaigns &&
        matchesActiveCampaign
      );
    });
  }, [
    activeCampaignOnly,
    distanceFilter,
    excludeUnlocated,
    exchangeOptions.canBeExchanged,
    exchangeOptions.canBeGifted,
    natureOptions.isProduct,
    natureOptions.isService,
    resources,
    searchTerm,
    selectedCampaignIds,
    selectedCategories,
    transportOptions.canBeDelivered,
    transportOptions.canBeTakenAway
  ]);

  const clearFilters = (): void => {
    setSearchTerm("");
    setSelectedCategories([]);
    setDistanceFilter("10");
    setExcludeUnlocated(false);
    setNatureOptions({ isProduct: false, isService: false });
    setTransportOptions({ canBeTakenAway: false, canBeDelivered: false });
    setExchangeOptions({ canBeExchanged: false, canBeGifted: false });
    setActiveCampaignOnly(false);
    setSelectedCampaignIds([]);
  };

  if (loading) {
    return <LoadingState label={t("loading", { defaultValue: "Loading..." })} />;
  }

  if (errorMessage) {
    return onRetry ? <ErrorState message={errorMessage} onRetry={onRetry} /> : <ErrorState message={errorMessage} />;
  }

  return (
    <ScreenContainer testID="search-resources-screen" style={styles.root}>
      <SegmentedButtons
        value="resources"
        onValueChange={(value) => {
          if (value === "needs") {
            onSwitchToNeeds?.();
          }
        }}
        buttons={[
          {
            value: "resources",
            label: t("resourceSearchLabel", { defaultValue: "Search resources" }),
            accessibilityLabel: t("resourceSearchLabel", { defaultValue: "Search resources" })
          },
          {
            value: "needs",
            label: t("searchNeedsLabel", { defaultValue: "Search needs" }),
            accessibilityLabel: t("searchNeedsLabel", { defaultValue: "Search needs" })
          }
        ]}
      />

      <View style={styles.bodySplit}>
        <ScrollView style={styles.filtersPane} contentContainerStyle={styles.filtersPaneContent}>
          <View style={styles.searchRow}>
            <TextInput
              mode="outlined"
              label={t("resourceSearchLabel", { defaultValue: "Search resources" })}
              placeholder={t("resourceSearchPlaceholder", { defaultValue: "Search resources" })}
              value={searchTerm}
              onChangeText={setSearchTerm}
              style={styles.searchField}
              outlineColor="#000"
              activeOutlineColor={designTokens.colors.primary}
              right={<TextInput.Icon icon="magnify" />}
            />
            <IconButton
              icon="refresh"
              mode="outlined"
              onPress={() => undefined}
              accessibilityLabel={t("retry", { defaultValue: "Retry" })}
            />
          </View>

          {allCampaignIds.length > 0 ? (
            <AppCard>
              <View style={styles.campaignHeader}>
                <View>
                  <Text variant="bodySmall">{t("activeCampaign", { defaultValue: "Active campaign" })}</Text>
                  <Text variant="bodyMedium" style={styles.campaignTitle}>
                    {selectedCampaignIds[0] ?? allCampaignIds[0]}
                  </Text>
                </View>
                <Checkbox
                  status={activeCampaignOnly ? "checked" : "unchecked"}
                  color={designTokens.colors.primaryContainer}
                  uncheckedColor="#fff"
                  onPress={() => setActiveCampaignOnly((previous) => !previous)}
                />
              </View>
            </AppCard>
          ) : null}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {allCategories.map((category) => {
              const selected = selectedCategories.includes(category);

              return (
                <Chip
                  key={category}
                  selected={selected}
                  mode={selected ? "flat" : "outlined"}
                  onPress={() => {
                    setSelectedCategories((previous) =>
                      previous.includes(category)
                        ? previous.filter((value) => value !== category)
                        : [...previous, category]
                    );
                  }}
                >
                  {category}
                </Chip>
              );
            })}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {allCampaignIds.map((campaignId) => {
              const selected = selectedCampaignIds.includes(campaignId);

              return (
                <Chip
                  key={campaignId}
                  selected={selected}
                  mode={selected ? "flat" : "outlined"}
                  onPress={() => {
                    setSelectedCampaignIds((previous) =>
                      previous.includes(campaignId)
                        ? previous.filter((value) => value !== campaignId)
                        : [...previous, campaignId]
                    );
                  }}
                  accessibilityLabel={`${t("campaignLabel", { defaultValue: "Campaign" })} ${campaignId}`}
                >
                  {campaignId}
                </Chip>
              );
            })}
          </ScrollView>

          <Divider />

          <Pressable accessibilityRole="button" onPress={() => setShowOptions((previous) => !previous)}>
            <View style={styles.accordionHeader}>
              <Text variant="titleSmall">{t("optionsTitle", { defaultValue: "Options" })}</Text>
              <IconButton icon={showOptions ? "chevron-up" : "chevron-right"} size={18} onPress={() => setShowOptions((previous) => !previous)} />
            </View>
          </Pressable>
          {showOptions ? (
            <View style={styles.optionGroups}>
              <Text variant="labelMedium">{t("natureLabel", { defaultValue: "Nature" })}</Text>
              <View style={styles.optionRow}>
                <Checkbox.Item
                  label={t("isProductLabel", { defaultValue: "Product" })}
                  status={natureOptions.isProduct ? "checked" : "unchecked"}
                  onPress={() =>
                    setNatureOptions((previous) => ({ ...previous, isProduct: !previous.isProduct }))
                  }
                  style={styles.checkboxItem}
                />
                <Checkbox.Item
                  label={t("isServiceLabel", { defaultValue: "Service" })}
                  status={natureOptions.isService ? "checked" : "unchecked"}
                  onPress={() =>
                    setNatureOptions((previous) => ({ ...previous, isService: !previous.isService }))
                  }
                  style={styles.checkboxItem}
                />
              </View>

              <Divider />
              <Text variant="labelMedium">{t("transportLabel", { defaultValue: "Transport" })}</Text>
              <View style={styles.optionRow}>
                <Checkbox.Item
                  label={t("canBeTakenAwayLabel", { defaultValue: "Pickup" })}
                  status={transportOptions.canBeTakenAway ? "checked" : "unchecked"}
                  onPress={() =>
                    setTransportOptions((previous) => ({
                      ...previous,
                      canBeTakenAway: !previous.canBeTakenAway
                    }))
                  }
                  style={styles.checkboxItem}
                />
                <Checkbox.Item
                  label={t("canBeDeliveredLabel", { defaultValue: "Delivery" })}
                  status={transportOptions.canBeDelivered ? "checked" : "unchecked"}
                  onPress={() =>
                    setTransportOptions((previous) => ({
                      ...previous,
                      canBeDelivered: !previous.canBeDelivered
                    }))
                  }
                  style={styles.checkboxItem}
                />
              </View>

              <Divider />
              <Text variant="labelMedium">{t("exchangeTypeLabel", { defaultValue: "Exchange type" })}</Text>
              <View style={styles.optionRow}>
                <Checkbox.Item
                  label={t("canBeExchangedLabel", { defaultValue: "Exchange" })}
                  status={exchangeOptions.canBeExchanged ? "checked" : "unchecked"}
                  onPress={() =>
                    setExchangeOptions((previous) => ({
                      ...previous,
                      canBeExchanged: !previous.canBeExchanged
                    }))
                  }
                  style={styles.checkboxItem}
                />
                <Checkbox.Item
                  label={t("canBeGiftedLabel", { defaultValue: "Gift" })}
                  status={exchangeOptions.canBeGifted ? "checked" : "unchecked"}
                  onPress={() =>
                    setExchangeOptions((previous) => ({ ...previous, canBeGifted: !previous.canBeGifted }))
                  }
                  style={styles.checkboxItem}
                />
              </View>
            </View>
          ) : null}

          <Divider />

          <Pressable accessibilityRole="button" onPress={() => setShowProximity((previous) => !previous)}>
            <View style={styles.accordionHeader}>
              <Text variant="titleSmall">{t("proximityTitle", { defaultValue: "Proximity" })}</Text>
              <IconButton icon={showProximity ? "chevron-up" : "chevron-right"} size={18} onPress={() => setShowProximity((previous) => !previous)} />
            </View>
          </Pressable>
          {showProximity ? (
            <View style={styles.proximitySection}>
              <TextInput
                mode="outlined"
                label={t("resourceDistanceFilterLabel", { defaultValue: "Distance filter (km)" })}
                value={distanceFilter}
                keyboardType="numeric"
                onChangeText={setDistanceFilter}
              />
              <Checkbox.Item
                label={t("excludeUnlocatedLabel", { defaultValue: "Exclude unlocated resources" })}
                status={excludeUnlocated ? "checked" : "unchecked"}
                onPress={() => setExcludeUnlocated((previous) => !previous)}
                style={styles.checkboxSingle}
              />
            </View>
          ) : null}

          <View style={styles.actionsRow}>
            <PrimaryButton
              label={t("clearFiltersLabel", { defaultValue: "Clear filters" })}
              onPress={clearFilters}
            />
            <Button mode="outlined" onPress={() => onSwitchToNeeds?.()}>
              {t("searchNeedsLabel", { defaultValue: "Search needs" })}
            </Button>
          </View>
        </ScrollView>

        <View style={styles.resultsPane}>
          {filteredResources.length === 0 ? (
            <EmptyState
              message={t("searchResourcesEmpty", {
                defaultValue: "No resources found. Try changing category, distance, or campaign filters."
              })}
              actionLabel={t("clearFiltersLabel", { defaultValue: "Clear filters" })}
              onActionPress={clearFilters}
            />
          ) : (
            <ScrollView contentContainerStyle={styles.resourcesList}>
              {filteredResources.map((resource) => (
                <Pressable
                  key={resource.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${resource.title}. ${resource.category}. ${resource.distanceKm.toFixed(1)} km.`}
                  onPress={() => onOpenResource?.(resource)}
                >
                  <AppCard testID={`resource-card-${resource.id}`}>
                    <Text variant="titleMedium">{resource.title}</Text>
                    <Text variant="bodySmall">{resource.description}</Text>
                    <Text variant="labelSmall">
                      {resource.category} | {resource.distanceKm.toFixed(1)} km
                    </Text>
                  </AppCard>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingTop: designTokens.spacing.lg,
    paddingBottom: designTokens.spacing.sm
  },
  bodySplit: {
    flex: 1,
    gap: designTokens.spacing.sm
  },
  filtersPane: {
    flex: 1
  },
  filtersPaneContent: {
    gap: designTokens.spacing.sm,
    paddingBottom: designTokens.spacing.sm
  },
  resultsPane: {
    flex: 1
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
  campaignHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: designTokens.colors.primary,
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.sm,
    borderRadius: designTokens.radius.lg
  },
  campaignTitle: {
    color: "#fff",
    fontWeight: "700"
  },
  chipsRow: {
    gap: 8,
    paddingVertical: 4
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  optionGroups: {
    gap: designTokens.spacing.xs
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  checkboxItem: {
    minWidth: "48%",
    flexShrink: 1,
    paddingHorizontal: 0
  },
  checkboxSingle: {
    paddingHorizontal: 0
  },
  proximitySection: {
    gap: designTokens.spacing.xs
  },
  actionsRow: {
    gap: 8
  },
  resourcesList: {
    gap: 8,
    paddingBottom: 12
  }
});
