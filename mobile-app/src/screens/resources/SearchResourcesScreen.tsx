import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  AppSegmentedButtons,
  FormTextInput,
  PickerDialog,
  ProximityLocationEditor,
  type ProximityLocationValue,
  ScreenContainer
} from "../../components/primitives";
import { EmptyState } from "../../components/state/EmptyState";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { CampaignExplainerButton } from "../../components/campaignExplainer/CampaignExplainerButton";
import { ResourceSearchCard } from "../../components/listings/SearchListingCards";
import { fetchLinkableCampaigns, type LinkableCampaignItem } from "../../services/graphql/campaigns";
import {
  fetchResourceCategories,
  fetchSearchResources,
  type ResourceCategoryItem
} from "../../services/graphql/resources";
import { designTokens } from "../../theme/tokens";

const MAX_DISTANCE_KM = 50;
const DEFAULT_LOCATION_COORDINATES = { latitude: 50.6072, longitude: 3.3889 };

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
  createdAt: string | null;
  creatorAccountId: string | null;
  creatorDisplayName: string | null;
  category: string;
  distanceKm: number;
  type: "product" | "service";
  canBeTakenAway: boolean;
  canBeDelivered: boolean;
  canBeExchanged: boolean;
  canBeGifted: boolean;
  located: boolean;
  campaignIds: string[];
  imageUrls: string[];
}

