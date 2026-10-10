import type { ReactNode } from "react";

export function TokenBalanceDisplay({
  balance,
  format
}: {
  balance: number | null;
  format: (balance: number) => ReactNode;
}) {
  return <span aria-live="polite">{balance === null ? "—" : format(balance)}</span>;
}