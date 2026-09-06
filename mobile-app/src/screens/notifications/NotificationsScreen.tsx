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
import { getNotificationIcon } from "./notificationIcons";

export type NotificationSource = "account" | "need-claim" | "resource-bid";

export interface NotificationFeedItem {
  id: string;
  source: NotificationSource;
  eventType?: string | null;
  headline1: string;
  headline2: string;
  description: string;
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
  onMarkRead?: (notificationId: string, source: NotificationSource) => void;
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
          const NotificationIcon = getNotificationIcon(entry.eventType);
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
              accessibilityLabel={`${entry.headline1}. ${entry.headline2}. ${entry.description}`}
              onPress={() => {
                if (unread && onMarkRead) {
                  onMarkRead(entry.id, entry.source);
                } else if (unread && accountId) {
                  void markNotificationRead(entry.id, entry.source)
                    .then(() => loadNotifications("replace"))
                    .catch(() => setRemoteErrorMessage(t("notificationsReadError", { defaultValue: "We could not update notifications." })));
                }
                if (onOpenNotification) {
                  onOpenNotification(entry.id);
                }
              }}
              style={styles.notificationRow}
              testID={`notification-row-${entry.id}`}
            >
              <View style={styles.iconFrame}>
                <NotificationIcon width={70} height={70} />
              </View>

              <View style={styles.rowMain}>
                <View style={styles.rowHeadlines}>
                  <Text variant="bodySmall" style={styles.rowHeadline} numberOfLines={1}>
                    {entry.headline1}
                  </Text>
                  {entry.headline2 ? (
                    <Text variant="bodySmall" style={styles.rowHeadline} numberOfLines={1}>
                      {entry.headline2}
                    </Text>
                  ) : null}
                </View>
                <Text
                  variant="bodyMedium"
                  style={[styles.rowDescription, unread ? styles.rowDescriptionUnread : null]}
                  numberOfLines={3}
                >
                  {entry.description}
                </Text>
              </View>

              <View style={styles.rowRight}>
                <Text variant="bodySmall" style={[styles.rowMeta, unread ? styles.rowMetaUnread : null]}>
                  {createdAtLabel}
                </Text>
                {unread ? (
                  <Icon
                    testID={`notification-row-${entry.id}-unread`}
                    source="circle"
                    size={12}
                    color={designTokens.colors.primary}
                  />
                ) : null}
              </View>
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
    paddingBottom: designTokens.spacing.md
  },
  notificationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#CCCCCC"
  },
  iconFrame: {
    width: 70,
    height: 70,
    borderRadius: designTokens.radius.md,
    overflow: "hidden"
  },
  rowMain: {
    flex: 1,
    flexDirection: "column",
    gap: designTokens.spacing.xs
  },
  rowHeadlines: {
    flexDirection: "column"
  },
  rowHeadline: {
    opacity: 0.72
  },
  rowDescription: {
    fontFamily: appFontFamilies.altGeneral,
    color: designTokens.colors.primary
  },
  rowDescriptionUnread: {
    fontWeight: "bold"
  },
  rowRight: {
    flexDirection: "column",
    alignItems: "flex-end",
    gap: designTokens.spacing.xs
  },
  rowMeta: {
    color: designTokens.colors.primary
  },
  rowMetaUnread: {
    fontWeight: "bold"
  }
});
