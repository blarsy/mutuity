import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { IconButton, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";
import CameraIcon from "../../assets/img/CAMERA.svg";
import PhotosIcon from "../../assets/img/PHOTOS.svg";
import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";
import { FormFieldLabel } from "./FormFieldLabel";

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
  const { t } = useTranslation("common");
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
      <FormFieldLabel>{label}</FormFieldLabel>

      <View style={styles.actionsRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={addFromCameraLabel}
          style={styles.actionButton}
          onPress={() => void handleTakePicture()}
          disabled={busy}
        >
          <View style={styles.actionContent}>
            <CameraIcon width={64} height={64} fill="#fff" />
            <Text style={styles.actionText}>
              <Text style={styles.actionPlus}>+ </Text>
              {addFromCameraLabel}
            </Text>
          </View>
        </Pressable>

        <View style={styles.divider} />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={addFromLibraryLabel}
          style={styles.actionButton}
          onPress={() => void handlePickFromLibrary()}
          disabled={busy}
        >
          <View style={styles.actionContent}>
            <PhotosIcon width={64} height={64} fill="#fff" />
            <Text style={styles.actionText}>
              <Text style={styles.actionPlus}>+ </Text>
              {addFromLibraryLabel}
            </Text>
          </View>
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
                accessibilityLabel={t("removeImage", { defaultValue: "Remove image" })}
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
  actionsRow: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-around",
    backgroundColor: designTokens.colors.primaryContainer,
    borderRadius: 25,
    padding: designTokens.spacing.md
  },
  actionButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  actionContent: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center"
  },
  divider: {
    width: 5,
    backgroundColor: "#fff",
    borderRadius: 3
  },
  actionText: {
    color: designTokens.colors.primary,
    fontFamily: appFontFamilies.general,
    fontSize: 14,
    marginTop: designTokens.spacing.xs
  },
  actionPlus: {
    color: designTokens.colors.primary,
    fontFamily: appFontFamilies.general,
    fontSize: 14
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
