import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Icon, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { PrimaryButton, ScreenContainer } from "../../components/primitives";
import { EmptyState } from "../../components/state/EmptyState";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import {
  fetchNotificationWindow,
  markAllNotificationsRead,
  markNotificationRead
} from "../../services/graphql/notifications";
import { useAccountEventSignal } from "../../services/realtime/accountEvents";
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
  /** Raw backend payload, used to resolve the navigation destination on tap. */
  payload?: Record<string, unknown> | null;
}

export interface NotificationsScreenProps {
  accountId?: string | null;
  notifications?: NotificationFeedItem[];
  loading?: boolean;
  errorMessage?: string | null;
  onRetry?: () => void;
  onOpenNotification?: (notification: NotificationFeedItem) => void;
  onMarkRead?: (notificationId: string, source: NotificationSource) => void | Promise<unknown>;
  onLoadEarlier?: () => void;
}

const FEED_PAGE_SIZE = 20;
const notificationKey = (entry: NotificationFeedItem): string => `${entry.source}:${entry.id}`;

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
  const [loadedAccount, setLoadedAccount] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [remoteErrorMessage, setRemoteErrorMessage] = useState<string | null>(null);
  const [readErrorMessage, setReadErrorMessage] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const requestId = useRef(0);
  const feedWindow = useRef(FEED_PAGE_SIZE);
  const scope = useRef(0);
  const readOperation = useRef(0);
  const readVersions = useRef(new Map<string, number>());
  const confirmedReadKeys = useRef(new Set<string>());
  // Source-qualified keys: notification UUIDs are not unique across tables.
  const [locallyReadIds, setLocallyReadIds] = useState<Set<string>>(new Set());

  const hasInjectedNotifications = notifications !== undefined;

  const loadNotifications = useCallback(async (expand = false): Promise<void> => {
    if (hasInjectedNotifications || !accountId) {
      return;
    }

    if (expand) feedWindow.current += FEED_PAGE_SIZE;
    const request = ++requestId.current;
    setLoadingMore(expand);
    setRemoteErrorMessage(null);
    try {
      const page: { items: NotificationFeedItem[]; hasNextPage: boolean } = await fetchNotificationWindow(accountId, feedWindow.current);
      if (request !== requestId.current) return;
      const unique = new Map<string, NotificationFeedItem>();
      page.items.forEach((entry) => {
        if (!unique.has(notificationKey(entry))) unique.set(notificationKey(entry), entry);
      });
      setRemoteNotifications([...unique.values()]);
      setHasNextPage(page.hasNextPage);
      setLoadedAccount(accountId);
    } catch {
      if (request !== requestId.current) return;
      setRemoteErrorMessage(t("notificationsLoadError", { defaultValue: "We could not load notifications." }));
    } finally {
      if (request === requestId.current) setLoadingMore(false);
    }
  }, [accountId, hasInjectedNotifications, t]);

  useAccountEventSignal(loadNotifications, !hasInjectedNotifications && Boolean(accountId));

  useEffect(() => {
    feedWindow.current = FEED_PAGE_SIZE;
    scope.current += 1;
    readVersions.current.clear();
    confirmedReadKeys.current.clear();
    setLocallyReadIds(new Set());
    setRemoteNotifications([]);
    setLoadedAccount(null);
    setHasNextPage(false);
    setRemoteErrorMessage(null);
    setReadErrorMessage(null);
    void loadNotifications();
    return () => {
      requestId.current += 1;
      scope.current += 1;
    };
  }, [loadNotifications]);

  const sortedNotifications = useMemo(() => {
    return [...(notifications ?? (loadedAccount === accountId ? remoteNotifications : []))]
      .map((entry) =>
        locallyReadIds.has(notificationKey(entry)) ? { ...entry, readAt: entry.readAt ?? new Date().toISOString() } : entry
      )
      .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "") || b.id.localeCompare(a.id) || a.source.localeCompare(b.source));
  }, [notifications, remoteNotifications, locallyReadIds, loadedAccount, accountId]);

  const updateRead = (entries: NotificationFeedItem[], mutate: () => void | Promise<unknown>): void => {
    const operation = ++readOperation.current;
    const currentScope = scope.current;
    const keys = entries.filter((entry) => !entry.readAt).map(notificationKey);
    keys.forEach((key) => readVersions.current.set(key, operation));
    setLocallyReadIds((previous) => new Set([...previous, ...keys]));
    setReadErrorMessage(null);
    const confirm = (): void => {
      if (scope.current !== currentScope) return;
      keys.forEach((key) => confirmedReadKeys.current.add(key));
      setLocallyReadIds((previous) => {
        if (keys.every((key) => previous.has(key))) return previous;
        return new Set([...previous, ...keys]);
      });
    };
    const perform = async (): Promise<void> => {
      const result = mutate();
      if (result) await result;
      confirm();
    };
    void perform().catch(() => {
      if (scope.current !== currentScope) return;
      setLocallyReadIds((previous) => {
        const next = new Set(previous);
        keys.forEach((key) => {
          if (readVersions.current.get(key) === operation && !confirmedReadKeys.current.has(key)) {
            next.delete(key);
            readVersions.current.delete(key);
          }
        });
        return next;
      });
      setReadErrorMessage(t("notificationsReadError", { defaultValue: "We could not update notifications." }));
    });
  };

  const resolvedLoading = loading || (!errorMessage && !hasInjectedNotifications && Boolean(accountId) && loadedAccount !== accountId && !remoteErrorMessage);
  const resolvedErrorMessage = errorMessage ?? (!hasInjectedNotifications ? remoteErrorMessage : null);

  if (resolvedLoading) {
    return <LoadingState label={t("notificationsLoading", { defaultValue: "Loading notifications..." })} />;
  }

  if (resolvedErrorMessage && (hasInjectedNotifications || loadedAccount !== accountId)) {
    return (
      <ErrorState
        message={resolvedErrorMessage}
        {...(onRetry ? { onRetry } : { onRetry: () => void loadNotifications() })}
      />
    );
  }

  if (sortedNotifications.length === 0) {
    return (
      <EmptyState
        message={t("notificationsEmpty", { defaultValue: "No notifications yet." })}
        actionLabel={t("refreshLabel", { defaultValue: "Refresh" })}
        onActionPress={onRetry ?? (() => void loadNotifications())}
      />
    );
  }

  return (
    <ScreenContainer testID="notifications-screen" style={styles.root}>
      {resolvedErrorMessage || readErrorMessage ? (
        <Text accessibilityRole="alert">{readErrorMessage ?? resolvedErrorMessage}</Text>
      ) : null}
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
              key={notificationKey(entry)}
              accessibilityRole="button"
              accessibilityLabel={`${entry.headline1}. ${entry.headline2}. ${entry.description}`}
              onPress={() => {
                if (unread) {
                  if (onMarkRead) {
                    updateRead([entry], () => onMarkRead(entry.id, entry.source));
                  } else if (accountId) {
                    updateRead([entry], () => markNotificationRead(entry.id, entry.source));
                  }
                }
                if (onOpenNotification) {
                  onOpenNotification(entry);
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
          onPress={() => { if (!loadingMore) void loadNotifications(true); }}
          loading={loadingMore}
          disabled={loadingMore}
        />
      ) : null}
      {!hasInjectedNotifications && accountId && sortedNotifications.length > 0 ? (
        <PrimaryButton
          label={t("markAllReadLabel", { defaultValue: "Mark all as read" })}
          onPress={() => {
            updateRead(remoteNotifications, async () => {
              await markAllNotificationsRead();
            });
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
