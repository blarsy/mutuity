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
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
  } | null;
}

export interface TokenHistoryPage {
  items: ContributionHistoryItem[];
  hasNextPage: boolean;
  endCursor: string | null;
}

export async function fetchCurrentTokenBalance(): Promise<number> {
  const { data } = await apolloClient.query<CurrentTokenBalanceQueryResult>({
    query: CURRENT_TOKEN_BALANCE_QUERY,
    fetchPolicy: "network-only"
  });

  return data?.currentTokenBalance ?? 0;
}

export async function fetchTokenHistoryPage(
  accountId: string,
  first: number,
  after?: string | null
): Promise<TokenHistoryPage> {
  const variables: QueryAllTokenMovementsArgs = {
    condition: { accountId },
    first,
    ...(after ? { after } : {})
  };

  const { data } = await apolloClient.query<TokenHistoryQueryResult, QueryAllTokenMovementsArgs>({
    query: TOKEN_HISTORY_QUERY,
    variables,
    fetchPolicy: "network-only"
  });

  const nodes = data?.allTokenMovements?.nodes ?? [];
  const pageInfo = data?.allTokenMovements?.pageInfo;

  return {
    items: nodes
      .map((node) => ({
        id: node.id,
        title: node.eventType,
        eventType: node.eventType,
        tokenChange: node.amountDelta,
        createdAt: node.createdAt
      }))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    hasNextPage: pageInfo?.hasNextPage ?? false,
    endCursor: pageInfo?.endCursor ?? null
  };
}

export async function fetchTokenHistory(accountId: string): Promise<ContributionHistoryItem[]> {
  const page = await fetchTokenHistoryPage(accountId, DEFAULT_PAGE_SIZE);
  return page.items;
}
