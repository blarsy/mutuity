import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Button, Chip, Icon, IconButton, Snackbar, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";
import ChatIcon from "../../assets/img/CHAT.svg";

import { FormTextInput, NavigationBackHeader, ThemedDialog } from "../../components/primitives";
import { TokenAmount } from "../../components/TokenAmount";
import { claimNeedById, fetchNeedById, type NeedDetailItem } from "../../services/graphql/needs";
import { NeedClaimStatus, NeedIntensity } from "../../services/graphql/generated";
import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";

const IMAGE_BORDER_RADIUS = 12;
const MAP_REGION_DELTA = 0.02;
const mapProviderProps: { provider?: typeof PROVIDER_GOOGLE } = Platform.OS === "android" ? { provider: PROVIDER_GOOGLE } : {};

interface NeedDetailScreenProps {
  needId: string;
  need?: NeedDetailItem | null;
  loading?: boolean;
  errorMessage?: string | null;
  currentAccountId?: string | null;
  onBack?: () => void;
  onOpenCreatorAccount?: (accountId: string) => void;
  onOpenNeedChat?: (need: NeedDetailItem) => void;
  onRetry?: () => void;
}

interface DetailFieldProps {
  title: string;
  titleOnOwnLine?: boolean;
  children: React.ReactNode;
}

function DetailField({ title, titleOnOwnLine = false, children }: DetailFieldProps): React.JSX.Element {
  return (
    <View style={titleOnOwnLine ? styles.fieldOwnLine : styles.fieldInline}>
      <Text variant="labelLarge" style={styles.fieldTitle}>{title}</Text>
      {titleOnOwnLine ? children : <View style={styles.fieldInlineContent}>{children}</View>}
    </View>
  );
}

function NeedInfoChip({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <Chip style={styles.infoChip} compact>
      <Text variant="bodyMedium" style={styles.infoChipText}>{children}</Text>
    </Chip>
  );
}

function formatDate(value: string | null, locale: string): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

function intensityTranslation(intensity: NeedIntensity): { key: string; defaultValue: string } {
  if (intensity === NeedIntensity.Commitment) return { key: "needIntensityCommitment", defaultValue: "Commitment" };
  if (intensity === NeedIntensity.LegUp) return { key: "needIntensityLegUp", defaultValue: "Leg up" };
  if (intensity === NeedIntensity.RareContribution) return { key: "needIntensityRareContribution", defaultValue: "Rare contribution" };
  return { key: "needIntensitySharing", defaultValue: "Sharing" };
}

