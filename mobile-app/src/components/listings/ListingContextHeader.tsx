import React from "react";
import { Image, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Icon, Text } from "react-native-paper";

import { AccountAvatar } from "../AccountAvatar";
import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";

export type ListingContextKind = "resource" | "need";

export interface ListingContextHeaderProps {
  kind: ListingContextKind;
  title: string;
  authorDisplayName?: string | null;
  authorAvatarUrl?: string | null;
  listingImageUrl?: string | null;
  deletedAt?: string | null;
  testID?: string;
  accessibilityLabel?: string;
  onPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
}

const LISTING_IMAGE_SIZE = 50;
const AVATAR_SIZE = Math.round((LISTING_IMAGE_SIZE * 2) / 3);

function formatDeletedAt(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const deletedAt = new Date(value);
  if (Number.isNaN(deletedAt.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "2-digit", year: "numeric" }).format(deletedAt);
}

function getFallbackAuthor(kind: ListingContextKind): string {
  return kind === "resource" ? "Resource author unavailable" : "Need author unavailable";
}

export function ListingContextHeader({
  kind,
  title,
  authorDisplayName,
  authorAvatarUrl,
  listingImageUrl,
  deletedAt,
  testID,
  accessibilityLabel,
  onPress,
  containerStyle
}: ListingContextHeaderProps): React.JSX.Element {
  const hasImage = typeof listingImageUrl === "string" && listingImageUrl.trim().length > 0;
  const resolvedAuthorName = authorDisplayName?.trim() ? authorDisplayName : getFallbackAuthor(kind);
  const deletedAtLabel = formatDeletedAt(deletedAt);

  return (
    <View style={[styles.root, containerStyle]} testID={testID}>
      <Pressable
        accessibilityRole={onPress ? "button" : undefined}
        accessibilityLabel={accessibilityLabel ?? `${resolvedAuthorName}. ${title}`}
        onPress={onPress}
        style={styles.mediaFrame}
      >
        {hasImage ? (
          <Image source={{ uri: listingImageUrl }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Icon source="image-off-outline" size={20} color="rgba(0, 0, 0, 0.5)" />
          </View>
        )}

        <View style={styles.avatarWrap}>
          <AccountAvatar
            authenticated
            displayName={resolvedAuthorName}
            avatarUrl={authorAvatarUrl ?? null}
            size={AVATAR_SIZE}
          />
        </View>
      </Pressable>

      <Pressable
        accessibilityRole={onPress ? "button" : undefined}
        accessibilityLabel={accessibilityLabel ?? `${resolvedAuthorName}. ${title}`}
        onPress={onPress}
        style={styles.content}
      >
        <Text numberOfLines={1} ellipsizeMode="tail" variant="titleMedium" style={styles.authorLine}>
          <Icon size={18} color={designTokens.colors.primary} source="account-circle" /> {resolvedAuthorName}
        </Text>

        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          variant="titleMedium"
          style={[styles.titleLine, deletedAtLabel ? styles.deletedTitleLine : null]}
        >
          {title}
        </Text>

        {deletedAtLabel ? (
          <Text variant="bodySmall" style={styles.deletedMeta}>
            {`Deleted on ${deletedAtLabel}`}
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "flex-start"
  },
  mediaFrame: {
    width: LISTING_IMAGE_SIZE,
    height: LISTING_IMAGE_SIZE,
    position: "relative",
    marginRight: 20,
    marginBottom: 20
  },
  image: {
    width: LISTING_IMAGE_SIZE,
    height: LISTING_IMAGE_SIZE,
    borderRadius: 10,
    backgroundColor: designTokens.colors.secondary,
    overflow: "hidden"
  },
  imagePlaceholder: {
    width: LISTING_IMAGE_SIZE,
    height: LISTING_IMAGE_SIZE,
    borderRadius: 10,
    backgroundColor: designTokens.colors.secondary,
    alignItems: "center",
    justifyContent: "center"
  },
  avatarWrap: {
    position: "absolute",
    right: -20,
    bottom: -20,
    borderRadius: Math.round(AVATAR_SIZE / 2) + 2,
    borderWidth: 2,
    borderColor: "#ffffff",
    overflow: "hidden"
  },
  content: {
    flexGrow: 1,
    flexShrink: 1,
    paddingVertical: 6,
    paddingHorizontal: 6,
    gap: 2
  },
  authorLine: {
    color: designTokens.colors.primary,
    textTransform: "uppercase",
    fontFamily: appFontFamilies.altGeneral,
    letterSpacing: 0.3
  },
  titleLine: {
    fontFamily: appFontFamilies.general,
    color: "#111111"
  },
  deletedTitleLine: {
    textDecorationLine: "line-through"
  },
  deletedMeta: {
    color: "rgba(0, 0, 0, 0.75)",
    fontFamily: appFontFamilies.general
  }
});