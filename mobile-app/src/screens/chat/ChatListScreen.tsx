import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Icon, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import ChatBackground from "../../assets/img/background-chat.svg";
import { AccountAvatar } from "../../components/AccountAvatar";
import { ScreenContainer } from "../../components/primitives";
import { EmptyState } from "../../components/state/EmptyState";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { fetchChatConversations } from "../../services/graphql/chat";
import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";

export interface ChatConversationItem {
  id: string;
  otherAccountDisplayName: string;
  otherAccountAvatarUrl?: string | null;
  linkedResourceTitle: string | null;
  linkedResourceImageUrl?: string | null;
  lastMessagePreview: string;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface ChatListScreenProps {
  conversations?: ChatConversationItem[];
  loading?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  onOpenConversation?: (conversationId: string) => void;
  onOpenMyHub?: () => void;
}

export function ChatListScreen({
  conversations,
  loading = false,
  errorMessage = null,
  onRetry,
  onOpenConversation,
  onOpenMyHub
}: ChatListScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const [remoteConversations, setRemoteConversations] = useState<ChatConversationItem[]>([]);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteErrorMessage, setRemoteErrorMessage] = useState<string | null>(null);

  const hasInjectedConversations = conversations !== undefined;

  const loadConversations = useCallback(async (): Promise<void> => {
    if (hasInjectedConversations) {
      return;
    }

    setRemoteLoading(true);
    setRemoteErrorMessage(null);

    try {
      const nextConversations = await fetchChatConversations();
      setRemoteConversations(nextConversations);
    } catch {
      setRemoteErrorMessage(t("chatLoadError", { defaultValue: "We could not load this conversation." }));
    } finally {
      setRemoteLoading(false);
    }
  }, [hasInjectedConversations, t]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  const sortedConversations = useMemo(() => {
    return [...(conversations ?? remoteConversations)].sort((a, b) => (b.lastMessageAt ?? "").localeCompare(a.lastMessageAt ?? ""));
  }, [conversations, remoteConversations]);

  const resolvedLoading = loading || (!hasInjectedConversations && remoteLoading);
  const resolvedErrorMessage = errorMessage ?? (!hasInjectedConversations ? remoteErrorMessage : null);

  if (resolvedLoading) {
    return <LoadingState label={t("chatLoading", { defaultValue: "Loading conversations..." })} />;
  }

  if (resolvedErrorMessage) {
    return <ErrorState message={resolvedErrorMessage} {...(onRetry ? { onRetry } : { onRetry: () => void loadConversations() })} />;
  }

  if (sortedConversations.length === 0) {
    return (
      <EmptyState
        message={t("chatEmpty", { defaultValue: "No conversation yet." })}
        actionLabel={t("chatOpenMyHub", { defaultValue: "Open My Hub" })}
        {...(onOpenMyHub ? { onActionPress: onOpenMyHub } : {})}
      />
    );
  }

  return (
    <ScreenContainer testID="chat-list-screen" style={styles.root}>
      <ChatBackground width="100%" height="100%" fill={designTokens.colors.secondary} style={styles.background} />
      <ScrollView contentContainerStyle={styles.listContent}>
        {sortedConversations.map((conversation) => {
          const formattedDate = conversation.lastMessageAt
            ? new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "2-digit" }).format(new Date(conversation.lastMessageAt))
            : t("dateUnknown", { defaultValue: "Unknown date" });
          const contextTitle = conversation.linkedResourceTitle
            ?? t("chatGenericThread", { defaultValue: "Conversation" });

          return (
            <Pressable
              key={conversation.id}
              accessibilityRole="button"
              accessibilityLabel={t("chatOpenConversation", {
                defaultValue: "Open conversation with {{name}}",
                name: conversation.otherAccountDisplayName
              })}
              onPress={() => {
                if (onOpenConversation) {
                  onOpenConversation(conversation.id);
                }
              }}
              style={styles.row}
              testID={`chat-list-row-${conversation.id}`}
            >
              <View style={styles.mediaFrame}>
                {conversation.linkedResourceImageUrl ? (
                  <Image source={{ uri: conversation.linkedResourceImageUrl }} style={styles.resourceImage} />
                ) : (
                  <View style={styles.resourceImagePlaceholder}>
                    <Icon source="image-off-outline" size={26} color="rgba(0, 0, 0, 0.48)" />
                  </View>
                )}
                <View style={styles.avatarWrap}>
                  <AccountAvatar
                    authenticated
                    displayName={conversation.otherAccountDisplayName}
                    avatarUrl={conversation.otherAccountAvatarUrl ?? null}
                    size={46}
                  />
                </View>
              </View>

              <View style={styles.rowMain}>
                <Text variant="titleMedium" numberOfLines={1} style={styles.rowTitle}>
                  {conversation.otherAccountDisplayName}
                </Text>
                <Text variant="bodySmall" numberOfLines={1} style={styles.rowSubtitle}>
                  {contextTitle}
                </Text>
                <Text variant="bodySmall" numberOfLines={2} style={styles.previewText}>
                  {conversation.lastMessagePreview}
                </Text>
              </View>

              <View style={styles.rowRight}>
                {conversation.unreadCount > 0 ? <Icon source="circle" size={18} color={designTokens.colors.primary} /> : null}
                <Text variant="labelSmall" style={[styles.dateLabel, conversation.unreadCount > 0 ? styles.unreadDateLabel : null]}>
                  {formattedDate}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 0,
    position: "relative",
    backgroundColor: "#ffffff"
  },
  background: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  },
  listContent: {
    paddingBottom: designTokens.spacing.md
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 94,
    paddingLeft: designTokens.spacing.xs,
    paddingRight: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.sm,
    borderBottomColor: "#cccccc",
    borderBottomWidth: StyleSheet.hairlineWidth
  },
  mediaFrame: {
    width: 90,
    height: 78,
    position: "relative",
    marginRight: designTokens.spacing.sm
  },
  resourceImage: {
    width: 70,
    height: 70,
    borderRadius: designTokens.radius.sm,
    backgroundColor: designTokens.colors.secondary
  },
  resourceImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: designTokens.radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: designTokens.colors.secondary
  },
  avatarWrap: {
    position: "absolute",
    right: 0,
    bottom: 0,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#ffffff",
    overflow: "hidden"
  },
  rowMain: {
    flex: 1,
    alignSelf: "stretch",
    justifyContent: "center",
    gap: 2
  },
  rowRight: {
    minWidth: 56,
    alignSelf: "stretch",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingVertical: 2
  },
  rowTitle: {
    fontFamily: appFontFamilies.altGeneral,
    fontSize: 18,
    lineHeight: 22,
    color: designTokens.colors.primary
  },
  rowSubtitle: {
    fontFamily: appFontFamilies.general,
    color: "#111111",
    textTransform: "uppercase"
  },
  previewText: {
    fontFamily: appFontFamilies.general,
    color: "#111111"
  },
  dateLabel: {
    color: designTokens.colors.primary,
    fontFamily: appFontFamilies.general
  },
  unreadDateLabel: {
    fontFamily: appFontFamilies.altGeneral
  }
});
