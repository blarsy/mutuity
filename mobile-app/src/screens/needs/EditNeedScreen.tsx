import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Icon, Snackbar, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import {
  NavigationBackHeader,
  DateTimePickerField,
  FormFieldLabel,
  FormTextInput,
  PickerDialog,
  PicturesField,
  PriceSetter,
  PrimaryButton,
  ProximityLocationEditor,
  type ProximityLocationValue,
  ScreenContainer
} from "../../components/primitives";
import {
  createNeedForAccount,
  type NeedItem,
  updateNeedById
} from "../../services/graphql/needs";
import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";
import { fetchLinkableCampaigns, type LinkableCampaignItem } from "../../services/graphql/campaigns";

export interface EditNeedScreenProps {
  creatorAccountId: string | null;
  initialNeed: NeedItem | null;
  onBack: () => void;
  onSaved: () => void;
}

interface NatureToggleRowProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function NatureToggleRow({ label, selected, onPress }: NatureToggleRowProps): React.JSX.Element {
  const color = selected ? designTokens.colors.primary : "#000";

  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={onPress}>
      <View style={styles.radioRow}>
        <Icon source={selected ? "checkbox-marked" : "checkbox-blank-outline"} size={24} color={color} />
        <Text style={[styles.radioLabel, { color }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

export function EditNeedScreen({
  creatorAccountId,
  initialNeed,
  onBack,
  onSaved
}: EditNeedScreenProps): React.JSX.Element {
  const { t } = useTranslation(["common", "us2"]);
  const [title, setTitle] = useState(initialNeed?.title ?? "");
  const [description, setDescription] = useState(initialNeed?.description ?? "");
  const [imageUrls, setImageUrls] = useState<string[]>(initialNeed?.imageUrls ?? []);
  const [location, setLocation] = useState<ProximityLocationValue | null>(initialNeed?.location ?? null);
  const [tokenAmount, setTokenAmount] = useState(initialNeed?.proposedTokenAmount ?? 0);
  const [objectRequired, setObjectRequired] = useState(initialNeed?.objectRequired ?? true);
  const [competenceRequired, setCompetenceRequired] = useState(initialNeed?.competenceRequired ?? false);
  const [toolingRequired, setToolingRequired] = useState(initialNeed?.toolingRequired ?? false);
  const [multiplePeopleRequired, setMultiplePeopleRequired] = useState(initialNeed?.multiplePeopleRequired ?? false);
  const [requiredCompetenceText, setRequiredCompetenceText] = useState(initialNeed?.requiredCompetenceText ?? "");
  const [requiredToolingText, setRequiredToolingText] = useState(initialNeed?.requiredToolingText ?? "");
  const [requiredPeopleCountText, setRequiredPeopleCountText] = useState(
    initialNeed?.requiredPeopleCount ? String(initialNeed.requiredPeopleCount) : ""
  );
  const [campaignId, setCampaignId] = useState(initialNeed?.campaignId ?? "");
  const [campaigns, setCampaigns] = useState<LinkableCampaignItem[]>([]);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(
    initialNeed?.expiresAt ? new Date(initialNeed.expiresAt) : undefined
  );
  const [saving, setSaving] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  const withRequiredMark = (label: string): string => `${label} *`;

  const parsedTokenAmount = useMemo(() => Math.max(0, Math.round(tokenAmount)), [tokenAmount]);

  useEffect(() => {
    void fetchLinkableCampaigns()
      .then(setCampaigns)
      .catch(() => {
        setSnackbarMessage(t("campaignsLoadError", { defaultValue: "We could not load campaigns." }));
      });
  }, [t]);

  const parsedRequiredPeopleCount = useMemo(() => {
    const parsed = Number.parseInt(requiredPeopleCountText, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }, [requiredPeopleCountText]);

  const isTokenAmountInRange = useMemo(() => {
    return parsedTokenAmount >= 10;
  }, [parsedTokenAmount]);

  const validationError = useMemo(() => {
    if (title.trim().length === 0) {
      return t("fieldRequired", { ns: "common", defaultValue: "This field is required." });
    }

    if (!location?.label?.trim()) {
      return t("needLocationRequired", { ns: "us2", defaultValue: "Location is required." });
    }

    if (toolingRequired && requiredToolingText.trim().length === 0) {
      return t("requiredToolingTextRequired", {
        ns: "us2",
        defaultValue: "Tooling details are required when tooling is needed."
      });
    }

    if (competenceRequired && requiredCompetenceText.trim().length === 0) {
      return t("requiredCompetenceTextRequired", {
        ns: "us2",
        defaultValue: "Competence details are required when competence is needed."
      });
    }

    if (multiplePeopleRequired && (parsedRequiredPeopleCount === null || parsedRequiredPeopleCount < 2)) {
      return t("requiredPeopleCountRequired", {
        ns: "us2",
        defaultValue: "At least 2 people are required."
      });
    }

    if (!isTokenAmountInRange) {
      return t("needTokenAmountRangeError", {
        ns: "us2",
        defaultValue: "Tope amount is outside the allowed range for this intensity."
      });
    }

    return null;
  }, [
    competenceRequired,
    isTokenAmountInRange,
    location?.label,
    multiplePeopleRequired,
    parsedRequiredPeopleCount,
    requiredCompetenceText,
    requiredToolingText,
    t,
    title,
    toolingRequired
  ]);

  const saveNeed = async (): Promise<void> => {
    setHasAttemptedSubmit(true);

    if (validationError) {
      setSnackbarMessage(validationError);
      return;
    }

    if (!creatorAccountId) {
      setSnackbarMessage(
        t("myNeedsMissingAccountError", {
          ns: "us2",
          defaultValue: "We could not load your needs."
        })
      );
      return;
    }

    setSaving(true);

    try {
      if (initialNeed?.id) {
        await updateNeedById(initialNeed.id, {
          title,
          description,
          imageUrls,
          location: location?.label?.trim() ? location : null,
          proposedTokenAmount: parsedTokenAmount,
          objectRequired,
          competenceRequired,
          toolingRequired,
          multiplePeopleRequired,
          requiredCompetenceText,
          requiredToolingText,
          requiredPeopleCount: multiplePeopleRequired ? parsedRequiredPeopleCount : null,
          campaignId: campaignId.trim() || null,
          expiresAt: expiresAt?.toISOString() ?? null
        });
      } else {
        await createNeedForAccount(creatorAccountId, {
          title,
          description,
          imageUrls,
          location: location?.label?.trim() ? location : null,
          proposedTokenAmount: parsedTokenAmount,
          objectRequired,
          competenceRequired,
          toolingRequired,
          multiplePeopleRequired,
          requiredCompetenceText,
          requiredToolingText,
          requiredPeopleCount: multiplePeopleRequired ? parsedRequiredPeopleCount : null,
          campaignId: campaignId.trim() || null,
          expiresAt: expiresAt?.toISOString() ?? null
        });
      }

      onSaved();
    } catch {
      setSnackbarMessage(
        t("needSaveError", {
          ns: "us2",
          defaultValue: "We could not save this need."
        })
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer testID="edit-need-screen" style={styles.root}>
      <NavigationBackHeader
        onBack={onBack}
        accessibilityLabel={t("backToMyHubLabel", { ns: "common", defaultValue: "Back to My Hub" })}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text accessibilityRole="header" variant="headlineSmall" style={styles.pageTitle}>
          {initialNeed
            ? t("editNeedLabel", { ns: "us2", defaultValue: "Edit need" })
            : t("addNeedLabel", { ns: "us2", defaultValue: "Add need" })}
        </Text>

        <PicturesField
          label={t("needImagesLabel", { ns: "us2", defaultValue: "Pictures" })}
          accessibilityLabel={t("needImagesLabel", { ns: "us2", defaultValue: "Pictures" })}
          imageUrls={imageUrls}
          onChange={setImageUrls}
          addFromCameraLabel={t("needAddPictureFromCameraLabel", { ns: "us2", defaultValue: "Take picture" })}
          addFromLibraryLabel={t("needAddPictureFromLibraryLabel", { ns: "us2", defaultValue: "Add from photos" })}
        />

        <FormTextInput
          label={withRequiredMark(t("needTitleLabel", { ns: "us2", defaultValue: "Title" }))}
          accessibilityLabel={t("needTitleLabel", { ns: "us2", defaultValue: "Title" })}
          value={title}
          onChangeText={setTitle}
        />

        <FormTextInput
          label={t("needDescriptionLabel", { ns: "us2", defaultValue: "Description" })}
          accessibilityLabel={t("needDescriptionLabel", { ns: "us2", defaultValue: "Description" })}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />

        <FormFieldLabel>
          {withRequiredMark(t("needLocationLabel", { ns: "us2", defaultValue: "Location" }))}
        </FormFieldLabel>
        <ProximityLocationEditor value={location} onChange={setLocation} />

        <PriceSetter
          label={t("needTokenAmountLabel", { ns: "us2", defaultValue: "Tope amount" })}
          accessibilityLabel={t("needTokenAmountLabel", { ns: "us2", defaultValue: "Tope amount" })}
          value={tokenAmount}
          onChange={setTokenAmount}
        />

        <View style={styles.intensityBlock}>
          <FormFieldLabel>
            {t("needOptionsLabel", { ns: "us2", defaultValue: "Need options" })}
          </FormFieldLabel>
          <NatureToggleRow
            label={t("needObjectRequiredLabel", { ns: "us2", defaultValue: "Object required" })}
            selected={objectRequired}
            onPress={() => setObjectRequired((previous) => !previous)}
          />
          <NatureToggleRow
            label={t("needToolingRequiredLabel", { ns: "us2", defaultValue: "Tooling required" })}
            selected={toolingRequired}
            onPress={() => setToolingRequired((previous) => !previous)}
          />
          <NatureToggleRow
            label={t("needCompetenceRequiredLabel", { ns: "us2", defaultValue: "Competence required" })}
            selected={competenceRequired}
            onPress={() => setCompetenceRequired((previous) => !previous)}
          />
          <NatureToggleRow
            label={t("needMultiplePeopleRequiredLabel", { ns: "us2", defaultValue: "Multiple people required" })}
            selected={multiplePeopleRequired}
            onPress={() => setMultiplePeopleRequired((previous) => !previous)}
          />
        </View>

        {toolingRequired ? (
          <FormTextInput
            label={withRequiredMark(t("requiredToolingTextLabel", { ns: "us2", defaultValue: "Required tooling" }))}
            accessibilityLabel={t("requiredToolingTextLabel", { ns: "us2", defaultValue: "Required tooling" })}
            value={requiredToolingText}
            onChangeText={setRequiredToolingText}
          />
        ) : null}

        {competenceRequired ? (
          <FormTextInput
            label={withRequiredMark(t("requiredCompetenceTextLabel", { ns: "us2", defaultValue: "Required competence" }))}
            accessibilityLabel={t("requiredCompetenceTextLabel", { ns: "us2", defaultValue: "Required competence" })}
            value={requiredCompetenceText}
            onChangeText={setRequiredCompetenceText}
          />
        ) : null}

        {multiplePeopleRequired ? (
          <FormTextInput
            label={withRequiredMark(t("requiredPeopleCountLabel", { ns: "us2", defaultValue: "Required people count" }))}
            accessibilityLabel={t("requiredPeopleCountLabel", { ns: "us2", defaultValue: "Required people count" })}
            value={requiredPeopleCountText}
            onChangeText={setRequiredPeopleCountText}
            keyboardType="number-pad"
          />
        ) : null}

        <Pressable accessibilityRole="button" onPress={() => setShowCampaignDialog(true)}>
          <View style={styles.campaignRow}>
            <View>
              <FormFieldLabel>
                {t("needCampaignLabel", { ns: "us2", defaultValue: "Campaign (optional)" })}
              </FormFieldLabel>
              <Text variant="bodySmall">
                {campaigns.find((campaign) => campaign.id === campaignId)?.title ??
                  t("noCampaignLabel", { ns: "us2", defaultValue: "No campaign" })}
              </Text>
            </View>
            <Icon source="chevron-right" size={20} />
          </View>
        </Pressable>

        <DateTimePickerField
          label={t("needExpiresAtLabel", { ns: "us2", defaultValue: "Expires at (ISO datetime)" })}
          value={expiresAt}
          onChange={setExpiresAt}
          testID="need-expiration"
        />

        {hasAttemptedSubmit && validationError ? <Text style={styles.warningText}>{validationError}</Text> : null}
      </ScrollView>

      <View style={styles.saveFooter}>
        <PrimaryButton
          label={t("saveNeedLabel", { ns: "us2", defaultValue: "Save need" })}
          onPress={() => void saveNeed()}
          loading={saving}
          disabled={saving}
        />
      </View>

      <PickerDialog
        visible={showCampaignDialog}
        title={t("needCampaignLabel", { ns: "us2", defaultValue: "Campaign (optional)" })}
        items={[
          { value: "", label: t("noCampaignLabel", { ns: "us2", defaultValue: "No campaign" }) },
          ...campaigns.map((campaign) => ({ value: campaign.id, label: campaign.title }))
        ]}
        selectedValues={[campaignId]}
        multiple={false}
        onDismiss={() => setShowCampaignDialog(false)}
        onConfirm={(values) => {
          setCampaignId(values[0] ?? "");
          setShowCampaignDialog(false);
        }}
        testID="need-campaign-dialog"
      />

      <Snackbar visible={snackbarMessage !== null} onDismiss={() => setSnackbarMessage(null)}>
        {snackbarMessage ?? ""}
      </Snackbar>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingTop: designTokens.spacing.lg
  },
  scroll: {
    flex: 1
  },
  pageTitle: {
    fontFamily: appFontFamilies.title,
    textTransform: "uppercase",
    letterSpacing: 0.6
  },
  content: {
    gap: designTokens.spacing.sm,
    paddingBottom: designTokens.spacing.md
  },
  saveFooter: {
    paddingTop: designTokens.spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#f1d6bf"
  },
  intensityBlock: {
    gap: designTokens.spacing.xs
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: designTokens.spacing.xs
  },
  radioLabel: {
    fontFamily: appFontFamilies.general
  },
  campaignRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  warningText: {
    color: designTokens.colors.primary,
    fontFamily: appFontFamilies.general,
    fontSize: 12
  }
});
