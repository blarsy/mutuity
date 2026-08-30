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
import { Banner, Button, Chip, Icon, IconButton, Snackbar, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";
import ChatIcon from "../../assets/img/CHAT.svg";

import { NavigationBackHeader, FormTextInput, ThemedDialog } from "../../components/primitives";
import { TokenAmount } from "../../components/TokenAmount";
import { submitResourceBid } from "../../services/graphql/bids";
import { fetchCurrentTokenBalance } from "../../services/graphql/economics";
import { fetchResourceById, type ResourceDetailItem } from "../../services/graphql/resources";
import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";

const IMAGE_BORDER_RADIUS = 12;
const MAP_REGION_DELTA = 0.02;
const mapProviderProps: { provider?: typeof PROVIDER_GOOGLE } = Platform.OS === "android" ? { provider: PROVIDER_GOOGLE } : {};

interface ResourceDetailScreenProps {
  resourceId: string;
  resource?: ResourceDetailItem | null;
  loading?: boolean;
  errorMessage?: string | null;
  currentAccountId?: string | null;
  onBack?: () => void;
  onOpenCreatorAccount?: (accountId: string) => void;
  onOpenResourceChat?: (resource: ResourceDetailItem) => void;
  onRetry?: () => void;
}

interface DetailFieldProps {
  title: string;
  titleOnOwnLine?: boolean;
  children: React.ReactNode;
}

function DetailField({ title, titleOnOwnLine = false, children }: DetailFieldProps): React.JSX.Element {
  if (titleOnOwnLine) {
    return (
      <View style={styles.fieldOwnLine}>
        <Text variant="labelLarge" style={styles.fieldTitle}>{title}</Text>
        {children}
      </View>
    );
  }

  return (
    <View style={styles.fieldInline}>
      <Text variant="labelLarge" style={styles.fieldTitle}>{title}</Text>
      <View style={styles.fieldInlineContent}>{children}</View>
    </View>
  );
}

function ResourceInfoChip({ children }: { children: React.ReactNode }): React.JSX.Element {
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
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

function formatRelative(value: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const deltaMs = date.getTime() - Date.now();
  const deltaMinutes = Math.round(deltaMs / (60 * 1000));
  const absoluteMinutes = Math.abs(deltaMinutes);

  if (absoluteMinutes < 60) {
    return deltaMinutes >= 0 ? `in ${absoluteMinutes} min` : `${absoluteMinutes} min ago`;
  }

  const deltaHours = Math.round(deltaMinutes / 60);
  const absoluteHours = Math.abs(deltaHours);
  if (absoluteHours < 24) {
    return deltaHours >= 0 ? `in ${absoluteHours} h` : `${absoluteHours} h ago`;
  }

  const deltaDays = Math.round(deltaHours / 24);
  const absoluteDays = Math.abs(deltaDays);
  return deltaDays >= 0 ? `in ${absoluteDays} days` : `${absoluteDays} days ago`;
}

function isExpired(value: string | null): boolean {
  if (!value) {
    return false;
  }

  const expiration = new Date(value);
  if (Number.isNaN(expiration.getTime())) {
    return false;
  }

  return expiration.getTime() <= Date.now();
}

function buildMapRegion(latitude: number, longitude: number): {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
} {
  return {
    latitude,
    longitude,
    latitudeDelta: MAP_REGION_DELTA,
    longitudeDelta: MAP_REGION_DELTA
  };
}

export function ResourceDetailScreen({
  resourceId,
  resource,
  loading = false,
  errorMessage = null,
  currentAccountId = null,
  onBack,
  onOpenCreatorAccount,
  onOpenResourceChat,
  onRetry
}: ResourceDetailScreenProps): React.JSX.Element {
  const { t, i18n } = useTranslation();
  const [remoteResource, setRemoteResource] = useState<ResourceDetailItem | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(true);
  const [remoteErrorMessage, setRemoteErrorMessage] = useState<string | null>(null);
  const [focusedImageUrl, setFocusedImageUrl] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [swipedToEnd, setSwipedToEnd] = useState(false);
  const [bidDialogVisible, setBidDialogVisible] = useState(false);
  const [bidAmountValue, setBidAmountValue] = useState("");
  const [bidValidHoursValue, setBidValidHoursValue] = useState("12");
  const [bidMessageValue, setBidMessageValue] = useState("");
  const [bidErrorMessage, setBidErrorMessage] = useState<string | null>(null);
  const [bidSubmitting, setBidSubmitting] = useState(false);
  const [bidSuccessVisible, setBidSuccessVisible] = useState(false);
  const [currentTokenBalance, setCurrentTokenBalance] = useState<number | null>(null);
  const [loadingTokenBalance, setLoadingTokenBalance] = useState(false);

  const hasInjectedResource = resource !== undefined;

  const loadResource = useCallback(async () => {
    if (hasInjectedResource) {
      return;
    }

    setRemoteLoading(true);
    setRemoteErrorMessage(null);

    try {
      const result = await fetchResourceById(resourceId);
      setRemoteResource(result);
    } catch {
      setRemoteErrorMessage(t("resourceLoadError", { defaultValue: "We could not load this resource." }));
    } finally {
      setRemoteLoading(false);
    }
  }, [hasInjectedResource, resourceId, t]);

  useEffect(() => {
    void loadResource();
  }, [loadResource]);

  const resolvedResource = resource ?? remoteResource;
  const resolvedLoading = loading || (!hasInjectedResource && remoteLoading);
  const resolvedErrorMessage = errorMessage ?? (!hasInjectedResource ? remoteErrorMessage : null);

  useEffect(() => {
    setCurrentImageIndex(0);
    setSwipedToEnd(false);
  }, [resolvedResource?.id]);

  const images = resolvedResource?.imageUrls ?? [];
  const hasMultipleImages = images.length > 1;
  const windowDimension = Dimensions.get("window");
  const viewportWidth = Math.max(0, windowDimension.width - 20);
  const viewportHeight = Math.min(380, Math.max(220, Math.round(windowDimension.height * 0.35)));
  const absoluteMaxImgSize = windowDimension.width >= 1024 ? 500 : windowDimension.width >= 768 ? 400 : 300;
  const imageSize = Math.min(absoluteMaxImgSize, Math.min(viewportWidth, viewportHeight));
  const expirationDateLabel = formatDate(resolvedResource?.expiresAt ?? null, i18n.language);
  const expirationRelativeLabel = formatRelative(resolvedResource?.expiresAt ?? null);
  const hasCoordinates = typeof resolvedResource?.latitude === "number" && typeof resolvedResource?.longitude === "number";
  const isViewerOwner = resolvedResource?.creatorAccountId === currentAccountId;
  const hasTokenAmount = typeof resolvedResource?.defaultTokenAmount === "number" && resolvedResource.defaultTokenAmount > 0;

  const mapRegion = useMemo(() => {
    if (!hasCoordinates || !resolvedResource) {
      return null;
    }

    return buildMapRegion(resolvedResource.latitude!, resolvedResource.longitude!);
  }, [hasCoordinates, resolvedResource]);

  const openBidDialog = (): void => {
    if (!resolvedResource) {
      return;
    }

    setBidAmountValue(
      typeof resolvedResource.defaultTokenAmount === "number" && resolvedResource.defaultTokenAmount > 0
        ? String(resolvedResource.defaultTokenAmount)
        : ""
    );
    setBidValidHoursValue("12");
    setBidMessageValue("");
    setBidErrorMessage(null);
    setBidDialogVisible(true);
    setLoadingTokenBalance(true);

    void fetchCurrentTokenBalance()
      .then((balance) => {
        setCurrentTokenBalance(balance);
      })
      .catch(() => {
        setCurrentTokenBalance(null);
      })
      .finally(() => {
        setLoadingTokenBalance(false);
      });
  };

  const closeBidDialog = (): void => {
    setBidDialogVisible(false);
    setBidErrorMessage(null);
    setBidSubmitting(false);
  };

  const handleSubmitBid = (): void => {
    if (!resolvedResource) {
      return;
    }

    if (!currentAccountId) {
      setBidErrorMessage(t("bidSignInRequired", { defaultValue: "Sign in to send a bid." }));
      return;
    }

    const parsedAmount = Number.parseInt(bidAmountValue.trim(), 10);
    if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      setBidErrorMessage(t("bidInvalidAmountLabel", { defaultValue: "Enter a valid token amount." }));
      return;
    }

    const parsedValidHours = Number.parseInt(bidValidHoursValue.trim(), 10);
    if (!Number.isInteger(parsedValidHours) || parsedValidHours < 1 || parsedValidHours > 48) {
      setBidErrorMessage(t("bidInvalidHoursLabel", { defaultValue: "Validity must be between 1 and 48 hours." }));
      return;
    }

    if (typeof currentTokenBalance === "number" && parsedAmount > currentTokenBalance) {
      setBidErrorMessage(
        t("bidInsufficientTokensLabel", {
          defaultValue: "You cannot send more than your balance ({{max}}).",
          max: currentTokenBalance
        })
      );
      return;
    }

    setBidSubmitting(true);
    setBidErrorMessage(null);

    void submitResourceBid({
      resourceId: resolvedResource.id,
      proposedTokenAmount: parsedAmount,
      validHours: parsedValidHours,
      message: bidMessageValue.trim() ? bidMessageValue.trim() : null
    })
      .then(() => {
        closeBidDialog();
        setBidSuccessVisible(true);
      })
      .catch(() => {
        setBidErrorMessage(t("bidSubmitErrorLabel", { defaultValue: "We could not send your bid." }));
      })
      .finally(() => {
        setBidSubmitting(false);
      });
  };

  const handleImageScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>): void => {
    if (!hasMultipleImages) {
      return;
    }

    const page = Math.round(event.nativeEvent.contentOffset.x / viewportWidth);
    const safePage = Math.max(0, Math.min(images.length - 1, page));
    setCurrentImageIndex(safePage);
    if (safePage >= images.length - 1) {
      setSwipedToEnd(true);
    }
  };

  if (resolvedLoading) {
    return (
      <View style={styles.stateRoot}>
        <NavigationBackHeader
          onBack={onBack}
          accessibilityLabel={t("backLabel", { defaultValue: "Back" })}
        />
        <View style={styles.stateBody}>
          <ActivityIndicator size="large" />
          <Text variant="bodyMedium" style={styles.stateText}>
            {t("loading", { defaultValue: "Loading..." })}
          </Text>
        </View>
      </View>
    );
  }

  if (resolvedErrorMessage) {
    return (
      <View style={styles.stateRoot}>
        <NavigationBackHeader
          onBack={onBack}
          accessibilityLabel={t("backLabel", { defaultValue: "Back" })}
        />
        <View style={styles.stateBody}>
          <Text accessibilityRole="alert" variant="bodyMedium" style={styles.stateText}>
            {resolvedErrorMessage}
          </Text>
          <IconButton
            accessibilityLabel={t("retry", { defaultValue: "Retry" })}
            icon="refresh"
            onPress={() => {
              if (onRetry) {
                onRetry();
                return;
              }

              void loadResource();
            }}
          />
        </View>
      </View>
    );
  }

  if (!resolvedResource) {
    return (
      <View style={styles.stateRoot}>
        <NavigationBackHeader
          onBack={onBack}
          accessibilityLabel={t("backLabel", { defaultValue: "Back" })}
        />
        <View style={styles.stateBody}>
          <Text accessibilityRole="alert" variant="bodyMedium" style={styles.stateText}>
            {t("resourceNotAvailableLabel", { defaultValue: "This resource is not available anymore." })}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <NavigationBackHeader
        onBack={onBack}
        accessibilityLabel={t("backLabel", { defaultValue: "Back" })}
      />

      <View style={styles.bodyContent}>

      {!resolvedResource.isActive ? (
        <Banner
          elevation={0}
          style={styles.banner}
          icon={() => <Icon size={24} source="trash-can-outline" />}
          visible
        >
          <Text variant="bodySmall">
            {t("resourceInactiveLabel", { defaultValue: "This resource is archived and shown for context." })}
          </Text>
        </Banner>
      ) : null}

      {resolvedResource.isActive && isExpired(resolvedResource.expiresAt) ? (
        <Banner
          elevation={0}
          style={styles.banner}
          icon={() => <Icon size={24} source="timer-off-outline" />}
          visible
        >
          <Text variant="bodySmall">
            {t("resourceExpiredLabel", {
              defaultValue: "This resource expired on {{date}}.",
              date: expirationDateLabel || "-"
            })}
          </Text>
        </Banner>
      ) : null}

      {images.length > 0 ? (
        <View style={[styles.galleryFrame, { height: viewportHeight }]}> 
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleImageScrollEnd}
            contentContainerStyle={styles.galleryContent}
          >
            {images.map((imageUrl, index) => (
              <View key={`${resolvedResource.id}-${index}`} style={[styles.gallerySlide, { width: viewportWidth }]}> 
                <Pressable onPress={() => setFocusedImageUrl(imageUrl)} style={styles.galleryImagePressable}>
                  <Image
                    source={{ uri: imageUrl }}
                    style={[styles.resourceImage, { width: imageSize, height: imageSize }]}
                  />
                </Pressable>
              </View>
            ))}
          </ScrollView>
          {hasMultipleImages && currentImageIndex < images.length - 1 ? (
            <View style={styles.swipeHintZone} pointerEvents="none">
              <Icon source="gesture-swipe-left" size={36} />
            </View>
          ) : null}
        </View>
      ) : null}

      <DetailField title={t("broughtByLabel", { defaultValue: "Brought by" })} titleOnOwnLine>
        <View style={styles.creatorRow}>
          <View style={styles.creatorNameZone}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (onOpenCreatorAccount) {
                  onOpenCreatorAccount(resolvedResource.creatorAccountId);
                }
              }}
            >
              <Text variant="bodyMedium" style={styles.creatorNameText}>{resolvedResource.creatorDisplayName}</Text>
            </Pressable>
          </View>
          {!isViewerOwner && onOpenResourceChat ? (
            <IconButton
              icon={() => <ChatIcon width={26} height={26} />}
              size={22}
              onPress={() => onOpenResourceChat(resolvedResource)}
              accessibilityLabel={t("chatLabel", { defaultValue: "Chat" })}
            />
          ) : null}
          {!isViewerOwner && currentAccountId && resolvedResource.canBeExchanged ? (
            <IconButton
              icon="hand-coin"
              size={26}
              onPress={openBidDialog}
              accessibilityLabel={t("sendBidLabel", { defaultValue: "Send bid" })}
            />
          ) : null}
        </View>
      </DetailField>

      <View style={styles.hr} />

      <DetailField title={t("titleLabel", { defaultValue: "Title" })} titleOnOwnLine>
        <Text variant="bodyMedium" style={styles.bodyText}>{resolvedResource.title}</Text>
      </DetailField>

      <View style={styles.hr} />

      <DetailField title={t("descriptionLabel", { defaultValue: "Description" })} titleOnOwnLine>
        <Text variant="bodyMedium" style={styles.bodyText}>
          {resolvedResource.description || t("resourceDescriptionEmpty", { defaultValue: "No description provided." })}
        </Text>
      </DetailField>

      <View style={styles.hr} />

      <DetailField title={t("natureLabel", { defaultValue: "Nature" })} titleOnOwnLine>
        <View style={styles.chipsWrap}>
          {resolvedResource.isProduct ? <ResourceInfoChip>{t("isProductLabel", { defaultValue: "Product" })}</ResourceInfoChip> : null}
          {resolvedResource.isService ? <ResourceInfoChip>{t("isServiceLabel", { defaultValue: "Service" })}</ResourceInfoChip> : null}
        </View>
      </DetailField>

      <View style={styles.hr} />

      <DetailField title={t("expirationLabel", { defaultValue: "Expiration" })}>
        <View style={styles.expirationColumn}>
          <Text variant="bodyMedium">{expirationRelativeLabel || t("noDateLabel", { defaultValue: "No date" })}</Text>
          {expirationDateLabel ? <Text variant="bodyMedium">{expirationDateLabel}</Text> : null}
        </View>
      </DetailField>

      <View style={styles.hr} />

      {hasTokenAmount ? (
        <>
          <DetailField title={t("referenceTokenAmountLabel", { defaultValue: "Reference token amount" })}>
            <TokenAmount amount={resolvedResource.defaultTokenAmount ?? 0} size={28} />
          </DetailField>
          <View style={styles.hr} />
        </>
      ) : null}

      {resolvedResource.categoryLabels.length > 0 ? (
        <>
          <DetailField title={t("resourceCategoriesLabel", { defaultValue: "Categories" })} titleOnOwnLine>
            <View style={styles.chipsWrap}>
              {resolvedResource.categoryLabels.map((categoryLabel) => (
                <ResourceInfoChip key={`${resolvedResource.id}-${categoryLabel}`}>{categoryLabel}</ResourceInfoChip>
              ))}
            </View>
          </DetailField>
          <View style={styles.hr} />
        </>
      ) : null}

      <DetailField title={t("transportLabel", { defaultValue: "Transport" })} titleOnOwnLine>
        <View style={styles.chipsWrap}>
          {resolvedResource.canBeTakenAway ? (
            <ResourceInfoChip>
              {t(resolvedResource.isProduct ? "canBeTakenAwayLabel" : "onSiteLabel", {
                defaultValue: resolvedResource.isProduct ? "Pickup" : "On-site"
              })}
            </ResourceInfoChip>
          ) : null}
          {resolvedResource.canBeDelivered ? (
            <ResourceInfoChip>
              {t(resolvedResource.isProduct ? "canBeDeliveredLabel" : "placeToBeAgreedLabel", {
                defaultValue: resolvedResource.isProduct ? "Delivery" : "Place to be agreed"
              })}
            </ResourceInfoChip>
          ) : null}
        </View>
      </DetailField>

      <View style={styles.hr} />

      <DetailField title={t("typeLabel", { defaultValue: "Type" })} titleOnOwnLine>
        <View style={styles.chipsWrap}>
          {resolvedResource.canBeGifted ? <ResourceInfoChip>{t("canBeGiftedLabel", { defaultValue: "Gift" })}</ResourceInfoChip> : null}
          {resolvedResource.canBeExchanged ? <ResourceInfoChip>{t("canBeExchangedLabel", { defaultValue: "Exchange" })}</ResourceInfoChip> : null}
        </View>
      </DetailField>

      <View style={styles.hr} />

      <DetailField title={t("addressLabel", { defaultValue: "Address" })} titleOnOwnLine>
        <View style={styles.addressColumn}>
          <Text variant="bodySmall" style={styles.addressText}>
            {resolvedResource.locationLabel || t("noAddressDefinedLabel", { defaultValue: "No address defined" })}
          </Text>
          {hasCoordinates && mapRegion ? (
            <View style={styles.locationMapContainer}>
              <MapView
                showsUserLocation={false}
                style={styles.locationMap}
                mapType="standard"
                region={mapRegion}
                zoomEnabled={false}
                {...mapProviderProps}
              >
                <Marker coordinate={{ latitude: resolvedResource.latitude!, longitude: resolvedResource.longitude! }} />
              </MapView>
            </View>
          ) : null}
        </View>
      </DetailField>

      <Modal
        visible={Boolean(focusedImageUrl)}
        transparent
        animationType="fade"
        onRequestClose={() => setFocusedImageUrl(null)}
      >
        <View style={styles.focusedImageOverlay}>
          <IconButton
            icon="close"
            size={28}
            mode="contained"
            onPress={() => setFocusedImageUrl(null)}
            style={styles.closeFocusedImageButton}
            accessibilityLabel={t("closeLabel", { defaultValue: "Close" })}
          />
          {focusedImageUrl ? (
            <Image source={{ uri: focusedImageUrl }} style={styles.focusedImage} resizeMode="contain" />
          ) : null}
        </View>
      </Modal>

      {hasMultipleImages ? (
        <View style={styles.imageDotsRow}>
          {images.map((_, index) => (
            <View
              key={`${resolvedResource.id}-dot-${index}`}
              style={[styles.imageDot, index === currentImageIndex ? styles.imageDotActive : null]}
            />
          ))}
        </View>
      ) : null}

      <ThemedDialog
        visible={bidDialogVisible}
        title={t("createBidDialogTitle", { defaultValue: "Create bid" })}
        onDismiss={closeBidDialog}
        content={(
          <View style={styles.bidDialogContent}>
            <Text variant="bodyMedium" style={styles.bidDialogInfoText}>
              {t("bidDialogResourceLabel", {
                defaultValue: "You are bidding on {{title}} by {{owner}}.",
                title: resolvedResource.title,
                owner: resolvedResource.creatorDisplayName
              })}
            </Text>

            <FormTextInput
              label={t("amountOfTokenLabel", { defaultValue: "Token amount" })}
              accessibilityLabel={t("amountOfTokenLabel", { defaultValue: "Token amount" })}
              value={bidAmountValue}
              onChangeText={(value) => {
                setBidAmountValue(value);
                setBidErrorMessage(null);
              }}
              keyboardType="number-pad"
            />

            <FormTextInput
              label={t("hoursValidLabel", { defaultValue: "Valid for (hours)" })}
              accessibilityLabel={t("hoursValidLabel", { defaultValue: "Valid for (hours)" })}
              value={bidValidHoursValue}
              onChangeText={(value) => {
                setBidValidHoursValue(value);
                setBidErrorMessage(null);
              }}
              keyboardType="number-pad"
            />

            <FormTextInput
              label={t("bidMessageLabel", { defaultValue: "Message (optional)" })}
              accessibilityLabel={t("bidMessageLabel", { defaultValue: "Message (optional)" })}
              value={bidMessageValue}
              onChangeText={(value) => {
                setBidMessageValue(value);
                setBidErrorMessage(null);
              }}
              multiline
            />

            {loadingTokenBalance ? (
              <Text variant="bodySmall" style={styles.bidDialogHintText}>
                {t("tokenBalanceLoadingLabel", { defaultValue: "Loading token balance..." })}
              </Text>
            ) : null}

            {typeof currentTokenBalance === "number" ? (
              <Text variant="bodySmall" style={styles.bidDialogHintText}>
                {t("tokenBalanceAvailableLabel", {
                  defaultValue: "Available balance: {{balance}}",
                  balance: currentTokenBalance
                })}
              </Text>
            ) : null}

            {bidErrorMessage ? (
              <Text variant="bodySmall" style={styles.bidDialogErrorText}>
                {bidErrorMessage}
              </Text>
            ) : null}
          </View>
        )}
        actions={[
          <Button key="cancel" mode="outlined" onPress={closeBidDialog} disabled={bidSubmitting}>
            {t("cancelLabel", { defaultValue: "Cancel" })}
          </Button>,
          <Button key="submit" mode="contained" onPress={handleSubmitBid} loading={bidSubmitting} disabled={bidSubmitting}>
            {t("sendBidLabel", { defaultValue: "Send bid" })}
          </Button>
        ]}
      />

      <Snackbar visible={bidSuccessVisible} onDismiss={() => setBidSuccessVisible(false)}>
        {t("bidCreationSuccessMessage", { defaultValue: "Your bid has been sent." })}
      </Snackbar>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  stateRoot: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 24
  },
  stateBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12
  },
  stateText: {
    textAlign: "center",
    fontFamily: appFontFamilies.general
  },
  root: {
    flex: 1,
    backgroundColor: "#ffffff"
  },
  content: {
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 24
  },
  bodyContent: {
    marginTop: 4,
    gap: 10
  },
  banner: {
    backgroundColor: designTokens.colors.primaryContainer,
    borderRadius: IMAGE_BORDER_RADIUS,
    marginBottom: 4
  },
  singleImageZone: {
    alignItems: "center",
    marginBottom: 10
  },
  galleryFrame: {
    //marginBottom: 10,
    position: "relative"
  },
  galleryContent: {
    alignItems: "center"
  },
  gallerySlide: {
    alignItems: "center",
    justifyContent: "center"
  },
  galleryImagePressable: {
    alignItems: "center",
    justifyContent: "center"
  },
  swipeHintZone: {
    position: "absolute",
    right: 2,
    top: "50%",
    marginTop: -18
  },
  multiImageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    gap: 8
  },
  swipeHintPlaceholder: {
    width: 36,
    height: 36
  },
  resourceImage: {
    borderRadius: IMAGE_BORDER_RADIUS,
    backgroundColor: "#ffffff"
  },
  creatorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4
  },
  creatorNameZone: {
    flex: 1
  },
  creatorNameText: {
    color: designTokens.colors.primary,
    textDecorationLine: "underline",
    fontFamily: appFontFamilies.general
  },
  hr: {
    height: 2,
    backgroundColor: designTokens.colors.primaryContainer
  },
  fieldOwnLine: {
    gap: 6
  },
  fieldInline: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8
  },
  fieldTitle: {
    color: "#000000",
    fontFamily: appFontFamilies.altGeneral,
    textTransform: "uppercase",
    letterSpacing: 0.4
  },
  fieldInlineContent: {
    flex: 1
  },
  bodyText: {
    color: "#000000",
    fontFamily: appFontFamilies.general
  },
  infoChip: {
    backgroundColor: designTokens.colors.primaryContainer,
    marginRight: 4,
    marginBottom: 4
  },
  infoChipText: {
    textTransform: "uppercase",
    fontFamily: appFontFamilies.general
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 2
  },
  expirationColumn: {
    flexDirection: "column",
    gap: 2
  },
  addressColumn: {
    flexDirection: "column",
    gap: 6
  },
  addressText: {
    paddingVertical: 5,
    fontFamily: appFontFamilies.general
  },
  locationMap: {
    width: "100%",
    height: 220
  },
  locationMapContainer: {
    width: "100%",
    height: 220,
    borderRadius: IMAGE_BORDER_RADIUS,
    overflow: "hidden",
    backgroundColor: "#ffffff"
  },
  focusedImageOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
    padding: 12
  },
  closeFocusedImageButton: {
    position: "absolute",
    right: 12,
    top: 40
  },
  focusedImage: {
    width: "100%",
    height: "78%"
  },
  imageDotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: -2
  },
  imageDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "#d9d9d9"
  },
  imageDotActive: {
    backgroundColor: designTokens.colors.primary
  },
  bidDialogContent: {
    gap: 10
  },
  bidDialogInfoText: {
    fontFamily: appFontFamilies.general,
    color: "#000000"
  },
  bidDialogHintText: {
    color: "#333333",
    fontFamily: appFontFamilies.general
  },
  bidDialogErrorText: {
    color: designTokens.colors.primary,
    fontFamily: appFontFamilies.general
  }
});
