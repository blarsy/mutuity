import { fetchCurrentTokenBalance } from "../graphql/economics";
import { useAccountQuery } from "./useAccountQuery";

export function useTokenBalance(accountId: string | null, enabled = true) {
  const { value, ...state } = useAccountQuery(accountId, enabled, fetchCurrentTokenBalance);
  return { balance: value, ...state };
}