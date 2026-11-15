import React from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { Icon, IconButton, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";

interface SearchListing {
  id: string;
  title: string;
  createdAt?: string | null;
  creatorDisplayName?: string | null;
  imageUrls?: string[];
}

export interface ResourceSearchListing extends SearchListing {
  canBeExchanged?: boolean;
  canBeGifted?: boolean;
}

export interface NeedSearchListing extends SearchListing {
  proposedTokenAmount: number | null;
}

export interface ResourceSearchCardProps {
  listing: ResourceSearchListing;
  onPress?: () => void;
  onStartChat?: () => void;
  accessibilityLabel?: string;
}

export interface NeedSearchCardProps {
  listing: NeedSearchListing;
  onPress?: () => void;
  accessibilityLabel?: string;
}

function formatPublishedDate(value: string | null | undefined, locale: string): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

function ListingImage({ imageUrls }: { imageUrls?: string[] }): React.JSX.Element {
  return imageUrls?.[0] ? (
    <Image source={{ uri: imageUrls[0] }} style={styles.image} />
  ) : (
    <View style={[styles.image, styles.imageFallback]}>
      <Icon source="image-outline" size={20} color={designTokens.colors.primary} />
    </View>
  );
}

export function ResourceSearchCard({
  listing,
  onPress,
  onStartChat,
  accessibilityLabel = listing.title
}: ResourceSearchCardProps): React.JSX.Element {
  const { t, i18n } = useTranslation("common");
  const content = (
    <>
      <ListingImage {...(listing.imageUrls ? { imageUrls: listing.imageUrls } : {})} />
      <View style={styles.resourceContent}>
        <Text variant="labelSmall" style={styles.publishedAt}>
          {`${t("publishedAtLabel", { defaultValue: "Published" })} ${formatPublishedDate(listing.createdAt, i18n.language) ?? "-"}`}
        </Text>
        <View style={styles.body}>
          <Text variant="titleMedium" numberOfLines={2} style={styles.title}>
            {listing.title}
          </Text>
          <Text variant="labelSmall" style={styles.author}>
            {`${t("broughtByLabel", { defaultValue: "Brought by" })} ${listing.creatorDisplayName ?? t("anonymousLabel", { defaultValue: "Anonymous" })}`}
          </Text>
          <View style={styles.flagsRow}>
            {listing.canBeGifted ? (
              <Text variant="labelSmall" style={styles.flagText}>
                {t("canBeGiftedLabel", { defaultValue: "Gift" })}
              </Text>
            ) : null}
            {listing.canBeExchanged ? (
              <Text variant="labelSmall" style={styles.flagText}>
                {t("canBeExchangedLabel", { defaultValue: "Exchange" })}
              </Text>
            ) : null}
          </View>
        </View>
        {onStartChat ? (
          <IconButton
            icon="chat-outline"
            size={15}
            style={styles.chatButton}
            onPress={(event) => {
              event.stopPropagation();
              onStartChat();
            }}
            testID={`resource-card-chat-${listing.id}`}
          />
        ) : null}
      </View>
    </>
  );

  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={[styles.card, styles.resourceCard]}
      testID={`resource-card-${listing.id}`}
    >
      {content}
    </Pressable>
  ) : (
    <View style={[styles.card, styles.resourceCard]} testID={`resource-card-${listing.id}`}>
      {content}
    </View>
  );
}

export function NeedSearchCard({
  listing,
  onPress,
  accessibilityLabel = `${listing.title}. ${listing.proposedTokenAmount} Tope.`
}: NeedSearchCardProps): React.JSX.Element {
  const { t, i18n } = useTranslation(["common", "us2"]);
  const content = (
    <>
      <ListingImage {...(listing.imageUrls ? { imageUrls: listing.imageUrls } : {})} />
      <View style={styles.needContent}>
        <Text variant="labelSmall" style={styles.publishedAt}>
          {`${t("publishedAtLabel", { defaultValue: "Published" })} ${formatPublishedDate(listing.createdAt, i18n.language) ?? "-"}`}
        </Text>
        <View style={styles.body}>
          <Text variant="titleMedium" numberOfLines={2} style={[styles.title, styles.needTitle]}>
            {listing.title}
          </Text>
          <Text variant="labelSmall" style={styles.author}>
            {`${t("broughtByLabel", { defaultValue: "Brought by" })} ${listing.creatorDisplayName ?? t("anonymousLabel", { defaultValue: "Anonymous" })}`}
          </Text>
          <Text variant="labelSmall" style={styles.tokenLine}>
            {t("needTokenAmount", {
              ns: "us2",
              defaultValue: "{{amount}} Topes",
              amount: listing.proposedTokenAmount
            })}
          </Text>
        </View>
      </View>
    </>
  );

  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={styles.card}
      testID={`need-card-${listing.id}`}
    >
      {content}
    </Pressable>
  ) : (
    <View style={styles.card} testID={`need-card-${listing.id}`}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: designTokens.colors.primaryContainer,
    borderRadius: designTokens.radius.md
  },
  resourceCard: {
    alignSelf: "center",
    width: "100%"
  },
  image: {
    width: 92,
    height: 92,
    borderRadius: designTokens.radius.md,
    backgroundColor: "#fff"
  },
  imageFallback: {
    alignItems: "center",
    justifyContent: "center"
  },
  resourceContent: {
    flex: 1,
    marginRight: 4,
    position: "relative"
  },
  needContent: {
    flex: 1,
    marginRight: 4,
    gap: designTokens.spacing.xs
  },
  publishedAt: {
    color: designTokens.colors.primary,
    alignSelf: "flex-end",
    fontFamily: appFontFamilies.general,
    fontSize: 10,
    lineHeight: 12
  },
  body: {
    flex: 1,
    justifyContent: "center",
    gap: 2
  },
  title: {
    fontFamily: appFontFamilies.altGeneral,
    fontSize: 16,
    lineHeight: 20
  },
  needTitle: {
    flex: 1
  },
  author: {
    color: designTokens.colors.primary,
    fontSize: 10,
    lineHeight: 12,
    fontFamily: appFontFamilies.general
  },
  flagsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 1
  },
  flagText: {
    textTransform: "uppercase",
    fontSize: 10,
    lineHeight: 12,
    fontFamily: appFontFamilies.altGeneral,
    letterSpacing: 0.35
  },
  chatButton: {
    borderRadius: 0,
    position: "absolute",
    right: 0,
    bottom: -6
  },
  tokenLine: {
    color: designTokens.colors.primary,
    fontFamily: appFontFamilies.general
  }
});