export function NeedDetailScreen({
  needId,
  need,
  loading = false,
  errorMessage = null,
  currentAccountId = null,
  onBack,
  onOpenCreatorAccount,
  onOpenNeedChat,
  onRetry
}: NeedDetailScreenProps): React.JSX.Element {
  const { t, i18n } = useTranslation(["common", "us2"]);
  const [remoteNeed, setRemoteNeed] = useState<NeedDetailItem | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(true);
  const [remoteErrorMessage, setRemoteErrorMessage] = useState<string | null>(null);
  const [focusedImageUrl, setFocusedImageUrl] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [claimDialogVisible, setClaimDialogVisible] = useState(false);
  const [claimMessage, setClaimMessage] = useState("");
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimErrorMessage, setClaimErrorMessage] = useState<string | null>(null);
  const [claimSuccessVisible, setClaimSuccessVisible] = useState(false);
  const [submittedClaim, setSubmittedClaim] = useState<NeedDetailItem["ownClaim"]>(null);
  const hasInjectedNeed = need !== undefined;

  const loadNeed = useCallback(async (): Promise<void> => {
    if (hasInjectedNeed) return;
    setRemoteLoading(true);
    setRemoteErrorMessage(null);
    try {
      setRemoteNeed(await fetchNeedById(needId, currentAccountId));
    } catch {
      setRemoteErrorMessage(t("needLoadError", { ns: "us2", defaultValue: "We could not load this need." }));
    } finally {
      setRemoteLoading(false);
    }
  }, [currentAccountId, hasInjectedNeed, needId, t]);

  useEffect(() => { void loadNeed(); }, [loadNeed]);

  const resolvedNeed = need ?? remoteNeed;
  const resolvedLoading = loading || (!hasInjectedNeed && remoteLoading);
  const resolvedErrorMessage = errorMessage ?? (!hasInjectedNeed ? remoteErrorMessage : null);
  const images = resolvedNeed?.imageUrls ?? [];
  const windowDimension = Dimensions.get("window");
  const viewportWidth = Math.max(0, windowDimension.width - 20);
  const viewportHeight = Math.min(380, Math.max(220, Math.round(windowDimension.height * 0.35)));
  const imageSize = Math.min(windowDimension.width >= 768 ? 400 : 300, viewportWidth, viewportHeight);
  const hasCoordinates = typeof resolvedNeed?.location?.latitude === "number" && typeof resolvedNeed.location.longitude === "number";
  const mapRegion = useMemo(() => hasCoordinates && resolvedNeed?.location ? {
    latitude: resolvedNeed.location.latitude!,
    longitude: resolvedNeed.location.longitude!,
    latitudeDelta: MAP_REGION_DELTA,
    longitudeDelta: MAP_REGION_DELTA
  } : null, [hasCoordinates, resolvedNeed]);

  useEffect(() => { setCurrentImageIndex(0); }, [resolvedNeed?.id]);

  const handleImageScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>): void => {
    const page = Math.round(event.nativeEvent.contentOffset.x / viewportWidth);
    setCurrentImageIndex(Math.max(0, Math.min(images.length - 1, page)));
  };

  const handleSubmitClaim = (): void => {
    setClaimSubmitting(true);
    setClaimErrorMessage(null);

    void claimNeedById(needId, claimMessage.trim() || null)
      .then((claim) => {
        if (!claim) {
          throw new Error("Need claim was not created");
        }

        setSubmittedClaim({
          id: claim.id,
          message: claimMessage.trim() || null,
          status: claim.status
        });
        setClaimDialogVisible(false);
        setClaimSuccessVisible(true);
      })
      .catch(() => {
        setClaimErrorMessage(t("claimNeedError", { ns: "us2", defaultValue: "We could not claim this need." }));
      })
      .finally(() => {
        setClaimSubmitting(false);
      });
  };

  if (resolvedLoading || resolvedErrorMessage || !resolvedNeed) {
    return (
      <View style={styles.stateRoot}>
        <NavigationBackHeader onBack={onBack} accessibilityLabel={t("backLabel", { defaultValue: "Back" })} />
        <View style={styles.stateBody}>
          {resolvedLoading ? <ActivityIndicator size="large" /> : null}
          <Text accessibilityRole={resolvedErrorMessage || !resolvedNeed ? "alert" : undefined} style={styles.stateText}>
            {resolvedLoading
              ? t("loading", { defaultValue: "Loading..." })
              : resolvedErrorMessage ?? t("needNotAvailableLabel", { ns: "us2", defaultValue: "This need is not available anymore." })}
          </Text>
          {resolvedErrorMessage ? (
            <IconButton icon="refresh" accessibilityLabel={t("retry", { defaultValue: "Retry" })} onPress={onRetry ?? (() => void loadNeed())} />
          ) : null}
        </View>
      </View>
    );
  }

  const intensityMeta = intensityTranslation(resolvedNeed.intensity);
  const isViewerOwner = resolvedNeed.creatorAccountId === currentAccountId;
  const existingClaim = submittedClaim ?? resolvedNeed.ownClaim;
  const requirements = [
    resolvedNeed.objectRequired ? t("needObjectRequiredLabel", { ns: "us2", defaultValue: "Object required" }) : null,
    resolvedNeed.competenceRequired ? t("needCompetenceRequiredLabel", { ns: "us2", defaultValue: "Competence required" }) : null,
    resolvedNeed.toolingRequired ? t("needToolingRequiredLabel", { ns: "us2", defaultValue: "Tooling required" }) : null,
    resolvedNeed.multiplePeopleRequired ? t("needMultiplePeopleRequiredLabel", { ns: "us2", defaultValue: "Multiple people required" }) : null
  ].filter((value): value is string => value !== null);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} testID="need-detail-screen">
      <NavigationBackHeader onBack={onBack} accessibilityLabel={t("backLabel", { defaultValue: "Back" })} />
      <View style={styles.bodyContent}>
        {images.length > 0 ? (
          <View style={[styles.galleryFrame, { height: viewportHeight }]}>
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={handleImageScrollEnd}>
              {images.map((imageUrl, index) => (
                <View key={`${resolvedNeed.id}-${index}`} style={[styles.gallerySlide, { width: viewportWidth }]}>
                  <Pressable onPress={() => setFocusedImageUrl(imageUrl)}>
                    <Image source={{ uri: imageUrl }} style={[styles.needImage, { width: imageSize, height: imageSize }]} />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {images.length > 1 ? (
          <View style={styles.imageDotsRow}>
            {images.map((_, index) => <View key={`${resolvedNeed.id}-dot-${index}`} style={[styles.imageDot, index === currentImageIndex && styles.imageDotActive]} />)}
          </View>
        ) : null}

        <DetailField title={t("broughtByLabel", { defaultValue: "Brought by" })} titleOnOwnLine>
          <View style={styles.creatorRow}>
            <Pressable
              disabled={!onOpenCreatorAccount}
              accessibilityRole={onOpenCreatorAccount ? "button" : undefined}
              onPress={() => onOpenCreatorAccount?.(resolvedNeed.creatorAccountId)}
              style={styles.creatorNameZone}
            >
              <Text variant="bodyMedium" style={styles.creatorNameText}>{resolvedNeed.creatorDisplayName}</Text>
            </Pressable>
            {!isViewerOwner && currentAccountId && onOpenNeedChat ? (
              <IconButton
                icon={() => <ChatIcon width={26} height={26} />}
                size={22}
                onPress={() => onOpenNeedChat(resolvedNeed)}
                accessibilityLabel={t("chatLabel", { defaultValue: "Chat" })}
              />
            ) : null}
            {!isViewerOwner && currentAccountId ? (
              <IconButton
                icon="hand-front-right"
                size={26}
                onPress={() => {
                  setClaimMessage(existingClaim?.message ?? "");
                  setClaimErrorMessage(null);
                  setClaimDialogVisible(true);
                }}
                accessibilityLabel={existingClaim?.status === NeedClaimStatus.Open
                  ? t("updateClaimNoteLabel", { ns: "us2", defaultValue: "Update claim note" })
                  : t("claimNeedLabel", { ns: "us2", defaultValue: "Claim need" })}
              />
            ) : null}
          </View>
        </DetailField>

        <View style={styles.hr} />
        <DetailField title={t("needTitleLabel", { ns: "us2", defaultValue: "Title" })} titleOnOwnLine>
          <Text variant="bodyMedium" style={styles.bodyText}>{resolvedNeed.title}</Text>
        </DetailField>

        <View style={styles.hr} />
        <DetailField title={t("needDescriptionLabel", { ns: "us2", defaultValue: "Description" })} titleOnOwnLine>
          <Text variant="bodyMedium" style={styles.bodyText}>
            {resolvedNeed.description || t("needDescriptionEmpty", { ns: "us2", defaultValue: "No description yet." })}
          </Text>
        </DetailField>

        <View style={styles.hr} />
        <DetailField title={t("needTokenAmountLabel", { ns: "us2", defaultValue: "Tope amount" })}>
          <TokenAmount amount={resolvedNeed.proposedTokenAmount} size={28} />
        </DetailField>

        <View style={styles.hr} />
        <DetailField title={t("needIntensityLabel", { ns: "us2", defaultValue: "Intensity" })}>
          <Text variant="bodyMedium">{t(intensityMeta.key, { ns: "us2", defaultValue: intensityMeta.defaultValue })}</Text>
        </DetailField>

        {requirements.length > 0 ? (
          <>
            <View style={styles.hr} />
            <DetailField title={t("needNatureLabel", { ns: "us2", defaultValue: "Need nature" })} titleOnOwnLine>
              <View style={styles.chipsWrap}>{requirements.map((label) => <NeedInfoChip key={label}>{label}</NeedInfoChip>)}</View>
            </DetailField>
          </>
        ) : null}

        {resolvedNeed.requiredCompetenceText ? (
          <>
            <View style={styles.hr} />
            <DetailField title={t("requiredCompetenceTextLabel", { ns: "us2", defaultValue: "Required competence" })} titleOnOwnLine>
              <Text variant="bodyMedium" style={styles.bodyText}>{resolvedNeed.requiredCompetenceText}</Text>
            </DetailField>
          </>
        ) : null}

        {resolvedNeed.requiredToolingText ? (
          <>
            <View style={styles.hr} />
            <DetailField title={t("requiredToolingTextLabel", { ns: "us2", defaultValue: "Required tooling" })} titleOnOwnLine>
              <Text variant="bodyMedium" style={styles.bodyText}>{resolvedNeed.requiredToolingText}</Text>
            </DetailField>
          </>
        ) : null}

        {resolvedNeed.requiredPeopleCount ? (
          <>
            <View style={styles.hr} />
            <DetailField title={t("requiredPeopleCountLabel", { ns: "us2", defaultValue: "Required people count" })}>
              <Text variant="bodyMedium">{resolvedNeed.requiredPeopleCount}</Text>
            </DetailField>
          </>
        ) : null}

        <View style={styles.hr} />
        <DetailField title={t("needExpiresAtLabel", { ns: "us2", defaultValue: "Expiration" })}>
          <Text variant="bodyMedium">{formatDate(resolvedNeed.expiresAt ?? null, i18n.language) || t("noDateLabel", { defaultValue: "No date" })}</Text>
        </DetailField>

        <View style={styles.hr} />
        <DetailField title={t("needLocationLabel", { ns: "us2", defaultValue: "Location" })} titleOnOwnLine>
          <Text variant="bodySmall" style={styles.bodyText}>{resolvedNeed.location?.label || t("noAddressDefinedLabel", { defaultValue: "No address defined" })}</Text>
          {hasCoordinates && mapRegion ? (
            <View style={styles.locationMapContainer}>
              <MapView style={styles.locationMap} region={mapRegion} zoomEnabled={false} {...mapProviderProps}>
                <Marker coordinate={{ latitude: mapRegion.latitude, longitude: mapRegion.longitude }} />
              </MapView>
            </View>
          ) : null}
        </DetailField>

        <Text variant="bodySmall" style={styles.publishedText}>
          {t("publishedAtLabel", { defaultValue: "Published" })} {formatDate(resolvedNeed.createdAt, i18n.language) || "-"}
          {isViewerOwner ? ` · ${t("yourNeedLabel", { ns: "us2", defaultValue: "Your need" })}` : ""}
        </Text>
      </View>

      <Modal visible={Boolean(focusedImageUrl)} transparent animationType="fade" onRequestClose={() => setFocusedImageUrl(null)}>
        <View style={styles.focusedImageOverlay}>
          <IconButton icon="close" mode="contained" style={styles.closeFocusedImageButton} onPress={() => setFocusedImageUrl(null)} accessibilityLabel={t("closeLabel", { defaultValue: "Close" })} />
          {focusedImageUrl ? <Image source={{ uri: focusedImageUrl }} style={styles.focusedImage} resizeMode="contain" /> : null}
        </View>
      </Modal>

      <ThemedDialog
        visible={claimDialogVisible}
        title={existingClaim
          ? t("updateClaimDialogTitle", { ns: "us2", defaultValue: "Update your claim" })
          : t("claimDialogTitle", { ns: "us2", defaultValue: "Claim this need" })}
        onDismiss={() => {
          if (!claimSubmitting) setClaimDialogVisible(false);
        }}
        content={(
          <View style={styles.claimDialogContent}>
            <Text variant="bodyMedium">
              {t("claimDialogHint", {
                ns: "us2",
                defaultValue: "You are claiming {{title}}. Add an optional note for its creator.",
                title: resolvedNeed.title
              })}
            </Text>
            <FormTextInput
              label={t("claimDialogOptionalMessage", { ns: "us2", defaultValue: "Optional message" })}
              placeholder={t("claimDialogPlaceholder", { ns: "us2", defaultValue: "Explain how you can help" })}
              value={claimMessage}
              onChangeText={(value) => {
                setClaimMessage(value);
                setClaimErrorMessage(null);
              }}
              multiline
            />
            {claimErrorMessage ? <Text style={styles.claimErrorText}>{claimErrorMessage}</Text> : null}
          </View>
        )}
        actions={[
          <Button key="cancel" onPress={() => setClaimDialogVisible(false)} disabled={claimSubmitting}>
            {t("cancelLabel", { ns: "common", defaultValue: "Cancel" })}
          </Button>,
          <Button key="submit" mode="contained" onPress={handleSubmitClaim} loading={claimSubmitting} disabled={claimSubmitting}>
            {existingClaim
              ? t("claimDialogSave", { ns: "us2", defaultValue: "Save claim" })
              : t("claimDialogSubmit", { ns: "us2", defaultValue: "Submit claim" })}
          </Button>
        ]}
        testID="need-claim-dialog"
      />

      <Snackbar visible={claimSuccessVisible} onDismiss={() => setClaimSuccessVisible(false)}>
        {t("claimSuccessMessage", { ns: "us2", defaultValue: "Your claim has been submitted." })}
      </Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  stateRoot: { flex: 1, backgroundColor: "#ffffff", paddingHorizontal: 10, paddingTop: 6, paddingBottom: 24 },
  stateBody: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  stateText: { textAlign: "center", fontFamily: appFontFamilies.general },
  root: { flex: 1, backgroundColor: "#ffffff" },
  content: { paddingHorizontal: 10, paddingTop: 6, paddingBottom: 24 },
  bodyContent: { marginTop: 4, gap: 10 },
  galleryFrame: { position: "relative" },
  gallerySlide: { alignItems: "center", justifyContent: "center" },
  needImage: { borderRadius: IMAGE_BORDER_RADIUS, backgroundColor: "#ffffff" },
  creatorRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  creatorNameZone: { flex: 1 },
  creatorNameText: { color: designTokens.colors.primary, textDecorationLine: "underline", fontFamily: appFontFamilies.general },
  hr: { height: 2, backgroundColor: designTokens.colors.primaryContainer },
  fieldOwnLine: { gap: 6 },
  fieldInline: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  fieldTitle: { color: "#000000", fontFamily: appFontFamilies.altGeneral, textTransform: "uppercase", letterSpacing: 0.4 },
  fieldInlineContent: { flex: 1 },
  bodyText: { color: "#000000", fontFamily: appFontFamilies.general },
  infoChip: { backgroundColor: designTokens.colors.primaryContainer, marginRight: 4, marginBottom: 4 },
  infoChipText: { textTransform: "uppercase", fontFamily: appFontFamilies.general },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 2 },
  locationMapContainer: { width: "100%", height: 220, borderRadius: IMAGE_BORDER_RADIUS, overflow: "hidden", backgroundColor: "#ffffff" },
  locationMap: { width: "100%", height: 220 },
  imageDotsRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  imageDot: { width: 7, height: 7, borderRadius: 999, backgroundColor: "#d9d9d9" },
  imageDotActive: { backgroundColor: designTokens.colors.primary },
  publishedText: { alignSelf: "flex-end", color: designTokens.colors.primary, fontFamily: appFontFamilies.general },
  claimDialogContent: { gap: designTokens.spacing.md, paddingTop: designTokens.spacing.sm },
  claimErrorText: { color: "#d32f2f", fontFamily: appFontFamilies.general },
  focusedImageOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", alignItems: "center", padding: 12 },
  closeFocusedImageButton: { position: "absolute", right: 12, top: 40 },
  focusedImage: { width: "100%", height: "78%" }
});