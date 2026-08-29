import React from "react";
import { Pressable, StyleProp, StyleSheet, ViewStyle } from "react-native";
import { Avatar } from "react-native-paper";

import { designTokens } from "../theme/tokens";

export interface AccountAvatarProps {
  authenticated: boolean;
  displayName?: string | null;
  avatarUrl?: string | null;
  size?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

function AccountAvatarContent({ authenticated, displayName, avatarUrl, size = 24 }: Pick<AccountAvatarProps, "authenticated" | "displayName" | "avatarUrl" | "size">): React.JSX.Element {
  if (!authenticated) {
    return <Avatar.Icon size={size} icon="account-outline" style={styles.icon} color="#000000" />;
  }

  if (avatarUrl) {
    return <Avatar.Image size={size} source={{ uri: avatarUrl }} style={styles.image} />;
  }

  return (
    <Avatar.Text
      size={size}
      label={getInitials(displayName ?? "")}
      style={styles.text}
      color="#000000"
    />
  );
}

export function AccountAvatar({ authenticated, displayName, avatarUrl, size = 24, onPress, style }: AccountAvatarProps): React.JSX.Element {
  console.log("AccountAvatar props:", { authenticated, displayName, avatarUrl, size, onPress, style }); 
  const content = (
    <AccountAvatarContent
      authenticated={authenticated}
      displayName={displayName}
      avatarUrl={avatarUrl}
      size={size}
    />
  );

  if (!onPress) {
    return <>{content}</>;
  }

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={style}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  icon: {
    backgroundColor: designTokens.colors.secondary
  },
  image: {
    backgroundColor: "transparent"
  },
  text: {
    backgroundColor: "#0D70E0"
  }
});