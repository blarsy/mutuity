import React, { type ReactNode } from "react";
import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import { Dialog, Portal, Text } from "react-native-paper";

import { designTokens } from "../../theme/tokens";

export interface ThemedDialogProps {
  visible: boolean;
  title?: string;
  content: ReactNode;
  actions?: ReactNode[];
  testID?: string | undefined;
  onDismiss?: (() => void) | undefined;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  actionZoneStyle?: StyleProp<ViewStyle>;
}

export function ThemedDialog({
  visible,
  title,
  content,
  actions,
  testID,
  onDismiss,
  style,
  contentStyle,
  actionZoneStyle
}: ThemedDialogProps): React.JSX.Element {
  const dialogProps = onDismiss ? { onDismiss } : {};
  const testIdProps = testID ? { testID } : {};

  return (
    <Portal>
      <Dialog
        visible={visible}
        style={[styles.dialog, style]}
        theme={{ roundness: 1 }}
        {...dialogProps}
        {...testIdProps}
      >
        <View style={styles.titleRow}>
          <Text variant="titleLarge" style={styles.titleText} numberOfLines={1}>
            {title ?? ""}
          </Text>
        </View>

        <Dialog.Content style={[styles.contentZone, contentStyle]}>{content}</Dialog.Content>

        {actions ? <Dialog.Actions style={[styles.actionZone, actionZoneStyle]}>{actions}</Dialog.Actions> : null}
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    backgroundColor: designTokens.colors.primaryContainer,
    borderWidth: 0,
    borderColor: "transparent",
    elevation: 0,
    shadowColor: "transparent",
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    marginHorizontal: 16
  },
  titleRow: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 4,
    paddingBottom: 0
  },
  titleText: {
    width: "100%",
    textAlign: "center"
  },
  contentZone: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 0
  },
  actionZone: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 4
  }
});