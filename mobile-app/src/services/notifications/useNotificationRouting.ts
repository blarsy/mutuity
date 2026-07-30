import { useCallback, useEffect, useRef } from "react";

export interface NotificationRoutePayload {
  notificationId: string;
  routeName?: string;
  routeParams?: Record<string, unknown>;
}

export interface NotificationRoutingState {
  pendingRoute: NotificationRoutePayload | null;
  unreadCount: number;
}

export function useNotificationRouting(onNavigate: (payload: NotificationRoutePayload) => void): {
  pendingRoute: NotificationRoutePayload | null;
  setPendingRoute: (payload: NotificationRoutePayload | null) => void;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  refreshUnreadState: () => void;
} {
  const pendingRouteRef = useRef<NotificationRoutePayload | null>(null);
  const unreadCountRef = useRef(0);
  const onNavigateRef = useRef(onNavigate);

  onNavigateRef.current = onNavigate;

  const setPendingRoute = useCallback((payload: NotificationRoutePayload | null) => {
    pendingRouteRef.current = payload;
  }, []);

  const setUnreadCount = useCallback((count: number) => {
    unreadCountRef.current = count;
  }, []);

  const refreshUnreadState = useCallback(() => {
    // Trigger a re-fetch of unread counts from the backend
    // This is called when the app comes to foreground or after a notification is read
    const currentPending = pendingRouteRef.current;
    if (currentPending) {
      onNavigateRef.current(currentPending);
      pendingRouteRef.current = null;
    }
  }, []);

  useEffect(() => {
    // When a notification deep-link arrives while the hook is active,
    // process any pending route
    const interval = setInterval(() => {
      const pending = pendingRouteRef.current;
      if (pending) {
        onNavigateRef.current(pending);
        pendingRouteRef.current = null;
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return {
    get pendingRoute() {
      return pendingRouteRef.current;
    },
    setPendingRoute,
    get unreadCount() {
      return unreadCountRef.current;
    },
    setUnreadCount,
    refreshUnreadState
  };
}
