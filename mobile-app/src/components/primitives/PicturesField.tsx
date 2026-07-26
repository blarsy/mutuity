import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { Icon, IconButton, Text } from "react-native-paper";

import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";

export interface PicturesFieldProps {
  label: string;
  accessibilityLabel?: string;
  imageUrls: string[];
  onChange: (imageUrls: string[]) => void;
  addFromCameraLabel: string;
  addFromLibraryLabel: string;
}

export function PicturesField({
  label,
  accessibilityLabel,
  imageUrls,
  onChange,
  addFromCameraLabel,
  addFromLibraryLabel
}: PicturesFieldProps): React.JSX.Element {
  const [busy, setBusy] = useState(false);

  const appendUris = (uris: string[]): void => {
    if (uris.length === 0) {
      return;
    }

    const deduped = [...new Set([...imageUrls, ...uris.filter((uri) => uri.trim().length > 0)])];
    onChange(deduped);
  };

  const removeAtIndex = (index: number): void => {
    onChange(imageUrls.filter((_, currentIndex) => currentIndex !== index));
  };

  const handlePickFromLibrary = async (): Promise<void> => {
    setBusy(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8
      });

      if (result.canceled) {
        return;
      }

      appendUris(result.assets.map((asset) => asset.uri));
    } finally {
      setBusy(false);
    }
  };

  const handleTakePicture = async (): Promise<void> => {
    setBusy(true);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8
      });

      if (result.canceled) {
        return;
      }

      appendUris(result.assets.map((asset) => asset.uri));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View accessible accessibilityLabel={accessibilityLabel ?? label} style={styles.root}>
      <Text variant="titleSmall" style={styles.label}>{label}</Text>

      <View style={styles.actionsRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={addFromCameraLabel}
          style={styles.actionButton}
          onPress={() => void handleTakePicture()}
          disabled={busy}
        >
          <Icon source="camera" size={22} color={designTokens.colors.primary} />
          <Text style={styles.actionText}>{addFromCameraLabel}</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={addFromLibraryLabel}
          style={styles.actionButton}
          onPress={() => void handlePickFromLibrary()}
          disabled={busy}
        >
          <Icon source="image-multiple" size={22} color={designTokens.colors.primary} />
          <Text style={styles.actionText}>{addFromLibraryLabel}</Text>
        </Pressable>
      </View>

      {imageUrls.length > 0 ? (
        <View style={styles.grid}>
          {imageUrls.map((imageUrl, index) => (
            <View key={`${imageUrl}-${index}`} style={styles.imageBox}>
              <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
              <IconButton
                icon="close"
                size={16}
                style={styles.removeButton}
                iconColor="#fff"
                containerColor="rgba(0,0,0,0.55)"
                onPress={() => removeAtIndex(index)}
                accessibilityLabel="Remove image"
              />
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: designTokens.spacing.xs
  },
  label: {
    fontFamily: appFontFamilies.altGeneral,
    textTransform: "uppercase",
    letterSpacing: 0.4
  },
  actionsRow: {
    flexDirection: "row",
    gap: designTokens.spacing.xs
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: designTokens.spacing.xs,
    borderWidth: 1,
    borderColor: designTokens.colors.primary,
    borderRadius: designTokens.radius.md,
    paddingVertical: designTokens.spacing.sm,
    paddingHorizontal: designTokens.spacing.sm,
    backgroundColor: designTokens.colors.primaryContainer
  },
  actionText: {
    color: designTokens.colors.primary,
    fontFamily: appFontFamilies.general,
    fontSize: 12
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: designTokens.spacing.xs
  },
  imageBox: {
    width: 100,
    height: 100,
    borderRadius: designTokens.radius.sm,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#f5f5f5"
  },
  image: {
    width: "100%",
    height: "100%"
  },
  removeButton: {
    position: "absolute",
    top: 0,
    right: 0,
    margin: 0
  }
});
