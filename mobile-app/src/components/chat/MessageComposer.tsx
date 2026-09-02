import * as ImagePicker from "expo-image-picker";
import React from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";

import PhotosIcon from "../../assets/img/PHOTOS.svg";
import SendIcon from "../../assets/img/SEND.svg";
import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";

export interface MessageComposerProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  pendingImageUri?: string | null;
  onImageSelected: (imageUri: string) => void;
  onRemoveImage: () => void;
  sending?: boolean;
  placeholder?: string;
  testID?: string;
}

const ICON_SIZE = 20;
const PREVIEW_SIZE = 56;

export function MessageComposer({
  value,
  onChangeText,
  onSend,
  pendingImageUri = null,
  onImageSelected,
  onRemoveImage,
  sending = false,
  placeholder,
  testID
}: MessageComposerProps): React.JSX.Element {
  const { t } = useTranslation();

  const handlePickImage = async (): Promise<void> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    const pickedUri = result.assets[0]?.uri;
    if (!pickedUri) {
      return;
    }

    onImageSelected(pickedUri);
  };

  const canSend = !sending && (value.trim().length > 0 || Boolean(pendingImageUri));

  return (
    <View style={styles.root} testID={testID}>
      {pendingImageUri ? (
        <View style={styles.previewRow}>
          <Image source={{ uri: pendingImageUri }} style={styles.previewImage} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("chatRemoveImage", { defaultValue: "Remove image" })}
            onPress={onRemoveImage}
            style={styles.previewRemove}
          >
            <Text style={styles.previewRemoveLabel}>×</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.inputRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("chatPickImage", { defaultValue: "Add a photo" })}
          onPress={() => void handlePickImage()}
          style={styles.iconButton}
          hitSlop={8}
        >
          <PhotosIcon width={ICON_SIZE} height={ICON_SIZE} fill={designTokens.colors.primary} />
        </Pressable>

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ?? t("chatMessagePlaceholder", { defaultValue: "Write a message" })}
          placeholderTextColor="rgba(0, 0, 0, 0.4)"
          multiline
          style={styles.input}
          accessibilityLabel={t("chatMessageComposer", { defaultValue: "Message" })}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("chatSend", { defaultValue: "Send" })}
          onPress={onSend}
          disabled={!canSend}
          style={[styles.iconButton, !canSend ? styles.iconButtonDisabled : null]}
          hitSlop={8}
        >
          {sending ? (
            <ActivityIndicator size="small" color={designTokens.colors.primary} />
          ) : (
            <SendIcon width={ICON_SIZE} height={ICON_SIZE} fill={designTokens.colors.primary} />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: designTokens.spacing.xs
  },
  previewRow: {
    alignSelf: "flex-start",
    position: "relative"
  },
  previewImage: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    borderRadius: designTokens.radius.sm,
    backgroundColor: designTokens.colors.secondary
  },
  previewRemove: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center"
  },
  previewRemoveLabel: {
    color: "#fff",
    fontSize: 12,
    lineHeight: 14
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2
  },
  iconButton: {
    padding: 4
  },
  iconButtonDisabled: {
    opacity: 0.35
  },
  input: {
    flex: 1,
    fontFamily: appFontFamilies.general,
    fontSize: 15,
    color: "#111111",
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: 6,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: designTokens.radius.md,
    maxHeight: 100
  }
});
