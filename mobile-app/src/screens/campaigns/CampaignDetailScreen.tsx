import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Snackbar, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import {
  NavigationBackHeader,
  DateTimePickerField,
  FormFieldLabel,
  FormTextInput,
  ImagePickerField,
  PrimaryButton,
  ScreenContainer
} from "../../components/primitives";
import { CampaignModerationStatus } from "../../services/graphql/generated";
import { createCampaignForAccount, updateCampaignById, type CampaignItem } from "../../services/graphql/campaigns";
import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";

export interface CampaignDetailScreenProps {
  campaign: CampaignItem;
  creatorAccountId: string | null;
  isNew?: boolean;
  onApprovePendingEntry?: (entryId: string) => Promise<void> | void;
  onRejectPendingEntry?: (entryId: string) => Promise<void> | void;
  onBack?: () => void;
  onSaved?: () => void;
}

const DEFAULT_REWARDS_MULTIPLIER = "5";
const DEFAULT_AIRDROP_AMOUNT = "3000";

function plainTextFromRichText(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function CampaignDetailScreen({
  campaign,
  creatorAccountId,
  isNew = false,
  onApprovePendingEntry,
  onRejectPendingEntry,
  onBack,
  onSaved
}: CampaignDetailScreenProps): React.JSX.Element {
  const { t } = useTranslation(["common", "us3"]);
  const [title, setTitle] = useState(campaign.title);
  const [theme, setTheme] = useState(campaign.theme ?? "");
  const [description, setDescription] = useState(campaign.description);

  const defaultStartAt = useMemo(() => new Date(), []);
  const defaultAirdropAt = useMemo(() => new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), []);
  const defaultEndAt = useMemo(() => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), []);

  const [startAt, setStartAt] = useState<Date>(
    campaign.startAt ? new Date(campaign.startAt) : defaultStartAt
  );
  const [airdropAt, setAirdropAt] = useState<Date>(
    campaign.airdropAt ? new Date(campaign.airdropAt) : defaultAirdropAt
  );
  const [endAt, setEndAt] = useState<Date>(
    campaign.endAt ? new Date(campaign.endAt) : defaultEndAt
  );
  const [rewardsMultiplier, setRewardsMultiplier] = useState(
    String(campaign.rewardsMultiplier ?? DEFAULT_REWARDS_MULTIPLIER)
  );
  const [airdropAmount, setAirdropAmount] = useState(
    String(campaign.airdropAmount ?? DEFAULT_AIRDROP_AMOUNT)
  );
  const [managerNoteFromCreator, setManagerNoteFromCreator] = useState(
    campaign.managerNoteFromCreator ?? ""
  );
  const [imageUri, setImageUri] = useState<string | null>(campaign.imageUrl ?? null);
  const [saving, setSaving] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);
  const [approvingEntries, setApprovingEntries] = useState<string[]>([]);
  const [rejectingEntries, setRejectingEntries] = useState<string[]>([]);

  const withRequiredMark = (label: string): string => `${label} *`;

  const isCreator = creatorAccountId === campaign.creatorAccountId;
  const isApproved = campaign.moderationStatus === CampaignModerationStatus.Approved;
  const isPending = campaign.moderationStatus === CampaignModerationStatus.Pending;
  const pendingEntries = campaign.pendingEntries ?? [];

  const validationError = useMemo(() => {
    if (title.trim().length === 0) {
      return t("fieldRequired", { ns: "common", defaultValue: "This field is required." });
    }

    if (plainTextFromRichText(theme).length === 0) {
      return t("campaignThemeRequired", { ns: "us3", defaultValue: "Theme is required." });
    }

    if (description.trim().length === 0) {
      return t("fieldRequired", { ns: "common", defaultValue: "This field is required." });
    }

    if (description.trim().length > 500) {
      return t("campaignDescriptionMaxLength", {
        ns: "us3",
        defaultValue: "Description must be 500 characters or fewer."
      });
    }

    if (!startAt || !airdropAt || !endAt) {
      return t("campaignDatesRequired", { ns: "us3", defaultValue: "Start, airdrop and end dates are required." });
    }

    const start = startAt.getTime();
    const airdrop = airdropAt.getTime();
    const end = endAt.getTime();

    if (start >= end) {
      return t("campaignEndDateMustBeAfterStart", {
        ns: "us3",
        defaultValue: "End date must be after start date."
      });
    }

    if (airdrop < start || airdrop > end) {
      return t("campaignAirdropDateMustBeBetween", {
        ns: "us3",
        defaultValue: "Airdrop date must be between start and end."
      });
    }

    const multiplier = Number(rewardsMultiplier);
    if (!Number.isInteger(multiplier) || multiplier < 5 || multiplier > 10) {
      return t("campaignRewardsMultiplierRange", {
        ns: "us3",
        defaultValue: "Rewards multiplier must be between 5 and 10."
      });
    }

    const amount = Number(airdropAmount);
    if (!Number.isInteger(amount) || amount < 3000 || amount > 8000) {
      return t("campaignAirdropAmountRange", {
        ns: "us3",
        defaultValue: "Airdrop amount must be between 3000 and 8000."
      });
    }

    return null;
  }, [airdropAmount, airdropAt, description, endAt, rewardsMultiplier, startAt, t, theme, title]);

  const saveCampaign = async (): Promise<void> => {
    setHasAttemptedSubmit(true);

    if (validationError) {
      setSnackbarMessage(validationError);
      return;
    }

    if (!isCreator && !isNew) {
      setSnackbarMessage(
        t("campaignCannotEditOthers", { ns: "us3", defaultValue: "You can only edit your own campaigns." })
      );
      return;
    }

    setSaving(true);

    try {
      const input = {
        title,
        theme,
        description,
        startAt: startAt?.toISOString() ?? "",
        airdropAt: airdropAt?.toISOString() ?? "",
        endAt: endAt?.toISOString() ?? "",
        rewardsMultiplier: Number(rewardsMultiplier),
        airdropAmount: Number(airdropAmount),
        imageUrl: imageUri,
        ...(managerNoteFromCreator.trim() && { managerNoteFromCreator: managerNoteFromCreator.trim() })
      };

      if (isNew) {
        if (!creatorAccountId) {
          throw new Error("Cannot create campaign: missing account");
        }

        await createCampaignForAccount(creatorAccountId, input);
      } else {
        await updateCampaignById(campaign.id, input);
      }

      setSnackbarMessage(t("campaignSavedSuccess", { ns: "us3", defaultValue: "Campaign saved." }));
      onSaved?.();
    } catch {
      setSnackbarMessage(
        t("campaignSaveError", { ns: "us3", defaultValue: "We could not save this campaign." })
      );
    } finally {
      setSaving(false);
    }
  };

  const handleApproveEntry = async (entryId: string): Promise<void> => {
    if (!onApprovePendingEntry) {
      return;
    }

    setApprovingEntries((prev) => [...prev, entryId]);

    try {
      await onApprovePendingEntry(entryId);
    } catch {
      setSnackbarMessage(
        t("campaignEntryApproveError", { ns: "us3", defaultValue: "Could not approve entry." })
      );
    } finally {
      setApprovingEntries((prev) => prev.filter((id) => id !== entryId));
    }
  };

  const handleRejectEntry = async (entryId: string): Promise<void> => {
    if (!onRejectPendingEntry) {
      return;
    }

    setRejectingEntries((prev) => [...prev, entryId]);

    try {
      await onRejectPendingEntry(entryId);
    } catch {
      setSnackbarMessage(
        t("campaignEntryRejectError", { ns: "us3", defaultValue: "Could not reject entry." })
      );
    } finally {
      setRejectingEntries((prev) => prev.filter((id) => id !== entryId));
    }
  };

  return (
    <ScreenContainer testID="campaign-detail-screen" style={styles.root}>
      <NavigationBackHeader
        onBack={onBack}
        accessibilityLabel={t("backToMyHubLabel", { ns: "common", defaultValue: "Back" })}
      />

      <View style={styles.headerTitleRow}>
        <Text accessibilityRole="header" variant="headlineSmall" style={styles.pageTitle}>
          {isNew ? t("newCampaignTitle", { ns: "us3", defaultValue: "New Campaign" }) : campaign.title}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {(isCreator || isNew) && (isPending || isNew) ? (
          <>
            <FormTextInput
              label={withRequiredMark(t("campaignTitleLabel", { ns: "us3", defaultValue: "Title" }))}
              accessibilityLabel={t("campaignTitleLabel", { ns: "us3", defaultValue: "Title" })}
              value={title}
              onChangeText={setTitle}
            />

            <FormTextInput
              label={withRequiredMark(t("campaignThemeLabel", { ns: "us3", defaultValue: "Theme" }))}
              accessibilityLabel={t("campaignThemeLabel", { ns: "us3", defaultValue: "Theme" })}
              value={theme}
              onChangeText={setTheme}
              multiline
              numberOfLines={3}
            />

            <FormTextInput
              label={withRequiredMark(t("campaignDescriptionLabel", { ns: "us3", defaultValue: "Description" }))}
              accessibilityLabel={t("campaignDescriptionLabel", { ns: "us3", defaultValue: "Description" })}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />

            <ImagePickerField
              label={t("campaignImageLabel", { ns: "us3", defaultValue: "Campaign image" })}
              accessibilityLabel={t("campaignImageLabel", { ns: "us3", defaultValue: "Campaign image" })}
              imageUri={imageUri}
              onChange={setImageUri}
              addFromCameraLabel={t("addFromCameraLabel", { ns: "common", defaultValue: "Take photo" })}
              addFromLibraryLabel={t("addFromLibraryLabel", { ns: "common", defaultValue: "Pick from library" })}
            />

            <DateTimePickerField
              label={withRequiredMark(t("campaignStartDateLabel", { ns: "us3", defaultValue: "Start date" }))}
              value={startAt}
              onChange={(nextValue: Date | undefined) => {
                if (nextValue) setStartAt(nextValue);
              }}
              testID="campaign-start-date"
              allowClear={false}
            />

            <DateTimePickerField
              label={withRequiredMark(t("campaignAirdropDateLabel", { ns: "us3", defaultValue: "Airdrop date" }))}
              value={airdropAt}
              onChange={(nextValue: Date | undefined) => {
                if (nextValue) setAirdropAt(nextValue);
              }}
              testID="campaign-airdrop-date"
              allowClear={false}
            />

            <DateTimePickerField
              label={withRequiredMark(t("campaignEndDateLabel", { ns: "us3", defaultValue: "End date" }))}
              value={endAt}
              onChange={(nextValue: Date | undefined) => {
                if (nextValue) setEndAt(nextValue);
              }}
              testID="campaign-end-date"
              allowClear={false}
            />

            <FormTextInput
              label={withRequiredMark(t("campaignRewardsMultiplierLabel", { ns: "us3", defaultValue: "Rewards multiplier" }))}
              accessibilityLabel={t("campaignRewardsMultiplierLabel", { ns: "us3", defaultValue: "Rewards multiplier" })}
              value={rewardsMultiplier}
              onChangeText={setRewardsMultiplier}
              keyboardType="numeric"
            />

            <FormTextInput
              label={withRequiredMark(t("campaignAirdropAmountLabel", { ns: "us3", defaultValue: "Airdrop amount" }))}
              accessibilityLabel={t("campaignAirdropAmountLabel", { ns: "us3", defaultValue: "Airdrop amount" })}
              value={airdropAmount}
              onChangeText={setAirdropAmount}
              keyboardType="numeric"
            />

            <FormTextInput
              label={t("campaignNoteForManagerLabel", { ns: "us3", defaultValue: "Note for manager" })}
              accessibilityLabel={t("campaignNoteForManagerLabel", { ns: "us3", defaultValue: "Note for manager" })}
              value={managerNoteFromCreator}
              onChangeText={setManagerNoteFromCreator}
              multiline
              numberOfLines={3}
            />

            {hasAttemptedSubmit && validationError ? <Text style={styles.warningText}>{validationError}</Text> : null}

            <PrimaryButton
              label={isNew ? t("createCampaignLabel", { ns: "us3", defaultValue: "Create campaign" }) : t("saveCampaignLabel", { ns: "us3", defaultValue: "Save campaign" })}
              onPress={() => void saveCampaign()}
              loading={saving}
              disabled={saving}
            />
          </>
        ) : (
          <View style={styles.nonEditableOverlay}>
            <Text style={styles.nonEditableText}>
              {t("campaignIsNotEditable", {
                ns: "us3",
                defaultValue: "This campaign is not editable because its status is not pending or approved."
              })}
            </Text>
          </View>
        )}

        {isApproved && pendingEntries.length > 0 && (
          <View style={styles.moderationBlock}>
            <FormFieldLabel style={styles.sectionTitle}>
              {t("campaignPendingEntriesLabel", { ns: "us3", defaultValue: "Pending entries" })}
            </FormFieldLabel>

            {pendingEntries.map((entry) => {
              const isApproving = approvingEntries.includes(entry.id);
              const isRejecting = rejectingEntries.includes(entry.id);
              const isBusy = isApproving || isRejecting;

              return (
                <View key={entry.id} style={styles.entryCard}>
                  <View style={styles.entryInfo}>
                    <Text variant="labelSmall" style={styles.entryType}>
                      {entry.type.toUpperCase()}
                    </Text>
                    <Text variant="bodySmall">{entry.title}</Text>
                    <Text variant="labelSmall" style={styles.entryCreator}>
                      by {entry.creatorDisplayName ?? "Unknown"}
                    </Text>
                  </View>

                  <View style={styles.entryActions}>
                    <PrimaryButton
                      label={t("approveLabel", { ns: "common", defaultValue: "Approve" })}
                      onPress={() => void handleApproveEntry(entry.id)}
                      loading={isApproving}
                      disabled={isBusy}
                    />
                    <PrimaryButton
                      label={t("rejectLabel", { ns: "common", defaultValue: "Reject" })}
                      onPress={() => void handleRejectEntry(entry.id)}
                      loading={isRejecting}
                      disabled={isBusy}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {!isNew && (isApproved || isPending) && (
          <View style={styles.statsBlock}>
            <FormFieldLabel style={styles.sectionTitle}>
              {t("campaignStatsLabel", { ns: "us3", defaultValue: "Campaign stats" })}
            </FormFieldLabel>
            <Text variant="bodySmall">
              {t("campaignResourcesCount", {
                ns: "us3",
                defaultValue: "{{count}} resources",
                count: campaign.resourceCount
              })}
            </Text>
            <Text variant="bodySmall">
              {t("campaignNeedsCount", {
                ns: "us3",
                defaultValue: "{{count}} needs",
                count: campaign.needCount
              })}
            </Text>
            {pendingEntries.length > 0 && (
              <Text variant="bodySmall">
                {t("campaignPendingCount", {
                  ns: "us3",
                  defaultValue: "{{count}} pending entries",
                  count: pendingEntries.length
                })}
              </Text>
            )}
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
    position: "relative"
  },
  headerTitleRow: {
    marginTop: 4,
    marginBottom: designTokens.spacing.md
  },
  pageTitle: {
    fontFamily: appFontFamilies.title,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    flex: 1
  },
  content: {
    gap: designTokens.spacing.sm,
    paddingBottom: designTokens.spacing.md
  },
  moderationBlock: {
    gap: designTokens.spacing.sm,
    marginTop: designTokens.spacing.md
  },
  sectionTitle: {
    fontFamily: appFontFamilies.altGeneral,
    textTransform: "uppercase",
    letterSpacing: 0.4
  },
  entryCard: {
    backgroundColor: designTokens.colors.primaryContainer,
    borderRadius: designTokens.radius.md,
    padding: designTokens.spacing.sm,
    gap: designTokens.spacing.xs
  },
  entryInfo: {
    gap: designTokens.spacing.xs
  },
  entryType: {
    color: designTokens.colors.primary,
    fontFamily: appFontFamilies.general,
    textTransform: "uppercase"
  },
  entryCreator: {
    color: designTokens.colors.secondary,
    fontFamily: appFontFamilies.general,
    fontSize: 11
  },
  entryActions: {
    flexDirection: "row",
    gap: designTokens.spacing.xs,
    marginTop: designTokens.spacing.xs
  },
  statsBlock: {
    backgroundColor: designTokens.colors.primaryContainer,
    borderRadius: designTokens.radius.md,
    padding: designTokens.spacing.sm,
    gap: designTokens.spacing.xs,
    marginTop: designTokens.spacing.md
  },
  warningText: {
    color: designTokens.colors.primary,
    fontFamily: appFontFamilies.general,
    fontSize: 12
  },
  nonEditableOverlay: {
    backgroundColor: designTokens.colors.primaryContainer,
    borderRadius: designTokens.radius.md,
    padding: designTokens.spacing.sm,
    marginTop: designTokens.spacing.md,
    alignItems: "center",
    justifyContent: "center"
  },
  nonEditableText: {
    color: designTokens.colors.primary,
    fontFamily: appFontFamilies.general,
    fontSize: 14,
    textAlign: "center"
  }
});
