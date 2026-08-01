import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Divider, Icon, Snackbar, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import {
  DateTimePickerField,
  FormTextInput,
  PicturesField,
  PriceSetter,
  PrimaryButton,
  ProximityLocationEditor,
  type ProximityLocationValue,
  ScreenContainer
} from "../../components/primitives";
import {
  createResourceForAccount,
  deleteResourceById,
  type MyResourceItem,
  updateResourceById
} from "../../services/graphql/resources";
import { useNetworkStatus } from "../../services/network/useNetworkStatus";
import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";

export interface EditResourceScreenProps {
  creatorAccountId: string | null;
  initialResource: MyResourceItem | null;
  onBack: () => void;
  onSaved: () => void;
}

export function EditResourceScreen({
  creatorAccountId,
  initialResource,
  onBack,
  onSaved
}: EditResourceScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const { isConnected, isInternetReachable } = useNetworkStatus();

  const [title, setTitle] = useState(initialResource?.title ?? "");
  const [tokenAmount, setTokenAmount] = useState(initialResource?.defaultTokenAmount ?? 0);
  const [imageUrls, setImageUrls] = useState<string[]>(initialResource?.imageUrls ?? []);
  const [description, setDescription] = useState(initialResource?.description ?? "");
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(
    initialResource?.expiresAt ? new Date(initialResource.expiresAt) : undefined
  );
  const [natureOptions, setNatureOptions] = useState({
    isProduct: initialResource?.isProduct ?? true,
    isService: initialResource?.isService ?? false
  });
  const [exchangeOptions, setExchangeOptions] = useState({
    canBeGifted: initialResource?.canBeGifted ?? true,
    canBeExchanged: initialResource?.canBeExchanged ?? false
  });
  const [transportOptions, setTransportOptions] = useState({
    canBeTakenAway: initialResource?.canBeTakenAway ?? true,
    canBeDelivered: initialResource?.canBeDelivered ?? false
  });
  const [location, setLocation] = useState<ProximityLocationValue | null>(initialResource?.location ?? null);
  const [saving, setSaving] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  const isOffline = !isConnected || !isInternetReachable;

  const parsedTokenAmount = useMemo(() => Math.max(0, Math.round(tokenAmount)), [tokenAmount]);

  const validationErrors = useMemo(() => {
    const errors: string[] = [];

    if (title.trim().length === 0) {
      errors.push(t("fieldRequired", { defaultValue: "Title is required." }));
    }

    if (!natureOptions.isProduct && !natureOptions.isService) {
      errors.push(t("natureRequired", { defaultValue: "Select at least one nature." }));
    }

    if (!exchangeOptions.canBeGifted && !exchangeOptions.canBeExchanged) {
      errors.push(t("exchangeTypeRequired", { defaultValue: "Select at least one exchange type." }));
    }

    if (natureOptions.isProduct && !transportOptions.canBeTakenAway && !transportOptions.canBeDelivered) {
      errors.push(t("transportRequired", { defaultValue: "Select at least one transport option." }));
    }

    if (transportOptions.canBeTakenAway && !location?.label?.trim()) {
      errors.push(t("addressRequiredWhenOnSite", { defaultValue: "Address is required for on-site pickup." }));
    }

    return errors;
  }, [exchangeOptions.canBeExchanged, exchangeOptions.canBeGifted, location?.label, natureOptions.isProduct, natureOptions.isService, t, transportOptions.canBeDelivered, transportOptions.canBeTakenAway]);

  const handleSave = async (): Promise<void> => {
    if (validationErrors.length > 0) {
      const firstError = validationErrors[0];
      if (firstError) {
        setSnackbarMessage(firstError);
      }
      return;
    }

    if (isOffline) {
      setSnackbarMessage(t("offlineResourceSaveWarning", { defaultValue: "Saving is unavailable while offline" }));
      return;
    }

    if (!creatorAccountId) {
      setSnackbarMessage(t("resourceLoadMissingAccountError", { defaultValue: "We could not load your resources." }));
      return;
    }

    setSaving(true);

    try {
      if (initialResource?.id) {
        await updateResourceById(initialResource.id, {
          title,
          description,
          defaultTokenAmount: parsedTokenAmount,
          imageUrls,
          expiresAt: expiresAt?.toISOString() ?? null,
          isProduct: natureOptions.isProduct,
          isService: natureOptions.isService,
          canBeTakenAway: transportOptions.canBeTakenAway,
          canBeDelivered: transportOptions.canBeDelivered,
          canBeExchanged: exchangeOptions.canBeExchanged,
          canBeGifted: exchangeOptions.canBeGifted,
          location: location?.label?.trim() ? location : null
        });
      } else {
        await createResourceForAccount(creatorAccountId, {
          title,
          description,
          defaultTokenAmount: parsedTokenAmount,
          imageUrls,
          expiresAt: expiresAt?.toISOString() ?? null,
          isProduct: natureOptions.isProduct,
          isService: natureOptions.isService,
          canBeTakenAway: transportOptions.canBeTakenAway,
          canBeDelivered: transportOptions.canBeDelivered,
          canBeExchanged: exchangeOptions.canBeExchanged,
          canBeGifted: exchangeOptions.canBeGifted,
          location: location?.label?.trim() ? location : null
        });
      }

      onSaved();
    } catch {
      setSnackbarMessage(t("resourceSaveError", { defaultValue: "Something went wrong" }));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!initialResource?.id) {
      return;
    }

    setSaving(true);
    try {
      await deleteResourceById(initialResource.id);
      onSaved();
    } catch {
      setSnackbarMessage(t("resourceDeleteError", { defaultValue: "Something went wrong" }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer testID="edit-resource-screen" style={styles.root}>
      <View style={styles.headerRow}>
        <Text accessibilityRole="header" variant="headlineSmall" style={styles.pageTitle}>
          {initialResource
            ? t("editResourceLabel", { defaultValue: "Edit Resource" })
            : t("addResourceLabel", { defaultValue: "Add Resource" })}
        </Text>
        <PrimaryButton label={t("backToMyHubLabel", { defaultValue: "Back to My Hub" })} onPress={onBack} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <PicturesField
          label={t("resourceImagesEditLabel", { defaultValue: "Pictures" })}
          accessibilityLabel={t("resourceImagesEditLabel", { defaultValue: "Edit resource images" })}
          imageUrls={imageUrls}
          onChange={setImageUrls}
          addFromCameraLabel={t("resourceAddPictureFromCameraLabel", { defaultValue: "Take picture" })}
          addFromLibraryLabel={t("resourceAddPictureFromLibraryLabel", { defaultValue: "Add from photos" })}
        />

        <FormTextInput
          label={t("resourceTitleEditLabel", { defaultValue: "Title" })}
          accessibilityLabel={t("resourceTitleEditLabel", { defaultValue: "Title" })}
          value={title}
          onChangeText={setTitle}
        />

        <FormTextInput
          label={t("resourceDescriptionEditLabel", { defaultValue: "Description" })}
          accessibilityLabel={t("resourceDescriptionEditLabel", { defaultValue: "Description" })}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />

        <Divider style={styles.divider} />

        <Text variant="titleSmall" style={styles.sectionTitle}>{t("natureLabel", { defaultValue: "Nature" })}</Text>
        <ToggleRow
          label={t("isProductLabel", { defaultValue: "Product" })}
          value={natureOptions.isProduct}
          onToggle={() => setNatureOptions((previous) => ({ ...previous, isProduct: !previous.isProduct }))}
        />
        <ToggleRow
          label={t("isServiceLabel", { defaultValue: "Service" })}
          value={natureOptions.isService}
          onToggle={() => setNatureOptions((previous) => ({ ...previous, isService: !previous.isService }))}
        />

        <Divider style={styles.divider} />

        <PriceSetter
          label={t("resourcePriceEditLabel", { defaultValue: "Token amount" })}
          accessibilityLabel={t("resourcePriceEditLabel", { defaultValue: "Token amount" })}
          value={tokenAmount}
          onChange={setTokenAmount}
        />

        <DateTimePickerField
          label={t("resourceExpirationLabel", { defaultValue: "Expiration" })}
          value={expiresAt}
          onChange={setExpiresAt}
          testID="resource-expiration"
        />

        <Divider style={styles.divider} />

        <Text variant="titleSmall" style={styles.sectionTitle}>{t("exchangeTypeLabel", { defaultValue: "Exchange type" })}</Text>
        <ToggleRow
          label={t("canBeGiftedLabel", { defaultValue: "Can be gifted" })}
          value={exchangeOptions.canBeGifted}
          onToggle={() => setExchangeOptions((previous) => ({ ...previous, canBeGifted: !previous.canBeGifted }))}
        />
        <ToggleRow
          label={t("canBeExchangedLabel", { defaultValue: "Can be exchanged" })}
          value={exchangeOptions.canBeExchanged}
          onToggle={() => setExchangeOptions((previous) => ({ ...previous, canBeExchanged: !previous.canBeExchanged }))}
        />

        <Divider style={styles.divider} />

        <Text variant="titleSmall" style={styles.sectionTitle}>{t("transportLabel", { defaultValue: "Transport" })}</Text>
        <ToggleRow
          label={t("canBeTakenAwayLabel", { defaultValue: "Can be taken away" })}
          value={transportOptions.canBeTakenAway}
          onToggle={() => setTransportOptions((previous) => ({ ...previous, canBeTakenAway: !previous.canBeTakenAway }))}
        />
        <ToggleRow
          label={t("canBeDeliveredLabel", { defaultValue: "Can be delivered" })}
          value={transportOptions.canBeDelivered}
          onToggle={() => setTransportOptions((previous) => ({ ...previous, canBeDelivered: !previous.canBeDelivered }))}
        />

        <Divider style={styles.divider} />

        <Text variant="titleSmall" style={styles.sectionTitle}>{t("addressLabel", { defaultValue: "Address" })}</Text>
        <ProximityLocationEditor value={location} onChange={setLocation} />

        {validationErrors.length > 0 ? (
          <View style={styles.validationZone}>
            {validationErrors.map((error) => (
              <Text key={error} style={styles.warningText}>
                {error}
              </Text>
            ))}
          </View>
        ) : null}

        {isOffline ? (
          <Text
            accessibilityLabel={t("offlineResourceSaveWarningLabel", {
              defaultValue: "Offline resource save warning"
            })}
            style={styles.warningText}
          >
            {t("offlineResourceSaveWarning", { defaultValue: "Saving is unavailable while offline" })}
          </Text>
        ) : null}

        <PrimaryButton
          label={t("saveResource", { defaultValue: "Save resource" })}
          accessibilityLabel={t("saveResource", { defaultValue: "Save resource" })}
          onPress={() => void handleSave()}
          loading={saving}
          disabled={validationErrors.length > 0}
        />

        {initialResource ? (
          <PrimaryButton
            label={t("deleteResourceLabel", { defaultValue: "Delete Resource" })}
            accessibilityLabel={t("deleteResourceLabel", { defaultValue: "Delete Resource" })}
            onPress={() => void handleDelete()}
            disabled={saving}
          />
        ) : null}
      </ScrollView>

      <Snackbar visible={snackbarMessage !== null} onDismiss={() => setSnackbarMessage(null)}>
        {snackbarMessage ?? ""}
      </Snackbar>
    </ScreenContainer>
  );
}

interface ToggleRowProps {
  label: string;
  value: boolean;
  onToggle: () => void;
}

function ToggleRow({ label, value, onToggle }: ToggleRowProps): React.JSX.Element {
  const color = value ? designTokens.colors.primary : "#000";

  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: value }} onPress={onToggle}>
      <View style={styles.toggleRow}>
        <Icon source={value ? "checkbox-marked" : "checkbox-blank-outline"} size={24} color={color} />
        <Text style={[styles.toggleText, { color }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingTop: designTokens.spacing.lg
  },
  pageTitle: {
    fontFamily: appFontFamilies.title,
    textTransform: "uppercase",
    letterSpacing: 0.6
  },
  sectionTitle: {
    fontFamily: appFontFamilies.altGeneral,
    textTransform: "uppercase",
    letterSpacing: 0.4
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: designTokens.spacing.md
  },
  content: {
    gap: designTokens.spacing.sm,
    paddingBottom: designTokens.spacing.md
  },
  divider: {
    marginVertical: designTokens.spacing.xs
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: designTokens.spacing.xs,
    paddingVertical: 3
  },
  toggleText: {
    flexShrink: 1,
    fontFamily: appFontFamilies.general
  },
  validationZone: {
    gap: designTokens.spacing.xs
  },
  warningText: {
    color: designTokens.colors.primary,
    fontSize: 12,
    fontFamily: appFontFamilies.general
  }
});