export interface SearchResourcesScreenProps {
  resources?: SearchResourceItem[];
  campaignOptions?: LinkableCampaignItem[];
  categoryOptions?: ResourceCategoryItem[];
  loading?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  onSwitchToNeeds?: () => void;
  onOpenResource?: (resource: SearchResourceItem) => void;
  onOpenResourceChat?: (resource: SearchResourceItem) => void;
  currentAccountId?: string | null;
  onOpenCampaign?: (campaignId: string) => void;
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
  resources,
  campaignOptions: injectedCampaignOptions,
  categoryOptions: injectedCategoryOptions,
  loading = false,
  errorMessage,
  onRetry,
  onSwitchToNeeds,
  onOpenResource,
  onOpenResourceChat,
  currentAccountId = null,
  onOpenCampaign
}: SearchResourcesScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const defaultLocationLabel = t("locationDefault", { defaultValue: "Tournai center" });
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
  const [remoteResources, setRemoteResources] = useState<SearchResourceItem[]>([]);
  const [campaignOptions, setCampaignOptions] = useState<LinkableCampaignItem[]>(injectedCampaignOptions ?? []);
  const [categoryOptions, setCategoryOptions] = useState<ResourceCategoryItem[]>(injectedCategoryOptions ?? []);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteErrorMessage, setRemoteErrorMessage] = useState<string | null>(null);
  const [referenceLocation, setReferenceLocation] = useState<ProximityLocationValue | null>({
    label: defaultLocationLabel,
    ...DEFAULT_LOCATION_COORDINATES
  });
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
  const requestIdRef = useRef(0);

  const hasInjectedResources = resources !== undefined;
  const sourceResources = hasInjectedResources ? resources : remoteResources;
  const hasInjectedPickerOptions = injectedCampaignOptions !== undefined && injectedCategoryOptions !== undefined;

  useEffect(() => {
    if (hasInjectedPickerOptions) {
      return;
    }

    void Promise.all([fetchLinkableCampaigns(), fetchResourceCategories()])
      .then(([nextCampaignOptions, nextCategoryOptions]) => {
        setCampaignOptions(nextCampaignOptions);
        setCategoryOptions(nextCategoryOptions);
      })
      .catch(() => {
        setCampaignOptions([]);
        setCategoryOptions([]);
      });
  }, [hasInjectedPickerOptions]);

  const campaignTitleById = useMemo(
    () => new Map(campaignOptions.map((campaign) => [campaign.id, campaign.title])),
    [campaignOptions]
  );
  const distanceKmValue = useMemo(() => {
    const parsed = Number.parseFloat(distanceFilter);
    if (!Number.isFinite(parsed)) {
      return 10;
    }
    return Math.max(1, Math.min(MAX_DISTANCE_KM, parsed));
  }, [distanceFilter]);
  const latitude = referenceLocation?.latitude;
  const longitude = referenceLocation?.longitude;
  const hasReferenceLocation = typeof latitude === "number" && Number.isFinite(latitude) && Math.abs(latitude) <= 90 &&
    typeof longitude === "number" && Number.isFinite(longitude) && Math.abs(longitude) <= 180;
  const unresolvedLocation = referenceLocation !== null && !hasReferenceLocation;
  const searchLatitude = hasReferenceLocation ? latitude : undefined;
  const searchLongitude = hasReferenceLocation ? longitude : undefined;
  const searchDistance = hasReferenceLocation ? distanceKmValue : 10;

  // Only server-side inputs belong in this snapshot: picker changes must not restart a request.
  const remoteFilters = useMemo(
    () => ({
      searchTerm,
      hasReferenceLocation,
      latitude: searchLatitude,
      longitude: searchLongitude,
      distanceKm: searchDistance,
      natureOptions: { isProduct: natureOptions.isProduct, isService: natureOptions.isService },
      transportOptions: { canBeTakenAway: transportOptions.canBeTakenAway, canBeDelivered: transportOptions.canBeDelivered },
      exchangeOptions: { canBeExchanged: exchangeOptions.canBeExchanged, canBeGifted: exchangeOptions.canBeGifted }
    }),
    [
      exchangeOptions.canBeExchanged,
      exchangeOptions.canBeGifted,
      hasReferenceLocation,
      searchDistance,
      searchLatitude,
      searchLongitude,
      natureOptions.isProduct,
      natureOptions.isService,
      searchTerm,
      transportOptions.canBeTakenAway,
      transportOptions.canBeDelivered
    ]
  );
  const debouncedFilters = useDebouncedValue(remoteFilters, 500);
  const latestFiltersRef = useRef(remoteFilters);
  latestFiltersRef.current = remoteFilters;
  const [resultFilters, setResultFilters] = useState(debouncedFilters);
  const [hasLoadedResources, setHasLoadedResources] = useState(false);

  // Invalidate immediately when inputs change, not only after the debounce expires.
  useEffect(() => () => {
    requestIdRef.current += 1;
  }, [remoteFilters, hasInjectedResources]);

  const loadResources = useCallback(async () => {
    if (hasInjectedResources) {
      return;
    }

    if (unresolvedLocation) {
      setRemoteLoading(false);
      return;
    }

    const currentRequestId = requestIdRef.current + 1;
    requestIdRef.current = currentRequestId;

    setRemoteLoading(true);
    setRemoteErrorMessage(null);

    try {
      const nextResources = await fetchSearchResources({
        searchTerm: debouncedFilters.searchTerm,
        hasReferenceLocation: debouncedFilters.hasReferenceLocation,
        referenceLocation: debouncedFilters.hasReferenceLocation
          ? { latitude: debouncedFilters.latitude!, longitude: debouncedFilters.longitude! }
          : null,
        distanceKm: debouncedFilters.distanceKm,
        natureOptions: debouncedFilters.natureOptions,
        transportOptions: debouncedFilters.transportOptions,
        exchangeOptions: debouncedFilters.exchangeOptions
      });

      if (requestIdRef.current !== currentRequestId || latestFiltersRef.current !== debouncedFilters) {
        return;
      }

      setRemoteResources(nextResources);
      setResultFilters(debouncedFilters);
      setHasLoadedResources(true);
    } catch {
      if (requestIdRef.current !== currentRequestId || latestFiltersRef.current !== debouncedFilters) {
        return;
      }

      setRemoteErrorMessage(t("resourceSearchLoadError", { defaultValue: "We could not load resources." }));
    } finally {
      if (requestIdRef.current === currentRequestId && latestFiltersRef.current === debouncedFilters) {
        setRemoteLoading(false);
      }
    }
  }, [
    debouncedFilters,
    hasInjectedResources,
    t,
    unresolvedLocation
  ]);

  useEffect(() => {
    void loadResources();
    return () => {
      requestIdRef.current += 1;
    };
  }, [loadResources]);

  const filteredResources = useMemo(() => {
    const filters = hasInjectedResources ? debouncedFilters : resultFilters;
    const normalizedSearch = filters.searchTerm.trim().toLowerCase();
    const maxDistance = filters.distanceKm;
    const hasDistanceFilter = Number.isFinite(maxDistance);
    const hasNatureFilter = filters.natureOptions.isProduct || filters.natureOptions.isService;
    const hasTransportFilter =
      filters.transportOptions.canBeTakenAway || filters.transportOptions.canBeDelivered;
    const hasExchangeFilter =
      filters.exchangeOptions.canBeExchanged || filters.exchangeOptions.canBeGifted;

    return sourceResources.filter((resource) => {
      const searchableText = `${resource.title} ${resource.description}`.toLowerCase();
      const matchesSearch = !hasInjectedResources || normalizedSearch.length === 0 || searchableText.includes(normalizedSearch);
      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(resource.category);
      const matchesDistance =
        !filters.hasReferenceLocation || !hasDistanceFilter || resource.distanceKm <= maxDistance;
      const matchesUnlocated = !excludeUnlocated || resource.located;
      const matchesNature =
        !hasNatureFilter ||
        (filters.natureOptions.isProduct && resource.type === "product") ||
        (filters.natureOptions.isService && resource.type === "service");
      const matchesTransport =
        !hasTransportFilter ||
        (filters.transportOptions.canBeTakenAway && resource.canBeTakenAway) ||
        (filters.transportOptions.canBeDelivered && resource.canBeDelivered);
      const matchesExchange =
        !hasExchangeFilter ||
        (filters.exchangeOptions.canBeExchanged && resource.canBeExchanged) ||
        (filters.exchangeOptions.canBeGifted && resource.canBeGifted);
      const matchesCampaigns =
        selectedCampaignIds.length === 0 ||
        selectedCampaignIds.every((campaignId) => resource.campaignIds.includes(campaignId));

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
    excludeUnlocated,
    hasInjectedResources,
    resultFilters,
    selectedCampaignIds,
    selectedCategories,
    sourceResources
  ]);

  const resolvedLoading = loading || (!hasInjectedResources && remoteLoading);
  const resolvedErrorMessage = errorMessage ?? (!hasInjectedResources ? remoteErrorMessage : null);

  const handleRetry = (): void => {
    if (onRetry) {
      onRetry();
      return;
    }

    void loadResources();
  };

  const clearFilters = (): void => {
    setSearchTerm("");
    setSelectedCategories([]);
    setDistanceFilter("10");
    setExcludeUnlocated(false);
    setNatureOptions({ isProduct: false, isService: false });
    setTransportOptions({ canBeTakenAway: false, canBeDelivered: false });
    setExchangeOptions({ canBeExchanged: false, canBeGifted: false });
    setReferenceLocation({ label: defaultLocationLabel, ...DEFAULT_LOCATION_COORDINATES });
    setSelectedCampaignIds([]);
  };

  if (resolvedErrorMessage && (hasInjectedResources || !hasLoadedResources)) {
    return <ErrorState message={resolvedErrorMessage} onRetry={handleRetry} />;
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
            <FormTextInput
              label={t("resourceSearchLabel", { defaultValue: "Search resources" })}
              placeholder={t("resourceSearchPlaceholder", { defaultValue: "Search resources" })}
              value={searchTerm}
              onChangeText={setSearchTerm}
              style={styles.searchField}
              right={<TextInput.Icon icon="magnify" />}
            />
            <IconButton
              icon="refresh"
              mode="contained-tonal"
              onPress={handleRetry}
              accessibilityLabel={t("retry", { defaultValue: "Retry" })}
            />
          </View>

          <Divider />

          <Pressable accessibilityRole="button" onPress={() => setShowCategoriesDialog(true)}>
            <View style={styles.accordionHeader}>
              <View>
                <Text variant="titleSmall">{t("categoriesTitle", { defaultValue: "Categories" })}</Text>
                {selectedCategories.length === 0 &&
                  <Text variant="bodySmall" style={styles.accordionSubtitle}>
                      {t("allCategoriesLabel", { defaultValue: "All categories" })}
                  </Text>
                }
              </View>
              <IconButton icon="chevron-right" size={18} onPress={() => setShowCategoriesDialog(true)} />
            </View>
          </Pressable>

          {selectedCategories.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {selectedCategories.map((category) => (
                <Chip
                  key={category}
                  mode="outlined"
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
                <View style={styles.accordionTitleRow}>
                  <Text variant="titleSmall">{t("campaignsLabel", { defaultValue: "Campaigns" })}</Text>
                  <CampaignExplainerButton
                    accessibilityLabel={t("campaignsExplainLabel", { defaultValue: "What is a campaign?" })}
                    testID="campaign-explainer-button"
                  />
                </View>
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

              {referenceLocation && !hasReferenceLocation ? (
                <Text variant="bodySmall">
                  {t("locationCoordinatesUnavailable", { defaultValue: "Choose a location with coordinates to filter by distance." })}
                </Text>
              ) : null}

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

          {resolvedErrorMessage ? <ErrorState message={resolvedErrorMessage} onRetry={handleRetry} /> : null}
          {!hasInjectedResources && sourceResources.length >= 50 ? (
            <Text variant="bodySmall">{t("searchResourcesLimit", { defaultValue: "Showing up to 50 results. Refine your search; other matches may be missing." })}</Text>
          ) : null}
          {resolvedLoading ? <LoadingState label={t("loading", { defaultValue: "Loading..." })} /> : null}
          {resolvedLoading && (loading || !hasLoadedResources) ? null : filteredResources.length === 0 ? (
            <EmptyState
              message={t("searchResourcesEmpty", {
                defaultValue: "No resources found. Try changing your filters."
              })}
              actionLabel={t("clearFiltersLabel", { defaultValue: "Clear filters" })}
              onActionPress={clearFilters}
            />
          ) : (
            <View style={styles.resourcesList}>
              {filteredResources.map((resource) => (
                <ResourceSearchCard
                  key={resource.id}
                  listing={resource}
                  accessibilityLabel={`${resource.title}. ${resource.category}. ${resource.distanceKm.toFixed(1)} km.`}
                  {...(onOpenResource ? { onPress: () => onOpenResource(resource) } : {})}
                  {...(onOpenResourceChat && resource.creatorAccountId !== currentAccountId
                    ? { onStartChat: () => onOpenResourceChat(resource) }
                    : {})}
                />
              ))}
            </View>
          )}
      </ScrollView>

      <PickerDialog
        visible={showCategoriesDialog}
        title={t("categoriesTitle", { defaultValue: "Categories" })}
        items={categoryOptions.map((category) => ({ value: category.label, label: category.label }))}
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
        items={campaignOptions.map((campaign) => ({
          value: campaign.id,
          label: campaign.title,
          ...(onOpenCampaign
            ? {
                actionIcon: "eye",
                actionAccessibilityLabel: t("openCampaignPublic", { defaultValue: "View campaign" })
              }
            : {})
        }))}
        selectedValues={selectedCampaignIds}
        onDismiss={() => setShowCampaignsDialog(false)}
        onConfirm={(nextSelectedCampaignIds) => {
          setSelectedCampaignIds(nextSelectedCampaignIds);
          setShowCampaignsDialog(false);
        }}
        {...(onOpenCampaign ? { onItemAction: (item: { value: string }) => onOpenCampaign(item.value) } : {})}
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
  accordionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: designTokens.spacing.xs
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
    gap: 10,
    width: "100%",
    paddingBottom: 4
  }
});
