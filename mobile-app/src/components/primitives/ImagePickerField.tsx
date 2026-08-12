import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import { Image, Pressable, StyleSheet, View } from "react-native";
import { Icon, Text } from "react-native-paper";
import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";
import { FormFieldLabel } from "./FormFieldLabel";

export interface ImagePickerFieldProps {
  label: string;
  accessibilityLabel?: string;
  imageUri: string | null;
  onChange: (imageUri: string | null) => void;
  addFromCameraLabel: string;
  addFromLibraryLabel: string;
}

const PREVIEW_SIZE = 120;

export function ImagePickerField({
  label,
  accessibilityLabel,
  imageUri,
  onChange,
  addFromCameraLabel,
  addFromLibraryLabel
}: ImagePickerFieldProps): React.JSX.Element {
  const [busy, setBusy] = useState(false);

  const handlePickFromLibrary = async (): Promise<void> => {
    setBusy(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8
      });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      onChange(result.assets[0].uri);
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

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      onChange(result.assets[0].uri);
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = (): void => {
    onChange(null);
  };

  return (
    <View style={styles.root} accessibilityLabel={accessibilityLabel ?? label}>
      <FormFieldLabel>{label}</FormFieldLabel>

      <View style={styles.previewRow}>
        {imageUri ? (
          <View style={styles.previewContainer}>
            <Image
              source={{ uri: imageUri }}
              style={styles.preview}
              accessibilityLabel={label}
            />
            <Pressable
              onPress={handleRemove}
              style={styles.removeButton}
              accessibilityRole="button"
              accessibilityLabel="Remove image"
            >
              <Icon source="close-circle" size={24} color={designTokens.colors.primary} />
            </Pressable>
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Icon source="image-outline" size={40} color={designTokens.colors.secondary} />
          </View>
        )}

        <View style={styles.actions}>
          <Pressable
            onPress={() => void handlePickFromLibrary()}
            disabled={busy}
            style={styles.actionButton}
            accessibilityRole="button"
            accessibilityLabel={addFromLibraryLabel}
          >
            <Icon source="image-multiple" size={20} color={designTokens.colors.primary} />
            <Text variant="labelSmall" style={styles.actionLabel}>{addFromLibraryLabel}</Text>
          </Pressable>

          <Pressable
            onPress={() => void handleTakePicture()}
            disabled={busy}
            style={styles.actionButton}
            accessibilityRole="button"
            accessibilityLabel={addFromCameraLabel}
          >
            <Icon source="camera" size={20} color={designTokens.colors.primary} />
            <Text variant="labelSmall" style={styles.actionLabel}>{addFromCameraLabel}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: designTokens.spacing.xs
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: designTokens.spacing.sm
  },
  previewContainer: {
    position: "relative"
  },
  preview: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    borderRadius: designTokens.radius.md
  },
  placeholder: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    borderRadius: designTokens.radius.md,
    backgroundColor: designTokens.colors.primaryContainer,
    alignItems: "center",
    justifyContent: "center"
  },
  removeButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#fff",
    borderRadius: 12
  },
  actions: {
    gap: designTokens.spacing.xs
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: designTokens.spacing.xs,
    paddingVertical: designTokens.spacing.xs
  },
  actionLabel: {
    fontFamily: appFontFamilies.general,
    color: designTokens.colors.primary
  }
});
