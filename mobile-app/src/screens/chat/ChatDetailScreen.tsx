import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View
} from "react-native";
import { Icon, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { MessageComposer } from "../../components/chat/MessageComposer";
import { ListingContextHeader } from "../../components/listings/ListingContextHeader";
import { NavigationBackHeader, ScreenContainer } from "../../components/primitives";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import {
  fetchChatConversationDetail,
  markConversationMessagesRead,
  sendResourceMessage
} from "../../services/graphql/chat";
import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";

const NEAR_BOTTOM_THRESHOLD = 50;

export interface ChatMessageItem {
  id: string;
  direction: "incoming" | "outgoing";
  body: string;
  createdAt: string | null;
  imageUrls?: string[];
}

export interface ChatDetailConversation {
  id: string;
  otherAccountId: string | null;
  otherAccountDisplayName: string;
  linkedResourceId: string | null;
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
  onOpenLinkedResource?: (resourceId: string) => void;
  onOpenLinkedAccount?: (accountId: string) => void;
  onSendMessage?: (messageText: string, imageUri?: string | null) => void;
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
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const [remoteConversation, setRemoteConversation] = useState<ChatDetailConversation | null>(null);
  const [remoteMessages, setRemoteMessages] = useState<ChatMessageItem[]>([]);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteErrorMessage, setRemoteErrorMessage] = useState<string | null>(null);
  const [remoteSending, setRemoteSending] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const messagesScrollRef = useRef<ScrollView>(null);
  const isNearBottomRef = useRef(true);
  const previousMessageCountRef = useRef(0);
  const pendingAutoScrollRef = useRef<{ animated: boolean } | null>(null);

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

  const scrollToBottom = useCallback((animated: boolean): void => {
    messagesScrollRef.current?.scrollToEnd({ animated });
    setHasNewMessages(false);
  }, []);

  const handleMessagesContentSizeChange = useCallback((): void => {
    if (!pendingAutoScrollRef.current) {
      return;
    }

    const { animated } = pendingAutoScrollRef.current;
    pendingAutoScrollRef.current = null;
    scrollToBottom(animated);
  }, [scrollToBottom]);

  const handleMessagesScroll = (event: NativeSyntheticEvent<NativeScrollEvent>): void => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);
    const nearBottom = distanceFromBottom <= NEAR_BOTTOM_THRESHOLD;
    isNearBottomRef.current = nearBottom;
    if (nearBottom) {
      setHasNewMessages(false);
    }
  };

  useEffect(() => {
    const previousCount = previousMessageCountRef.current;
    const currentCount = sortedMessages.length;
    previousMessageCountRef.current = currentCount;

    if (currentCount <= previousCount) {
      return;
    }

    if (previousCount === 0 || isNearBottomRef.current) {
      pendingAutoScrollRef.current = { animated: previousCount !== 0 };
      // ScrollView layout may already reflect the new content by now; try immediately and again once measured.
      scrollToBottom(previousCount !== 0);
    } else {
      setHasNewMessages(true);
    }
  }, [sortedMessages, scrollToBottom]);

  const handleSend = (): void => {
    const trimmedValue = composerValue.trim();
    if (!trimmedValue && !pendingImageUri) {
      return;
    }

    const messageBody = trimmedValue || t("chatImageMessageFallback", { defaultValue: "\uD83D\uDCF7 Photo" });

    if (onSendMessage) {
      onSendMessage(messageBody, pendingImageUri);
      setComposerValue("");
      setPendingImageUri(null);
      return;
    }

    if (!conversationId || !currentAccountId) {
      return;
    }

    setRemoteSending(true);
    void sendResourceMessage(conversationId, currentAccountId, messageBody, pendingImageUri)
      .then(async () => {
        setComposerValue("");
        setPendingImageUri(null);
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
      <NavigationBackHeader onBack={onBackToList}>
        <ListingContextHeader
          kind="resource"
          title={resolvedConversation.linkedResourceTitle ?? t("chatGenericThread", { defaultValue: "Conversation" })}
          authorDisplayName={resolvedConversation.otherAccountDisplayName}
          onPressListing={
            resolvedConversation.linkedResourceId && onOpenLinkedResource
              ? () => onOpenLinkedResource(resolvedConversation.linkedResourceId!)
              : undefined
          }
          onPressAuthor={
            resolvedConversation.otherAccountId && onOpenLinkedAccount
              ? () => onOpenLinkedAccount(resolvedConversation.otherAccountId!)
              : undefined
          }
          containerStyle={styles.listingHeader}
        />
      </NavigationBackHeader>

      <View style={styles.messagesContainer}>
        <ScrollView
          ref={messagesScrollRef}
          contentContainerStyle={styles.messagesContent}
          onScroll={handleMessagesScroll}
          onContentSizeChange={handleMessagesContentSizeChange}
          scrollEventThrottle={16}
        >
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
                {(message.imageUrls ?? []).map((imageUrl) => (
                  <Image key={imageUrl} source={{ uri: imageUrl }} style={styles.messageImage} />
                ))}
                <Text style={styles.messageText}>{message.body}</Text>
                <Text style={styles.messageTime}>{formattedDate}</Text>
              </View>
            );
          })}
        </ScrollView>

        {hasNewMessages ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("chatNewMessages", { defaultValue: "New messages" })}
            onPress={() => scrollToBottom(true)}
            style={styles.scrollToBottomButton}
          >
            <Icon source="chevron-double-down" size={22} color={designTokens.colors.primary} />
          </Pressable>
        ) : null}
      </View>

      <MessageComposer
        testID="chat-composer"
        value={composerValue}
        onChangeText={setComposerValue}
        onSend={handleSend}
        pendingImageUri={pendingImageUri}
        onImageSelected={setPendingImageUri}
        onRemoveImage={() => setPendingImageUri(null)}
        sending={resolvedSending}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    gap: designTokens.spacing.sm,
    paddingTop: designTokens.spacing.lg
  },
  listingHeader: {
    flex: 1
  },
  messagesContainer: {
    flex: 1,
    position: "relative"
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
  messageImage: {
    width: 180,
    height: 180,
    borderRadius: designTokens.radius.sm,
    backgroundColor: designTokens.colors.secondary
  },
  messageTime: {
    alignSelf: "flex-end",
    fontSize: 11,
    opacity: 0.65
  },
  scrollToBottomButton: {
    position: "absolute",
    right: designTokens.spacing.sm,
    bottom: designTokens.spacing.sm,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: designTokens.colors.secondary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3
  }
});
