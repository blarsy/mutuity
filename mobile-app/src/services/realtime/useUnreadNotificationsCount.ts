import { fetchUnreadNotificationsCount } from "../graphql/notifications";
import { useAccountQuery } from "./useAccountQuery";

export function useUnreadNotificationsCount(accountId: string | null) {
  const { value, ...state } = useAccountQuery(accountId, true, fetchUnreadNotificationsCount);
  return { count: value, ...state };
}