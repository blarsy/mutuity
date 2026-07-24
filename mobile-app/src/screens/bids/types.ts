export type BidDirection = "sent" | "received";

export interface BidWorkspaceItem {
  id: string;
  direction: BidDirection;
  title: string;
  counterpartyDisplayName: string;
  tokenAmount: number;
  isActive: boolean;
  updatedAt: string | null;
}