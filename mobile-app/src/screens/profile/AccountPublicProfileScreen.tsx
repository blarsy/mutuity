import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Chip, Icon, IconButton, Snackbar, Text } from "react-native-paper";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useTranslation } from "react-i18next";

import { AccountAvatar } from "../../components/AccountAvatar";
import { NavigationBackHeader, PrimaryButton, ScreenContainer } from "../../components/primitives";
import { fetchMyProfile } from "../../services/graphql/profile";
import { NeedIntensity } from "../../services/graphql/generated";
import type { MyProfileRecord } from "./MyProfileScreen";
import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";

export interface AccountPublicProfileScreenProps {
  accountId: string;
  profile?: MyProfileRecord | null;
  loading?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  onBack?: () => void;
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

export function AccountPublicProfileScreen({
  accountId,
  profile,
  loading = false,
  errorMessage = null,
  onRetry,
  onBack
}: AccountPublicProfileScreenProps): React.JSX.Element {
  const { t, i18n } = useTranslation();
  const [remoteProfile, setRemoteProfile] = useState<MyProfileRecord | null>(null);
  const [remoteLoading, setRemoteLoading] = useState(true);
  const [remoteErrorMessage, setRemoteErrorMessage] = useState<string | null>(null);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const hasInjectedProfile = profile !== undefined;

  const loadProfile = useCallback(async (): Promise<void> => {
    if (hasInjectedProfile) {
      return;
    }

    setRemoteLoading(true);
    setRemoteErrorMessage(null);

    try {
      const nextProfile = await fetchMyProfile(accountId);
      setRemoteProfile(nextProfile);
    } catch {
      setRemoteErrorMessage(t("profileLoadError", { defaultValue: "We could not load this profile." }));
    } finally {
      setRemoteLoading(false);
    }
  }, [accountId, hasInjectedProfile, t]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const resolvedProfile = profile ?? remoteProfile;
  const resolvedLoading = loading || (!hasInjectedProfile && remoteLoading);
  const resolvedErrorMessage = errorMessage ?? (!hasInjectedProfile ? remoteErrorMessage : null);
  const profileLinks = resolvedProfile?.profileLinks ?? [];
  const resources = resolvedProfile?.resources ?? [];
  const needs = resolvedProfile?.needs ?? [];
  const location = resolvedProfile?.location;
  const hasLocationMap = Boolean(location?.latitude != null && location?.longitude != null);
  const hasBio = Boolean(resolvedProfile?.bio.trim());

  const intensityLabelMeta = (intensity: NeedIntensity): { key: string; defaultValue: string } => {
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
  };

  const resolveLinkTarget = (url: string): string => {
    const trimmed = url.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }

    return `https://${trimmed}`;
  };

  const openProfileLink = (url: string): void => {
    const target = resolveLinkTarget(url);
    void Linking.openURL(target).catch(() => {
      setFeedback(t("profileLinkOpenError", { defaultValue: "We could not open this link." }));
    });
  };

  const profileLinkTypeIcons: Record<"website" | "facebook" | "instagram" | "x", string> = {
    website: "web",
    facebook: "facebook",
    instagram: "instagram",
    x: "twitter"
  };

  return (
    <>
      <ScreenContainer testID="account-public-profile-screen" style={styles.root}>
        <NavigationBackHeader
          onBack={onBack}
          accessibilityLabel={t("backLabel", { defaultValue: "Back" })}
        />

      {resolvedLoading ? (
        <View style={styles.stateBody}>
          <ActivityIndicator size="large" />
          <Text variant="bodyMedium" style={styles.stateText}>
            {t("profileLoading", { defaultValue: "Loading profile..." })}
          </Text>
        </View>
      ) : resolvedErrorMessage ? (
        <View style={styles.stateBody}>
          <Text accessibilityRole="alert" variant="bodyMedium" style={styles.stateText}>
            {resolvedErrorMessage}
          </Text>
          <PrimaryButton
            label={t("retry", { defaultValue: "Retry" })}
            onPress={() => {
              if (onRetry) {
                onRetry();
                return;
              }

              void loadProfile();
            }}
          />
        </View>
      ) : !resolvedProfile ? (
        <View style={styles.stateBody}>
          <Text accessibilityRole="alert" variant="bodyMedium" style={styles.stateText}>
            {t("profileNotAvailable", { defaultValue: "This profile is not available." })}
          </Text>
        </View>
      ) : (
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.bodyContent}>
        <View style={styles.identityRow}>
          <AccountAvatar
            authenticated
            displayName={resolvedProfile.displayName}
            avatarUrl={resolvedProfile.avatarUrl}
            size={64}
          />

          <View style={styles.identityTextZone}>
            <Text variant="titleLarge" style={styles.displayNameText}>
              {resolvedProfile.displayName || t("anonymousLabel", { defaultValue: "Anonymous" })}
            </Text>
            {resolvedProfile.location?.label ? (
              <Text variant="bodyMedium" style={styles.secondaryText}>{resolvedProfile.location.label}</Text>
            ) : null}
          </View>
        </View>

        <Pressable accessibilityRole="button" onPress={() => setShowMoreInfo((current) => !current)} style={styles.moreInfoButton}>
          <Text variant="labelLarge" style={styles.moreInfoText}>
            {showMoreInfo ? t("lessInfoLabel", { defaultValue: "Less info" }) : t("moreInfoLabel", { defaultValue: "More info" })}
          </Text>
        </Pressable>

        {showMoreInfo ? (
          <View style={styles.sectionCard}>
            {hasBio ? (
              <View style={styles.inlineStack}>
                <Text variant="labelLarge" style={styles.sectionTitle}>{t("bioLabel", { defaultValue: "Bio" })}</Text>
                <Text variant="bodyMedium" style={styles.bioText}>{resolvedProfile.bio.trim()}</Text>
              </View>
            ) : null}

            {profileLinks.length > 0 ? (
              <View style={styles.inlineStack}>
                <Text variant="labelLarge" style={styles.sectionTitle}>{t("linksLabel", { defaultValue: "Links" })}</Text>
                {profileLinks.map((link) => (
                  <Pressable
                    key={`${link.type}-${link.url}`}
                    accessibilityRole="link"
                    style={styles.linkRow}
                    onPress={() => openProfileLink(link.url)}
                  >
                    <IconButton icon={profileLinkTypeIcons[link.type]} size={18} />
                    <View style={styles.linkTextZone}>
                      <Text variant="bodyMedium" style={styles.linkText}>
                        {link.label.trim() || link.url}
                      </Text>
                      <Text variant="bodySmall" style={styles.linkUrlText}>
                        {link.url}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {location?.label && hasLocationMap && location.latitude != null && location.longitude != null ? (
              <View style={styles.inlineStack}>
                <Text variant="labelLarge" style={styles.sectionTitle}>{t("locationLabel", { defaultValue: "Location" })}</Text>
                <Text variant="bodyMedium" style={styles.locationText}>{location.label}</Text>
                <MapView
                  provider={PROVIDER_GOOGLE}
                  style={styles.map}
                  initialRegion={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05
                  }}
                >
                  <Marker coordinate={{ latitude: location.latitude, longitude: location.longitude }} />
                </MapView>
              </View>
            ) : null}
          </View>
        ) : null}

        {resources.length > 0 ? (
          <View style={styles.sectionCard}>
            <Text variant="labelLarge" style={styles.sectionTitle}>{t("availableResourcesLabel", { defaultValue: "Available resources" })}</Text>
            <View style={styles.resourceList}>
              {resources.map((resource) => (
                <View key={resource.id} style={styles.resourceCard} testID={`resource-card-${resource.id}`}>
                  {resource.imageUrls[0] ? (
                    <Image source={{ uri: resource.imageUrls[0] }} style={styles.resourceCardImage} />
                  ) : (
                    <View style={styles.resourceCardImageFallback}>
                      <Icon source="image-outline" size={20} color={designTokens.colors.primary} />
                    </View>
                  )}
                  <View style={styles.resourceCardContent}>
                    <Text variant="labelSmall" style={styles.resourceCardPublishedAt}>
                      {`${t("publishedAtLabel", { defaultValue: "Published" })} ${formatPublishedDate(resource.createdAt, i18n.language) ?? "-"}`}
                    </Text>
                    <View style={styles.resourceCardBody}>
                      <Text variant="titleMedium" numberOfLines={2} style={styles.resourceTitle}>{resource.title}</Text>
                      <Text variant="labelSmall" style={styles.resourceCardAuthor}>
                        {`${t("broughtByLabel", { defaultValue: "Brought by" })} ${resolvedProfile.displayName || t("anonymousLabel", { defaultValue: "Anonymous" })}`}
                      </Text>
                      <View style={styles.resourceCardFlagsRow}>
                        {resource.canBeGifted ? <Text variant="labelSmall" style={styles.resourceCardFlagText}>{t("canBeGiftedLabel", { defaultValue: "Gift" })}</Text> : null}
                        {resource.canBeExchanged ? <Text variant="labelSmall" style={styles.resourceCardFlagText}>{t("canBeExchangedLabel", { defaultValue: "Exchange" })}</Text> : null}
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {needs.length > 0 ? (
          <View style={styles.sectionCard}>
            <Text variant="labelLarge" style={styles.sectionTitle}>{t("availableNeedsLabel", { defaultValue: "Available needs" })}</Text>
            <View style={styles.resourceList}>
              {needs.map((need) => {
                const intensity = intensityLabelMeta(need.intensity);
                return (
                  <View key={need.id} style={styles.needCard} testID={`need-card-${need.id}`}>
                    <View style={styles.needCardHeader}>
                      <Text variant="titleMedium" style={styles.needTitle}>{need.title}</Text>
                      <Chip compact>{t(intensity.key, { defaultValue: intensity.defaultValue })}</Chip>
                    </View>
                    <Text variant="bodySmall" numberOfLines={2}>{need.description || t("needDescriptionEmpty", { defaultValue: "No description yet." })}</Text>
                    <Text variant="labelSmall" style={styles.needTokenLine}>
                      {t("needTokenAmount", { defaultValue: "{{amount}} token", amount: need.proposedTokenAmount })}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}
        </View>
      </ScrollView>
      )}
      </ScreenContainer>
      <Snackbar visible={feedback !== null} onDismiss={() => setFeedback(null)}>
        {feedback ?? ""}
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingTop: designTokens.spacing.sm,
    gap: designTokens.spacing.xs
  },
  content: {
    paddingBottom: designTokens.spacing.md
  },
  bodyContent: {
    marginTop: 4,
    gap: designTokens.spacing.md
  },
  stateBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: designTokens.spacing.sm
  },
  stateText: {
    textAlign: "center",
    fontFamily: appFontFamilies.general
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: designTokens.spacing.md,
    backgroundColor: designTokens.colors.secondary,
    borderRadius: designTokens.radius.md,
    padding: designTokens.spacing.md
  },
  identityTextZone: {
    flex: 1,
    gap: designTokens.spacing.xs
  },
  displayNameText: {
    fontFamily: appFontFamilies.altGeneral
  },
  secondaryText: {
    fontFamily: appFontFamilies.general,
    opacity: 0.8
  },
  sectionCard: {
    backgroundColor: designTokens.colors.secondary,
    borderRadius: designTokens.radius.md,
    padding: designTokens.spacing.md,
    gap: designTokens.spacing.xs
  },
  sectionTitle: {
    fontFamily: appFontFamilies.altGeneral,
    textTransform: "uppercase"
  },
  moreInfoButton: {
    backgroundColor: designTokens.colors.secondary,
    borderRadius: designTokens.radius.md,
    paddingVertical: designTokens.spacing.sm,
    paddingHorizontal: designTokens.spacing.md,
    alignItems: "center"
  },
  moreInfoText: {
    fontFamily: appFontFamilies.altGeneral,
    textTransform: "uppercase"
  },
  bioText: {
    fontFamily: appFontFamilies.general
  },
  inlineStack: {
    gap: designTokens.spacing.xs
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: designTokens.radius.sm,
    backgroundColor: designTokens.colors.primaryContainer,
    paddingVertical: 2,
    paddingHorizontal: designTokens.spacing.xs
  },
  linkTextZone: {
    flex: 1,
    gap: 2
  },
  linkText: {
    fontFamily: appFontFamilies.general,
    color: designTokens.colors.primary
  },
  linkUrlText: {
    fontFamily: appFontFamilies.general,
    opacity: 0.75
  },
  locationText: {
    fontFamily: appFontFamilies.general
  },
  map: {
    width: "100%",
    height: 180,
    borderRadius: designTokens.radius.sm
  },
  resourceList: {
    gap: designTokens.spacing.sm
  },
  resourceCard: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
    backgroundColor: designTokens.colors.primaryContainer,
    borderRadius: designTokens.radius.sm,
    padding: designTokens.spacing.sm,
  },
  resourceCardImage: {
    width: 92,
    height: 92,
    borderRadius: designTokens.radius.md,
    backgroundColor: "#fff"
  },
  resourceCardImageFallback: {
    width: 92,
    height: 92,
    borderRadius: designTokens.radius.md,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center"
  },
  resourceCardContent: {
    flex: 1,
    marginRight: 4
  },
  resourceCardPublishedAt: {
    color: designTokens.colors.primary,
    alignSelf: "flex-end",
    fontFamily: appFontFamilies.general,
    fontSize: 10,
    lineHeight: 12
  },
  resourceCardBody: {
    flex: 1,
    justifyContent: "center",
    gap: 2
  },
  resourceTitle: {
    fontFamily: appFontFamilies.altGeneral,
    fontSize: 16,
    lineHeight: 20
  },
  resourceCardAuthor: {
    color: designTokens.colors.primary,
    fontSize: 10,
    lineHeight: 12,
    fontFamily: appFontFamilies.general
  },
  resourceCardFlagsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 1
  },
  resourceCardFlagText: {
    textTransform: "uppercase",
    fontSize: 10,
    lineHeight: 12,
    fontFamily: appFontFamilies.altGeneral,
    letterSpacing: 0.35
  },
  needCard: {
    backgroundColor: designTokens.colors.primaryContainer,
    borderRadius: designTokens.radius.md,
    padding: designTokens.spacing.sm,
    gap: designTokens.spacing.xs
  },
  needCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: designTokens.spacing.sm
  },
  needTitle: {
    fontFamily: appFontFamilies.altGeneral,
    flex: 1
  },
  needTokenLine: {
    color: designTokens.colors.primary,
    fontFamily: appFontFamilies.general
  }
});
