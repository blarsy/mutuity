import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Icon, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { PrimaryButton, ScreenContainer } from "../../components/primitives";
import { EmptyState } from "../../components/state/EmptyState";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from "../../services/graphql/notifications";
import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";

export interface NotificationFeedItem {
  id: string;
  title: string;
  body: string;
  createdAt: string | null;
  readAt: string | null;
}

export interface NotificationsScreenProps {
  accountId?: string | null;
  notifications?: NotificationFeedItem[];
  loading?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  onOpenNotification?: (notificationId: string) => void;
  onMarkRead?: (notificationId: string) => void;
  onLoadEarlier?: () => void;
}

export function NotificationsScreen({
  accountId = null,
  notifications,
  loading = false,
  errorMessage = null,
  onRetry,
  onOpenNotification,
  onMarkRead,
  onLoadEarlier
}: NotificationsScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const [remoteNotifications, setRemoteNotifications] = useState<NotificationFeedItem[]>([]);
  const [remoteLoading, setRemoteLoading] = useState(false);
  const [remoteErrorMessage, setRemoteErrorMessage] = useState<string | null>(null);
  const [endCursor, setEndCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  const hasInjectedNotifications = notifications !== undefined;

  const loadNotifications = useCallback(async (mode: "replace" | "append" = "replace"): Promise<void> => {
    if (hasInjectedNotifications || !accountId) {
      return;
    }

    setRemoteLoading(true);
    setRemoteErrorMessage(null);
    try {
      const page = await fetchNotifications(accountId, mode === "append" ? endCursor : null);
      setRemoteNotifications((previous) => (mode === "append" ? [...previous, ...page.items] : page.items));
      setEndCursor(page.endCursor);
      setHasNextPage(page.hasNextPage);
    } catch {
      setRemoteErrorMessage(t("notificationsLoadError", { defaultValue: "We could not load notifications." }));
    } finally {
      setRemoteLoading(false);
    }
  }, [accountId, endCursor, hasInjectedNotifications, t]);

  useEffect(() => {
    void loadNotifications("replace");
  }, [loadNotifications]);

  const sortedNotifications = useMemo(() => {
    return [...(notifications ?? remoteNotifications)].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  }, [notifications, remoteNotifications]);

  const resolvedLoading = loading || (!hasInjectedNotifications && remoteLoading);
  const resolvedErrorMessage = errorMessage ?? (!hasInjectedNotifications ? remoteErrorMessage : null);

  if (resolvedLoading) {
    return <LoadingState label={t("notificationsLoading", { defaultValue: "Loading notifications..." })} />;
  }

  if (resolvedErrorMessage) {
    return (
      <ErrorState
        message={resolvedErrorMessage}
        {...(onRetry ? { onRetry } : { onRetry: () => void loadNotifications("replace") })}
      />
    );
  }

  if (sortedNotifications.length === 0) {
    return (
      <EmptyState
        message={t("notificationsEmpty", { defaultValue: "No notifications yet." })}
        actionLabel={t("refreshLabel", { defaultValue: "Refresh" })}
        {...(onRetry ? { onActionPress: onRetry } : {})}
      />
    );
  }

  return (
    <ScreenContainer testID="notifications-screen" style={styles.root}>
      <Text accessibilityRole="header" variant="headlineSmall" style={styles.title}>
        {t("notificationsLabel", { defaultValue: "Notifications" })}
      </Text>

      <ScrollView contentContainerStyle={styles.listContent}>
        {sortedNotifications.map((entry) => {
          const unread = !entry.readAt;
          const createdAtLabel = entry.createdAt
            ? new Intl.DateTimeFormat(undefined, {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit"
            }).format(new Date(entry.createdAt))
            : t("dateUnknown", { defaultValue: "Unknown date" });

          return (
            <Pressable
              key={entry.id}
              accessibilityRole="button"
              accessibilityLabel={`${entry.title}. ${entry.body}`}
              onPress={() => {
                if (unread && onMarkRead) {
                  onMarkRead(entry.id);
                } else if (unread && accountId) {
                  void markNotificationRead(entry.id)
                    .then(() => loadNotifications("replace"))
                    .catch(() => setRemoteErrorMessage(t("notificationsReadError", { defaultValue: "We could not update notifications." })));
                }
                if (onOpenNotification) {
                  onOpenNotification(entry.id);
                }
              }}
              style={[styles.notificationCard, unread ? styles.unreadCard : null]}
              testID={`notification-row-${entry.id}`}
            >
              <View style={styles.rowTop}>
                <Text variant="titleMedium" style={styles.rowTitle} numberOfLines={2}>
                  {entry.title}
                </Text>
                {unread ? <Icon source="circle" size={12} color={designTokens.colors.primary} /> : null}
              </View>
              <Text variant="bodySmall" style={styles.rowBody}>
                {entry.body}
              </Text>
              <Text variant="labelSmall" style={styles.rowMeta}>
                {createdAtLabel}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {onLoadEarlier ? (
        <PrimaryButton
          label={t("notificationsLoadEarlier", { defaultValue: "Load earlier notifications" })}
          onPress={onLoadEarlier}
        />
      ) : !hasInjectedNotifications && hasNextPage ? (
        <PrimaryButton
          label={t("notificationsLoadEarlier", { defaultValue: "Load earlier notifications" })}
          onPress={() => void loadNotifications("append")}
        />
      ) : !hasInjectedNotifications && sortedNotifications.length > 0 ? (
        <PrimaryButton
          label={t("markAllReadLabel", { defaultValue: "Mark all as read" })}
          onPress={() => {
            void markAllNotificationsRead()
              .then(() => loadNotifications("replace"))
              .catch(() => setRemoteErrorMessage(t("notificationsReadError", { defaultValue: "We could not update notifications." })));
          }}
        />
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingTop: designTokens.spacing.lg,
    gap: designTokens.spacing.sm
  },
  title: {
    fontFamily: appFontFamilies.title,
    textTransform: "uppercase",
    letterSpacing: 0.6
  },
  listContent: {
    gap: designTokens.spacing.sm,
    paddingBottom: designTokens.spacing.md
  },
  notificationCard: {
    borderRadius: designTokens.radius.md,
    backgroundColor: designTokens.colors.secondary,
    padding: designTokens.spacing.md,
    gap: designTokens.spacing.xs
  },
  unreadCard: {
    borderWidth: 1,
    borderColor: designTokens.colors.primary
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: designTokens.spacing.sm
  },
  rowTitle: {
    flex: 1,
    fontFamily: appFontFamilies.altGeneral,
    fontSize: 18,
    lineHeight: 22
  },
  rowBody: {
    fontFamily: appFontFamilies.general,
    opacity: 0.84
  },
  rowMeta: {
    opacity: 0.65
  }
});
