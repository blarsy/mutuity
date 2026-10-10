import { useQuery } from "@apollo/client/react";
import { useRef } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useAccountEventSignal } from "../../services/graphql/accountEvents";
import { COUNT_UNREAD_NOTIFICATIONS_QUERY } from "./notifications.queries";

export function useUnreadNotifications() {
  const { session } = useAuth();
  const enabled = session.authenticated && Boolean(session.account?.id);
  const lastKnown = useRef<{ accountId: string | undefined; value: number | null }>({ accountId: undefined, value: null });
  const query = useQuery<{ countUnreadNotifications: number | null }>(COUNT_UNREAD_NOTIFICATIONS_QUERY, {
    skip: !enabled,
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first"
  });
  useAccountEventSignal(() => query.refetch(), enabled);
  const accountId = enabled ? session.account?.id : undefined;
  if (lastKnown.current.accountId !== accountId) lastKnown.current = { accountId, value: null };
  if (enabled && typeof query.data?.countUnreadNotifications === "number") lastKnown.current.value = query.data.countUnreadNotifications;
  return { ...query, count: enabled ? lastKnown.current.value : null };
}