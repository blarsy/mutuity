export type BidDirection = "sent" | "received";

export interface BidWorkspaceItem {
  id: string;
  direction: BidDirection;
  title: string;
  counterpartyDisplayName: string;
  listingAuthorDisplayName?: string | null;
  listingAuthorAvatarUrl?: string | null;
  listingImageUrl?: string | null;
  tokenAmount: number;
  isActive: boolean;
  updatedAt: string | null;
}