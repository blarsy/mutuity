import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Badge, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

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
  linkedResourceTitle: string | null;
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
      <Text accessibilityRole="header" variant="headlineSmall" style={styles.title}>
        {t("chatLabel", { defaultValue: "Chat" })}
      </Text>

      <ScrollView contentContainerStyle={styles.listContent}>
        {sortedConversations.map((conversation) => {
          const formattedDate = conversation.lastMessageAt
            ? new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "2-digit" }).format(new Date(conversation.lastMessageAt))
            : t("dateUnknown", { defaultValue: "Unknown date" });

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
              <View style={styles.rowMain}>
                <Text variant="titleMedium" numberOfLines={1} style={styles.rowTitle}>
                  {conversation.otherAccountDisplayName}
                </Text>
                <Text variant="bodySmall" numberOfLines={1} style={styles.rowSubtitle}>
                  {conversation.linkedResourceTitle
                    ? t("chatLinkedResource", {
                      defaultValue: "About: {{title}}",
                      title: conversation.linkedResourceTitle
                    })
                    : t("chatGenericThread", { defaultValue: "Conversation" })}
                </Text>
                <Text variant="bodySmall" numberOfLines={2} style={styles.previewText}>
                  {conversation.lastMessagePreview}
                </Text>
              </View>

              <View style={styles.rowRight}>
                <Text variant="labelSmall" style={styles.dateLabel}>
                  {formattedDate}
                </Text>
                {conversation.unreadCount > 0 ? <Badge size={22}>{conversation.unreadCount}</Badge> : null}
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
    paddingTop: designTokens.spacing.lg
  },
  title: {
    fontFamily: appFontFamilies.title,
    textTransform: "uppercase",
    letterSpacing: 0.6
  },
  listContent: {
    paddingTop: designTokens.spacing.sm,
    gap: designTokens.spacing.sm,
    paddingBottom: designTokens.spacing.md
  },
  row: {
    backgroundColor: designTokens.colors.secondary,
    borderRadius: designTokens.radius.md,
    padding: designTokens.spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: designTokens.spacing.md
  },
  rowMain: {
    flex: 1,
    gap: designTokens.spacing.xs
  },
  rowRight: {
    minWidth: 44,
    alignItems: "flex-end",
    gap: designTokens.spacing.xs
  },
  rowTitle: {
    fontFamily: appFontFamilies.altGeneral,
    fontSize: 18,
    lineHeight: 22
  },
  rowSubtitle: {
    fontFamily: appFontFamilies.general,
    opacity: 0.75
  },
  previewText: {
    fontFamily: appFontFamilies.general,
    opacity: 0.82
  },
  dateLabel: {
    opacity: 0.7
  }
});
