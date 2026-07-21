import { apolloClient } from "./client";
import { type QueryAllTokenMovementsArgs } from "./generated";
import { CURRENT_TOKEN_BALANCE_QUERY, TOKEN_HISTORY_QUERY } from "./operations";
import type { ContributionHistoryItem } from "../../screens/economics/MyEconomicsScreen";

const DEFAULT_PAGE_SIZE = 50;

interface CurrentTokenBalanceQueryResult {
  currentTokenBalance: number | null;
}

interface TokenHistoryQueryResult {
  allTokenMovements: {
    nodes: Array<{
      id: string;
      amountDelta: number;
      eventType: string;
      createdAt: string;
    }>;
  } | null;
}

export async function fetchCurrentTokenBalance(): Promise<number> {
  const { data } = await apolloClient.query<CurrentTokenBalanceQueryResult>({
    query: CURRENT_TOKEN_BALANCE_QUERY,
    fetchPolicy: "network-only"
  });

  return data?.currentTokenBalance ?? 0;
}

export async function fetchTokenHistory(accountId: string): Promise<ContributionHistoryItem[]> {
  const variables: QueryAllTokenMovementsArgs = {
    condition: { accountId },
    first: DEFAULT_PAGE_SIZE
  };

  const { data } = await apolloClient.query<TokenHistoryQueryResult, QueryAllTokenMovementsArgs>({
    query: TOKEN_HISTORY_QUERY,
    variables,
    fetchPolicy: "network-only"
  });

  return (data?.allTokenMovements?.nodes ?? []).map((node) => ({
    id: node.id,
    title: node.eventType,
    tokenChange: node.amountDelta,
    createdAt: node.createdAt
  }));
}
