import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { FormTextInput, PrimaryButton, ScreenContainer } from "../../components/primitives";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import {
  fetchChatConversationDetail,
  markConversationMessagesRead,
  sendResourceMessage
} from "../../services/graphql/chat";
import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";

export interface ChatMessageItem {
  id: string;
  direction: "incoming" | "outgoing";
  body: string;
  createdAt: string | null;
}

export interface ChatDetailConversation {
  id: string;
  otherAccountDisplayName: string;
  linkedResourceTitle: string | null;
}

export interface ChatDetailScreenProps {
  conversationId?: string | null;
  currentAccountId?: string | null;
  conversation: ChatDetailConversation | null;
  messages?: ChatMessageItem[];
  loading?: boolean;
  errorMessage?: string | null;
  sending?: boolean;
  onRetry?: () => void;
  onBackToList: () => void;
  onOpenLinkedResource?: () => void;
  onOpenLinkedAccount?: () => void;
  onSendMessage?: (messageText: string) => void;
}

export function ChatDetailScreen({
  conversationId,
  currentAccountId = null,
  conversation,
  messages,
  loading = false,
  errorMessage = null,
  sending = false,
  onRetry,
  onBackToList,
  onOpenLinkedResource,
  onOpenLinkedAccount,
  onSendMessage
}: ChatDetailScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const [composerValue, setComposerValue] = useState("");
  const [remoteConversation, setRemoteConversation] = useState<ChatDetailConversation | null>(null);
  const [remoteMessages, setRemoteMessages] = useState<ChatMessageItem[]>([]);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteErrorMessage, setRemoteErrorMessage] = useState<string | null>(null);
  const [remoteSending, setRemoteSending] = useState(false);

  const hasInjectedDetail = conversation !== null || messages !== undefined;

  const loadConversation = useCallback(async (): Promise<void> => {
    if (hasInjectedDetail || !conversationId || !currentAccountId) {
      return;
    }

    setRemoteLoading(true);
    setRemoteErrorMessage(null);

    try {
      const result = await fetchChatConversationDetail(conversationId, currentAccountId);
      setRemoteConversation(result.conversation);
      setRemoteMessages(result.messages);
      await markConversationMessagesRead(conversationId);
    } catch {
      setRemoteErrorMessage(t("chatConversationMissing", { defaultValue: "We could not load this conversation." }));
    } finally {
      setRemoteLoading(false);
    }
  }, [conversationId, currentAccountId, hasInjectedDetail, t]);

  useEffect(() => {
    void loadConversation();
  }, [loadConversation]);

  const resolvedConversation = conversation ?? remoteConversation;
  const resolvedMessages = messages ?? remoteMessages;
  const resolvedLoading = loading || (!hasInjectedDetail && remoteLoading);
  const resolvedErrorMessage = errorMessage ?? (!hasInjectedDetail ? remoteErrorMessage : null);
  const resolvedSending = sending || (!hasInjectedDetail && remoteSending);

  const sortedMessages = useMemo(() => {
    return [...resolvedMessages].sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
  }, [resolvedMessages]);

  const handleSend = (): void => {
    const trimmedValue = composerValue.trim();
    if (!trimmedValue) {
      return;
    }

    if (onSendMessage) {
      onSendMessage(trimmedValue);
      setComposerValue("");
      return;
    }

    if (!conversationId || !currentAccountId) {
      return;
    }

    setRemoteSending(true);
    void sendResourceMessage(conversationId, currentAccountId, trimmedValue)
      .then(async () => {
        setComposerValue("");
        await loadConversation();
      })
      .catch(() => {
        setRemoteErrorMessage(t("chatSendError", { defaultValue: "We could not send your message." }));
      })
      .finally(() => {
        setRemoteSending(false);
      });
  };

  if (resolvedLoading) {
    return <LoadingState label={t("chatConversationLoading", { defaultValue: "Loading conversation..." })} />;
  }

  if (resolvedErrorMessage) {
    return <ErrorState message={resolvedErrorMessage} {...(onRetry ? { onRetry } : { onRetry: () => void loadConversation() })} />;
  }

  if (!resolvedConversation) {
    return (
      <ErrorState
        message={t("chatConversationMissing", { defaultValue: "We could not load this conversation." })}
        {...(onRetry ? { onRetry } : { onRetry: () => void loadConversation() })}
      />
    );
  }

  return (
    <ScreenContainer testID="chat-detail-screen" style={styles.root}>
      <View style={styles.header}>
        <PrimaryButton
          label={t("backLabel", { defaultValue: "Back" })}
          onPress={onBackToList}
        />
        <View style={styles.headerContent}>
          <Text accessibilityRole="header" variant="titleLarge" style={styles.headerTitle}>
            {resolvedConversation.otherAccountDisplayName}
          </Text>
          {resolvedConversation.linkedResourceTitle ? (
            <Text variant="bodySmall" style={styles.headerSubtitle}>
              {resolvedConversation.linkedResourceTitle}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.linkRow}>
        {onOpenLinkedResource ? (
          <Pressable accessibilityRole="button" onPress={onOpenLinkedResource}>
            <Text style={styles.linkText}>{t("chatOpenResource", { defaultValue: "Open resource" })}</Text>
          </Pressable>
        ) : null}
        {onOpenLinkedAccount ? (
          <Pressable accessibilityRole="button" onPress={onOpenLinkedAccount}>
            <Text style={styles.linkText}>{t("chatOpenProfile", { defaultValue: "Open profile" })}</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.messagesContent}>
        {sortedMessages.map((message) => {
          const isOutgoing = message.direction === "outgoing";
          const formattedDate = message.createdAt
            ? new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date(message.createdAt))
            : "--:--";

          return (
            <View
              key={message.id}
              style={[styles.messageBubble, isOutgoing ? styles.outgoingBubble : styles.incomingBubble]}
              testID={`chat-message-${message.id}`}
            >
              <Text style={styles.messageText}>{message.body}</Text>
              <Text style={styles.messageTime}>{formattedDate}</Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.composerRow}>
        <FormTextInput
          accessibilityLabel={t("chatMessageComposer", { defaultValue: "Message" })}
          placeholder={t("chatMessagePlaceholder", { defaultValue: "Write a message" })}
          value={composerValue}
          onChangeText={setComposerValue}
          style={styles.composerInput}
        />
        <PrimaryButton
          label={t("chatSend", { defaultValue: "Send" })}
          onPress={handleSend}
          loading={resolvedSending}
          disabled={!composerValue.trim() || resolvedSending}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: designTokens.spacing.sm,
    paddingTop: designTokens.spacing.lg
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: designTokens.spacing.sm
  },
  headerContent: {
    flex: 1,
    gap: designTokens.spacing.xs
  },
  headerTitle: {
    fontFamily: appFontFamilies.altGeneral,
    fontSize: 20,
    lineHeight: 24
  },
  headerSubtitle: {
    opacity: 0.7
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: designTokens.spacing.md
  },
  linkText: {
    color: designTokens.colors.primary,
    fontFamily: appFontFamilies.general
  },
  messagesContent: {
    gap: designTokens.spacing.sm,
    paddingBottom: designTokens.spacing.sm
  },
  messageBubble: {
    maxWidth: "86%",
    borderRadius: designTokens.radius.md,
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.sm,
    gap: designTokens.spacing.xs
  },
  outgoingBubble: {
    alignSelf: "flex-end",
    backgroundColor: designTokens.colors.primary,
    opacity: 0.92
  },
  incomingBubble: {
    alignSelf: "flex-start",
    backgroundColor: designTokens.colors.secondary
  },
  messageText: {
    color: "#000",
    fontFamily: appFontFamilies.general
  },
  messageTime: {
    alignSelf: "flex-end",
    fontSize: 11,
    opacity: 0.65
  },
  composerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: designTokens.spacing.sm
  },
  composerInput: {
    flex: 1,
    backgroundColor: "#fff"
  }
});
