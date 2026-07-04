import { useEffect } from "react";

export interface NotificationRoutePayload {
  notificationId: string;
  routeName?: string;
  routeParams?: Record<string, unknown>;
}

export function useNotificationRouting(onNavigate: (payload: NotificationRoutePayload) => void): void {
  useEffect(() => {
    void onNavigate;
  }, [onNavigate]);
}
