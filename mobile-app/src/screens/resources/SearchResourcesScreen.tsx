import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View
} from "react-native";
import Slider from "@react-native-community/slider";
import { Checkbox, Chip, Divider, Icon, IconButton, Text, TextInput } from "react-native-paper";
import { useTranslation } from "react-i18next";

import {
  AppCard,
  AppSegmentedButtons,
  PickerDialog,
  ProximityLocationEditor,
  type ProximityLocationValue,
  ScreenContainer
} from "../../components/primitives";
import { EmptyState } from "../../components/state/EmptyState";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { designTokens } from "../../theme/tokens";

const MAX_DISTANCE_KM = 100;

interface ProximityOptionRowProps {
  title: string;
  value: boolean;
  onChange: (newValue: boolean) => void;
}

function ProximityOptionRow({ title, value, onChange }: ProximityOptionRowProps): React.JSX.Element {
  const color = value ? designTokens.colors.primary : "#000";

  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: value }} onPress={() => onChange(!value)}>
      <View style={styles.optionSelectRow}>
        <Icon source={value ? "checkbox-marked" : "checkbox-blank-outline"} size={28} color={color} />
        <Text variant="bodyMedium" style={[styles.optionSelectText, { color }]}>
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

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

export function SearchResourcesScreen({
  resources = DEFAULT_RESOURCES,
  loading = false,
  errorMessage,
  onRetry,
  onSwitchToNeeds,
  onOpenResource
}: SearchResourcesScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const defaultLocationLabel = t("locationAroundMeLabel", { defaultValue: "Around me" });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [distanceFilter, setDistanceFilter] = useState("10");
  const [excludeUnlocated, setExcludeUnlocated] = useState(false);
  const [natureOptions, setNatureOptions] = useState({ isProduct: false, isService: false });
  const [transportOptions, setTransportOptions] = useState({ canBeTakenAway: false, canBeDelivered: false });
  const [exchangeOptions, setExchangeOptions] = useState({ canBeExchanged: false, canBeGifted: false });
  const [showCategoriesDialog, setShowCategoriesDialog] = useState(false);
  const [showCampaignsDialog, setShowCampaignsDialog] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showProximity, setShowProximity] = useState(false);
  const [referenceLocation, setReferenceLocation] = useState<ProximityLocationValue | null>({
    label: defaultLocationLabel
  });
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);

  const allCampaignIds = useMemo(() => resolveCampaignIds(resources), [resources]);
  const allCategories = useMemo(() => resolveCategories(resources), [resources]);
  const distanceKmValue = useMemo(() => {
    const parsed = Number.parseFloat(distanceFilter);
    if (!Number.isFinite(parsed)) {
      return 10;
    }
    return Math.max(1, Math.min(MAX_DISTANCE_KM, parsed));
  }, [distanceFilter]);
  const hasReferenceLocation = referenceLocation !== null;

  const filterSnapshot = useMemo(
    () => ({
      searchTerm,
      selectedCategories,
      distanceFilter,
      excludeUnlocated,
      referenceLocationLabel: referenceLocation?.label ?? null,
      natureOptions,
      transportOptions,
      exchangeOptions,
      selectedCampaignIds
    }),
    [
      distanceFilter,
      excludeUnlocated,
      exchangeOptions,
      natureOptions,
      referenceLocation,
      searchTerm,
      selectedCampaignIds,
      selectedCategories,
      transportOptions
    ]
  );
  const debouncedFilters = useDebouncedValue(filterSnapshot, 500);

  const filteredResources = useMemo(() => {
    const normalizedSearch = debouncedFilters.searchTerm.trim().toLowerCase();
    const maxDistance = Number.parseFloat(debouncedFilters.distanceFilter);
    const hasDistanceFilter = Number.isFinite(maxDistance);
    const hasNatureFilter = debouncedFilters.natureOptions.isProduct || debouncedFilters.natureOptions.isService;
    const hasTransportFilter =
      debouncedFilters.transportOptions.canBeTakenAway || debouncedFilters.transportOptions.canBeDelivered;
    const hasExchangeFilter =
      debouncedFilters.exchangeOptions.canBeExchanged || debouncedFilters.exchangeOptions.canBeGifted;

    return resources.filter((resource) => {
      const searchableText = `${resource.title} ${resource.description}`.toLowerCase();
      const matchesSearch = normalizedSearch.length === 0 || searchableText.includes(normalizedSearch);
      const matchesCategory =
        debouncedFilters.selectedCategories.length === 0 ||
        debouncedFilters.selectedCategories.includes(resource.category);
      const hasDebouncedReferenceLocation = debouncedFilters.referenceLocationLabel !== null;
      const matchesDistance =
        !hasDebouncedReferenceLocation || !hasDistanceFilter || (resource.located && resource.distanceKm <= maxDistance);
      const matchesUnlocated = !debouncedFilters.excludeUnlocated || resource.located;
      const matchesNature =
        !hasNatureFilter ||
        (debouncedFilters.natureOptions.isProduct && resource.type === "product") ||
        (debouncedFilters.natureOptions.isService && resource.type === "service");
      const matchesTransport =
        !hasTransportFilter ||
        (debouncedFilters.transportOptions.canBeTakenAway && resource.canBeTakenAway) ||
        (debouncedFilters.transportOptions.canBeDelivered && resource.canBeDelivered);
      const matchesExchange =
        !hasExchangeFilter ||
        (debouncedFilters.exchangeOptions.canBeExchanged && resource.canBeExchanged) ||
        (debouncedFilters.exchangeOptions.canBeGifted && resource.canBeGifted);
      const matchesCampaigns =
        debouncedFilters.selectedCampaignIds.length === 0 ||
        debouncedFilters.selectedCampaignIds.every((campaignId) => resource.campaignIds.includes(campaignId));

      return (
        matchesSearch &&
        matchesCategory &&
        matchesDistance &&
        matchesUnlocated &&
        matchesNature &&
        matchesTransport &&
        matchesExchange &&
        matchesCampaigns
      );
    });
  }, [
    debouncedFilters,
    resources
  ]);

  const clearFilters = (): void => {
    setSearchTerm("");
    setSelectedCategories([]);
    setDistanceFilter("10");
    setExcludeUnlocated(false);
    setNatureOptions({ isProduct: false, isService: false });
    setTransportOptions({ canBeTakenAway: false, canBeDelivered: false });
    setExchangeOptions({ canBeExchanged: false, canBeGifted: false });
    setReferenceLocation({ label: defaultLocationLabel });
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
      <AppSegmentedButtons
        value="resources"
        onValueChange={(value) => {
          if (value === "needs") {
            onSwitchToNeeds?.();
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
            accessibilityLabel: t("searchNeedsLabel", { defaultValue: "Search needs" })
          }
        ]}
      />

      <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentScrollContent}>
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
              onPress={onRetry ?? (() => undefined)}
              accessibilityLabel={t("retry", { defaultValue: "Retry" })}
            />
          </View>

          <Divider />

          <Pressable accessibilityRole="button" onPress={() => setShowCategoriesDialog(true)}>
            <View style={styles.accordionHeader}>
              <View>
                <Text variant="titleSmall">{t("categoriesTitle", { defaultValue: "Categories" })}</Text>
                <Text variant="bodySmall" style={styles.accordionSubtitle}>
                  {selectedCategories.length === 0
                    ? t("allCategoriesLabel", { defaultValue: "All categories" })
                    : `${selectedCategories.length} ${t("selectedLabel", { defaultValue: "selected" })}`}
                </Text>
              </View>
              <IconButton icon="chevron-right" size={18} onPress={() => setShowCategoriesDialog(true)} />
            </View>
          </Pressable>

          {selectedCategories.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {selectedCategories.map((category) => (
                <Chip
                  key={category}
                  selected
                  mode="flat"
                  onClose={() =>
                    setSelectedCategories((previous) => previous.filter((value) => value !== category))
                  }
                >
                  {category}
                </Chip>
              ))}
            </ScrollView>
          ) : null}

          <Divider />

          <Pressable accessibilityRole="button" onPress={() => setShowCampaignsDialog(true)}>
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {selectedCampaignIds.map((campaignId) => (
                <Chip
                  key={campaignId}
                  selected
                  mode="flat"
                  onClose={() =>
                    setSelectedCampaignIds((previous) => previous.filter((value) => value !== campaignId))
                  }
                >
                  {campaignId}
                </Chip>
              ))}
            </ScrollView>
          ) : null}

          <Divider />

          <Pressable accessibilityRole="button" onPress={() => setShowOptions((previous) => !previous)}>
            <View style={styles.accordionHeader}>
              <Text variant="titleSmall">{t("optionsTitle", { defaultValue: "Options" })}</Text>
              <IconButton
                icon={showOptions ? "chevron-up" : "chevron-right"}
                size={18}
                onPress={() => setShowOptions((previous) => !previous)}
              />
            </View>
          </Pressable>

          {showOptions ? (
            <View style={styles.optionGroups}>
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
              <IconButton
                icon={showProximity ? "chevron-up" : "chevron-right"}
                size={18}
                onPress={() => setShowProximity((previous) => !previous)}
              />
            </View>
          </Pressable>

          {showProximity ? (
            <View style={styles.proximitySection}>
              <ProximityLocationEditor value={referenceLocation} onChange={setReferenceLocation} />

              {hasReferenceLocation ? (
                <View style={styles.distanceZone}>
                  <Text variant="bodySmall" style={styles.distanceSummaryText}>
                    {t("maxDistanceLabel", {
                      defaultValue: "{{distance}} km max",
                      distance: Math.round(distanceKmValue)
                    })}
                  </Text>

                  <Slider
                    minimumValue={1}
                    maximumValue={MAX_DISTANCE_KM}
                    step={5}
                    value={distanceKmValue}
                    minimumTrackTintColor={designTokens.colors.primary}
                    maximumTrackTintColor={designTokens.colors.primary}
                    thumbTintColor={designTokens.colors.primary}
                    style={styles.proximitySlider}
                    onValueChange={(nextValue) => setDistanceFilter(String(Math.round(nextValue)))}
                  />

                  <ProximityOptionRow
                    title={t("excludeUnlocatedLabel", { defaultValue: "Exclude unlocated resources" })}
                    value={excludeUnlocated}
                    onChange={setExcludeUnlocated}
                  />
                </View>
              ) : null}
            </View>
          ) : null}

          {filteredResources.length === 0 ? (
            <EmptyState
              message={t("searchResourcesEmpty", {
                defaultValue: "No resources found. Try changing category, distance, or campaign filters."
              })}
              actionLabel={t("clearFiltersLabel", { defaultValue: "Clear filters" })}
              onActionPress={clearFilters}
            />
          ) : (
            <View style={styles.resourcesList}>
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
            </View>
          )}
      </ScrollView>

      <PickerDialog
        visible={showCategoriesDialog}
        title={t("categoriesTitle", { defaultValue: "Categories" })}
        items={allCategories.map((category) => ({ value: category, label: category }))}
        selectedValues={selectedCategories}
        onDismiss={() => setShowCategoriesDialog(false)}
        onConfirm={(nextSelectedCategories) => {
          setSelectedCategories(nextSelectedCategories);
          setShowCategoriesDialog(false);
        }}
      />

      <PickerDialog
        visible={showCampaignsDialog}
        title={t("campaignsLabel", { defaultValue: "Campaigns" })}
        items={allCampaignIds.map((campaignId) => ({ value: campaignId, label: campaignId }))}
        selectedValues={selectedCampaignIds}
        onDismiss={() => setShowCampaignsDialog(false)}
        onConfirm={(nextSelectedCampaignIds) => {
          setSelectedCampaignIds(nextSelectedCampaignIds);
          setShowCampaignsDialog(false);
        }}
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
  contentScrollContent: {
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
  chipsRow: {
    gap: 8,
    paddingVertical: 4
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  accordionSubtitle: {
    opacity: 0.75
  },
  optionGroups: {
    gap: 2
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 0
  },
  checkboxItem: {
    minWidth: "48%",
    flexShrink: 1,
    paddingHorizontal: 0,
    marginVertical: -4
  },
  proximitySection: {
    gap: 4
  },
  distanceZone: {
    gap: 2
  },
  distanceSummaryText: {
    textAlign: "center"
  },
  proximitySlider: {
    width: "80%",
    alignSelf: "center",
    paddingVertical: 20
  },
  optionSelectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 5,
    flexShrink: 1
  },
  optionSelectText: {
    flexShrink: 1
  },
  dialogChipsContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: designTokens.spacing.xs
  },
  resourcesList: {
    gap: 8,
    paddingBottom: 4
  }
});
