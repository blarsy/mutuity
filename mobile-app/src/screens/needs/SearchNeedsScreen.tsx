import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Checkbox, Chip, Snackbar, Text, TextInput } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { AppSegmentedButtons, PrimaryButton, ScreenContainer } from "../../components/primitives";
import { EmptyState } from "../../components/state/EmptyState";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import {
  claimNeedById,
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
  onClaimNeed?: (need: NeedItem) => Promise<void> | void;
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

export function SearchNeedsScreen({
  needs,
  loading = false,
  errorMessage = null,
  onRetry,
  onSwitchToResources,
  onOpenNeed,
  onClaimNeed,
  currentAccountId = null
}: SearchNeedsScreenProps): React.JSX.Element {
  const { t } = useTranslation(["common", "us2"]);
  const [searchTerm, setSearchTerm] = useState("");
  const [maxTokenAmount, setMaxTokenAmount] = useState("");
  const [selectedIntensities, setSelectedIntensities] = useState<NeedIntensity[]>([]);
  const [hideClaimedNeeds, setHideClaimedNeeds] = useState(false);
  const [remoteNeeds, setRemoteNeeds] = useState<NeedItem[]>([]);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteErrorMessage, setRemoteErrorMessage] = useState<string | null>(null);
  const [claimedNeedIds, setClaimedNeedIds] = useState<string[]>([]);
  const [claimingNeedIds, setClaimingNeedIds] = useState<string[]>([]);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  const hasInjectedNeeds = needs !== undefined;

  const parsedMaxTokenAmount = useMemo(() => {
    const parsed = Number.parseInt(maxTokenAmount, 10);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : null;
  }, [maxTokenAmount]);

  const loadNeeds = useCallback(async () => {
    if (hasInjectedNeeds) {
      return;
    }

    setRemoteLoading(true);
    setRemoteErrorMessage(null);

    const filters: SearchNeedsFilters = {
      searchTerm,
      intensityFilters: selectedIntensities,
      maxProposedTokenAmount: parsedMaxTokenAmount,
      hideClaimedNeeds,
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
  }, [currentAccountId, hasInjectedNeeds, hideClaimedNeeds, parsedMaxTokenAmount, searchTerm, selectedIntensities, t]);

  useEffect(() => {
    void loadNeeds();
  }, [loadNeeds]);

  const sourceNeeds = hasInjectedNeeds ? needs : remoteNeeds;

  const filteredNeeds = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return sourceNeeds.filter((need) => {
      const matchesSearch =
        normalizedSearch.length === 0 || `${need.title} ${need.description}`.toLowerCase().includes(normalizedSearch);
      const matchesIntensity = selectedIntensities.length === 0 || selectedIntensities.includes(need.intensity);
      const matchesTokenAmount = parsedMaxTokenAmount === null || need.proposedTokenAmount <= parsedMaxTokenAmount;
      const isClaimed = need.isClaimedByCurrentAccount || claimedNeedIds.includes(need.id);
      const matchesClaimedVisibility = !hideClaimedNeeds || !isClaimed;

      return matchesSearch && matchesIntensity && matchesTokenAmount && matchesClaimedVisibility;
    });
  }, [claimedNeedIds, hideClaimedNeeds, parsedMaxTokenAmount, searchTerm, selectedIntensities, sourceNeeds]);

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

  const handleClaimNeed = async (need: NeedItem): Promise<void> => {
    if (claimingNeedIds.includes(need.id) || claimedNeedIds.includes(need.id) || need.isClaimedByCurrentAccount) {
      return;
    }

    if (!currentAccountId) {
      setSnackbarMessage(
        t("claimNeedLoginRequired", {
          ns: "us2",
          defaultValue: "Sign in to claim this need."
        })
      );
      return;
    }

    setClaimingNeedIds((previous) => [...previous, need.id]);

    try {
      if (onClaimNeed) {
        await onClaimNeed(need);
      } else {
        await claimNeedById(need.id);
      }
      setClaimedNeedIds((previous) => [...previous, need.id]);
    } catch {
      setSnackbarMessage(
        t("claimNeedError", {
          ns: "us2",
          defaultValue: "We could not claim this need."
        })
      );
    } finally {
      setClaimingNeedIds((previous) => previous.filter((value) => value !== need.id));
    }
  };

  const clearFilters = (): void => {
    setSearchTerm("");
    setMaxTokenAmount("");
    setSelectedIntensities([]);
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

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.searchRow}>
          <TextInput
            mode="outlined"
            label={t("searchNeedsLabel", { ns: "us2", defaultValue: "Search needs" })}
            placeholder={t("searchNeedsPlaceholder", { ns: "us2", defaultValue: "Search needs" })}
            value={searchTerm}
            onChangeText={setSearchTerm}
            style={styles.searchField}
          />
          <PrimaryButton
            label={t("retry", { ns: "common", defaultValue: "Retry" })}
            onPress={handleRetry}
          />
        </View>

        <TextInput
          mode="outlined"
          label={t("maxNeedTokenAmountLabel", { ns: "us2", defaultValue: "Max token amount" })}
          accessibilityLabel={t("maxNeedTokenAmountLabel", { ns: "us2", defaultValue: "Max token amount" })}
          value={maxTokenAmount}
          onChangeText={setMaxTokenAmount}
          keyboardType="number-pad"
        />

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
              const isClaimed = need.isClaimedByCurrentAccount || claimedNeedIds.includes(need.id);
              const isClaiming = claimingNeedIds.includes(need.id);

              return (
                <Pressable
                  key={need.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${need.title}. ${need.proposedTokenAmount} token.`}
                  onPress={() => onOpenNeed?.(need)}
                  style={styles.needCard}
                  testID={`need-card-${need.id}`}
                >
                  <View style={styles.cardHeader}>
                    <Text variant="titleMedium" style={styles.needTitle}>
                      {need.title}
                    </Text>
                    <Chip compact>
                      {t(intensityLabelMeta(need.intensity).key, {
                        ns: "us2",
                        defaultValue: intensityLabelMeta(need.intensity).defaultValue
                      })}
                    </Chip>
                  </View>
                  <Text variant="bodySmall" numberOfLines={2}>
                    {need.description || t("needDescriptionEmpty", { ns: "us2", defaultValue: "No description yet." })}
                  </Text>
                  <Text variant="labelSmall" style={styles.tokenLine}>
                    {t("needTokenAmount", {
                      ns: "us2",
                      defaultValue: "{{amount}} token",
                      amount: need.proposedTokenAmount
                    })}
                  </Text>
                  <PrimaryButton
                    label={
                      isClaimed
                        ? t("needClaimedLabel", { ns: "us2", defaultValue: "Claimed" })
                        : t("claimNeedLabel", { ns: "us2", defaultValue: "Claim need" })
                    }
                    onPress={() => void handleClaimNeed(need)}
                    disabled={isClaimed || isClaiming}
                    loading={isClaiming}
                    testID={`need-card-claim-${need.id}`}
                  />
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Snackbar visible={snackbarMessage !== null} onDismiss={() => setSnackbarMessage(null)}>
        {snackbarMessage ?? ""}
      </Snackbar>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingTop: designTokens.spacing.lg,
    paddingBottom: designTokens.spacing.sm
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
    backgroundColor: designTokens.colors.primaryContainer,
    borderRadius: designTokens.radius.md,
    padding: designTokens.spacing.sm,
    gap: designTokens.spacing.xs
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: designTokens.spacing.sm
  },
  needTitle: {
    fontFamily: appFontFamilies.altGeneral,
    flex: 1
  },
  tokenLine: {
    color: designTokens.colors.primary,
    fontFamily: appFontFamilies.general
  }
});
